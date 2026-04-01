'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/host/dashboard', label: 'Dashboard' },
  { href: '/host/saunas', label: 'Mine badstuer' },
];

export function HostShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/host');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[var(--color-brand)] text-white min-h-screen flex flex-col">
        <div className="p-6">
          <Link href="/host/dashboard" className="text-lg font-bold">
            Badstumester
          </Link>
          <p className="text-xs text-white/60 mt-1">Host-panel</p>
        </div>
        <nav className="flex-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-white/20 font-medium'
                  : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 space-y-1">
          <Link
            href="/"
            className="block px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            Til forsiden
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 transition-colors"
          >
            Logg ut
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-stone-50 p-8">
        {children}
      </main>
    </div>
  );
}
