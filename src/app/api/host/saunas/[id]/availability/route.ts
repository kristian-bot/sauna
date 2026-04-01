import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

async function verifySaunaOwnership(saunaId: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const service = createServiceClient();
  const { data: sauna } = await service
    .from('saunas')
    .select('host_id')
    .eq('id', saunaId)
    .single();

  if (!sauna || sauna.host_id !== user.id) return null;
  return service;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const saunaId = parseInt(id);
  const service = await verifySaunaOwnership(saunaId);

  if (!service) {
    return NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 });
  }

  const { data: hours } = await service
    .from('opening_hours')
    .select('day_of_week, open_hour')
    .eq('sauna_id', saunaId)
    .eq('is_closed', false);

  // Build schedule object: { 0: [8,9,10,...], 1: [...], ... }
  const schedule: Record<number, number[]> = {};
  for (let d = 0; d < 7; d++) schedule[d] = [];

  for (const row of hours || []) {
    // Convert Sunday=0 DB format to Monday=0 UI format
    const uiDay = row.day_of_week === 0 ? 6 : row.day_of_week - 1;
    if (!schedule[uiDay]) schedule[uiDay] = [];
    schedule[uiDay].push(row.open_hour);
  }

  // Sort each day's hours
  for (const d of Object.keys(schedule)) {
    schedule[Number(d)].sort((a, b) => a - b);
  }

  return NextResponse.json({ schedule });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const saunaId = parseInt(id);
  const service = await verifySaunaOwnership(saunaId);

  if (!service) {
    return NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 });
  }

  const body = await request.json();
  const { schedule } = body as { schedule: Record<number, number[]> };

  if (!schedule || typeof schedule !== 'object') {
    return NextResponse.json({ error: 'Ugyldig data' }, { status: 400 });
  }

  // Delete all existing opening hours for this sauna
  await service
    .from('opening_hours')
    .delete()
    .eq('sauna_id', saunaId);

  // Insert new rows
  const rows: Array<{
    sauna_id: number;
    day_of_week: number;
    open_hour: number;
    close_hour: number;
    is_closed: boolean;
  }> = [];

  for (const [uiDay, hours] of Object.entries(schedule)) {
    // Convert Monday=0 UI format to DB format (Sunday=0)
    const dbDay = Number(uiDay) === 6 ? 0 : Number(uiDay) + 1;
    for (const hour of hours) {
      rows.push({
        sauna_id: saunaId,
        day_of_week: dbDay,
        open_hour: hour,
        close_hour: hour + 1,
        is_closed: false,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await service
      .from('opening_hours')
      .insert(rows);

    if (error) {
      console.error('Opening hours insert error:', error);
      return NextResponse.json({ error: 'Kunne ikke lagre tilgjengelighet' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
