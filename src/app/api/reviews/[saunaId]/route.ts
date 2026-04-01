import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ saunaId: string }> }
) {
  const { saunaId } = await params;
  const supabase = createServiceClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at')
    .eq('sauna_id', parseInt(saunaId, 10))
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente anmeldelser' }, { status: 500 });
  }

  return NextResponse.json({ reviews: reviews || [] });
}
