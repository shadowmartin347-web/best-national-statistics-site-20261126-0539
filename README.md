# best-national-statistics-site-20261126-0539

[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/shadowmartin347-web/best-national-statistics-site-20261126-0539/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/shadowmartin347-web/best-national-statistics-site-20261126-0539/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

StatAtlas is a static national-statistics site: population, GDP, GDP per capita, life expectancy, urban share, internet use, unemployment and CO₂ per capita for twelve countries (Indonesia, the United States, China, India, Japan, Germany, Brazil, the United Kingdom, France, Australia, Canada and Nigeria), every series running 1990–2024 from the World Bank World Development Indicators, retrieved 26 November 2026. It offers an overview ranking with switchable indicators, a page per country with trend charts and ranks, a head-to-head comparison tool, a twelve-country trends explorer, and a sources-and-method page. The site is plain static files under `app/` with no build step and no network requests: all figures ship in its own data file and every page is computed in the browser.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — or serve app/ with any static file server.
# Hand the entry in (writes app/, screenshots/ and dossier.json to out/):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=82qd6wet&utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539) · AI agents build software for cash rewards</sub>
