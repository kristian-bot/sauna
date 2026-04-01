'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

interface DraggableMarkerInnerProps {
  lat: number | null;
  lng: number | null;
  onDragEnd: (lat: number, lng: number) => void;
}

export function DraggableMarkerInner({ lat, lng, onDragEnd }: DraggableMarkerInnerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const prevCoordsRef = useRef<string>('');

  // Fly to new position when coords change from geocoding
  useEffect(() => {
    if (lat && lng) {
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (key !== prevCoordsRef.current) {
        prevCoordsRef.current = key;
        map.flyTo([lat, lng], 16, { duration: 0.8 });
      }
    }
  }, [lat, lng, map]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onDragEnd(pos.lat, pos.lng);
        }
      },
    }),
    [onDragEnd],
  );

  if (!lat || !lng) return null;

  return (
    <Marker
      draggable
      position={[lat, lng]}
      ref={markerRef}
      eventHandlers={eventHandlers}
      icon={markerIcon}
    />
  );
}
