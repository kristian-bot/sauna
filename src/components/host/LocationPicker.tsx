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
const Marker = dynamic(
  () => import('react-leaflet').then(m => m.Marker),
  { ssr: false }
);

// Separate component for map events since useMapEvents needs to be inside MapContainer
const DraggableMarkerInner = dynamic(
  () => import('./DraggableMarkerInner').then(m => ({ default: m.DraggableMarkerInner })),
  { ssr: false }
);

interface LocationPickerProps {
  address: string;
  city: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  onAddressChange: (address: string) => void;
  onCityChange: (city: string) => void;
  onPostalCodeChange: (postalCode: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
}

const CITIES = [
  'Oslo', 'Bergen', 'Trondheim', 'Tromsø', 'Stavanger',
  'Kristiansand', 'Bodø', 'Ålesund', 'Drammen', 'Fredrikstad',
];

export function LocationPicker({
  address, city, postalCode, lat, lng,
  onAddressChange, onCityChange, onPostalCodeChange, onCoordsChange,
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const geocode = useCallback(async (addr: string, c: string, postal: string) => {
    if (!c) return;

    const parts = [addr, postal, c, 'Norge'].filter(Boolean);
    const query = parts.join(', ');

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
          const newLat = parseFloat(results[0].lat);
          const newLng = parseFloat(results[0].lon);
          onCoordsChange(newLat, newLng);
          setGeocodeMessage('Foreslått plassering — dra markøren for å justere');
        } else {
          setGeocodeMessage('Fant ikke adressen — plasser markøren manuelt');
        }
      }
    } catch {
      setGeocodeMessage('Kunne ikke søke opp adresse');
    } finally {
      setGeocoding(false);
    }
  }, [onCoordsChange]);

  // Debounced geocoding when address fields change
  useEffect(() => {
    if (!address && !city) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      geocode(address, city, postalCode);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, city, postalCode, geocode]);

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all';

  const mapCenter: [number, number] = lat && lng ? [lat, lng] : [63.0, 12.0];
  const mapZoom = lat && lng ? 15 : 5;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">By</label>
          <select value={city} onChange={e => onCityChange(e.target.value)} className={inputClass} required>
            <option value="">Velg by</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Postnummer</label>
          <input
            type="text"
            value={postalCode}
            onChange={e => onPostalCodeChange(e.target.value)}
            className={inputClass}
            placeholder="0150"
            maxLength={4}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Adresse</label>
        <input
          type="text"
          required
          value={address}
          onChange={e => onAddressChange(e.target.value)}
          className={inputClass}
          placeholder="Gateadresse og nummer"
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
