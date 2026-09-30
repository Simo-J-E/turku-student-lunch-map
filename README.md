# Turun opiskelijalounaskartta

Yksinkertainen karttasovellus Turun opiskelijaravintoloille. Näyttää opiskelijahinnat, sijainnit, suodattimet ja saatavilla olevat päivän ruokalistat.

## Tärkeä: ei backendiä

Tämä projekti toimii **pelkällä GitHub Pagesilla**.

- React + TypeScript + Vite
- Tailwind CSS
- Leaflet + OpenStreetMap
- GitHub Pages
- GitHub Actions
- Ei Cloudflarea
- Ei D1-tietokantaa
- Ei Worker-palvelinta
- Ei API-avaimia tai GitHub Secrets -asetuksia

Ruokalistat päivitetään GitHub Actionsissa rakennusvaiheessa. Action hakee julkisista ravintolalähteistä päivän tiedot ja kirjoittaa ne staattiseksi tiedostoksi `frontend/public/data/restaurants.json`. Selain lukee tämän tiedoston suoraan GitHub Pagesista.

## Ravintolat

Projektissa on 21 Turun opiskelijaravintolan perustiedot. Automaattinen päivän ruokalistan haku on toteutettu lähteille, jotka voidaan lukea luotettavasti build-vaiheessa:

- Unica / Compass Group
- Sodexo
- Kårkaféerna
- Juvenes Block

Jos jonkin ravintolan lähde ei ole automaattisesti luettavissa, ravintola näkyy silti kartalla ja käyttäjä pääsee sen viralliselle ruokalistasivulle.

## Paikallinen käyttö

Tarvitset Node.js 22:n.

```bash
npm install
npm run update:data
npm run dev
```

Jos haluat vain käyttää repossa olevaa ravintoladataa ilman verkkohakuja:

```bash
npm run update:data:offline
npm run dev
```

## Tarkistukset

Ennen julkaisua:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Tai kaikki yhdellä komennolla:

```bash
npm run verify
```

## GitHub Pages -julkaisu

1. Pushaa projekti GitHubiin `main`-branchiin.
2. Avaa repositoryn **Settings → Pages**.
3. Valitse **Source: GitHub Actions**.
4. Avaa **Actions** ja anna `Deploy GitHub Pages` -workflow'n valmistua.

Muita asetuksia ei tarvita.

`Deploy GitHub Pages` tekee automaattisesti seuraavat asiat:

1. asentaa riippuvuudet
2. ajaa lintin
3. ajaa TypeScript-tarkistuksen
4. ajaa testit
5. hakee päivän ruokalistat
6. buildaa staattisen React-sivun
7. julkaisee sen GitHub Pagesiin

Workflow ajetaan myös automaattisesti noin kahden tunnin välein, jotta päivän ruokalistat päivittyvät ilman omaa backend-palvelinta.

## Projektirakenne

```text
.
├── .github/workflows/
│   ├── ci.yml
│   └── deploy-pages.yml
├── data/
│   └── restaurants.json
├── frontend/
│   ├── public/data/restaurants.json
│   └── src/
├── scripts/
│   ├── parsers/
│   └── update-data.mjs
├── shared/
└── package.json
```

## Ruokalistojen päivitys

Manuaalinen päivitys paikallisesti:

```bash
npm run update:data
```

Komento ei kaada koko buildia, jos yhden ravintolan ulkoinen sivu ei vastaa. Muut ravintolat päivitetään normaalisti.

## GitHub Pages -reititys

Sovellus käyttää `HashRouter`ia, joten myös ravintoloiden tarkemmat sivut toimivat GitHub Pagesissa ilman erillistä palvelinreititystä.

Esimerkiksi:

```text
https://käyttäjä.github.io/turku-student-lunch-map/#/restaurant/assarin-ullakko
```

## Lisenssi

MIT

## Kartan ravintolakortti

Kun käyttäjä valitsee ravintolan kartalta tai listasta, kartan päälle avautuu responsiivinen kortti, jossa näkyvät päivän ruokalista, opiskelijahinnat, ruokavaliot sekä ruokalistan alkuperäinen lähde. Puhelimessa kortti käyttää kartan leveyttä ja ruokalista vierii kortin sisällä.
