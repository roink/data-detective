import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const sourcePath = path.join(rootDir, "index.html");
const buildDir = path.join(rootDir, ".build");
const distDir = path.join(rootDir, "dist");
const pagesDir = path.join(buildDir, "pages");
const assetNames = ["hescor_logo.svg", "logo_ministerium.jpg", "logo_uni-koeln.jpg"];

const artifacts = [
  {
    slug: "hescor-data-learning-lab",
    title: "HESCOR Data Learning Lab",
    libraryTitle: "HESCOR Data Learning Lab",
    machineName: "H5P.DataLearningLab",
    className: "DataLearningLab",
    mode: "combined",
    defaultGame: "detective",
    patchVersion: 6,
    branded: true
  },
  {
    slug: "data-detective",
    title: "Data Detective",
    libraryTitle: "Data Detective",
    machineName: "H5P.DataDetective",
    className: "DataDetective",
    mode: "detective",
    defaultGame: "detective",
    patchVersion: 2,
    branded: false
  },
  {
    slug: "metadata-explorer",
    title: "Metadata Explorer",
    libraryTitle: "Metadata Explorer",
    machineName: "H5P.MetadataExplorer",
    className: "MetadataExplorer",
    mode: "metadata",
    defaultGame: "metadata",
    patchVersion: 4,
    branded: false
  },
  {
    slug: "type-sorter",
    title: "Type Sorter",
    libraryTitle: "Type Sorter",
    machineName: "H5P.TypeSorter",
    className: "TypeSorter",
    mode: "types",
    defaultGame: "types",
    patchVersion: 2,
    branded: false
  },
  {
    slug: "research-method",
    title: "Research Method",
    libraryTitle: "Research Method",
    machineName: "H5P.ResearchMethod",
    className: "ResearchMethod",
    mode: "method",
    defaultGame: "method",
    patchVersion: 1,
    branded: false
  },
  {
    slug: "final-data-quiz",
    title: "Final Data Quiz",
    libraryTitle: "Final Data Quiz",
    machineName: "H5P.FinalDataQuiz",
    className: "FinalDataQuiz",
    mode: "finalquiz",
    defaultGame: "finalquiz",
    patchVersion: 1,
    branded: false
  }
];

const source = fs.readFileSync(sourcePath, "utf8");

function extract(pattern, description) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not extract ${description} from index.html`);
  return match[1].trim();
}

function block(name) {
  return extract(
    new RegExp(`<!-- build:${name}:start -->([\\s\\S]*?)<!-- build:${name}:end -->`),
    `${name} block`
  );
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyAssets(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const asset of assetNames) {
    fs.copyFileSync(path.join(rootDir, "assets", asset), path.join(targetDir, asset));
  }
  fs.cpSync(path.join(rootDir, "assets", "final-data-quiz"), path.join(targetDir, "final-data-quiz"), { recursive: true });
}

function bodyFor(mode) {
  const toast = block("toast");
  if (mode === "combined") {
    return [
      block("header"),
      block("switcher"),
      `<main class="page">\n${block("detective")}\n${block("types")}\n${block("metadata")}\n${block("method")}\n${block("finalquiz")}\n</main>`,
      block("footer"),
      toast
    ].join("\n\n");
  }

  return `<main class="page page--isolated">\n${block(mode)}\n</main>\n\n${toast}`;
}

const css = extract(/<style>([\s\S]*?)<\/style>/, "styles");
const siteScript = extract(/<script>([\s\S]*?)<\/script>/, "application script");
const sourceScript = siteScript
  .replace(
    /const hashViews = \{ "#data-detective": "detective", "#type-sorter": "types", "#metadata-explorer": "metadata", "#research-method": "method", "#final-data-quiz": "finalquiz" \};\n    setGameView\(hashViews\[location\.hash\] \|\| \(el\("detectiveView"\) \? "detective" : el\("typesView"\) \? "types" : el\("metadataView"\) \? "metadata" : el\("methodView"\) \? "method" : "finalquiz"\)\);/,
    'setGameView(params.defaultGame || (el("detectiveView") ? "detective" : el("typesView") ? "types" : el("metadataView") ? "metadata" : el("methodView") ? "method" : "finalquiz"));'
  );

function standalonePageFor(artifact) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index,follow" />
  <title>${artifact.title} · HESCOR Data Learning Lab</title>
  <link rel="icon" href="../assets/hescor_logo.svg" type="image/svg+xml" />
  <style>
${css}
  </style>
</head>
<body>
${bodyFor(artifact.mode)}
  <script>
${siteScript}
  </script>
</body>
</html>
`;
}

function buildPagesSite() {
  fs.rmSync(pagesDir, { recursive: true, force: true });
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.copyFileSync(sourcePath, path.join(pagesDir, "index.html"));
  copyAssets(path.join(pagesDir, "assets"));
  fs.writeFileSync(path.join(pagesDir, ".nojekyll"), "");

  for (const artifact of artifacts.filter(({ mode }) => mode !== "combined")) {
    const routeDir = path.join(pagesDir, artifact.slug);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, "index.html"), standalonePageFor(artifact));
    console.log(`Built standalone page: .build/pages/${artifact.slug}/index.html`);
  }
}

