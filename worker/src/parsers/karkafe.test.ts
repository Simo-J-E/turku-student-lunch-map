import { describe, expect, it } from 'vitest';
import { parseKarkafeText } from './karkafe';

const fixture = `Lounas
Viikko 39
Hintakategoria
1 Erikoislounas
Opiskelijat 5,90 €
Jatko-opiskelijat 9,30 €
2 Normaali lounas
Opiskelijat 3,10 €
3 Bowl
Opiskelijat 5,30 €
4 Astra Solsidan
Opiskelijat 9,90 €
Arken
MA-PE 11.00-14.30
Viikon lista
Kanamakkarastroganoffia * 2 L G P
Laktoositon, gluteeniton.
100g sisältää: Energia 120kcal
Hernis ja Papu-kasvisnuudeliwokki * 2 Vgn M C P S
Vegaaninen, maidoton.
Astra
MA-PE 11-14.30
Viikon lista
Teriyaki kana-nuudeli bowl 3 M C P
Maidoton.
Teriyaki Hernis-nuudeli bowl 3 Vgn M C P
Vegaaninen, maidoton.
Astra Solsidan
Possuvindaloocurrya * 4 L G
Aurum`;

describe('parseKarkafeText', () => {
  it('extracts only the selected restaurant section and source prices', () => {
    const result = parseKarkafeText(fixture, 'Kårkafé Arken');
    expect(result.studentPrice).toBe(3.1);
    expect(result.premiumPrice).toBe(5.3);
    expect(result.meals).toHaveLength(2);
    expect(result.meals[0]?.diets).toContain('GLUTEN_FREE');
    expect(result.meals[1]?.diets).toContain('VEGAN');
  });

  it('does not include Astra Solsidan in the normal Astra menu', () => {
    const result = parseKarkafeText(fixture, 'Kårkafé Astra');
    expect(result.meals).toHaveLength(2);
    expect(result.meals.some((meal) => meal.name.includes('Possuvindaloo'))).toBe(false);
  });
});
