import { NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();

  // Get host's sauna IDs
  const { data: saunas } = await service
    .from('saunas')
    .select('id, name')
    .eq('host_id', user.id);

  const saunaIds = (saunas || []).map(s => s.id);

  if (saunaIds.length === 0) {
    return NextResponse.json({ reviews: [] });
  }

  const { data: reviews, error } = await service
    .from('reviews')
    .select('id, sauna_id, customer_name, rating, comment, created_at, host_reply, host_reply_at')
    .in('sauna_id', saunaIds)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente anmeldelser' }, { status: 500 });
  }

  // Attach sauna name to each review
  const saunaMap = Object.fromEntries((saunas || []).map(s => [s.id, s.name]));
  const enriched = (reviews || []).map(r => ({
    ...r,
    sauna_name: saunaMap[r.sauna_id] || 'Ukjent',
  }));

  return NextResponse.json({ reviews: enriched });
}
