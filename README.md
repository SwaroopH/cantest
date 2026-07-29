# CanTest — Canada Citizenship Mock Test

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
