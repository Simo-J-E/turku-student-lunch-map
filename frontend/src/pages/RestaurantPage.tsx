import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { MealTier, Restaurant } from '@turku-lunch/shared';
import Header from '../components/Header';
import { api } from '../services/api';
import { euro, updated } from '../utils/format';

const tierLabels: Record<MealTier, string> = {
  BASIC: 'Peruslounas',
  SPECIAL: 'Erikoisannos / deluxe',
  OTHER: 'Muu vaihtoehto',
};
const dietLabels: Record<string, string> = {
  VEGAN: 'Vegaani', VEGETARIAN: 'Kasvis', GLUTEN_FREE: 'Gluteeniton', LACTOSE_FREE: 'Laktoositon', DAIRY_FREE: 'Maidoton',
};

export default function RestaurantPage() {
  const { slug = '' } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.restaurant(slug).then(setRestaurant).catch((caught: Error) => setError(caught.message));
  }, [slug]);

  const menuSource = restaurant?.todayMenu?.sourceUrl ?? restaurant?.menuUrl;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl p-4">
        <Link className="btn mb-4" to="/">
          <ArrowLeft size={16} aria-hidden="true"/> Takaisin kartalle
        </Link>
        {error && <div className="card p-4" role="alert">{error}</div>}
        {!restaurant && !error && <div className="card p-6" role="status">Ladataan…</div>}
        {restaurant && (
          <div className="space-y-4">
            <section className="card p-5 sm:p-6" aria-labelledby="restaurant-title">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 id="restaurant-title" className="text-2xl font-bold">{restaurant.name}</h1>
                  <p className="mt-1 text-slate-500">{restaurant.address}</p>
                  {restaurant.chain && <p className="mt-1 text-sm text-slate-500">{restaurant.chain}</p>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{euro(restaurant.studentPrice)}</div>
                  <div className="text-xs text-slate-500">peruslounas</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="badge">Kela-tuettu</span>
                {restaurant.premiumStudentPrice != null && <span className="badge">Deluxe {euro(restaurant.premiumStudentPrice)}</span>}
                {restaurant.veganAvailable && <span className="badge">Vegaani</span>}
                {restaurant.glutenFreeAvailable && <span className="badge">Gluteeniton</span>}
              </div>
            </section>

            <section className="card p-5 sm:p-6" aria-labelledby="today-menu-title">
              <h2 id="today-menu-title" className="text-lg font-semibold">Tänään</h2>
              <div className="mt-3 space-y-3">
                {restaurant.todayMenu?.meals.map((meal, index) => (
                  <article key={`${meal.name}-${index}`} className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tierLabels[meal.tier ?? 'OTHER']} · {meal.category}</div>
                    <div className="mt-1 font-medium">{meal.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {meal.studentPrice != null && <span className="badge">{euro(meal.studentPrice)}</span>}
                      {meal.diets.map((diet) => <span className="badge" key={diet}>{dietLabels[diet] ?? diet}</span>)}
                    </div>
                  </article>
                ))}
                {!restaurant.todayMenu?.meals.length && <p className="text-slate-500">Ruokalistaa ei tällä hetkellä saatavilla.</p>}
              </div>
            </section>

            <section className="card p-5 text-sm sm:p-6" aria-labelledby="source-title">
              <h2 id="source-title" className="font-semibold">Tiedot ja lähteet</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><dt className="text-slate-500">Lounasaika</dt><dd>{restaurant.lunchHours || 'Ei tietoa'}</dd></div>
                <div><dt className="text-slate-500">Päivitetty</dt><dd>{updated(restaurant.todayMenu?.fetchedAt)}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <a className="btn border" href={restaurant.websiteUrl} target="_blank" rel="noreferrer">Ravintolan sivu <ExternalLink size={14} aria-hidden="true"/></a>
                {menuSource && <a className="btn border" href={menuSource} target="_blank" rel="noreferrer">Ruokalistan lähde <ExternalLink size={14} aria-hidden="true"/></a>}
                <a className="btn border" href={restaurant.priceSourceUrl} target="_blank" rel="noreferrer">Hinnan lähde <ExternalLink size={14} aria-hidden="true"/></a>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
