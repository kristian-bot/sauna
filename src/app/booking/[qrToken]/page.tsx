'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK } from '@/lib/pricing';
import type { BookingWithSlot } from '@/lib/types';

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Bekreftet' },
  pending_payment: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', label: 'Venter på betaling' },
  cancelled: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Kansellert' },
  expired: { color: 'text-stone-600', bg: 'bg-stone-50 border-stone-200', label: 'Utløpt' },
  refunded: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Refundert' },
};

export default function BookingLookup({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = use(params);
  const [booking, setBooking] = useState<BookingWithSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/lookup?token=${qrToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booking) setBooking(data.booking);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [qrToken]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
          </div>
        </Container>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center mb-4 text-2xl">
              🔍
            </div>
            <h1 className="text-xl font-bold mb-2">Booking ikke funnet</h1>
            <p className="text-stone-400 text-sm">Ugyldig eller utløpt QR-kode.</p>
          </div>
        </Container>
      </div>
    );
  }

  const slot = booking.slot;
  const status = statusConfig[booking.status] || statusConfig.expired;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        {/* Status banner */}
        <div className={`rounded-2xl p-4 border mb-6 flex items-center gap-3 ${status.bg}`}>
          <div className={`w-3 h-3 rounded-full ${booking.status === 'confirmed' ? 'bg-green-500' : 'bg-stone-400'}`} />
          <span className={`font-semibold text-sm ${status.color}`}>{status.label}</span>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-lg">
              🧖
            </div>
            <div>
              <div className="font-semibold">{slot.sauna.name}</div>
              <div className="text-xs text-stone-400 capitalize">{formatDateNorwegian(slot.date)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Tid</div>
              <div className="text-sm font-semibold">{formatHourRange(slot.hour)}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Type</div>
              <div className="text-sm font-semibold">{booking.booking_type === 'private' ? 'Privat' : 'Felles'}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Antall</div>
              <div className="text-sm font-semibold">{booking.num_people} pers.</div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-100">
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Navn</span>
              <span className="font-medium">{booking.customer_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-sm">Pris</span>
              <span className="font-bold text-lg">{formatPriceNOK(booking.price_nok)}</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
