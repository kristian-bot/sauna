'use client';

import { useEffect, useState, use } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK } from '@/lib/pricing';

interface BookingDetail {
  id: string;
  slot_id: string;
  booking_type: string;
  num_people: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  price_nok: number;
  status: string;
  qr_token: string;
  created_at: string;
  slot: {
    date: string;
    hour: number;
    sauna: { name: string; capacity: number };
  };
}

export default function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('bookings')
        .select('*, slot:slots(date, hour, sauna:saunas(name, capacity))')
        .eq('id', id)
        .single();
      setBooking(data as BookingDetail | null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleCancel() {
    if (!booking || !confirm('Er du sikker på at du vil kansellere denne bookingen?')) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        setBooking({ ...booking, status: 'cancelled' });
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  }

  async function handleRefund() {
    if (!booking || !confirm('Er du sikker på at du vil refundere denne bookingen?')) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/refund`, { method: 'POST' });
      if (res.ok) {
        setBooking({ ...booking, status: 'refunded' });
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      </AdminShell>
    );
  }

  if (!booking) {
    return (
      <AdminShell>
        <h1 className="text-2xl font-bold">Booking ikke funnet</h1>
      </AdminShell>
    );
  }

  const statusLabels: Record<string, string> = {
    confirmed: 'Bekreftet', pending_payment: 'Venter', cancelled: 'Kansellert', expired: 'Utløpt', refunded: 'Refundert',
  };

  return (
    <AdminShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Bookingdetaljer</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-400">ID: {booking.id.slice(0, 8)}</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-stone-100">
              {statusLabels[booking.status] || booking.status}
            </span>
          </div>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-stone-500">Badstu</dt>
              <dd className="font-medium">{booking.slot.sauna.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Dato</dt>
              <dd className="font-medium capitalize">{formatDateNorwegian(booking.slot.date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Tid</dt>
              <dd className="font-medium">{formatHourRange(booking.slot.hour)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Type</dt>
              <dd className="font-medium">{booking.booking_type === 'private' ? 'Privat' : 'Felles'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Antall</dt>
              <dd className="font-medium">{booking.num_people}</dd>
            </div>
            <hr className="border-stone-100" />
            <div className="flex justify-between">
              <dt className="text-stone-500">Navn</dt>
              <dd className="font-medium">{booking.customer_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">E-post</dt>
              <dd className="font-medium">{booking.customer_email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Telefon</dt>
              <dd className="font-medium">{booking.customer_phone}</dd>
            </div>
            <hr className="border-stone-100" />
            <div className="flex justify-between text-lg">
              <dt className="font-semibold">Pris</dt>
              <dd className="font-bold">{formatPriceNOK(booking.price_nok)}</dd>
            </div>
          </dl>

          {booking.status === 'confirmed' && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Kanseller
              </button>
              <button
                onClick={handleRefund}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Refunder
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
