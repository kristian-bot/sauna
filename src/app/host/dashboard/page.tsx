'use client';

import { useEffect, useState } from 'react';
import { HostShell } from '@/components/host/HostShell';
import { formatPriceNOK } from '@/lib/pricing';

interface Stats {
  totalBookings: number;
  confirmedToday: number;
  totalRevenue: number;
  hostPayout: number;
  pendingPayments: number;
}

export default function HostDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/host/dashboard')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Bekreftede bookinger', value: stats.totalBookings },
    { label: 'I dag', value: stats.confirmedToday },
    { label: 'Venter på betaling', value: stats.pendingPayments },
    { label: 'Total omsetning', value: formatPriceNOK(stats.totalRevenue) },
    { label: 'Din utbetaling (85%)', value: formatPriceNOK(stats.hostPayout) },
  ] : [];

  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <p className="text-sm text-stone-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </HostShell>
  );
}
