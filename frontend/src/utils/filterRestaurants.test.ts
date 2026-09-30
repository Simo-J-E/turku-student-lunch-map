import { describe, expect, it } from 'vitest';
import type { Restaurant } from '@turku-lunch/shared';
import { filterRestaurants, lunchOpenAt } from './filterRestaurants';
import { DEFAULT_FILTERS } from '../constants/filters';

const base: Restaurant = {
  id:1,name:'Test',slug:'test',address:'Turku',latitude:60,longitude:22,city:'Turku',websiteUrl:'x',menuUrl:'x',
  studentDiscountAvailable:true,studentMealType:'KELA_SUBSIDIZED',studentPrice:3.1,premiumStudentPrice:null,normalPrice:null,
  currency:'EUR',vegetarianAvailable:false,veganAvailable:false,glutenFreeAvailable:false,sourceUrl:'x',priceSourceUrl:'x',
  active:true,updatedAt:new Date().toISOString(),todayMenu:null,
};

describe('filterRestaurants', () => {
  it('filters by max price', () => {
    expect(filterRestaurants([base,{...base,id:2,studentPrice:5}],{...DEFAULT_FILTERS,maxPrice:4})).toHaveLength(1);
  });

  it('does not hide unknown prices unless a price filter is enabled', () => {
    expect(filterRestaurants([{...base,studentPrice:null}],DEFAULT_FILTERS)).toHaveLength(1);
    expect(filterRestaurants([{...base,studentPrice:null}],{...DEFAULT_FILTERS,maxPrice:4})).toHaveLength(0);
  });

  it('filters by menu availability and meal name', () => {
    const withMenu: Restaurant = {
      ...base,
      id:2,
      todayMenu:{
        restaurantId:2,date:'2026-09-30',sourceUrl:'x',fetchedAt:new Date().toISOString(),
        meals:[{name:'Kana curry',category:'Lounas',diets:[],allergens:[]}],
      },
    };
    expect(filterRestaurants([base,withMenu],{...DEFAULT_FILTERS,menuAvailable:true})).toEqual([withMenu]);
    expect(filterRestaurants([base,withMenu],{...DEFAULT_FILTERS,query:'kana'})).toEqual([withMenu]);
  });

  it('filters diets from the current menu rather than invented static flags', () => {
    const vegan: Restaurant = {
      ...base,
      id:2,
      todayMenu:{
        restaurantId:2,date:'2026-09-30',sourceUrl:'x',fetchedAt:new Date().toISOString(),
        meals:[{name:'Kasviscurry',category:'Lounas',diets:['VEGAN','VEGETARIAN'],allergens:[]}],
      },
    };
    expect(filterRestaurants([base,vegan],{...DEFAULT_FILTERS,vegan:true})).toEqual([vegan]);
  });
});

describe('lunchOpenAt', () => {
  it('respects Finnish weekday ranges', () => {
    const restaurant = {...base,lunchHours:'ma-pe 10.30-14.00, la 11-13'};
    expect(lunchOpenAt(restaurant,new Date('2026-09-30T09:00:00Z'))).toBe(true); // Wed 12:00 Helsinki
    expect(lunchOpenAt(restaurant,new Date('2026-10-04T09:00:00Z'))).toBe(false); // Sun 12:00 Helsinki
  });

  it('uses opening weekdays when lunch hours only contain a clock range', () => {
    const restaurant = {...base,openingHours:'ma-pe',lunchHours:'10.30-14.00'};
    expect(lunchOpenAt(restaurant,new Date('2026-09-30T09:00:00Z'))).toBe(true);
    expect(lunchOpenAt(restaurant,new Date('2026-10-04T09:00:00Z'))).toBe(false);
  });
});
