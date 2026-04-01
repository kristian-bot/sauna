import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hostRegisterSchema } from '@/lib/validation';
import slugify from 'slugify';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = hostRegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Ugyldig data' },
      { status: 400 }
    );
  }

  const { name, email, phone, password, bio } = parsed.data;
  const supabase = createServiceClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already')) {
      return NextResponse.json({ error: 'E-postadressen er allerede registrert' }, { status: 409 });
    }
    console.error('Auth error:', authError);
    return NextResponse.json({ error: 'Kunne ikke opprette bruker' }, { status: 500 });
  }

  const userId = authData.user.id;

  // Generate unique slug
  let slug = slugify(name, { lower: true, strict: true });
  const { data: existing } = await supabase
    .from('hosts')
    .select('slug')
    .eq('slug', slug)
    .single();

  if (existing) {
    slug = `${slug}-${userId.slice(0, 6)}`;
  }

  // Create host record
  const { error: hostError } = await supabase
    .from('hosts')
    .insert({
      id: userId,
      email,
      name,
      phone,
      bio: bio || null,
      slug,
      is_verified: false,
    });

  if (hostError) {
    console.error('Host insert error:', hostError);
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: 'Kunne ikke opprette host-profil' }, { status: 500 });
  }

  return NextResponse.json({ success: true, host_id: userId, slug });
}
