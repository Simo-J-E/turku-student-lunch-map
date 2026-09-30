import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUnicaText } from './unica.mjs';
import { parseSodexoJson } from './sodexo.mjs';
import { parseKarkafeText } from './karkafe.mjs';
import { parseJuvenesHtml } from './juvenes.mjs';

const unicaFixture = `Sigyn
Keskiviikko 30.9.2026
Lounas tarjolla 11.00–15.00
VEGAANINEN LOUNAS
3,10 / 7,90 / 10,90
Härkispataa teriyaki (A, G, L, M, Veg, VS)
Tummaa riisiä (G, L, M, Veg)
DELILOUNAS
5,80 / 10,90
Poronkäristystä (G, L, M)
JÄLKIRUOKA
1,50 / 1,80
Pannacotta (G, L)
Torstai 1.10.2026`;

test('Unica parser parses lunch and ignores dessert price', () => {
  const result = parseUnicaText(unicaFixture, '2026-09-30');
  assert.equal(result.studentPrice, 3.1);
  assert.equal(result.premiumPrice, 5.8);
  assert.ok(result.meals.length >= 3);
  assert.ok(result.meals[0].diets.includes('VEGAN'));
  assert.equal(result.meals.find((meal) => meal.name.includes('Pannacotta'))?.studentPrice, null);
});

test('Sodexo parser parses prices and diets without using dessert price', () => {
  const result = parseSodexoJson({ courses: {
    1: { title_fi: 'Kasviscurry', category: 'FROM THE FIELD-VEGAN', dietcodes: 'G, M', properties: 'VEG', price: '3,10 € / 8,10 €' },
    2: { title_fi: 'Burger', category: 'Grilli', dietcodes: 'L', price: '5,90 € / 11,40 €' },
    3: { title_fi: 'Pannacotta', category: 'Jälkiruoka', price: '1,50 €' },
  }});
  assert.equal(result.studentPrice, 3.1);
  assert.equal(result.premiumPrice, 5.9);
  assert.ok(result.meals[0].diets.includes('VEGAN'));
  assert.equal(result.meals[2].studentPrice, null);
});

const karkafeFixture = `Lounas
Viikko 39
Hintakategoria
1 Erikoislounas
Opiskelijat 5,90 €
2 Normaali lounas
Opiskelijat 3,10 €
3 Bowl
Opiskelijat 5,30 €
Arken
MA-PE 11.00-14.30
Viikon lista
Kanamakkarastroganoffia * 2 L G P
Laktoositon, gluteeniton.
Hernis ja Papu-kasvisnuudeliwokki * 2 Vgn M C P
Vegaaninen, maidoton.
Astra
Teriyaki kana-nuudeli bowl 3 M C P
Aurum`;

test('Kårkafé parser keeps restaurant section and correct student prices', () => {
  const result = parseKarkafeText(karkafeFixture, 'Kårkafé Arken');
  assert.equal(result.studentPrice, 3.1);
  assert.equal(result.premiumPrice, 5.3);
  assert.equal(result.meals.length, 2);
  assert.ok(result.meals[0].diets.includes('GLUTEN_FREE'));
  assert.ok(result.meals[1].diets.includes('VEGAN'));
});

test('Juvenes parser reads student prices and menu rows', () => {
  const html = `<h3>Block lounaslista</h3><h3>COZY</h3><ul><li>Lihapullat G, L</li><li>Kasviscurry G, M, VEG</li></ul><h4>Erityisruokavaliomerkinnät:</h4><p>Buffet, opiskelijat 3,10 €</p><p>Fusion Kitchen, opiskelijat 5,90 €</p>`;
  const result = parseJuvenesHtml(html);
  assert.equal(result.studentPrice, 3.1);
  assert.equal(result.premiumPrice, 5.9);
  assert.equal(result.meals.length, 2);
  assert.ok(result.meals[1].diets.includes('VEGAN'));
});
