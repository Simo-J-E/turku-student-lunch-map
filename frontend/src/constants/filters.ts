import type { RestaurantFilters } from '@turku-lunch/shared';

export const DEFAULT_FILTERS: RestaurantFilters = {
  query:'',maxPrice:null,studentDiscountOnly:true,premiumOnly:false,menuAvailable:false,vegan:false,
  vegetarian:false,glutenFree:false,openNow:false,area:'',campus:'',chain:'',sort:'name',
};
