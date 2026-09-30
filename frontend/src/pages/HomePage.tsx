import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Filter, List, LocateFixed, Map, Search, X } from 'lucide-react';
import type { Restaurant, RestaurantFilters } from '@turku-lunch/shared';
import Header from '../components/Header';
import MapView from '../components/MapView';
import RestaurantCard from '../components/RestaurantCard';
import SelectedRestaurantPanel from '../components/SelectedRestaurantPanel';
import FiltersPanel from '../components/FiltersPanel';
import { DEFAULT_FILTERS } from '../constants/filters';
import { api } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { distanceKm } from '../utils/distance';
import { filterRestaurants } from '../utils/filterRestaurants';

export default function HomePage() {
  const [restaurants,setRestaurants] = useState<Restaurant[]>([]);
  const [filters,setFilters] = useState<RestaurantFilters>(DEFAULT_FILTERS);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);
  const [selectedId,setSelectedId] = useState<number>();
  const [showFilters,setShowFilters] = useState(false);
  const [mobileView,setMobileView] = useState<'map'|'list'>('map');
  const geo = useGeolocation();

  useEffect(() => {
    api.restaurants().then(setRestaurants).catch((caught:Error) => setError(caught.message)).finally(() => setLoading(false));
  },[]);

  const enriched = useMemo(() => restaurants.map((restaurant) => geo.location ? {
    ...restaurant,
    distanceKm:distanceKm(geo.location.latitude,geo.location.longitude,restaurant.latitude,restaurant.longitude),
  } : restaurant),[restaurants,geo.location]);
  const filtered = useMemo(() => filterRestaurants(enriched,filters),[enriched,filters]);
  const select = useCallback((id:number) => {
    setSelectedId(id);
    setMobileView('map');
  },[]);
  const selectedRestaurant = useMemo(() => filtered.find((restaurant) => restaurant.id === selectedId), [filtered, selectedId]);

  useEffect(() => {
    if (selectedId != null && !selectedRestaurant) setSelectedId(undefined);
  }, [selectedId, selectedRestaurant]);
  const hasActiveFilters = filters.maxPrice != null || filters.premiumOnly || filters.menuAvailable || filters.vegan || filters.vegetarian || filters.glutenFree || filters.openNow || Boolean(filters.area || filters.campus || filters.chain);

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Header/>
    <main className="mx-auto max-w-[1600px] px-3 py-3 md:px-4">
      <section className="mb-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="input h-11 pl-10" placeholder="Hae ravintolaa tai ruokaa" value={filters.query} onChange={(event: ChangeEvent<HTMLInputElement>) => setFilters({...filters,query:event.target.value})}/>{filters.query && <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400" onClick={() => setFilters({...filters,query:''})} aria-label="Tyhjennä haku"><X size={16}/></button>}</div>
          <button className={`btn h-11 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${hasActiveFilters ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`} onClick={() => setShowFilters((value) => !value)}><Filter size={17}/><span className="hidden sm:inline">Suodattimet</span></button>
          <button className="btn h-11 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" onClick={geo.locate}><LocateFixed size={17}/><span className="hidden md:inline">Lähimmät</span></button>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm"><div><strong>{filtered.length}</strong> opiskelijaravintolaa</div><div className="flex rounded-xl border border-slate-200 bg-white p-1 lg:hidden dark:border-slate-800 dark:bg-slate-900"><button className={`view-toggle ${mobileView === 'map' ? 'view-toggle-active' : ''}`} onClick={() => setMobileView('map')}><Map size={15}/>Kartta</button><button className={`view-toggle ${mobileView === 'list' ? 'view-toggle-active' : ''}`} onClick={() => setMobileView('list')}><List size={15}/>Lista</button></div></div>
        {showFilters && <FiltersPanel filters={filters} setFilters={setFilters} restaurants={restaurants} onLocate={geo.locate} locating={geo.loading}/>} 
      </section>

      {error && <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{error}</div>}
      {geo.error && <div className="mb-3 text-xs text-slate-500">{geo.error}</div>}
      {loading ? <div className="card p-8 text-center">Ladataan ravintoloita…</div> : <div className="app-layout">
        <section className={`${mobileView === 'list' ? 'block' : 'hidden'} restaurant-list lg:block`} aria-label="Ravintolalista">
          {filtered.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} selected={restaurant.id === selectedId} onSelect={() => select(restaurant.id)}/>)}
          {!filtered.length && <div className="card p-6 text-center text-sm text-slate-500">Ei ravintoloita näillä suodattimilla.</div>}
        </section>
        <section className={`${mobileView === 'map' ? 'block' : 'hidden'} map-shell lg:block`}>
          <MapView restaurants={filtered} selectedId={selectedId} onSelect={select} userLocation={geo.location}/>
          {selectedRestaurant && <SelectedRestaurantPanel restaurant={selectedRestaurant} onClose={() => setSelectedId(undefined)}/>}
        </section>
      </div>}
    </main>
  </div>;
}
