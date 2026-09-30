import type { Restaurant } from '@turku-lunch/shared';

let cache: Restaurant[] | null = null;

async function loadRestaurants(): Promise<Restaurant[]> {
  if (cache) return cache;

  const response = await fetch(`${import.meta.env.BASE_URL}data/restaurants.json`, {
    cache: 'no-cache',
  });
  if (!response.ok) throw new Error(`Ravintoladatan lataus epäonnistui (${response.status}).`);

  const data = (await response.json()) as Restaurant[];
  cache = data.filter((restaurant) => restaurant.active);
  return cache;
}

export const api = {
  restaurants: loadRestaurants,
  restaurant: async (slug: string) => {
    const restaurants = await loadRestaurants();
    const restaurant = restaurants.find((item) => item.slug === slug);
    if (!restaurant) throw new Error('Ravintolaa ei löytynyt.');
    return restaurant;
  },
};
