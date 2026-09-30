import type { Restaurant } from '@turku-lunch/shared';
import { Clock3, ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { distance, euro, updated } from '../utils/format';

export default function RestaurantCard({ restaurant, selected, onSelect }: { restaurant: Restaurant; selected?: boolean; onSelect?: () => void }) {
  return <article className={`card p-4 transition ${selected ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`} onClick={onSelect}>
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{restaurant.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{restaurant.address}{restaurant.distanceKm != null && <> · {distance(restaurant.distanceKm)}</>}</p></div><span className="badge">{euro(restaurant.studentPrice)}</span></div>
    {restaurant.premiumStudentPrice != null && <p className="mt-2 text-xs">Deluxe / premium: <strong>{euro(restaurant.premiumStudentPrice)}</strong></p>}
    <div className="mt-3 space-y-1 text-sm">
      {restaurant.todayMenu?.meals.slice(0,3).map((meal, i)=><div key={`${meal.name}-${i}`} className="truncate">{meal.name}</div>)}
      {!restaurant.todayMenu?.meals.length && <div className="text-slate-500">Ruokalistaa ei tällä hetkellä saatavilla.</div>}
    </div>
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800"><span className="flex items-center gap-1"><Clock3 size={13}/>{restaurant.todayMenu ? updated(restaurant.todayMenu.fetchedAt) : 'Ei päivitystä'}</span><Link className="flex items-center gap-1 font-medium text-slate-900 dark:text-white" to={`/restaurant/${restaurant.slug}`}>Näytä lisää <ExternalLink size={12}/></Link></div>
  </article>;
}
