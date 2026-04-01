import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: member } = await service
    .from('family_members')
    .select('id, is_admin')
    .eq('id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Ikke familiemedlem' }, { status: 403 });
  }

  const url = new URL(request.url);
  const mine = url.searchParams.get('mine') === 'true';
  const status = url.searchParams.get('status');

  let query = service
    .from('cabin_bookings')
    .select('*, cabins(name, color), family_members(name, email)')
    .order('check_in', { ascending: true });

  if (mine) {
    query = query.eq('member_id', user.id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: bookings, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente bookinger' }, { status: 500 });
  }

  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: member } = await service
    .from('family_members')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Ikke familiemedlem' }, { status: 403 });
  }

  const body = await request.json();
  const { cabin_id, check_in, check_out, note } = body;

  if (!cabin_id || !check_in || !check_out) {
    return NextResponse.json({ error: 'Mangler påkrevde felt' }, { status: 400 });
  }

  if (new Date(check_out) <= new Date(check_in)) {
    return NextResponse.json({ error: 'Utsjekk må være etter innsjekk' }, { status: 400 });
  }

  // Check for overlapping confirmed/pending bookings
  const { data: overlapping } = await service
    .from('cabin_bookings')
    .select('id')
    .eq('cabin_id', cabin_id)
    .in('status', ['pending', 'confirmed'])
    .lt('check_in', check_out)
    .gt('check_out', check_in);

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json({ error: 'Hytta er allerede booket i denne perioden' }, { status: 409 });
  }

  const { data: booking, error } = await service
    .from('cabin_bookings')
    .insert({
      cabin_id,
      member_id: user.id,
      check_in,
      check_out,
      note: note || null,
      status: 'pending',
    })
    .select('*, cabins(name, color), family_members(name, email)')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke opprette booking' }, { status: 500 });
  }

  return NextResponse.json({ booking }, { status: 201 });
}
