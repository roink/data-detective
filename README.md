[![GitHub Org](https://img.shields.io/badge/GitHub-HESCOR-blue?logo=github&logoColor=white)](https://github.com/HESCOR)

---

# HESCOR Data Learning Lab

Three browser games for learning basic data literacy:

- **Data Detective** teaches data quality by asking players to spot errors in mock tables.
- **Type Sorter** teaches binary, categorical, ordinal, and numerical variables through card sorting and explanatory feedback.
- **Metadata Explorer** shows how metadata give a field-survey dataset meaning, context and reusability across seven short levels.

Play the combined website at [roink.github.io/data-detective](https://roink.github.io/data-detective/).

Standalone, iframe-friendly versions without the exhibition header, game switcher, or footer are also available:

- [Data Detective](https://roink.github.io/data-detective/data-detective/)
- [Type Sorter](https://roink.github.io/data-detective/type-sorter/)
- [Metadata Explorer](https://roink.github.io/data-detective/metadata-explorer/)

For example:

```html
<iframe
  src="https://roink.github.io/data-detective/metadata-explorer/"
  title="Metadata Explorer"
  width="100%"
  height="900"
  loading="lazy">
</iframe>
```

## Download H5P packages

The latest validated packages are published as permanent GitHub Release downloads:

- [Combined HESCOR Data Learning Lab](https://github.com/roink/data-detective/releases/latest/download/hescor-data-learning-lab.h5p)
- [Data Detective only](https://github.com/roink/data-detective/releases/latest/download/data-detective.h5p)
- [Type Sorter only](https://github.com/roink/data-detective/releases/latest/download/type-sorter.h5p)
- [Metadata Explorer only](https://github.com/roink/data-detective/releases/latest/download/metadata-explorer.h5p)
- [SHA-256 checksums](https://github.com/roink/data-detective/releases/latest/download/SHA256SUMS.txt)

See the [latest release](https://github.com/roink/data-detective/releases/latest) for all downloads in one place.

## Project structure

The root `index.html` and `assets/` directory are the canonical application. The H5P packages and standalone Pages routes are generated from them.

```text
index.html                   Canonical markup, styles, game data, and behavior
assets/                      Canonical HESCOR branding assets and Pages assets
scripts/
  build.mjs                  Builds Pages and H5P deployment artifacts
  check.mjs                  Rebuilds and validates Pages and H5P artifacts
.build/pages/                Generated GitHub Pages deployment
  data-detective/index.html
  type-sorter/index.html
  metadata-explorer/index.html
dist/
  hescor-data-learning-lab.h5p
  data-detective.h5p
  type-sorter.h5p
  metadata-explorer.h5p
```

## Build and check

The project has no third-party build dependencies. It requires Node.js plus the standard `zip` and `unzip` commands.

```bash
npm run build
npm run check
```

The same check runs in GitHub Actions for pushes to `master`, pull requests, and manual workflow runs. Successful runs provide a downloadable `hescor-h5p-packages` workflow artifact retained for 30 days. Pushes to `master` deploy the generated Pages site and update the permanent `Latest H5P packages` release linked above.

The deployment outputs are:

| Artifact | Purpose |
| --- | --- |
| `index.html` and `assets/` | Canonical markup, styles, behavior, and branding |
| `.build/pages/` | Generated Pages site with the combined homepage and three standalone routes |
| `dist/hescor-data-learning-lab.h5p` | Combined H5P with all three games and full HESCOR header/footer |
| `dist/data-detective.h5p` | Data Detective only, without site header/footer |
| `dist/type-sorter.h5p` | Type Sorter only, without site header/footer |
| `dist/metadata-explorer.h5p` | Metadata Explorer only, without site header/footer |

The H5P files contain custom libraries. The account performing the first upload must therefore be allowed to install H5P libraries.

## Local preview

Serve the repository root with any static server:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.
