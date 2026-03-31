import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createBookingSchema } from '@/lib/validation';
import { calculatePrice } from '@/lib/pricing';
import { createVippsPayment } from '@/lib/vipps/client';
import { v4 as uuidv4 } from 'uuid';
import type { ReserveSlotResult } from '@/lib/types';

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

  // Get sauna capacity
  const { data: sauna } = await supabase
    .from('saunas')
    .select('capacity, name')
    .eq('id', sauna_id)
    .single();

  if (!sauna) {
    return NextResponse.json({ error: 'Badstu ikke funnet' }, { status: 404 });
  }

  // Atomic slot reservation
  const { data: result, error: rpcError } = await supabase
    .rpc('reserve_slot', {
      p_sauna_id: sauna_id,
      p_date: date,
      p_hour: hour,
      p_booking_type: booking_type,
      p_num_people: booking_type === 'private' ? sauna.capacity : num_people,
      p_capacity: sauna.capacity,
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

  // Calculate price
  const priceOere = calculatePrice(booking_type, num_people);

  // Create booking
  const bookingId = uuidv4();
  const qrToken = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

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
      status: 'pending_payment',
      qr_token: qrToken,
      expires_at: expiresAt,
    });

  if (bookingError) {
    console.error('Booking insert error:', bookingError);
    // Release the slot
    await supabase.rpc('release_slot', { p_slot_id: reservation.slot_id, p_num_people: booking_type === 'private' ? sauna.capacity : num_people });
    return NextResponse.json({ error: 'Kunne ikke opprette booking' }, { status: 500 });
  }

  // Create Vipps payment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const vippsReference = `SAUNA-${bookingId.slice(0, 8).toUpperCase()}`;

  try {
    const vippsResult = await createVippsPayment({
      reference: vippsReference,
      amount: priceOere,
      description: `Badstu: ${sauna.name} ${date} kl ${hour}:00`,
      callbackUrl: `${baseUrl}/api/webhooks/vipps`,
      returnUrl: `${baseUrl}/book/callback?booking_id=${bookingId}`,
      customerPhone: customer_phone,
    });

    // Store payment record
    await supabase.from('payments').insert({
      booking_id: bookingId,
      vipps_reference: vippsReference,
      amount_oere: priceOere,
      status: 'created',
    });

    return NextResponse.json({
      booking_id: bookingId,
      vipps_redirect_url: vippsResult.url,
    });
  } catch (err) {
    console.error('Vipps payment creation failed:', err);
    // Mark booking as failed and release slot
    await supabase.from('bookings').update({ status: 'expired' }).eq('id', bookingId);
    await supabase.rpc('release_slot', { p_slot_id: reservation.slot_id, p_num_people: booking_type === 'private' ? sauna.capacity : num_people });
    return NextResponse.json({ error: 'Kunne ikke starte betaling' }, { status: 500 });
  }
}
