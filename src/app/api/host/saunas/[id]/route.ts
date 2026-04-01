import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { updateSaunaSchema } from '@/lib/validation';
import { geocodeAddress } from '@/lib/geocoding';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSaunaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Ugyldig data' },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Verify ownership
  const { data: existing } = await service
    .from('saunas')
    .select('host_id, lat, lng')
    .eq('id', parseInt(id))
    .single();

  if (!existing || existing.host_id !== user.id) {
    return NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 });
  }

  const data = parsed.data;

  // Geocode if address/city updated and no lat/lng provided
  const updatePayload: Record<string, unknown> = { ...data };
  if ((data.address || data.city) && !data.lat && !data.lng) {
    const address = data.address || '';
    const city = data.city || '';
    if (address && city) {
      const coords = await geocodeAddress(address, city);
      updatePayload.lat = coords.lat;
      updatePayload.lng = coords.lng;
    }
  }

  const { data: sauna, error } = await service
    .from('saunas')
    .update(updatePayload)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    console.error('Sauna update error:', error);
    return NextResponse.json({ error: 'Kunne ikke oppdatere badstu' }, { status: 500 });
  }

  return NextResponse.json({ sauna });
}
