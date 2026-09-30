import { describe, expect, it } from 'vitest';
import { VERIFIED_RESTAURANTS } from './verifiedRestaurants';

const EXPECTED_TURKU_RESTAURANTS = [
  'Assarin Ullakko',
  'Block',
  'Deli Pharma',
  'Delica',
  'Dental',
  'Fiskarholmen - Auriga Business Center',
  'Flavoria cafe',
  'Galilei',
  'Kasvisravintola Keidas',
  'Kisälli',
  'Kårkafé Arken',
  'Kårkafé Astra',
  'Kårkafé Aurum',
  'Kårkafé Kåren',
  'Linus',
  'Macciavelli',
  'Monttu ja Mercatori',
  'Sigyn',
  'Turun AMK Lemminkäisenkatu',
  'TYKS U-sairaala',
  'Unican Kulma',
].sort((a,b) => a.localeCompare(b,'fi'));

describe('VERIFIED_RESTAURANTS', () => {
  it('contains the full 21 restaurant Turku reference list', () => {
    const names = VERIFIED_RESTAURANTS.map((restaurant) => restaurant.name).sort((a,b) => a.localeCompare(b,'fi'));
    expect(names).toEqual(EXPECTED_TURKU_RESTAURANTS);
  });

  it('has unique slugs and valid Turku coordinates', () => {
    const slugs = new Set(VERIFIED_RESTAURANTS.map((restaurant) => restaurant.slug));
    expect(slugs.size).toBe(VERIFIED_RESTAURANTS.length);
    for (const restaurant of VERIFIED_RESTAURANTS) {
      expect(restaurant.latitude).toBeGreaterThan(60.4);
      expect(restaurant.latitude).toBeLessThan(60.5);
      expect(restaurant.longitude).toBeGreaterThan(22.2);
      expect(restaurant.longitude).toBeLessThan(22.35);
    }
  });
});
