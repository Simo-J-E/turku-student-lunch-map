import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Restaurant } from '@turku-lunch/shared';
import type { UserLocation } from '../hooks/useGeolocation';
import { euro } from '../utils/format';

export default function MapView({ restaurants, selectedId, onSelect, userLocation }: { restaurants: Restaurant[]; selectedId?: number; onSelect:(id:number)=>void; userLocation:UserLocation|null }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || mapRef.current) return;
    const map = L.map(el.current, { zoomControl: true }).setView([60.4518, 22.2666], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current; const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    restaurants.forEach((r) => {
      const selected = r.id === selectedId;
      const icon = L.divIcon({ className:'', html:`<div style="width:${selected?38:32}px;height:${selected?38:32}px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${selected?'#0f172a':'#fff'};color:${selected?'#fff':'#0f172a'};border:2px solid #0f172a;box-shadow:0 2px 8px #0003;font:700 11px system-ui">${r.studentPrice?.toFixed(1) ?? '€'}</div>`, iconSize:[selected?38:32,selected?38:32], iconAnchor:[selected?19:16,selected?19:16] });
      const marker = L.marker([r.latitude, r.longitude], { icon }).addTo(layer);
      marker.bindPopup(`<strong>${r.name}</strong><br>${r.address}<br>Opiskelija: ${euro(r.studentPrice)}`);
      marker.on('click', () => onSelect(r.id));
    });
    if (userLocation) L.circleMarker([userLocation.latitude,userLocation.longitude], {radius:7,weight:3,fillOpacity:1}).bindTooltip('Sinä').addTo(layer);
  }, [restaurants, selectedId, onSelect, userLocation]);

  return <div ref={el} className="h-[55vh] min-h-[420px] w-full rounded-2xl lg:h-[calc(100vh-7rem)]" aria-label="Turun opiskelijaravintoloiden kartta"/>;
}
