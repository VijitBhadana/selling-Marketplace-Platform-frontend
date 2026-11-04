'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export type LatLng = { lat: number; lng: number };

/**
 * A plain OpenStreetMap the visitor drags around; the pin is drawn fixed over its centre by
 * the parent, so the chosen spot is always the map's centre. Only ever loaded through
 * next/dynamic, keeping Leaflet out of every other page's bundle.
 */
export default function PinMap({
  start,
  zoom,
  flyTo,
  onMoveStart,
  onMoveEnd,
}: {
  start: LatLng;
  zoom: number;
  /** A new object re-centres the map there (e.g. after a search). */
  flyTo?: LatLng | null;
  onMoveStart?: () => void;
  onMoveEnd: (center: LatLng) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const handlers = useRef({ onMoveStart, onMoveEnd });
  handlers.current = { onMoveStart, onMoveEnd };

  useEffect(() => {
    const map = L.map(elRef.current!, { center: [start.lat, start.lng], zoom, zoomControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    map.attributionControl.setPrefix(false);
    map.on('movestart', () => handlers.current.onMoveStart?.());
    map.on('moveend', () => {
      const c = map.getCenter();
      handlers.current.onMoveEnd({ lat: c.lat, lng: c.lng });
    });
    mapRef.current = map;
    // The dialog may still be settling its size on the first frame.
    const frame = requestAnimationFrame(() => map.invalidateSize());
    handlers.current.onMoveEnd(start);
    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (flyTo) mapRef.current?.flyTo([flyTo.lat, flyTo.lng], Math.max(mapRef.current.getZoom(), 15), { duration: 0.8 });
  }, [flyTo]);

  return <div ref={elRef} className="absolute inset-0 z-0" />;
}
