import type { Meal, MealTier, Restaurant } from '@turku-lunch/shared';
import { CheckCircle2, ChevronRight, Clock3, ExternalLink, MapPin, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lunchOpenNow } from '../utils/filterRestaurants';
import { distance, euro, sourceLabel, updated } from '../utils/format';

const tierOrder: MealTier[] = ['BASIC', 'SPECIAL', 'OTHER'];
const dietLabels: Record<string, string> = {
  VEGAN: 'Vegaani',
  VEGETARIAN: 'Kasvis',
  GLUTEN_FREE: 'Gluteeniton',
  LACTOSE_FREE: 'Laktoositon',
  DAIRY_FREE: 'Maidoton',
};

const tierLabels: Record<MealTier, string> = {
  BASIC: 'Peruslounas',
  SPECIAL: 'Erikoisannos / deluxe',
  OTHER: 'Muut vaihtoehdot',
};

function normalizedTier(meal: Meal): MealTier {
  return meal.tier ?? 'OTHER';
}

function mealsByTier(meals: Meal[]) {
  return tierOrder
    .map((tier) => ({ tier, meals: meals.filter((meal) => normalizedTier(meal) === tier) }))
    .filter((group) => group.meals.length > 0);
}

export default function RestaurantCard({
  restaurant,
  selected,
  onSelect,
}: {
  restaurant: Restaurant;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const open = lunchOpenNow(restaurant);
  const meals = restaurant.todayMenu?.meals ?? [];
  const previewMeals = meals.slice(0, 3);
  const groupedMeals = mealsByTier(meals);
  const sourceUrl = restaurant.todayMenu?.sourceUrl ?? restaurant.menuUrl;

  return (
    <article
      className={`restaurant-card ${selected ? 'restaurant-card-selected' : ''}`}
      data-restaurant-id={restaurant.id}
      aria-current={selected ? 'true' : undefined}
    >
      <button type="button" className="restaurant-select-button" onClick={onSelect} aria-expanded={selected}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-tight">{restaurant.name}</h3>
              {selected && <span className="status-chip"><CheckCircle2 size={11}/>Valittu</span>}
            </div>
            <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
              <MapPin className="mt-0.5 shrink-0" size={12}/>
              <span>{restaurant.address}{restaurant.distanceKm != null && <> · {distance(restaurant.distanceKm)}</>}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-base font-bold">{euro(restaurant.studentPrice)}</div>
            <div className="text-[11px] text-slate-500">peruslounas</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`status-chip ${open ? 'status-open' : ''}`}>{open ? 'Auki nyt' : 'Ei auki nyt'}</span>
          {restaurant.premiumStudentPrice != null && <span className="status-chip">Deluxe {euro(restaurant.premiumStudentPrice)}</span>}
          {meals.length > 0 && <span className="status-chip"><Utensils size={11}/> {meals.length} vaihtoehtoa</span>}
        </div>

        {!selected && (
          <div className="mt-3 space-y-1.5 text-left text-sm">
            {previewMeals.map((meal, index) => <div key={`${meal.name}-${index}`} className="text-slate-700 dark:text-slate-200">{meal.name}</div>)}
            {!previewMeals.length && <div className="text-sm text-slate-500">Päivän ruokalistaa ei saatavilla.</div>}
          </div>
        )}
      </button>

      {selected && (
        <div className="restaurant-expanded-menu" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="font-semibold">Tänään tarjolla</h4>
            {restaurant.todayMenu?.date && <span className="text-xs text-slate-500">{new Intl.DateTimeFormat('fi-FI').format(new Date(`${restaurant.todayMenu.date}T12:00:00`))}</span>}
          </div>

          {groupedMeals.map((group) => (
            <section key={group.tier} className={`meal-tier-group meal-tier-${group.tier.toLowerCase()}`} aria-label={tierLabels[group.tier]}>
              <div className="meal-tier-heading">{tierLabels[group.tier]}</div>
              <div className="space-y-2">
                {group.meals.map((meal, index) => (
                  <div key={`${group.tier}-${meal.name}-${index}`} className="meal-option-row">
                    <div className="min-w-0">
                      <div className="font-medium leading-snug">{meal.name}</div>
                      {meal.diets.length > 0 && <div className="mt-1 text-[11px] text-slate-500">{meal.diets.map((diet) => dietLabels[diet] ?? diet).join(' · ')}</div>}
                    </div>
                    {meal.studentPrice != null && <span className="meal-price">{euro(meal.studentPrice)}</span>}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {!meals.length && <p className="py-2 text-sm text-slate-500">Päivän ruokalistaa ei ole saatavilla tästä lähteestä.</p>}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="text-slate-500">
              <div className="flex items-center gap-1"><Clock3 size={12}/>{restaurant.todayMenu ? `Päivitetty ${updated(restaurant.todayMenu.fetchedAt)}` : restaurant.lunchHours || 'Lounasaika ei tiedossa'}</div>
              <div className="mt-1">Lähde: {sourceLabel(sourceUrl)}</div>
            </div>
            <a className="btn min-h-11 px-3" href={sourceUrl} target="_blank" rel="noreferrer">Avaa lähde <ExternalLink size={13}/></a>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
        <Link className="flex min-h-11 items-center gap-0.5 px-2 font-medium" to={`/restaurant/${restaurant.slug}`}>Kaikki tiedot <ChevronRight size={14}/></Link>
      </div>
    </article>
  );
}
