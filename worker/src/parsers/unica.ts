import type { Diet, Meal } from '@turku-lunch/shared';

function decodeHtml(value:string){ return value.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&auml;/gi,'ä').replace(/&ouml;/gi,'ö').replace(/&Auml;/g,'Ä').replace(/&Ouml;/g,'Ö').replace(/&euro;/gi,'€').replace(/&#\d+;/g,' '); }
export function htmlToText(html:string){ return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|div|li|h\d|section|article|tr)>/gi,'\n').replace(/<[^>]+>/g,' ')).split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n'); }
const dietCodes: Record<string,Diet>={G:'GLUTEN_FREE',L:'LACTOSE_FREE',M:'DAIRY_FREE',VEG:'VEGAN'};
function parseDiets(line:string):Diet[]{ const up=line.toUpperCase(); const found=new Set<Diet>(); for(const [code,diet] of Object.entries(dietCodes)){ if(new RegExp(`(^|[, (])${code}($|[, )])`,'i').test(up)) found.add(diet); } if(found.has('VEGAN')) found.add('VEGETARIAN'); return [...found]; }
function isNoise(line:string){ return /^(Lounas|Lunch|Tilaa ruokalista|Tulosta|Rajaa|Näytä vain|Gluteeniton|Laktoositon|Maidoton|Vegaani|Allergeeneja|Osoite|Aukioloajat|Ota yhteyttä|Puh\.|Sähköposti)/i.test(line) || /^\(?[A-Z*, ]{1,30}\)?$/.test(line); }
function dateLabel(iso:string){ const [y,m,d]=iso.split('-').map(Number); return `${d}.${m}.${y}`; }
function priceLine(line:string){ return /\d+[,.]\d{1,2}\s*(?:€)?\s*\/\s*\d+[,.]\d{1,2}/.test(line); }
function prices(line:string){ return [...line.matchAll(/\d+[,.]\d{1,2}/g)].map(m=>Number(m[0].replace(',','.'))); }

export function parseUnicaText(text:string, date:string): {meals:Meal[]; studentPrice:number|null; premiumPrice:number|null} {
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
  const label=dateLabel(date); const start=lines.findIndex(l=>l.includes(label));
  if(start<0) return {meals:[],studentPrice:null,premiumPrice:null};
  const section:string[]=[];
  for(let i=start+1;i<lines.length;i++){ const l=lines[i]!; if(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/.test(l) && !l.includes(label)) break; if(/^Huomioithan|^\(G\)|^Ravintola |^Tyylikäs |^Tervetuloa/i.test(l)) break; section.push(l); }
  const meals:Meal[]=[]; let category='LOUNAS'; let currentPrice:number|null=null; let studentPrice:number|null=null; let premiumPrice:number|null=null;
  for(let i=0;i<section.length;i++){
    const line=section[i]!;
    if(/Lounas tarjolla|Lunch served/i.test(line)) continue;
    if(priceLine(line)){ const ps=prices(line); currentPrice=ps[0]??null; if(currentPrice!=null){ if(studentPrice==null || currentPrice<studentPrice) studentPrice=currentPrice; if(/DELI|BISTRO|PREMIUM|BRUNCH/i.test(category) && (premiumPrice==null||currentPrice<premiumPrice)) premiumPrice=currentPrice; } continue; }
    const upper=line.toUpperCase();
    if((upper===line && line.length<80 && !isNoise(line)) || /LOUNAS|LUNCH|BISTRO|DELI|TOAST|KEITTO|SOUP|SALAATTI|SALAD|BRUNCH/i.test(line) && line.length<90){ category=line; continue; }
    if(isNoise(line) || line.length<3 || /^\d+[,.]\d+/.test(line)) continue;
    if(/^[A-Z*, ()]+$/.test(line)) { const last=meals.at(-1); if(last) last.diets=[...new Set([...last.diets,...parseDiets(line)])]; continue; }
    const diets=parseDiets(line); const clean=line.replace(/\s*\([^)]*(?:G|L|M|Veg|VS|A)[^)]*\)\s*$/i,'').replace(/^\*\s*/,'').trim();
    if(clean && !/^(G|L|M|Veg|VS|A)(,\s*(G|L|M|Veg|VS|A))*$/i.test(clean)) meals.push({name:clean,category,studentPrice:currentPrice,diets,allergens:[]});
  }
  return {meals:meals.slice(0,40),studentPrice,premiumPrice};
}

export function parseUnicaHtml(html:string,date:string){ return parseUnicaText(htmlToText(html),date); }
