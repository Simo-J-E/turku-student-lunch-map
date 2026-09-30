import type { Restaurant } from '@turku-lunch/shared';
import { ChevronRight, Clock3, MapPin, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lunchOpenNow } from '../utils/filterRestaurants';
import { distance, euro, updated } from '../utils/format';

export default function RestaurantCard({ restaurant, selected, onSelect }: { restaurant: Restaurant; selected?: boolean; onSelect?: () => void }) {
  const open = lunchOpenNow(restaurant);
  const meals = restaurant.todayMenu?.meals.slice(0,3) ?? [];
  return <article className={`restaurant-card ${selected ? 'restaurant-card-selected' : ''}`} onClick={onSelect}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><h3 className="truncate font-semibold">{restaurant.name}</h3><p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={12}/>{restaurant.address}{restaurant.distanceKm != null && <> · {distance(restaurant.distanceKm)}</>}</p></div>
      <div className="shrink-0 text-right"><div className="text-base font-bold">{euro(restaurant.studentPrice)}</div><div className="text-[11px] text-slate-500">opiskelija</div></div>
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5"><span className={`status-chip ${open ? 'status-open' : ''}`}>{open ? 'Auki nyt' : 'Ei auki nyt'}</span>{restaurant.premiumStudentPrice != null && <span className="status-chip">Premium {euro(restaurant.premiumStudentPrice)}</span>}{restaurant.todayMenu?.meals.length ? <span className="status-chip"><Utensils size={11}/> Menu</span> : null}</div>
    <div className="mt-3 space-y-1.5 text-sm">{meals.map((meal, index) => <div key={`${meal.name}-${index}`} className="line-clamp-1 text-slate-700 dark:text-slate-200">{meal.name}</div>)}{!meals.length && <div className="text-sm text-slate-500">Päivän ruokalistaa ei saatavilla.</div>}</div>
    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><span className="flex items-center gap-1 text-slate-500"><Clock3 size={12}/>{restaurant.todayMenu ? updated(restaurant.todayMenu.fetchedAt) : restaurant.lunchHours || 'Aika ei tiedossa'}</span><Link className="flex items-center gap-0.5 font-medium" to={`/restaurant/${restaurant.slug}`}>Tiedot <ChevronRight size={14}/></Link></div>
  </article>;
}
