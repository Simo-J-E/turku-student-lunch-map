import type { Restaurant } from '@turku-lunch/shared';
import { Clock3, ExternalLink, MapPin, Utensils, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lunchOpenNow } from '../utils/filterRestaurants';
import { euro, sourceLabel, updated } from '../utils/format';

function dietLabel(diet: string) {
  const labels: Record<string, string> = {
    VEGAN: 'Vegaani',
    VEGETARIAN: 'Kasvis',
    GLUTEN_FREE: 'Gluteeniton',
    LACTOSE_FREE: 'Laktoositon',
    DAIRY_FREE: 'Maidoton',
  };
  return labels[diet] ?? diet;
}

export default function SelectedRestaurantPanel({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const open = lunchOpenNow(restaurant);
  const sourceUrl = restaurant.todayMenu?.sourceUrl ?? restaurant.menuUrl;
  const meals = restaurant.todayMenu?.meals ?? [];

  return (
    <aside className="selected-restaurant-panel" aria-label={`${restaurant.name} ruokalista`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold leading-tight sm:text-xl">{restaurant.name}</h2>
            <span className={`status-chip ${open ? 'status-open' : ''}`}>{open ? 'Auki nyt' : 'Ei auki nyt'}</span>
          </div>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 sm:text-sm">
            <MapPin className="mt-0.5 shrink-0" size={13} />
            <span>{restaurant.address}</span>
          </p>
        </div>
        <button className="icon-btn -mr-1 -mt-1 shrink-0" onClick={onClose} aria-label="Sulje ravintolan tiedot">
          <X size={18} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {restaurant.studentPrice != null && <span className="price-pill">Opiskelija {euro(restaurant.studentPrice)}</span>}
        {restaurant.premiumStudentPrice != null && <span className="price-pill">Premium {euro(restaurant.premiumStudentPrice)}</span>}
        {restaurant.distanceKm != null && <span className="status-chip">{restaurant.distanceKm < 1 ? `${Math.round(restaurant.distanceKm * 1000)} m` : `${restaurant.distanceKm.toFixed(1).replace('.', ',')} km`}</span>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Utensils size={16} />
          <h3 className="font-semibold">Tänään</h3>
        </div>
        {restaurant.todayMenu?.date && <span className="text-xs text-slate-500">{new Intl.DateTimeFormat('fi-FI').format(new Date(`${restaurant.todayMenu.date}T12:00:00`))}</span>}
      </div>

      <div className="selected-menu-list">
        {meals.map((meal, index) => (
          <div key={`${meal.category}-${meal.name}-${index}`} className="selected-meal-row">
            <div className="flex flex-wrap items-center gap-2">
              <span className="meal-category">{meal.category}</span>
              {meal.studentPrice != null && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{euro(meal.studentPrice)}</span>}
            </div>
            <div className="mt-1 text-sm font-medium leading-snug sm:text-[15px]">{meal.name}</div>
            {meal.diets.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {meal.diets.map((diet) => <span className="diet-chip" key={diet}>{dietLabel(diet)}</span>)}
              </div>
            )}
          </div>
        ))}
        {!meals.length && <p className="py-4 text-sm text-slate-500">Päivän ruokalistaa ei ole saatavilla tästä lähteestä.</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <div className="text-slate-500">
          <div className="flex items-center gap-1"><Clock3 size={12} /> {restaurant.todayMenu ? `Päivitetty ${updated(restaurant.todayMenu.fetchedAt)}` : restaurant.lunchHours || 'Lounasaika ei tiedossa'}</div>
          <div className="mt-1">Lähde: {sourceLabel(sourceUrl)}</div>
        </div>
        <div className="flex gap-1">
          <a className="btn px-2 py-1.5" href={sourceUrl} target="_blank" rel="noreferrer">Lähde <ExternalLink size={13} /></a>
          <Link className="btn btn-primary px-2.5 py-1.5" to={`/restaurant/${restaurant.slug}`}>Kaikki tiedot</Link>
        </div>
      </div>
    </aside>
  );
}
