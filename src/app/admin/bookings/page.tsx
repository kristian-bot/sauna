'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';
import { formatPriceNOK } from '@/lib/pricing';

interface BookingRow {
  id: string;
  customer_name: string;
  customer_email: string;
  booking_type: string;
  num_people: number;
  price_nok: number;
  status: string;
  created_at: string;
  slot: {
    date: string;
    hour: number;
    sauna: { name: string };
  };
}

const statusLabels: Record<string, string> = {
  confirmed: 'Bekreftet',
  pending_payment: 'Venter',
  cancelled: 'Kansellert',
  expired: 'Utløpt',
  refunded: 'Refundert',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-stone-100 text-stone-600',
  refunded: 'bg-blue-100 text-blue-800',
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      let query = supabase
        .from('bookings')
        .select('*, slot:slots(date, hour, sauna:saunas(name))')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      setBookings((data as BookingRow[]) || []);
      setLoading(false);
    }
    load();
  }, [filter]);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Bookinger</h1>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setLoading(true); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm"
        >
          <option value="all">Alle</option>
          <option value="confirmed">Bekreftet</option>
          <option value="pending_payment">Venter</option>
          <option value="cancelled">Kansellert</option>
          <option value="refunded">Refundert</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Dato</th>
                  <th className="px-4 py-3 font-medium">Badstu</th>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Pris</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      {b.slot?.date} kl {String(b.slot?.hour).padStart(2, '0')}:00
                    </td>
                    <td className="px-4 py-3">{b.slot?.sauna?.name}</td>
                    <td className="px-4 py-3">
                      <div>{b.customer_name}</div>
                      <div className="text-stone-400 text-xs">{b.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {b.booking_type === 'private' ? 'Privat' : `Felles (${b.num_people})`}
                    </td>
                    <td className="px-4 py-3">{formatPriceNOK(b.price_nok)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ''}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="text-[var(--color-brand)] hover:underline text-xs"
                      >
                        Detaljer
                      </Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                      Ingen bookinger funnet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
