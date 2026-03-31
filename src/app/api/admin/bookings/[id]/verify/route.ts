import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: qrToken } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, slot:slots(date, hour, sauna:saunas(name))')
    .eq('qr_token', qrToken)
    .single();

  if (!booking) {
    return NextResponse.json({ valid: false, error: 'Booking ikke funnet' });
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({
      valid: false,
      error: `Booking er ${booking.status === 'cancelled' ? 'kansellert' : booking.status === 'expired' ? 'utløpt' : 'ikke bekreftet'}`,
      booking,
    });
  }

  return NextResponse.json({ valid: true, booking });
}
