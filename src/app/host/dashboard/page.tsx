'use client';

import { useEffect, useState } from 'react';
import { HostShell } from '@/components/host/HostShell';
import { StarRating } from '@/components/ui/StarRating';
import { formatPriceNOK } from '@/lib/pricing';

interface SaunaRating {
  id: number;
  name: string;
  average_rating: number | null;
  review_count: number;
}

interface Stats {
  totalBookings: number;
  confirmedToday: number;
  totalRevenue: number;
  hostPayout: number;
  pendingPayments: number;
  overallRating: number | null;
  totalReviews: number;
  saunaRatings: SaunaRating[];
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
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => (
              <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
                <p className="text-sm text-stone-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Rating section */}
          {stats && stats.totalReviews > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-brand)] mb-4">Vurderinger</h2>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 mb-4">
                <p className="text-sm text-stone-500 mb-2">Gjennomsnittlig vurdering</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">
                    {stats.overallRating !== null ? stats.overallRating.toFixed(1) : '-'}
                  </span>
                  {stats.overallRating !== null && (
                    <StarRating rating={Math.round(stats.overallRating)} count={stats.totalReviews} size="md" />
                  )}
                </div>
              </div>

              {stats.saunaRatings.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.saunaRatings.map(s => (
                    <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
                      <p className="text-sm font-medium text-stone-700 mb-2">{s.name}</p>
                      {s.average_rating !== null && s.review_count > 0 ? (
                        <StarRating rating={Math.round(s.average_rating)} count={s.review_count} size="sm" />
                      ) : (
                        <p className="text-xs text-stone-400">Ingen anmeldelser ennå</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </HostShell>
  );
}
