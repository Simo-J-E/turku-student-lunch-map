import { ensureSeeded, getRestaurant, getRestaurants, patchRestaurant } from './db';
import { helsinkiDate, refreshRestaurantMenu, type Env } from './services/menu';

const json=(data:unknown,status=200,origin='*')=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS'}});
function auth(req:Request,env:Env){const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/,'');return Boolean(env.ADMIN_SECRET&&token===env.ADMIN_SECRET);}
async function maybeRefresh(env:Env, restaurant: Awaited<ReturnType<typeof getRestaurant>>){ if(!restaurant)return restaurant; const menu=restaurant.todayMenu; const stale=!menu || Date.now()-new Date(menu.fetchedAt).getTime()>3*60*60*1000; if(stale){try{restaurant.todayMenu=await refreshRestaurantMenu(env,restaurant);}catch(e){if(menu) menu.error=(e as Error).message;}} return restaurant; }

export default { async fetch(request:Request,env:Env):Promise<Response>{
  const origin=env.ALLOWED_ORIGIN||'*'; if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS'}});
  try{
    await ensureSeeded(env); const url=new URL(request.url); const p=url.pathname;
    if(p==='/api/health') return json({ok:true,date:helsinkiDate()},200,origin);
    if(p==='/api/restaurants'&&request.method==='GET'){ const items=await getRestaurants(env,url.searchParams.get('city')||'Turku'); const refreshed=await Promise.all(items.map(r=>maybeRefresh(env,r))); return json(refreshed,200,origin); }
    const match=p.match(/^\/api\/restaurants\/([^/]+)$/); if(match&&request.method==='GET'){ const item=await maybeRefresh(env,await getRestaurant(env,decodeURIComponent(match[1]!))); return item?json(item,200,origin):json({error:'Not found'},404,origin); }
    if(p==='/api/menus/today'&&request.method==='GET'){ const items=await getRestaurants(env); const refreshed=await Promise.all(items.map(r=>maybeRefresh(env,r))); return json(refreshed.map(r=>({restaurantId:r.id,restaurant:r.name,menu:r.todayMenu})),200,origin); }
    if(p==='/api/admin/refresh'&&request.method==='POST'){ if(!auth(request,env))return json({error:'Unauthorized'},401,origin); const items=await getRestaurants(env); let refreshed=0; await Promise.allSettled(items.map(async r=>{await refreshRestaurantMenu(env,r);refreshed++;})); return json({ok:true,refreshed},200,origin); }
    const admin=p.match(/^\/api\/admin\/restaurants\/(\d+)$/); if(admin&&request.method==='PATCH'){ if(!auth(request,env))return json({error:'Unauthorized'},401,origin); const body=await request.json() as Record<string,unknown>; const item=await patchRestaurant(env,Number(admin[1]),body); return item?json(item,200,origin):json({error:'Not found'},404,origin); }
    return json({error:'Not found'},404,origin);
  } catch(e){return json({error:(e as Error).message},500,origin);}
}};
