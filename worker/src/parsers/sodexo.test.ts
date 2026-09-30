import { describe, expect, it } from 'vitest';
import { parseSodexoJson } from './sodexo';

describe('parseSodexoJson', () => {
  it('parses meals, diets and student prices', () => {
    const result = parseSodexoJson({
      courses: {
        1: {title_fi:'Kasviscurry',category:'FROM THE FIELD-VEGAN',dietcodes:'G, M',properties:'VEG',price:'3,10 € / 8,10 €'},
        2: {title_fi:'Burger',category:'Grilli',dietcodes:'L',price:'5,90 € / 11,40 €'},
      },
    });
    expect(result.meals).toHaveLength(2);
    expect(result.studentPrice).toBe(3.1);
    expect(result.premiumPrice).toBe(5.9);
    expect(result.meals[0]?.diets).toContain('VEGAN');
    expect(result.meals[0]?.diets).toContain('GLUTEN_FREE');
  });

  it('does not use a dessert price as the student lunch price', () => {
    const result = parseSodexoJson({
      courses: {
        1: {title_fi:'Pasta',category:'Lounas',price:'3,10 € / 8,10 €'},
        2: {title_fi:'Pannacotta',category:'Jälkiruoka',price:'1,50 €'},
      },
    });
    expect(result.studentPrice).toBe(3.1);
    expect(result.meals.find((meal) => meal.name === 'Pannacotta')?.studentPrice).toBeNull();
  });


  it('recognises vegan markers from Sodexo image metadata', () => {
    const result = parseSodexoJson({
      courses: [{title_fi:'Kasviskeitto',category:'Lounas',dietcodeImages:['https://example.test/vege.svg'],price:'3,10 €'}],
    });
    expect(result.meals[0]?.diets).toContain('VEGAN');
  });

  it('returns an empty result for invalid data', () => {
    expect(parseSodexoJson(null)).toEqual({meals:[],studentPrice:null,premiumPrice:null});
  });
});
