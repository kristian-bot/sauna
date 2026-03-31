'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalBookings: number;
  confirmedToday: number;
  pendingPayments: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    confirmedToday: 0,
    pendingPayments: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);

      const [totalRes, todayRes, pendingRes, revenueRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending_payment'),
        supabase.from('bookings').select('price_nok').eq('status', 'confirmed'),
      ]);

      setStats({
        totalBookings: totalRes.count || 0,
        confirmedToday: todayRes.count || 0,
        pendingPayments: pendingRes.count || 0,
        revenue: (revenueRes.data || []).reduce((sum, b) => sum + b.price_nok, 0),
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Bekreftede bookinger', value: stats.totalBookings },
    { label: 'I dag', value: stats.confirmedToday },
    { label: 'Venter på betaling', value: stats.pendingPayments },
    { label: 'Total omsetning', value: `${(stats.revenue / 100).toLocaleString('nb-NO')} kr` },
  ];

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <p className="text-sm text-stone-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
