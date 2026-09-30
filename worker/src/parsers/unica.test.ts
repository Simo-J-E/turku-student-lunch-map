import { describe, expect, it } from 'vitest';
import { parseUnicaText } from './unica';
const fixture=`Sigyn\nKeskiviikko 30.9.2026\nLounas tarjolla 11.00–15.00\nVEGAANINEN LOUNAS\n3,10 / 7,90 / 10,90\nHärkispataa teriyaki (A, G, L, M, Veg, VS)\nTummaa riisiä (G, L, M, Veg)\nLOUNAS\n3,10 / 7,90 / 10,90\nTonnikala-lehtipinaattilasagnettea (A, L, VS)\nTorstai 1.10.2026`;
describe('parseUnicaText',()=>{it('extracts price and meals',()=>{const r=parseUnicaText(fixture,'2026-09-30');expect(r.studentPrice).toBe(3.1);expect(r.meals.length).toBeGreaterThan(1);expect(r.meals[0]?.diets).toContain('VEGAN');});});
