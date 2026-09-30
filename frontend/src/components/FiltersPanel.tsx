import type { Restaurant, RestaurantFilters } from '@turku-lunch/shared';
import { LocateFixed, RotateCcw } from 'lucide-react';

export default function FiltersPanel({ filters, setFilters, restaurants, onLocate, locating }: {
  filters: RestaurantFilters;
  setFilters: (f: RestaurantFilters) => void;
  restaurants: Restaurant[];
  onLocate: () => void;
  locating: boolean;
}) {
  const values = (key: 'area'|'campus'|'chain') => [...new Set(restaurants.map((r) => r[key]).filter((x): x is string => Boolean(x)))].sort();
  const patch = (p: Partial<RestaurantFilters>) => setFilters({ ...filters, ...p });
  return <aside className="card p-4">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Suodattimet</h2><button className="btn p-2" onClick={() => setFilters(DEFAULT_FILTERS)} aria-label="Tyhjennä"><RotateCcw size={16}/></button></div>
    <div className="space-y-4 text-sm">
      <label className="block">Maksimihinta<input className="mt-1 w-full accent-slate-900" type="range" min="2.5" max="7" step="0.1" value={filters.maxPrice ?? 7} onChange={(e)=>patch({maxPrice:Number(e.target.value)})}/><div className="mt-1 text-xs text-slate-500">{filters.maxPrice ? `${filters.maxPrice.toFixed(2).replace('.', ',')} €` : 'Ei rajaa'}</div></label>
      {([['studentDiscountOnly','Vain opiskelija-alennus'],['premiumOnly','Deluxe / premium'],['vegan','Vegaaninen'],['vegetarian','Kasvis'],['glutenFree','Gluteeniton'],['openNow','Lounas auki nyt']] as const).map(([k,l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={filters[k]} onChange={(e)=>patch({[k]:e.target.checked})}/>{l}</label>)}
      {(['area','campus','chain'] as const).map((k) => <label key={k} className="block capitalize">{k}<select className="input mt-1" value={filters[k]} onChange={(e)=>patch({[k]:e.target.value})}><option value="">Kaikki</option>{values(k).map(v=><option key={v}>{v}</option>)}</select></label>)}
      <label className="block">Järjestys<select className="input mt-1" value={filters.sort} onChange={(e)=>patch({sort:e.target.value as RestaurantFilters['sort']})}><option value="name">Nimi</option><option value="price">Halvin</option><option value="distance">Lähin</option></select></label>
      <button className="btn w-full border border-slate-200 dark:border-slate-800" onClick={onLocate}><LocateFixed size={16}/>{locating ? 'Haetaan…' : 'Käytä sijaintiani'}</button>
    </div>
  </aside>;
}

export const DEFAULT_FILTERS: RestaurantFilters = {
  query:'', maxPrice:7, studentDiscountOnly:true, premiumOnly:false, vegan:false, vegetarian:false, glutenFree:false, openNow:false, area:'', campus:'', chain:'', sort:'name'
};
