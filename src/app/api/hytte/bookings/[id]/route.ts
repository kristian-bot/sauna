import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
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
  const { data: member } = await service
    .from('family_members')
    .select('id, is_admin')
    .eq('id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Ikke familiemedlem' }, { status: 403 });
  }

  const body = await request.json();
  const { status } = body;

  // Only admin can confirm/reject
  if ((status === 'confirmed' || status === 'rejected') && !member.is_admin) {
    return NextResponse.json({ error: 'Kun admin kan godkjenne/avslå' }, { status: 403 });
  }

  // Members can only cancel their own bookings
  if (status === 'cancelled') {
    const { data: booking } = await service
      .from('cabin_bookings')
      .select('member_id')
      .eq('id', Number(id))
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking ikke funnet' }, { status: 404 });
    }

    if (booking.member_id !== user.id && !member.is_admin) {
      return NextResponse.json({ error: 'Kan kun kansellere egne bookinger' }, { status: 403 });
    }
  }

  const { data: updated, error } = await service
    .from('cabin_bookings')
    .update({ status })
    .eq('id', Number(id))
    .select('*, cabins(name, color), family_members(name, email)')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke oppdatere booking' }, { status: 500 });
  }

  return NextResponse.json({ booking: updated });
}

export async function DELETE(
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
  const { data: member } = await service
    .from('family_members')
    .select('id, is_admin')
    .eq('id', user.id)
    .single();

  if (!member || !member.is_admin) {
    return NextResponse.json({ error: 'Kun admin' }, { status: 403 });
  }

  const { error } = await service
    .from('cabin_bookings')
    .delete()
    .eq('id', Number(id));

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke slette booking' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
