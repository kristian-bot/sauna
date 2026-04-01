import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendReviewRequestEmail } from '@/lib/email/client';

export async function POST(request: NextRequest) {
  // Simple auth check via secret header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString().slice(0, 10);

  // Find confirmed bookings where the slot date has passed and review email not sent
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, slot:slots(date, hour, sauna:saunas(name))')
    .eq('status', 'confirmed')
    .eq('review_email_sent', false);

  if (error) {
    console.error('Error fetching bookings for review emails:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  let sent = 0;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chillsauna.no';

  for (const booking of bookings || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slot = booking.slot as any;
    if (!slot || slot.date >= now) continue;
    const saunaName: string = Array.isArray(slot.sauna) ? slot.sauna[0]?.name : slot.sauna?.name;

    // Check that no review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .single();

    if (existingReview) {
      // Mark as sent so we don't check again
      await supabase
        .from('bookings')
        .update({ review_email_sent: true })
        .eq('id', booking.id);
      continue;
    }

    try {
      await sendReviewRequestEmail({
        to: booking.customer_email,
        customerName: booking.customer_name,
        saunaName: saunaName || 'Badstu',
        reviewUrl: `${baseUrl}/review/${booking.id}`,
      });

      await supabase
        .from('bookings')
        .update({ review_email_sent: true })
        .eq('id', booking.id);

      sent++;
    } catch (err) {
      console.error(`Failed to send review email for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
