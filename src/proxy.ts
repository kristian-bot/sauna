import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin login page) and /host routes (except /host login page)
  const isProtectedAdmin = pathname.startsWith('/admin') && pathname !== '/admin';
  const isProtectedHost = pathname.startsWith('/host') && pathname !== '/host';

  if (!isProtectedAdmin && !isProtectedHost) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = isProtectedAdmin ? '/admin' : '/host';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  if (isProtectedAdmin) {
    // Check admin_users table
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (isProtectedHost) {
    // Check hosts table
    const { data: host } = await supabase
      .from('hosts')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!host) {
      return NextResponse.redirect(new URL('/host', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path+', '/host/:path+'],
};
