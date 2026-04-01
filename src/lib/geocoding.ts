const CITY_FALLBACKS: Record<string, { lat: number; lng: number }> = {
  'Oslo': { lat: 59.9139, lng: 10.7522 },
  'Bergen': { lat: 60.3913, lng: 5.3221 },
  'Trondheim': { lat: 63.4305, lng: 10.3951 },
  'Tromsø': { lat: 69.6496, lng: 18.9560 },
  'Stavanger': { lat: 58.9700, lng: 5.7331 },
  'Kristiansand': { lat: 58.1462, lng: 7.9956 },
  'Bodø': { lat: 67.2804, lng: 14.4049 },
  'Ålesund': { lat: 62.4722, lng: 6.1495 },
  'Drammen': { lat: 59.7441, lng: 10.2045 },
  'Fredrikstad': { lat: 59.2181, lng: 10.9298 },
};

export async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number }> {
  try {
    const query = `${address}, ${city}, Norway`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'sauna-booking/1.0' },
    });

    if (res.ok) {
      const results = await res.json();
      if (results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
        };
      }
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback to city center
  const fallback = CITY_FALLBACKS[city];
  if (fallback) return fallback;

  // Default to Oslo if nothing else works
  return { lat: 59.9139, lng: 10.7522 };
}
