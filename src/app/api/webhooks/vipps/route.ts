import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { captureVippsPayment } from '@/lib/vipps/client';
import { sendBookingConfirmation } from '@/lib/email/client';
import { generateQRCodeDataURL } from '@/lib/qr';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderId, transactionInfo } = body;

  if (!orderId) {
    return NextResponse.json({ ok: true }); // Acknowledge even if we can't process
  }

  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from('payments')
    .select('*, booking:bookings(*, slot:slots(*, sauna:saunas(*)))')
    .eq('vipps_reference', orderId)
    .single();

  if (!payment || !payment.booking) {
    console.warn('Vipps webhook: payment not found for', orderId);
    return NextResponse.json({ ok: true });
  }

  const booking = payment.booking as {
    id: string;
    status: string;
    customer_email: string;
    customer_name: string;
    booking_type: string;
    num_people: number;
    price_nok: number;
    qr_token: string;
    slot_id: string;
    slot: { date: string; hour: number; sauna: { name: string; capacity: number } };
  };

  // Already processed
  if (booking.status === 'confirmed') {
    return NextResponse.json({ ok: true });
  }

  const status = transactionInfo?.status;

  if (status === 'RESERVE' || status === 'RESERVED') {
    try {
      // Capture
      await captureVippsPayment(orderId, payment.amount_oere);
      await supabase.from('payments').update({ status: 'captured' }).eq('id', payment.id);
      await supabase.from('bookings').update({ status: 'confirmed', expires_at: null }).eq('id', booking.id);

      // Send email
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const qrDataUrl = await generateQRCodeDataURL(booking.qr_token);

      await sendBookingConfirmation({
        to: booking.customer_email,
        customerName: booking.customer_name,
        saunaName: booking.slot.sauna.name,
        date: formatDateNorwegian(booking.slot.date),
        hour: formatHourRange(booking.slot.hour),
        bookingType: booking.booking_type,
        numPeople: booking.num_people,
        price: formatPriceNOK(booking.price_nok),
        qrCodeUrl: qrDataUrl,
        bookingUrl: `${baseUrl}/booking/${booking.qr_token}`,
      });
    } catch (err) {
      console.error('Webhook capture/email error:', err);
    }
  } else if (status === 'CANCELLED' || status === 'REJECTED') {
    await supabase.from('payments').update({ status: 'cancelled' }).eq('id', payment.id);
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);

    const numToRelease = booking.booking_type === 'private'
      ? booking.slot.sauna.capacity
      : booking.num_people;
    await supabase.rpc('release_slot', { p_slot_id: booking.slot_id, p_num_people: numToRelease });
  }

  return NextResponse.json({ ok: true });
}
