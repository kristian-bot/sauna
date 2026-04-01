import { NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: member } = await service
    .from('family_members')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Ikke familiemedlem' }, { status: 403 });
  }

  const { data: cabins, error } = await service
    .from('cabins')
    .select('*')
    .order('id');

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente hytter' }, { status: 500 });
  }

  return NextResponse.json({ cabins });
}
