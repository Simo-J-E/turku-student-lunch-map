# Data sources

The site is static and has no backend. GitHub Actions fetches public restaurant menu sources and writes one normalized file:

`frontend/public/data/restaurants.json`

Current provider adapters:

- Unica / Compass Group: official restaurant menu pages
- Sodexo Finland: official daily JSON menu endpoints where available
- Kårkaféerna: official lunch page
- Juvenes: official restaurant menu page
- Kela: student meal pricing rules are stored in `data/kela-pricing.json` with the official Kela source URL

## Why opiskelijalounas.app is not scraped

`opiskelijalounas.app` is useful as a reference, but its published terms prohibit scraping the website, feeds, APIs or backend and prohibit copying or republishing restaurant data at scale without permission. This project therefore does not call or scrape its private/public backend.

If the service owner gives explicit permission or publishes a reusable feed/API under suitable terms, a provider adapter can be added later.
