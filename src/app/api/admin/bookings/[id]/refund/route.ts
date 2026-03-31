import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { refundVippsPayment } from '@/lib/vipps/client';

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

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Kan kun refundere bekreftede bookinger' }, { status: 400 });
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', id)
    .single();

  if (payment) {
    try {
      await refundVippsPayment(payment.vipps_reference, payment.amount_oere);
      await supabase.from('payments').update({ status: 'refunded' }).eq('id', payment.id);
    } catch (err) {
      console.error('Refund failed:', err);
      return NextResponse.json({ error: 'Refundering feilet' }, { status: 500 });
    }
  }

  await supabase.from('bookings').update({ status: 'refunded' }).eq('id', id);

  // Release slot
  const capacity = (booking.slot as { sauna: { capacity: number } })?.sauna?.capacity || 12;
  const numToRelease = booking.booking_type === 'private' ? capacity : booking.num_people;
  await supabase.rpc('release_slot', { p_slot_id: booking.slot_id, p_num_people: numToRelease });

  return NextResponse.json({ ok: true });
}
