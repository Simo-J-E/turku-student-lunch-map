# Turun opiskelijalounaat

Karttasovellus, joka näyttää Turun opiskelijaravintolat, opiskelijahinnat ja päivän ruokalistat. Frontend toimii GitHub Pagesissa ja API Cloudflare Workers + D1 -ympäristössä.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Leaflet + OpenStreetMap
- Cloudflare Workers
- Cloudflare D1
- Vitest, ESLint, Prettier
- GitHub Actions + GitHub Pages
- PWA manifest + basic offline cache

## Nykyinen datalähde

Ensimmäinen tuotantoadapteri lukee Unican / Compass Groupin julkisia virallisia ravintolasivuja. Seedissä on 10 Turun opiskelijaravintolaa: Assarin Ullakko, Monttu ja Mercatori, Macciavelli, Galilei, Linus, Kisälli, Dental, Deli Pharma, Sigyn ja Unican Kulma.

Hinnat ja päivän ruuat eivät ole käyttöliittymän logiikkaan kovakoodattuja: Worker hakee päivän listan lähdesivulta, parsii ensimmäisen opiskelijahinnan ja tallentaa tuloksen D1:een. Välimuisti on 3 tuntia.

> Huom: verkkosivujen HTML-rakenne voi muuttua. Parserille on testi, mutta tuotannossa lähdeadapteria kannattaa valvoa. Kela-tuettujen ravintoloiden täydellinen kansallinen lista kannattaa lisätä omana providerina, jos saat siihen vakaan rajapinnan.

## 1. Asenna

```bash
npm install
```

## 2. Luo D1

```bash
cd worker
npx wrangler d1 create turku-student-lunch
```

Kopioi saatu `database_id` tiedostoon `worker/wrangler.toml`.

Aja migraatiot:

```bash
npx wrangler d1 migrations apply turku-student-lunch --local
npx wrangler d1 migrations apply turku-student-lunch --remote
```

## 3. Admin secret

Paikallisesti:

```bash
cp worker/.dev.vars.example worker/.dev.vars
```

Muuta arvo:

```text
ADMIN_SECRET=oma-pitka-salaisuus
```

Tuotannossa:

```bash
cd worker
npx wrangler secret put ADMIN_SECRET
```

## 4. Käynnistä

Rootista:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Worker: `http://localhost:8787`

Luo frontendille tarvittaessa `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:8787
```

## 5. Testit ja build

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## GitHub Pages

1. Pushaa repo GitHubiin.
2. Repository Settings -> Pages -> Source: **GitHub Actions**.
3. Lisää repository variable `VITE_API_URL`, esim. `https://turku-student-lunch-api.<subdomain>.workers.dev`.
4. Push `main`-branchiin käynnistää Pages-workflow'n.

## Cloudflare deploy

Lisää GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Päivitä `worker/wrangler.toml` oikealla D1 database id:llä. `deploy-worker.yml` julkaisee backendin.

## API

- `GET /api/health`
- `GET /api/restaurants?city=Turku`
- `GET /api/restaurants/:slug`
- `GET /api/menus/today`
- `POST /api/admin/refresh` (Bearer ADMIN_SECRET)
- `PATCH /api/admin/restaurants/:id` (Bearer ADMIN_SECRET)

## GitHub Pages routing

Sovellus käyttää `HashRouter`-reititystä, joten refresh toimii myös projektipolun alla ilman 404:ää.

## Lisää uusi provider

Tee uusi parseri `worker/src/parsers/`-kansioon ja kutsu sitä `refreshRestaurantMenu`-palvelussa ravintolan ketjun tai provider-kentän perusteella. Pidä lähde aina virallisena ja välimuistita tulos.

## Tietojen luotettavuus

Sovellus näyttää ravintolan virallisen menu-URL:n lähteenä. Puuttuvia ruokia ei keksitä. Jos haku epäonnistuu, aiempi D1-lista voidaan näyttää ja API palauttaa lähdevirheen menuobjektiin.

## Lisenssi

MIT.
