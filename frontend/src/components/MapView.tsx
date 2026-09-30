import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Restaurant } from '@turku-lunch/shared';
import type { UserLocation } from '../hooks/useGeolocation';
import { euro } from '../utils/format';

function markerHtml(restaurant: Restaurant, selected: boolean) {
  const price = restaurant.studentPrice == null
    ? '€'
    : restaurant.studentPrice.toFixed(2).replace('.', ',');
  return `<div class="map-price-marker${selected ? ' selected' : ''}">${price}</div>`;
}

export default function MapView({
  restaurants,
  selectedId,
  onSelect,
  userLocation,
}: {
  restaurants: Restaurant[];
  selectedId?: number;
  onSelect: (id: number) => void;
  userLocation: UserLocation | null;
}) {
  const element = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const lastVisibleKey = useRef('');

  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = L.map(element.current, { zoomControl: true }).setView([60.4518, 22.2666], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    for (const restaurant of restaurants) {
      const selected = restaurant.id === selectedId;
      const size = selected ? 42 : 36;
      const icon = L.divIcon({
        className: '',
        html: markerHtml(restaurant, selected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([restaurant.latitude, restaurant.longitude], { icon }).addTo(layer);
      marker.bindPopup(
        `<strong>${restaurant.name}</strong><br>${restaurant.address}<br>Opiskelija: ${euro(restaurant.studentPrice)}`,
      );
      marker.on('click', () => onSelect(restaurant.id));
    }

    if (userLocation) {
      L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 7,
        weight: 3,
        fillOpacity: 1,
      }).bindTooltip('Sinä').addTo(layer);
    }

    const visibleKey = restaurants.map((restaurant) => restaurant.id).sort((a, b) => a - b).join(',');
    if (restaurants.length && visibleKey !== lastVisibleKey.current) {
      if (restaurants.length === 1) {
        const only = restaurants[0]!;
        map.setView([only.latitude, only.longitude], 15);
      } else {
        const bounds = L.latLngBounds(
          restaurants.map((restaurant) => [restaurant.latitude, restaurant.longitude] as L.LatLngTuple),
        );
        map.fitBounds(bounds.pad(0.12), { maxZoom: 14 });
      }
      lastVisibleKey.current = visibleKey;
    }
  }, [restaurants, selectedId, onSelect, userLocation]);

  return (
    <div
      ref={element}
      className="h-full min-h-[440px] w-full"
      aria-label="Turun opiskelijaravintoloiden kartta"
    />
  );
}
