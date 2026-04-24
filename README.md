# Data Detective

A small browser game for learning basic data-management and data-science problems by spotting errors in mock tabular data.

## Play

[Play Data Detective](https://roink.github.io/data-detective/)

## About

Data Detective shows small tables with intentionally problematic entries. Players click suspicious cells and get immediate feedback.

Example problems include:

- text in numeric columns
- mixed units
- decimal comma vs. decimal point
- ambiguous or impossible dates
- inconsistent category labels
- duplicate IDs
- out-of-range coordinates
- cross-field inconsistencies

## How to use

Open the web app and click the wrong data.

## Local preview

Clone the repository and open `index.html` in a browser.

```bash
git clone https://github.com/roink/data-detective.git
cd data-detective
xdg-open index.html
