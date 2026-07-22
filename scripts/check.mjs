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

const artifacts = [
  { slug: "hescor-data-learning-lab", machineName: "H5P.DataLearningLab", combined: true },
  { slug: "data-detective", machineName: "H5P.DataDetective", gameId: "detectiveView" },
  { slug: "type-sorter", machineName: "H5P.TypeSorter", gameId: "typesView" }
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
  if (artifact.combined) {
    for (const expected of ["site-header", "game-switcher", "detectiveView", "typesView", "brand-footer"]) {
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
}

console.log("All site and H5P artifact checks passed");
