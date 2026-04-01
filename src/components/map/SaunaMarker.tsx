'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { formatPriceNOK } from '@/lib/pricing';
import type { MapSauna } from '@/lib/types';

// Custom marker icon
const saunaIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface SaunaMarkerProps {
  sauna: MapSauna;
  onClick?: (sauna: MapSauna) => void;
}

export function SaunaMarker({ sauna, onClick }: SaunaMarkerProps) {
  const cheapestPrice = sauna.shared_price_per_person_oere || sauna.private_price_oere;

  return (
    <Marker
      position={[sauna.lat, sauna.lng]}
      icon={saunaIcon}
      eventHandlers={{
        click: () => onClick?.(sauna),
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <h3 className="font-semibold text-sm mb-1">{sauna.name}</h3>
          <p className="text-xs text-stone-500 mb-2">{sauna.city} &middot; Maks {sauna.max_people} pers.</p>
          {cheapestPrice && (
            <p className="text-xs font-medium text-[#4a9d6e] mb-2">
              Fra {formatPriceNOK(cheapestPrice)}
              {sauna.shared_price_per_person_oere ? '/person' : ''}
            </p>
          )}
          <Link
            href={`/sauna/${sauna.slug}`}
            className="inline-block text-xs bg-[#4a9d6e] text-white px-3 py-1.5 rounded-lg hover:bg-[#4a9d6e]/90 transition-colors"
          >
            Se detaljer
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
