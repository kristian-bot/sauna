import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cancelVippsPayment } from '@/lib/vipps/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, slot:slots(sauna:saunas(capacity))')
    .eq('id', id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking ikke funnet' }, { status: 404 });
  }

  if (booking.status !== 'confirmed' && booking.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Kan ikke kansellere denne bookingen' }, { status: 400 });
  }

  // Cancel Vipps payment if exists
  const { data: payment } = await supabase
    .from('payments')
    .select('vipps_reference')
    .eq('booking_id', id)
    .single();

  if (payment) {
    try {
      await cancelVippsPayment(payment.vipps_reference);
    } catch {
      // May already be cancelled
    }
    await supabase.from('payments').update({ status: 'cancelled' }).eq('booking_id', id);
  }

  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);

  // Release slot
  const capacity = (booking.slot as { sauna: { capacity: number } })?.sauna?.capacity || 12;
  const numToRelease = booking.booking_type === 'private' ? capacity : booking.num_people;
  await supabase.rpc('release_slot', { p_slot_id: booking.slot_id, p_num_people: numToRelease });

  return NextResponse.json({ ok: true });
}
