import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Restaurant, RestaurantFilters } from '@turku-lunch/shared';
import Header from '../components/Header';
import MapView from '../components/MapView';
import RestaurantCard from '../components/RestaurantCard';
import FiltersPanel, { DEFAULT_FILTERS } from '../components/FiltersPanel';
import { api } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { distanceKm } from '../utils/distance';
import { filterRestaurants } from '../utils/filterRestaurants';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filters, setFilters] = useState<RestaurantFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number>();
  const geo = useGeolocation();

  useEffect(() => { api.restaurants().then(setRestaurants).catch((e:Error)=>setError(e.message)).finally(()=>setLoading(false)); }, []);
  const enriched = useMemo(() => restaurants.map((r) => geo.location ? {...r, distanceKm:distanceKm(geo.location.latitude,geo.location.longitude,r.latitude,r.longitude)} : r), [restaurants, geo.location]);
  const filtered = useMemo(() => filterRestaurants(enriched, filters), [enriched, filters]);
  const select = useCallback((id:number)=>setSelectedId(id), []);

  return <div className="min-h-screen"><Header/>
    <main className="mx-auto max-w-[1800px] p-3 md:p-4">
      <div className="mb-3 flex items-center gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="input pl-10" placeholder="Hae ravintolaa tai päivän ruokaa, esim. kana" value={filters.query} onChange={(e)=>setFilters({...filters,query:e.target.value})}/></div><div className="hidden text-sm text-slate-500 sm:block">{filtered.length} paikkaa</div></div>
      {error && <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{error}</div>}
      {geo.error && <div className="mb-3 text-xs text-slate-500">{geo.error}</div>}
      {loading ? <div className="card p-8 text-center">Ladataan ravintoloita…</div> : <div className="grid gap-3 lg:grid-cols-[240px_360px_minmax(0,1fr)]">
        <div className="hidden lg:block"><FiltersPanel filters={filters} setFilters={setFilters} restaurants={restaurants} onLocate={geo.locate} locating={geo.loading}/></div>
        <section className="max-h-[calc(100vh-7rem)] space-y-3 overflow-auto pr-1" aria-label="Ravintolalista">{filtered.map((r)=><RestaurantCard key={r.id} restaurant={r} selected={r.id===selectedId} onSelect={()=>setSelectedId(r.id)}/>)}</section>
        <div className="order-first lg:order-none"><MapView restaurants={filtered} selectedId={selectedId} onSelect={select} userLocation={geo.location}/></div>
      </div>}
    </main>
  </div>;
}
