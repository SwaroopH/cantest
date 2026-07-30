# CanTest — Canada Citizenship Mock Test

**Try it live:** [https://swarooph.github.io/cantest/](https://swarooph.github.io/cantest/)

Unofficial local study tool based on IRCC’s [Discover Canada](https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada/read-online.html) guide. Pick any **province or territory** for capital/region questions (default: British Columbia).

This is **not** an official IRCC test. Only the Discover Canada study guide is authoritative.

## Features

- **Province/territory picker**: filters local capital/region questions; saved in `localStorage`
- **Mock exam**: 20 questions, 30-minute timer, pass at 15/20; stratified chapter mix with ≥1 local/regions question
- **Practice by chapter**: untimed, immediate feedback and source links
- **Review**: per-question explanations after submit
- **160+ MCQs** grounded in scraped guide content (includes the 3 official study-guide MCQs)

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Deploy (GitHub Pages)

Configured for `https://swarooph.github.io/cantest/` (`base: '/cantest/'` in Vite; workflow on `master`).

1. Push these changes to GitHub.
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Push to `master` (or run the **Deploy static content to Pages** workflow manually).
4. Site URL after a green Actions run: https://swarooph.github.io/cantest/

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the app |
| `npm run build` | Production build |
| `npm run scrape` | Re-fetch Discover Canada chapters into `data/guide/` |
| `npm run smoke` | Quick checks for bank size, sampling, pass threshold |

## Content pipeline

1. `npm run scrape` writes structured JSON under `data/guide/`
2. `data/questions.json` is the curated MCQ bank (answers checked against the corpus)
3. The Vite app imports the question bank at build time

## Exam rules mirrored

- 20 questions
- 30 minutes
- Pass: 15/20 (75%)

## Licence

Two different things live in this repo, under two different terms:

- **Code** (`src/`, `scripts/`, config) — MIT, © 2026 Swaroop Hegde. See [LICENSE](LICENSE).
- **Study content** (`data/questions.json`, `data/guide/`) — adapted from Discover Canada,
  © His Majesty the King in Right of Canada, as represented by the Minister of Immigration,
  Refugees and Citizenship Canada. Reproduced for non-commercial use. See [NOTICE](NOTICE).

The MIT grant covers the code only; it does not extend to the Discover Canada material. This
is not an official version of that material and is not endorsed by the Government of Canada.
