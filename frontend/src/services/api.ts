import type { Restaurant } from '@turku-lunch/shared';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL puuttuu. Julkaise Worker ja määritä API-osoite.');
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export const api = {
  restaurants: () => request<Restaurant[]>('/api/restaurants?city=Turku'),
  restaurant: (slug: string) => request<Restaurant>(`/api/restaurants/${encodeURIComponent(slug)}`),
  refreshAll: (token: string) => request<{ ok: boolean; refreshed: number }>('/api/admin/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }),
  updateRestaurant: (token: string, id: number, patch: Partial<Restaurant>) =>
    request<Restaurant>(`/api/admin/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    }),
};
