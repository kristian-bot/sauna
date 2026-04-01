'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapSauna } from '@/lib/types';

const MapContainer = dynamic(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false }
);

const SaunaMarkerComponent = dynamic(
  () => import('./SaunaMarker').then(m => ({ default: m.SaunaMarker })),
  { ssr: false }
);

interface SaunaMapProps {
  saunas: MapSauna[];
}

export function SaunaMap({ saunas }: SaunaMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
      </div>
    );
  }

  // Center on Norway
  const defaultCenter: [number, number] = [63.0, 12.0];
  const defaultZoom = 5;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="w-full h-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {saunas.map(sauna => (
        <SaunaMarkerComponent
          key={sauna.id}
          sauna={sauna}
        />
      ))}
    </MapContainer>
  );
}
