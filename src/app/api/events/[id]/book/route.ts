import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { bookEventSchema } from '@/lib/validation';
import { calculateCommission } from '@/lib/pricing';
import { createVippsPayment } from '@/lib/vipps/client';
import { v4 as uuidv4 } from 'uuid';
import type { ReserveEventSlotResult } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const body = await request.json();
  const parsed = bookEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Ugyldig data' },
      { status: 400 }
    );
  }

  const { num_people, customer_name, customer_email, customer_phone } = parsed.data;
  const supabase = createServiceClient();

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*, sauna:saunas(name)')
    .eq('id', eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Event ikke funnet' }, { status: 404 });
  }

  // Atomic reservation
  const { data: result, error: rpcError } = await supabase
    .rpc('reserve_event_slot', {
      p_event_id: eventId,
      p_num_people: num_people,
    });

  if (rpcError) {
    console.error('reserve_event_slot error:', rpcError);
    return NextResponse.json({ error: 'Kunne ikke reservere plass' }, { status: 500 });
  }

  const reservation = (result as ReserveEventSlotResult[])?.[0];
  if (!reservation?.success) {
    return NextResponse.json(
      { error: reservation?.error_message || 'Ingen ledige plasser' },
      { status: 409 }
    );
  }

  // Calculate price with commission
  const priceOere = event.price_per_person_oere * num_people;
  const { platformFee, hostPayout } = calculateCommission(priceOere);

  // Create event booking
  const bookingId = uuidv4();
  const qrToken = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: bookingError } = await supabase
    .from('event_bookings')
    .insert({
      id: bookingId,
      event_id: eventId,
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
    console.error('Event booking insert error:', bookingError);
    return NextResponse.json({ error: 'Kunne ikke opprette booking' }, { status: 500 });
  }

  // Create Vipps payment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const vippsReference = `EVENT-${bookingId.slice(0, 8).toUpperCase()}`;
  const saunaName = (event.sauna as { name: string })?.name || 'Event';

  try {
    const vippsResult = await createVippsPayment({
      reference: vippsReference,
      amount: priceOere,
      description: `Event: ${event.title} - ${saunaName}`,
      callbackUrl: `${baseUrl}/api/webhooks/vipps`,
      returnUrl: `${baseUrl}/book/callback?booking_id=${bookingId}&type=event`,
      customerPhone: customer_phone,
    });

    await supabase.from('payments').insert({
      booking_id: bookingId,
      vipps_reference: vippsReference,
      amount_oere: priceOere,
      platform_fee_oere: platformFee,
      host_amount_oere: hostPayout,
      status: 'created',
    });

    return NextResponse.json({
      booking_id: bookingId,
      vipps_redirect_url: vippsResult.url,
    });
  } catch (err) {
    console.error('Vipps payment creation failed:', err);
    await supabase.from('event_bookings').update({ status: 'expired' }).eq('id', bookingId);
    return NextResponse.json({ error: 'Kunne ikke starte betaling' }, { status: 500 });
  }
}
