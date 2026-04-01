import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();

  // Verify ownership
  const { data: sauna } = await service
    .from('saunas')
    .select('host_id')
    .eq('id', parseInt(id))
    .single();

  if (!sauna || sauna.host_id !== user.id) {
    return NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 });
  }

  const body = await request.json();
  const { date, hours } = body;

  if (!date || !Array.isArray(hours)) {
    return NextResponse.json({ error: 'Ugyldig data' }, { status: 400 });
  }

  // Upsert opening hours for the specified date
  // We use a simple approach: store as opening_hours with day_of_week derived from date
  const dayOfWeek = new Date(date).getDay();

  for (const { hour, is_available } of hours) {
    if (is_available) {
      await service
        .from('opening_hours')
        .upsert({
          sauna_id: parseInt(id),
          day_of_week: dayOfWeek,
          open_hour: hour,
          close_hour: hour + 1,
          is_closed: false,
        }, { onConflict: 'sauna_id,day_of_week' });
    }
  }

  return NextResponse.json({ success: true });
}
