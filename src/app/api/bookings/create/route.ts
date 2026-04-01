import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createBookingSchema } from '@/lib/validation';
import { getSaunaPrice, calculateCommission } from '@/lib/pricing';
import { v4 as uuidv4 } from 'uuid';
import type { ReserveSlotResult, Sauna } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Ugyldig data' },
      { status: 400 }
    );
  }

  const { sauna_id, date, hour, booking_type, num_people, customer_name, customer_email, customer_phone } = parsed.data;
  const supabase = createServiceClient();

  // Get sauna with marketplace fields
  const { data: sauna } = await supabase
    .from('saunas')
    .select('*')
    .eq('id', sauna_id)
    .single();

  if (!sauna) {
    return NextResponse.json({ error: 'Badstu ikke funnet' }, { status: 404 });
  }

  const capacity = sauna.max_people || sauna.capacity;

  // Atomic slot reservation
  const { data: result, error: rpcError } = await supabase
    .rpc('reserve_slot', {
      p_sauna_id: sauna_id,
      p_date: date,
      p_hour: hour,
      p_booking_type: booking_type,
      p_num_people: booking_type === 'private' ? capacity : num_people,
      p_capacity: capacity,
    });

  if (rpcError) {
    console.error('reserve_slot error:', rpcError);
    return NextResponse.json({ error: 'Kunne ikke reservere tidspunkt' }, { status: 500 });
  }

  const reservation = (result as ReserveSlotResult[])?.[0];
  if (!reservation?.success) {
    return NextResponse.json(
      { error: reservation?.error_message || 'Tidspunktet er ikke tilgjengelig' },
      { status: 409 }
    );
  }

  // Calculate price dynamically from sauna
  const priceOere = getSaunaPrice(sauna as Sauna, booking_type, num_people);
  const { platformFee, hostPayout } = calculateCommission(priceOere);

  // Create booking — directly confirmed (demo mode, no payment)
  const bookingId = uuidv4();
  const qrToken = uuidv4();

  const { error: bookingError } = await supabase
    .from('bookings')
    .insert({
      id: bookingId,
      slot_id: reservation.slot_id,
      booking_type,
      num_people,
      customer_name,
      customer_email,
      customer_phone,
      price_nok: priceOere,
      platform_fee_oere: platformFee,
      host_payout_oere: hostPayout,
      status: 'confirmed',
      qr_token: qrToken,
      expires_at: null,
    });

  if (bookingError) {
    console.error('Booking insert error:', bookingError);
    await supabase.rpc('release_slot', { p_slot_id: reservation.slot_id, p_num_people: booking_type === 'private' ? capacity : num_people });
    return NextResponse.json({ error: 'Kunne ikke opprette booking' }, { status: 500 });
  }

  // Create mock payment record
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const vippsReference = `DEMO-${bookingId.slice(0, 8).toUpperCase()}`;

  await supabase.from('payments').insert({
    booking_id: bookingId,
    vipps_reference: vippsReference,
    amount_oere: priceOere,
    platform_fee_oere: platformFee,
    host_amount_oere: hostPayout,
    status: 'captured',
  });

  return NextResponse.json({
    booking_id: bookingId,
    // Skip Vipps — redirect straight to success
    vipps_redirect_url: `${baseUrl}/book/success/${bookingId}`,
  });
}
