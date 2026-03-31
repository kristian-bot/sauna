import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getVippsPaymentStatus, captureVippsPayment } from '@/lib/vipps/client';
import { sendBookingConfirmation } from '@/lib/email/client';
import { generateQRCodeDataURL } from '@/lib/qr';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id');

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id mangler' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get booking and payment
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(*, sauna:saunas(*))
    `)
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking ikke funnet' }, { status: 404 });
  }

  // Already confirmed
  if (booking.status === 'confirmed') {
    return NextResponse.json({ status: 'confirmed', booking_id: bookingId });
  }

  // Already expired/cancelled
  if (['expired', 'cancelled'].includes(booking.status)) {
    return NextResponse.json({ status: booking.status, booking_id: bookingId });
  }

  // Get payment record
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (!payment) {
    return NextResponse.json({ error: 'Betaling ikke funnet' }, { status: 404 });
  }

  try {
    // Check Vipps status
    const vippsStatus = await getVippsPaymentStatus(payment.vipps_reference);
    const lastEvent = vippsStatus.transactionLogHistory?.[0];

    if (!lastEvent) {
      return NextResponse.json({ status: 'pending' });
    }

    const operation = lastEvent.operation;

    if (operation === 'RESERVE') {
      // Payment authorized — capture it
      await captureVippsPayment(payment.vipps_reference, payment.amount_oere);

      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'captured', vipps_psp_ref: vippsStatus.transactionSummary?.capturedAmount ? payment.vipps_reference : null })
        .eq('id', payment.id);

      // Confirm booking
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', expires_at: null })
        .eq('id', bookingId);

      // Send confirmation email
      try {
        const slot = booking.slot as { date: string; hour: number; sauna: { name: string } };
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
        const qrDataUrl = await generateQRCodeDataURL(booking.qr_token);

        await sendBookingConfirmation({
          to: booking.customer_email,
          customerName: booking.customer_name,
          saunaName: slot.sauna.name,
          date: formatDateNorwegian(slot.date),
          hour: formatHourRange(slot.hour),
          bookingType: booking.booking_type,
          numPeople: booking.num_people,
          price: formatPriceNOK(booking.price_nok),
          qrCodeUrl: qrDataUrl,
          bookingUrl: `${baseUrl}/booking/${booking.qr_token}`,
        });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        // Don't fail the booking for email errors
      }

      return NextResponse.json({ status: 'confirmed', booking_id: bookingId });
    }

    if (operation === 'CANCEL' || lastEvent.operationSuccess === false) {
      await supabase.from('payments').update({ status: 'cancelled' }).eq('id', payment.id);
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);

      // Release slot
      const numToRelease = booking.booking_type === 'private'
        ? (booking.slot as { sauna: { capacity: number } }).sauna.capacity
        : booking.num_people;
      await supabase.rpc('release_slot', { p_slot_id: booking.slot_id, p_num_people: numToRelease });

      return NextResponse.json({ status: 'cancelled', booking_id: bookingId });
    }

    return NextResponse.json({ status: 'pending' });
  } catch (err) {
    console.error('Payment status check failed:', err);
    return NextResponse.json({ error: 'Kunne ikke sjekke betalingsstatus' }, { status: 500 });
  }
}
