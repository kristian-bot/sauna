import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: sauna, error } = await supabase
    .from('saunas')
    .select('*, host:hosts(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !sauna) {
    return NextResponse.json({ error: 'Badstu ikke funnet' }, { status: 404 });
  }

  // Get upcoming events for this sauna
  const today = new Date().toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('sauna_id', sauna.id)
    .gte('date', today)
    .eq('is_full', false)
    .order('date', { ascending: true })
    .limit(10);

  // Get reviews for this sauna
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at, host_reply, host_reply_at')
    .eq('sauna_id', sauna.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ sauna, events: events || [], reviews: reviews || [] });
}
