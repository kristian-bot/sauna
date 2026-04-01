import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin(service: ReturnType<typeof createServiceClient>, userId: string) {
  const { data: member } = await service
    .from('family_members')
    .select('id, is_admin')
    .eq('id', userId)
    .single();

  return member?.is_admin ? member : null;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();
  const admin = await requireAdmin(service, user.id);

  if (!admin) {
    return NextResponse.json({ error: 'Kun admin' }, { status: 403 });
  }

  const { data: members, error } = await service
    .from('family_members')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente medlemmer' }, { status: 500 });
  }

  return NextResponse.json({ members });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();
  const admin = await requireAdmin(service, user.id);

  if (!admin) {
    return NextResponse.json({ error: 'Kun admin' }, { status: 403 });
  }

  const { memberId } = await request.json();

  if (!memberId) {
    return NextResponse.json({ error: 'Mangler medlems-ID' }, { status: 400 });
  }

  if (memberId === user.id) {
    return NextResponse.json({ error: 'Kan ikke fjerne deg selv' }, { status: 400 });
  }

  // Delete from family_members (cascades auth user stays, just removes membership)
  const { error } = await service
    .from('family_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke fjerne medlem' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
