import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");

execFileSync(process.execPath, [path.join(scriptDir, "build.mjs")], { stdio: "inherit" });

const site = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const siteScript = site.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!siteScript) throw new Error("Could not find the site application script");
new Function(siteScript);

const pagesDir = path.join(rootDir, ".build", "pages");
for (const expectedPath of [
  "index.html",
  ".nojekyll",
  "assets/hescor_logo.svg",
  "data-detective/index.html",
  "type-sorter/index.html",
  "metadata-explorer/index.html",
  "research-method/index.html",
  "final-data-quiz/index.html",
  "assets/final-data-quiz/lifecycle.png"
]) {
  if (!fs.existsSync(path.join(pagesDir, expectedPath))) {
    throw new Error(`Generated Pages site is missing ${expectedPath}`);
  }
}

const artifacts = [
  { slug: "hescor-data-learning-lab", machineName: "H5P.DataLearningLab", combined: true },
  { slug: "data-detective", machineName: "H5P.DataDetective", gameId: "detectiveView" },
  { slug: "type-sorter", machineName: "H5P.TypeSorter", gameId: "typesView" },
  { slug: "metadata-explorer", machineName: "H5P.MetadataExplorer", gameId: "metadataView" },
  { slug: "research-method", machineName: "H5P.ResearchMethod", gameId: "methodView" },
  { slug: "final-data-quiz", machineName: "H5P.FinalDataQuiz", gameId: "finalQuizView" }
];

for (const artifact of artifacts) {
  const packagePath = path.join(rootDir, "dist", `${artifact.slug}.h5p`);
  execFileSync("unzip", ["-t", packagePath], { stdio: "ignore" });

  const entries = execFileSync("unzip", ["-Z1", packagePath], { encoding: "utf8" })
    .trim()
    .split("\n");
  if (entries.some((entry) => entry.endsWith("/") || entry.endsWith(".html"))) {
    throw new Error(`${artifact.slug}.h5p contains a forbidden directory or HTML entry`);
  }

  const packageDir = path.join(rootDir, ".build", artifact.slug);
  const libraryDir = path.join(packageDir, `${artifact.machineName}-1.0`);
  for (const jsonPath of [
    path.join(packageDir, "h5p.json"),
    path.join(packageDir, "content", "content.json"),
    path.join(libraryDir, "library.json"),
    path.join(libraryDir, "semantics.json")
  ]) JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const appScript = fs.readFileSync(path.join(libraryDir, "app.js"), "utf8");
  new Function(appScript);
  if (artifact.slug === "final-data-quiz" && !fs.existsSync(path.join(libraryDir, "assets", "final-data-quiz", "lifecycle.png"))) {
    throw new Error("final-data-quiz.h5p is missing its lifecycle image");
  }
  if (artifact.combined) {
    for (const expected of ["site-header", "game-switcher", "detectiveView", "typesView", "metadataView", "methodView", "finalQuizView", "brand-footer"]) {
      if (!appScript.includes(expected)) throw new Error(`Combined H5P is missing ${expected}`);
    }
  } else {
    if (!appScript.includes(`id=\\"${artifact.gameId}\\"`)) {
      throw new Error(`${artifact.slug}.h5p is missing its game interface`);
    }
    for (const forbidden of ['class=\\"site-header\\"', 'class=\\"game-switcher\\"', 'class=\\"brand-footer\\"']) {
      if (appScript.includes(forbidden)) throw new Error(`${artifact.slug}.h5p contains site chrome`);
    }
  }

  if (!artifact.combined) {
    const standalonePage = fs.readFileSync(path.join(pagesDir, artifact.slug, "index.html"), "utf8");
    const standaloneScript = standalonePage.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    if (!standaloneScript) throw new Error(`${artifact.slug} standalone page has no application script`);
    new Function(standaloneScript);
    if (!standalonePage.includes(`id="${artifact.gameId}"`)) {
      throw new Error(`${artifact.slug} standalone page is missing its game interface`);
    }
    for (const forbidden of ["site-header", "game-switcher", "brand-footer"]) {
      if (standalonePage.includes(`class="${forbidden}"`)) {
        throw new Error(`${artifact.slug} standalone page contains ${forbidden}`);
      }
    }
    for (const otherGame of artifacts.filter(item => !item.combined && item.slug !== artifact.slug)) {
      if (standalonePage.includes(`id="${otherGame.gameId}"`)) {
        throw new Error(`${artifact.slug} standalone page contains ${otherGame.gameId}`);
      }
    }
  }
}

console.log("All Pages and H5P artifact checks passed");
