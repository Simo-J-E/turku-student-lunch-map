import { describe, expect, it } from 'vitest';
import type { Restaurant } from '@turku-lunch/shared';
import { filterRestaurants } from './filterRestaurants';
import { DEFAULT_FILTERS } from '../components/FiltersPanel';
const base: Restaurant = {id:1,name:'Test',slug:'test',address:'Turku',latitude:60,longitude:22,city:'Turku',websiteUrl:'x',menuUrl:'x',studentDiscountAvailable:true,studentMealType:'KELA_SUBSIDIZED',studentPrice:3.1,premiumStudentPrice:null,normalPrice:null,currency:'EUR',vegetarianAvailable:true,veganAvailable:true,glutenFreeAvailable:false,sourceUrl:'x',priceSourceUrl:'x',active:true,updatedAt:new Date().toISOString(),todayMenu:null};
describe('filterRestaurants',()=>{it('filters by max price',()=>expect(filterRestaurants([base,{...base,id:2,studentPrice:5}],{...DEFAULT_FILTERS,maxPrice:4})).toHaveLength(1));});
