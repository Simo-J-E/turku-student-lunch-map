import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Restaurant } from '@turku-lunch/shared';
import Header from '../components/Header';
import { api } from '../services/api';
import { euro, updated } from '../utils/format';

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
          <ArrowLeft size={16} /> Takaisin kartalle
        </Link>
        {error && <div className="card p-4">{error}</div>}
        {!restaurant && !error && <div className="card p-6">Ladataan…</div>}
        {restaurant && (
          <div className="space-y-4">
            <section className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                  <p className="mt-1 text-slate-500">{restaurant.address}</p>
                  {restaurant.chain && <p className="mt-1 text-sm text-slate-500">{restaurant.chain}</p>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{euro(restaurant.studentPrice)}</div>
                  <div className="text-xs text-slate-500">opiskelijalounas</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="badge">Kela-tuettu</span>
                {restaurant.premiumStudentPrice != null && (
                  <span className="badge">Premium {euro(restaurant.premiumStudentPrice)}</span>
                )}
                {restaurant.veganAvailable && <span className="badge">Vegaani</span>}
                {restaurant.glutenFreeAvailable && <span className="badge">Gluteeniton</span>}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="text-lg font-semibold">Tänään</h2>
              <div className="mt-3 space-y-3">
                {restaurant.todayMenu?.meals.map((meal, index) => (
                  <div key={`${meal.name}-${index}`} className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{meal.category}</div>
                    <div className="font-medium">{meal.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {meal.diets.map((diet) => <span className="badge" key={diet}>{diet}</span>)}
                    </div>
                  </div>
                ))}
                {!restaurant.todayMenu?.meals.length && (
                  <p className="text-slate-500">Ruokalistaa ei tällä hetkellä saatavilla.</p>
                )}
              </div>
            </section>

            <section className="card p-6 text-sm">
              <h2 className="font-semibold">Tiedot ja lähteet</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><dt className="text-slate-500">Lounasaika</dt><dd>{restaurant.lunchHours || 'Ei tietoa'}</dd></div>
                <div><dt className="text-slate-500">Päivitetty</dt><dd>{updated(restaurant.todayMenu?.fetchedAt)}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <a className="btn border" href={restaurant.websiteUrl} target="_blank" rel="noreferrer">
                  Ravintolan sivu <ExternalLink size={14} />
                </a>
                {menuSource && (
                  <a className="btn border" href={menuSource} target="_blank" rel="noreferrer">
                    Ruokalistan lähde <ExternalLink size={14} />
                  </a>
                )}
                <a className="btn border" href={restaurant.priceSourceUrl} target="_blank" rel="noreferrer">
                  Hinnan lähde <ExternalLink size={14} />
                </a>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
