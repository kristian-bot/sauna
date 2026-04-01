import { NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();

  // Get host's saunas with rating info
  const { data: saunas } = await service
    .from('saunas')
    .select('id, name, average_rating, review_count')
    .eq('host_id', user.id);

  const saunaList = saunas || [];
  const saunaIds = saunaList.map(s => s.id);

  const emptyResponse = {
    totalBookings: 0,
    confirmedToday: 0,
    totalRevenue: 0,
    hostPayout: 0,
    pendingPayments: 0,
    overallRating: null as number | null,
    totalReviews: 0,
    saunaRatings: saunaList.map(s => ({
      id: s.id,
      name: s.name,
      average_rating: s.average_rating,
      review_count: s.review_count,
    })),
  };

  if (saunaIds.length === 0) {
    return NextResponse.json(emptyResponse);
  }

  // Calculate overall rating
  const ratedSaunas = saunaList.filter(s => s.average_rating !== null && s.review_count > 0);
  const totalReviews = saunaList.reduce((sum, s) => sum + (s.review_count || 0), 0);
  const overallRating = totalReviews > 0
    ? ratedSaunas.reduce((sum, s) => sum + (s.average_rating || 0) * s.review_count, 0) / totalReviews
    : null;

  // Get bookings for host's saunas via slots
  const { data: slots } = await service
    .from('slots')
    .select('id')
    .in('sauna_id', saunaIds);

  const slotIds = (slots || []).map(s => s.id);

  if (slotIds.length === 0) {
    return NextResponse.json({
      ...emptyResponse,
      overallRating,
      totalReviews,
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const [totalRes, todayRes, pendingRes, revenueRes] = await Promise.all([
    service.from('bookings').select('id', { count: 'exact', head: true })
      .in('slot_id', slotIds).eq('status', 'confirmed'),
    service.from('bookings').select('id', { count: 'exact', head: true })
      .in('slot_id', slotIds).eq('status', 'confirmed')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),
    service.from('bookings').select('id', { count: 'exact', head: true })
      .in('slot_id', slotIds).eq('status', 'pending_payment'),
    service.from('bookings').select('price_nok, host_payout_oere')
      .in('slot_id', slotIds).eq('status', 'confirmed'),
  ]);

  const totalRevenue = (revenueRes.data || []).reduce((sum, b) => sum + b.price_nok, 0);
  const hostPayout = (revenueRes.data || []).reduce((sum, b) => sum + (b.host_payout_oere || b.price_nok), 0);

  return NextResponse.json({
    totalBookings: totalRes.count || 0,
    confirmedToday: todayRes.count || 0,
    totalRevenue,
    hostPayout,
    pendingPayments: pendingRes.count || 0,
    overallRating,
    totalReviews,
    saunaRatings: saunaList.map(s => ({
      id: s.id,
      name: s.name,
      average_rating: s.average_rating,
      review_count: s.review_count,
    })),
  });
}
