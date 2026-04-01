'use client';

import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export function MapBoundsTracker({ onBoundsChange }: MapBoundsTrackerProps) {
  const map = useMap();

  function reportBounds() {
    const b = map.getBounds();
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }

  useMapEvents({
    moveend: reportBounds,
    zoomend: reportBounds,
  });

  // Report initial bounds
  useEffect(() => {
    reportBounds();
  }, []);

  return null;
}
