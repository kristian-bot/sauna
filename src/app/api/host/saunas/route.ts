import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { createSaunaSchema } from '@/lib/validation';
import { geocodeAddress } from '@/lib/geocoding';
import slugify from 'slugify';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: saunas, error } = await service
    .from('saunas')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente badstuer' }, { status: 500 });
  }

  return NextResponse.json({ saunas });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSaunaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Ugyldig data' },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Verify host exists
  const { data: host } = await service
    .from('hosts')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!host) {
    return NextResponse.json({ error: 'Ikke registrert som host' }, { status: 403 });
  }

  const data = parsed.data;

  // Geocode address if lat/lng not provided
  let lat = data.lat;
  let lng = data.lng;
  if ((lat === undefined || lng === undefined) && data.address && data.city) {
    const coords = await geocodeAddress(data.address, data.city);
    lat = coords.lat;
    lng = coords.lng;
  }

  // Generate unique slug
  let slug = slugify(data.name, { lower: true, strict: true });
  const { data: existing } = await service
    .from('saunas')
    .select('slug')
    .eq('slug', slug)
    .single();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { data: sauna, error } = await service
    .from('saunas')
    .insert({
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      lat,
      lng,
      capacity: data.capacity,
      max_people: data.max_people,
      min_people: data.min_people || 1,
      private_price_oere: data.private_price_oere ?? null,
      shared_price_per_person_oere: data.shared_price_per_person_oere ?? null,
      allowed_booking_types: data.allowed_booking_types,
      image_urls: data.image_urls || [],
      host_id: user.id,
      slug,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Sauna insert error:', error);
    return NextResponse.json({ error: 'Kunne ikke opprette badstu' }, { status: 500 });
  }

  return NextResponse.json({ sauna }, { status: 201 });
}