function libraryScriptFor(artifact, body) {
  return `(function (H5P, $) {
  "use strict";

  function ${artifact.className}(params, contentId) {
    H5P.EventDispatcher.call(this);
    this.params = Object.assign({ defaultGame: ${JSON.stringify(artifact.defaultGame)} }, params || {});
    this.contentId = contentId;
    this.wrapper = null;
    this.resizeObserver = null;
  }

  ${artifact.className}.prototype = Object.create(H5P.EventDispatcher.prototype);
  ${artifact.className}.prototype.constructor = ${artifact.className};

  ${artifact.className}.prototype.attach = function ($container) {
    if (this.wrapper) {
      $container.html("").append(this.wrapper);
      this.trigger("resize");
      return;
    }

    var self = this;
    var params = this.params;
    var wrapper = document.createElement("div");
    wrapper.className = "h5p-data-learning-lab h5p-data-learning-lab--${artifact.mode}";
    wrapper.innerHTML = ${JSON.stringify(body)};

    var libraryPath = H5P.getLibraryPath("${artifact.machineName}-1.0");
    wrapper.dataset.assetRoot = libraryPath;
    wrapper.querySelectorAll('img[src^="assets/"]').forEach(function (image) {
      image.src = libraryPath + "/" + image.getAttribute("src");
    });

    $container.html("").addClass("h5p-data-learning-lab-container").append(wrapper);
    this.wrapper = wrapper;

    (function initializeGame() {
${sourceScript.split("\n").map((line) => `      ${line}`).join("\n")}
    }).call(this);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(function () {
        self.trigger("resize");
      });
      this.resizeObserver.observe(wrapper);
    }

    window.requestAnimationFrame(function () {
      self.trigger("resize");
    });
  };

  H5P.${artifact.className} = ${artifact.className};
})(H5P, H5P.jQuery);
`;
}

function buildH5p(artifact) {
  const packageDir = path.join(buildDir, artifact.slug);
  const libraryFolder = `${artifact.machineName}-1.0`;
  const libraryDir = path.join(packageDir, libraryFolder);
  const contentDir = path.join(packageDir, "content");
  const outputPath = path.join(distDir, `${artifact.slug}.h5p`);

  fs.rmSync(packageDir, { recursive: true, force: true });
  fs.mkdirSync(libraryDir, { recursive: true });
  fs.mkdirSync(contentDir, { recursive: true });

  writeJson(path.join(packageDir, "h5p.json"), {
    title: artifact.title,
    language: "en",
    mainLibrary: artifact.machineName,
    embedTypes: ["iframe"],
    preloadedDependencies: [{
      machineName: artifact.machineName,
      majorVersion: 1,
      minorVersion: 0
    }]
  });

  writeJson(path.join(contentDir, "content.json"), artifact.mode === "combined"
    ? { defaultGame: artifact.defaultGame }
    : {});

  writeJson(path.join(libraryDir, "library.json"), {
    title: artifact.libraryTitle,
    description: artifact.mode === "combined"
      ? "Five interactive games for learning data quality, variable types, metadata and research data practice."
      : `An interactive game for learning ${artifact.mode === "detective" ? "data quality" : artifact.mode === "types" ? "variable types" : artifact.mode === "metadata" ? "metadata" : artifact.mode === "method" ? "the research process" : "data literacy"}.`,
    machineName: artifact.machineName,
    majorVersion: 1,
    minorVersion: 0,
    patchVersion: artifact.patchVersion,
    runnable: 1,
    author: "HESCOR Project, University of Cologne",
    license: "MIT",
    coreApi: { majorVersion: 1, minorVersion: 0 },
    embedTypes: ["iframe"],
    fullscreen: 1,
    preloadedJs: [{ path: "app.js" }],
    preloadedCss: [{ path: "app.css" }]
  });

  const semantics = artifact.mode === "combined" ? [{
    name: "defaultGame",
    type: "select",
    label: "Game shown first",
    description: "Players can switch between all five games after opening the activity.",
    options: [
      { value: "detective", label: "Data Detective" },
      { value: "types", label: "Type Sorter" },
      { value: "metadata", label: "Metadata Explorer" },
      { value: "method", label: "Research Method" },
      { value: "finalquiz", label: "Final Data Quiz" }
    ],
    default: artifact.defaultGame
  }] : [];
  writeJson(path.join(libraryDir, "semantics.json"), semantics);

  fs.writeFileSync(path.join(libraryDir, "app.css"), `${css}\n`);
  fs.writeFileSync(path.join(libraryDir, "app.js"), libraryScriptFor(artifact, bodyFor(artifact.mode)));
  if (artifact.branded || artifact.mode === "finalquiz") copyAssets(path.join(libraryDir, "assets"));

  fs.rmSync(outputPath, { force: true });
  execFileSync(
    "zip",
    ["-q", "-D", "-r", outputPath, "h5p.json", "content", libraryFolder],
    { cwd: packageDir }
  );

  const entries = execFileSync("unzip", ["-Z1", outputPath], { encoding: "utf8" })
    .trim()
    .split("\n");
  const forbidden = entries.filter((entry) => entry.endsWith("/") || entry.endsWith(".html"));
  if (forbidden.length) {
    throw new Error(`${artifact.slug} contains forbidden archive entries: ${forbidden.join(", ")}`);
  }

  console.log(`Built H5P artifact: dist/${artifact.slug}.h5p`);
}

fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });
console.log("Using canonical application source: index.html + assets/");
buildPagesSite();
for (const artifact of artifacts) buildH5p(artifact);
