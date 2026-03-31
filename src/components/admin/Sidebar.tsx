'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/bookings', label: 'Bookinger' },
  { href: '/admin/scan', label: 'QR-skanner' },
  { href: '/admin/saunas', label: 'Badstuer' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin');
  }

  return (
    <aside className="w-64 bg-[var(--color-brand)] text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold">Chill Sauna Admin</h1>
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
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 transition-colors"
        >
          Logg ut
        </button>
      </div>
    </aside>
  );
}
