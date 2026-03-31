import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceClient();

  const { data: saunas, error } = await supabase
    .from('saunas')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente badstuer' }, { status: 500 });
  }

  return NextResponse.json({ saunas });
}
