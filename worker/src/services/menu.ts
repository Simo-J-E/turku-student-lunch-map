import type { Menu, Restaurant } from '@turku-lunch/shared';
import { parseUnicaHtml } from '../parsers/unica';

export interface Env { DB: D1Database; ADMIN_SECRET?: string; ALLOWED_ORIGIN?: string }
export function helsinkiDate(d=new Date()){ return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Helsinki',year:'numeric',month:'2-digit',day:'2-digit'}).format(d); }

export async function refreshRestaurantMenu(env:Env, r:Restaurant, date=helsinkiDate()):Promise<Menu>{
  const response=await fetch(r.menuUrl,{headers:{'User-Agent':'TurkuStudentLunchMap/1.0 (+GitHub project; public menu aggregator)','Accept-Language':'fi-FI,fi;q=0.9'}});
  if(!response.ok) throw new Error(`Menu source ${response.status}`);
  const parsed=parseUnicaHtml(await response.text(),date); const fetchedAt=new Date().toISOString();
  await env.DB.prepare('DELETE FROM meals WHERE menu_id IN (SELECT id FROM menus WHERE restaurant_id=? AND date=?)').bind(r.id,date).run();
  await env.DB.prepare('DELETE FROM menus WHERE restaurant_id=? AND date=?').bind(r.id,date).run();
  const menuResult=await env.DB.prepare('INSERT INTO menus (restaurant_id,date,source_url,fetched_at) VALUES (?,?,?,?) RETURNING id').bind(r.id,date,r.menuUrl,fetchedAt).first<{id:number}>();
  const menuId=menuResult!.id;
  for(const meal of parsed.meals){
    await env.DB.prepare('INSERT INTO meals (menu_id,name,category,student_price,diets_json,allergens_json) VALUES (?,?,?,?,?,?)').bind(menuId,meal.name,meal.category,meal.studentPrice??null,JSON.stringify(meal.diets),JSON.stringify(meal.allergens)).run();
  }
  await env.DB.prepare('UPDATE restaurants SET student_price=COALESCE(?,student_price), premium_student_price=COALESCE(?,premium_student_price), price_last_checked_at=?, updated_at=? WHERE id=?').bind(parsed.studentPrice,parsed.premiumPrice,fetchedAt,fetchedAt,r.id).run();
  return {restaurantId:r.id,date,sourceUrl:r.menuUrl,fetchedAt,meals:parsed.meals,id:menuId};
}
