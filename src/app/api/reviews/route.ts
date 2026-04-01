import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  let body: { booking_id: string; rating: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 400 });
  }

  const { booking_id, rating, comment } = body;

  if (!booking_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'booking_id og rating (1-5) er påkrevd' }, { status: 400 });
  }

  // Check that no review already exists for this booking
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', booking_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Du har allerede gitt en vurdering for denne bookingen' }, { status: 409 });
  }

  // Use the submit_review function for atomic insert + rating update
  const { data, error } = await supabase.rpc('submit_review', {
    p_booking_id: booking_id,
    p_rating: rating,
    p_comment: comment || null,
  });

  if (error) {
    console.error('submit_review error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ review_id: data });
}
