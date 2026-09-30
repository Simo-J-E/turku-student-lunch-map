# Turun opiskelijalounaat

Yksinkertainen karttasovellus Turun opiskelijaravintoloille. Kartalta ja listasta näkee opiskelijahinnat, päivän ruokalistat silloin kun ne voidaan hakea virallisesta lähteestä sekä hyödylliset suodattimet.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Leaflet + OpenStreetMap
- Cloudflare Workers + D1
- Vitest, ESLint, Prettier
- GitHub Actions + GitHub Pages
- PWA manifest + basic offline cache

## Ravintolat

Seedissä on 21 Turun opiskelijaravintolaa:

- Assarin Ullakko
- Block
- Deli Pharma
- Delica
- Dental
- Fiskarholmen - Auriga Business Center
- Flavoria cafe
- Galilei
- Kasvisravintola Keidas
- Kisälli
- Kårkafé Arken
- Kårkafé Astra
- Kårkafé Aurum
- Kårkafé Kåren
- Linus
- Macciavelli
- Monttu ja Mercatori
- Sigyn
- Turun AMK Lemminkäisenkatu
- TYKS U-sairaala
- Unican Kulma

Ravintolat näkyvät kartalla myös silloin, kun päivän ruokalistaa ei saada koneellisesti.

## Ruokalähteet

Worker käyttää ensisijaisesti virallisia lähteitä:

- Unica / Compass Group: virallisen ravintolasivun parseri
- Sodexo: virallinen daily JSON -ruokalista
- Juvenes Block: viralliselta sivulta opiskelijahinnat
- Kårkaféerna: viralliselta sivulta opiskelijahinnat
- Muut ravintolat: virallinen lähdelinkki näytetään, eikä puuttuvaa ruokalistaa keksitä

Ruokalista välimuistitetaan D1:een. Nykyinen automaattinen päivitysväli on 3 tuntia. Hinta ei ole sovelluksen suodatuslogiikkaan kovakoodattu, vaan se on ravintolan dataa ja parseri voi päivittää sen lähteestä.

## 1. Asenna

```bash
npm install
```

## 2. Luo D1

```bash
cd worker
npx wrangler d1 create turku-student-lunch
```

Kopioi saatu `database_id` tiedostoon `worker/wrangler.toml`:

```toml
database_id = "OMA_D1_DATABASE_ID"
```

Aja migraatiot rootista:

```bash
npm run migrate:local -w worker
npm run migrate:remote -w worker
```

GitHubin Worker-workflow ajaa remote-migraatiot automaattisesti ennen deployta.

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

## 4. Käynnistä paikallisesti

Rootista:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Worker: `http://localhost:8787`

Luo frontendille `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:8787
```

## 5. Tarkista ennen julkaisua

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Samat tarkistukset ajetaan myös GitHub Actionsissa ennen kumpaakaan deployta. Jos yksikin tarkistus epäonnistuu, Worker tai GitHub Pages ei julkaise uutta versiota.

## GitHub Pages

1. Pushaa repo GitHubiin.
2. Repository Settings -> Pages -> Source: **GitHub Actions**.
3. Lisää repository variable `VITE_API_URL`, esimerkiksi `https://turku-student-lunch-api.<subdomain>.workers.dev`.
4. Push `main`-branchiin käynnistää tarkistukset ja Pages-deployn.

## Cloudflare deploy

Lisää GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Päivitä `worker/wrangler.toml` oikealla D1 database id:llä. Worker deployataan vasta kun lint, typecheck, testit ja build ovat menneet läpi.

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

Tee parseri `worker/src/parsers/`-kansioon ja kutsu sitä `refreshRestaurantMenu`-palvelusta. Pidä lähteenä ravintolan omaa tai muuta virallista lähdettä. Puuttuvaa tietoa ei arvata.

## Lisenssi

MIT.
