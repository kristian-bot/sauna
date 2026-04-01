'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false }
);

const DraggableMarkerInner = dynamic(
  () => import('./DraggableMarkerInner').then(m => ({ default: m.DraggableMarkerInner })),
  { ssr: false }
);

interface LocationPickerProps {
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  onAddressChange: (address: string) => void;
  onCityChange: (city: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
}

export function LocationPicker({
  address, city, lat, lng,
  onAddressChange, onCityChange, onCoordsChange,
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const geocode = useCallback(async (addr: string, c: string) => {
    const query = [addr, c, 'Norge'].filter(Boolean).join(', ');
    if (query.length < 5) return;

    setGeocoding(true);
    setGeocodeMessage('');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=no`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'sauna-booking/1.0' },
      });

      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          onCoordsChange(parseFloat(results[0].lat), parseFloat(results[0].lon));
          setGeocodeMessage('Foreslått plassering — dra markøren for å justere');
        } else {
          setGeocodeMessage('Fant ikke adressen — prøv å være mer spesifikk, eller plasser markøren manuelt');
        }
      }
    } catch {
      setGeocodeMessage('Kunne ikke søke opp adresse');
    } finally {
      setGeocoding(false);
    }
  }, [onCoordsChange]);

  useEffect(() => {
    if (!address && !city) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      geocode(address, city);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, city, geocode]);

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all';

  const mapCenter: [number, number] = lat && lng ? [lat, lng] : [63.0, 12.0];
  const mapZoom = lat && lng ? 15 : 5;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Adresse</label>
        <input
          type="text"
          required
          value={address}
          onChange={e => onAddressChange(e.target.value)}
          className={inputClass}
          placeholder="F.eks. Strandveien 14, 0252 Oslo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Sted / by</label>
        <input
          type="text"
          required
          value={city}
          onChange={e => onCityChange(e.target.value)}
          className={inputClass}
          placeholder="F.eks. Oslo, Lofoten, Hemsedal..."
        />
      </div>

      {/* Map */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-stone-600">Plassering på kart</label>
          {geocoding && (
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <span className="animate-spin inline-block w-3 h-3 border border-stone-300 border-t-[var(--color-accent)] rounded-full" />
              Søker...
            </span>
          )}
        </div>

        {geocodeMessage && (
          <p className="text-xs text-stone-500 mb-2">{geocodeMessage}</p>
        )}

        {mounted && (
          <div className="rounded-xl overflow-hidden border border-stone-300 h-64 sm:h-80">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="w-full h-full"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarkerInner
                lat={lat}
                lng={lng}
                onDragEnd={onCoordsChange}
              />
            </MapContainer>
          </div>
        )}

        {lat && lng && (
          <p className="text-xs text-stone-400 mt-1">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
