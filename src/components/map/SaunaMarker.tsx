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
}

function MiniStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-stone-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] text-stone-400 ml-0.5">({count})</span>
    </div>
  );
}

export function SaunaMarker({ sauna }: SaunaMarkerProps) {
  const cheapestPrice = sauna.shared_price_per_person_oere || sauna.private_price_oere;

  return (
    <Marker
      position={[sauna.lat, sauna.lng]}
      icon={saunaIcon}
    >
      <Popup>
        <div className="min-w-[180px]">
          <h3 className="font-semibold text-sm mb-1">{sauna.name}</h3>
          <p className="text-xs text-stone-500 mb-2">{sauna.city}</p>
          {sauna.average_rating !== null && sauna.review_count > 0 && (
            <MiniStars rating={sauna.average_rating} count={sauna.review_count} />
          )}
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
