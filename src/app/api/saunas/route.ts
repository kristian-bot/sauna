import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = request.nextUrl;

  const city = searchParams.get('city');
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = parseFloat(searchParams.get('radius') || '50'); // km

  let query = supabase
    .from('saunas')
    .select('id, name, slug, city, lat, lng, private_price_oere, shared_price_per_person_oere, image_urls, max_people, description, address')
    .eq('is_active', true)
    .not('slug', 'is', null);

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: saunas, error } = await query.order('name');

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente badstuer' }, { status: 500 });
  }

  // Client-side geo filtering if lat/lng provided
  let filtered = saunas || [];
  if (lat && lng) {
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    filtered = filtered.filter(s => {
      if (!s.lat || !s.lng) return false;
      const dist = haversineDistance(centerLat, centerLng, s.lat, s.lng);
      return dist <= radius;
    });
  }

  return NextResponse.json({ saunas: filtered });
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
