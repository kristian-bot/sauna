import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cancelVippsPayment } from '@/lib/vipps/client';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Find expired pending bookings
  const { data: expiredBookings } = await supabase
    .from('bookings')
    .select('*, slot:slots(sauna:saunas(capacity))')
    .eq('status', 'pending_payment')
    .lt('expires_at', now);

  if (!expiredBookings || expiredBookings.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  let expiredCount = 0;

  for (const booking of expiredBookings) {
    try {
      // Cancel Vipps payment if exists
      const { data: payment } = await supabase
        .from('payments')
        .select('vipps_reference')
        .eq('booking_id', booking.id)
        .single();

      if (payment) {
        try {
          await cancelVippsPayment(payment.vipps_reference);
        } catch {
          // Vipps may already have expired/cancelled it
        }
        await supabase.from('payments').update({ status: 'expired' }).eq('booking_id', booking.id);
      }

      // Expire booking
      await supabase.from('bookings').update({ status: 'expired' }).eq('id', booking.id);

      // Release slot
      const capacity = (booking.slot as { sauna: { capacity: number } })?.sauna?.capacity || 12;
      const numToRelease = booking.booking_type === 'private' ? capacity : booking.num_people;
      await supabase.rpc('release_slot', { p_slot_id: booking.slot_id, p_num_people: numToRelease });

      expiredCount++;
    } catch (err) {
      console.error(`Failed to expire booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ expired: expiredCount });
}
