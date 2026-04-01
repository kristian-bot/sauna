import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const body = await request.json();
  const { reply } = body;

  if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
    return NextResponse.json({ error: 'Svar kan ikke være tomt' }, { status: 400 });
  }

  if (reply.length > 1000) {
    return NextResponse.json({ error: 'Svar kan ikke være lengre enn 1000 tegn' }, { status: 400 });
  }

  const service = createServiceClient();

  // Get the review and verify the host owns the sauna
  const { data: review } = await service
    .from('reviews')
    .select('id, sauna_id')
    .eq('id', reviewId)
    .single();

  if (!review) {
    return NextResponse.json({ error: 'Anmeldelse ikke funnet' }, { status: 404 });
  }

  const { data: sauna } = await service
    .from('saunas')
    .select('host_id')
    .eq('id', review.sauna_id)
    .single();

  if (!sauna || sauna.host_id !== user.id) {
    return NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 });
  }

  const { error } = await service
    .from('reviews')
    .update({
      host_reply: reply.trim(),
      host_reply_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Reply update error:', error);
    return NextResponse.json({ error: 'Kunne ikke lagre svar' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
