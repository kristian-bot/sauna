'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/host/dashboard', label: 'Dashboard' },
  { href: '/host/saunas', label: 'Mine badstuer' },
  { href: '/host/reviews', label: 'Anmeldelser' },
];

export function HostShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/host');
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-[var(--color-brand)] text-white p-2 rounded-lg shadow-lg"
        aria-label="Åpne meny"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-brand)] text-white min-h-screen flex flex-col
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <Link href="/host/dashboard" className="text-lg font-bold">
              Badstumester
            </Link>
            <p className="text-xs text-white/60 mt-1">Host-panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/60 hover:text-white"
            aria-label="Lukk meny"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
      <main className="flex-1 bg-stone-50 p-4 pt-16 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
