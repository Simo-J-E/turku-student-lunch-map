import type { ChangeEvent } from 'react';
import type { Restaurant, RestaurantFilters } from '@turku-lunch/shared';
import { LocateFixed, RotateCcw } from 'lucide-react';
import { DEFAULT_FILTERS } from '../constants/filters';

export default function FiltersPanel({ filters, setFilters, restaurants, onLocate, locating }: {
  filters: RestaurantFilters;
  setFilters: (filters: RestaurantFilters) => void;
  restaurants: Restaurant[];
  onLocate: () => void;
  locating: boolean;
}) {
  const values = (key: 'area'|'campus'|'chain') => [...new Set(
    restaurants.map((restaurant) => restaurant[key]).filter((value): value is string => Boolean(value)),
  )].sort((a,b) => a.localeCompare(b,'fi'));
  const patch = (next: Partial<RestaurantFilters>) => setFilters({ ...filters, ...next });

  return <div className="card p-4">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-semibold">Suodattimet</h2>
      <button className="icon-btn" onClick={() => setFilters(DEFAULT_FILTERS)} aria-label="Tyhjennä suodattimet"><RotateCcw size={16}/></button>
    </div>
    <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
      <label className="block">Hinta
        <select className="input mt-1" value={filters.maxPrice ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => patch({maxPrice:event.target.value ? Number(event.target.value) : null})}>
          <option value="">Kaikki hinnat</option>
          <option value="3.2">Enintään 3,20 €</option>
          <option value="5.9">Enintään 5,90 €</option>
          <option value="7">Enintään 7,00 €</option>
        </select>
      </label>
      <label className="block">Kampus
        <select className="input mt-1" value={filters.campus} onChange={(event: ChangeEvent<HTMLSelectElement>) => patch({campus:event.target.value})}>
          <option value="">Kaikki</option>{values('campus').map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="block">Alue
        <select className="input mt-1" value={filters.area} onChange={(event: ChangeEvent<HTMLSelectElement>) => patch({area:event.target.value})}>
          <option value="">Kaikki</option>{values('area').map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="block">Ketju
        <select className="input mt-1" value={filters.chain} onChange={(event: ChangeEvent<HTMLSelectElement>) => patch({chain:event.target.value})}>
          <option value="">Kaikki</option>{values('chain').map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="block">Järjestys
        <select className="input mt-1" value={filters.sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => patch({sort:event.target.value as RestaurantFilters['sort']})}>
          <option value="name">Nimi</option><option value="price">Halvin ensin</option><option value="distance">Lähin ensin</option>
        </select>
      </label>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {([
        ['menuAvailable','Ruokalista saatavilla'],
        ['premiumOnly','Deluxe / premium'],
        ['vegan','Vegaaninen'],
        ['vegetarian','Kasvis'],
        ['glutenFree','Gluteeniton'],
        ['openNow','Lounas auki nyt'],
      ] as const).map(([key,label]) => <label key={key} className={`filter-chip ${filters[key] ? 'filter-chip-active' : ''}`}>
        <input className="sr-only" type="checkbox" checked={filters[key]} onChange={(event: ChangeEvent<HTMLInputElement>) => patch({[key]:event.target.checked})}/>{label}
      </label>)}
      <button className="filter-chip" onClick={onLocate}><LocateFixed size={15}/>{locating ? 'Haetaan…' : 'Käytä sijaintiani'}</button>
    </div>
  </div>;
}

