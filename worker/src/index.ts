import type { Restaurant } from '@turku-lunch/shared';
import { ensureSeeded, getRestaurant, getRestaurants, patchRestaurant } from './db';
import { helsinkiDate, refreshRestaurantMenu, supportsMenuRefresh, type Env } from './services/menu';

const json = (data: unknown, status = 200, origin = '*') => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type':'application/json; charset=utf-8',
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Headers':'Content-Type, Authorization',
    'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS',
  },
});

function auth(req: Request, env: Env) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/, '');
  return Boolean(env.ADMIN_SECRET && token === env.ADMIN_SECRET);
}

async function maybeRefresh(env: Env, restaurant: Restaurant): Promise<Restaurant> {
  const menu = restaurant.todayMenu;
  const stale = !menu || Date.now() - new Date(menu.fetchedAt).getTime() > 3 * 60 * 60 * 1000;
  if (!stale || !supportsMenuRefresh(restaurant)) return restaurant;

  try {
    restaurant.todayMenu = await refreshRestaurantMenu(env, restaurant);
  } catch (error) {
    if (menu) menu.error = (error as Error).message;
  }
  return restaurant;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status:204,
        headers:{
          'Access-Control-Allow-Origin':origin,
          'Access-Control-Allow-Headers':'Content-Type, Authorization',
          'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS',
        },
      });
    }

    try {
      await ensureSeeded(env);
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === '/api/health') return json({ok:true,date:helsinkiDate()},200,origin);

      if (path === '/api/restaurants' && request.method === 'GET') {
        const items = await getRestaurants(env,url.searchParams.get('city') || 'Turku');
        const refreshed = await Promise.all(items.map((restaurant) => maybeRefresh(env,restaurant)));
        return json(refreshed,200,origin);
      }

      const match = path.match(/^\/api\/restaurants\/([^/]+)$/);
      if (match && request.method === 'GET') {
        const slug = match[1];
        if (!slug) return json({error:'Not found'},404,origin);
        const found = await getRestaurant(env,decodeURIComponent(slug));
        if (!found) return json({error:'Not found'},404,origin);
        return json(await maybeRefresh(env,found),200,origin);
      }

      if (path === '/api/menus/today' && request.method === 'GET') {
        const items = await getRestaurants(env);
        const refreshed = await Promise.all(items.map((restaurant) => maybeRefresh(env,restaurant)));
        return json(refreshed.map((restaurant) => ({
          restaurantId:restaurant.id,
          restaurant:restaurant.name,
          menu:restaurant.todayMenu,
        })),200,origin);
      }

      if (path === '/api/admin/refresh' && request.method === 'POST') {
        if (!auth(request,env)) return json({error:'Unauthorized'},401,origin);
        const items = await getRestaurants(env);
        const supported = items.filter(supportsMenuRefresh);
        const skipped = items.length - supported.length;
        const results = await Promise.allSettled(supported.map((restaurant) => refreshRestaurantMenu(env,restaurant)));
        const refreshed = results.filter((result) => result.status === 'fulfilled').length;
        const failed = results.length - refreshed;
        return json({ok:true,refreshed,failed,skipped},200,origin);
      }

      const admin = path.match(/^\/api\/admin\/restaurants\/(\d+)$/);
      if (admin && request.method === 'PATCH') {
        if (!auth(request,env)) return json({error:'Unauthorized'},401,origin);
        const id = Number(admin[1]);
        if (!Number.isFinite(id)) return json({error:'Invalid id'},400,origin);
        const body = await request.json() as Record<string,unknown>;
        const item = await patchRestaurant(env,id,body);
        return item ? json(item,200,origin) : json({error:'Not found'},404,origin);
      }

      return json({error:'Not found'},404,origin);
    } catch (error) {
      return json({error:(error as Error).message},500,origin);
    }
  },
};
