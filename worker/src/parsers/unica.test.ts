import { describe, expect, it } from 'vitest';
import { parseUnicaText } from './unica';

const fixture = `Sigyn
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

describe('parseUnicaText', () => {
  it('extracts student and premium prices and meals', () => {
    const parsed = parseUnicaText(fixture, '2026-09-30');
    expect(parsed.studentPrice).toBe(3.1);
    expect(parsed.premiumPrice).toBe(5.8);
    expect(parsed.meals.length).toBeGreaterThan(2);
    expect(parsed.meals[0]?.diets).toContain('VEGAN');
  });

  it('does not use dessert price as the student lunch price', () => {
    const parsed = parseUnicaText(fixture, '2026-09-30');
    expect(parsed.studentPrice).not.toBe(1.5);
    expect(parsed.meals.find((meal) => meal.name.includes('Pannacotta'))?.studentPrice).toBeNull();
  });

  it('returns an empty menu when the requested date is missing', () => {
    expect(parseUnicaText(fixture, '2026-10-05')).toEqual({ meals: [], studentPrice: null, premiumPrice: null });
  });
});
