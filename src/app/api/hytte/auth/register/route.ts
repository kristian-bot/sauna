import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const service = createServiceClient();

  // Verify caller is admin
  const { data: admin } = await service
    .from('family_members')
    .select('id, is_admin')
    .eq('id', user.id)
    .single();

  if (!admin?.is_admin) {
    return NextResponse.json({ error: 'Kun admin kan registrere medlemmer' }, { status: 403 });
  }

  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Mangler påkrevde felt' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Passord må være minst 6 tegn' }, { status: 400 });
  }

  // Create auth user via admin API
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create family member record
  const { data: member, error: memberError } = await service
    .from('family_members')
    .insert({
      id: authData.user.id,
      email,
      name,
      is_admin: false,
    })
    .select()
    .single();

  if (memberError) {
    // Cleanup: delete the auth user if member creation fails
    await service.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'Kunne ikke opprette medlem' }, { status: 500 });
  }

  return NextResponse.json({ member }, { status: 201 });
}
