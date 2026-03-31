import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token mangler' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(
        *,
        sauna:saunas(*)
      )
    `)
    .eq('qr_token', token)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking ikke funnet' }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
