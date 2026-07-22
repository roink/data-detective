# HESCOR Data Learning Lab

Two browser games for learning basic data literacy:

- **Data Detective** teaches data quality by asking players to spot errors in mock tables.
- **Type Sorter** teaches binary, categorical, ordinal, and numerical variables through card sorting and explanatory feedback.

Play the combined website at [roink.github.io/data-detective](https://roink.github.io/data-detective/).

## Project structure

The root `index.html` and `assets/` directory are the canonical application. The H5P packages are generated from them.

```text
index.html                   Canonical markup, styles, game data, and behavior
assets/                      Canonical HESCOR branding assets and Pages assets
scripts/
  build.mjs                  Builds all H5P deployment artifacts
  check.mjs                  Rebuilds and validates the site and H5P artifacts
dist/
  hescor-data-learning-lab.h5p
  data-detective.h5p
  type-sorter.h5p
```

## Build and check

The project has no third-party build dependencies. It requires Node.js plus the standard `zip` and `unzip` commands.

```bash
npm run build
npm run check
```

The same check runs in GitHub Actions for pushes to `master`, pull requests, and manual workflow runs. Successful runs provide a downloadable `hescor-h5p-packages` artifact containing all three H5P files and their SHA-256 checksums. Workflow artifacts are retained for 30 days.

The deployment outputs are:

| Artifact | Purpose |
| --- | --- |
| `index.html` and `assets/` | Canonical combined GitHub Pages deployment; used directly, not generated |
| `dist/hescor-data-learning-lab.h5p` | Combined H5P with both games and full HESCOR header/footer |
| `dist/data-detective.h5p` | Data Detective only, without site header/footer |
| `dist/type-sorter.h5p` | Type Sorter only, without site header/footer |

The H5P files contain custom libraries. The account performing the first upload must therefore be allowed to install H5P libraries.

## Local preview

Serve the repository root with any static server:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.
