import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { createEventSchema } from '@/lib/validation';

export async function GET(
  _request: NextRequest,
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

  const { data: events, error } = await service
    .from('events')
    .select('*')
    .eq('sauna_id', parseInt(id))
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente events' }, { status: 500 });
  }

  return NextResponse.json({ events });
}

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

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Ugyldig data' },
      { status: 400 }
    );
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

  const { data: event, error } = await service
    .from('events')
    .insert({
      sauna_id: parseInt(id),
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    console.error('Event insert error:', error);
    return NextResponse.json({ error: 'Kunne ikke opprette event' }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
