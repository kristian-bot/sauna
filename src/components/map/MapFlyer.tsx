'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapFlyerProps {
  center: [number, number];
}

export function MapFlyer({ center }: MapFlyerProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);

  return null;
}
