# Turku Student Lunch Map

Static GitHub Pages application for finding Kela-subsidised student restaurants in Turku and checking today's menus.

## What this version does

- React + TypeScript + Vite + Tailwind CSS
- GitHub Pages only: no backend, Cloudflare Worker or database
- GitHub Actions refreshes menu data and deploys the static site
- Map + permanent restaurant sidebar/list
- Clicking a map marker selects, highlights and scrolls to that restaurant in the sidebar
- The selected sidebar card expands its full menu; no map popup/window is opened
- On phones, tapping a map marker switches to the list and opens the selected restaurant
- Meals are normalised as **basic**, **special/deluxe**, or **other**
- Search, price/diet/opening filters, geolocation and dark mode
- No analytics or advertising cookies

## Central data format

All providers are normalised into one build artifact:

```text
frontend/public/data/restaurants.json
```

GitHub Actions creates this file from official restaurant sources before building the site. See [DATA_SOURCES.md](./DATA_SOURCES.md).

The project does **not** scrape or call `opiskelijalounas.app` because its current terms prohibit scraping its website/APIs/backend and republishing restaurant data at scale without permission. It is used only as a human reference when checking coverage.

## Basic vs special/deluxe meals

Current Kela pricing rules are kept separately in:

```text
data/kela-pricing.json
```

That file currently represents rules valid from 1 January 2026 and contains the official Kela source URL. Menu prices themselves still come from restaurant sources.

## Accessibility and privacy

The interface is designed toward WCAG 2.2 AA / EN 301 549 practices:

- keyboard-operable restaurant selection
- visible focus indicators
- semantic landmarks and labels
- skip link to restaurant results
- screen-reader live status for selection/results
- 44 px touch targets for primary controls
- reduced-motion support
- list view as an alternative to the map
- responsive phone/tablet/desktop layouts
- no analytics or tracking cookies
- geolocation is requested only by user action and is not stored by the app

This is an implementation target, not a legal certification. An accessibility audit should be done before claiming formal conformance.

## Local development

```bash
npm install
npm run update:data
npm run dev
```

Offline UI/data-shape development:

```bash
npm run update:data:offline
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run update:data:offline
npm run validate:data
npm run build
```

Or:

```bash
npm run verify
```

## GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Set the source to **GitHub Actions**.
4. Push to `main` or run **Deploy GitHub Pages** manually.

The workflow also runs every two hours to rebuild the static menu data.

No secrets, D1 database, Cloudflare account or backend URL are required.
