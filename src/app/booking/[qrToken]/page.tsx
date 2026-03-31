'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK } from '@/lib/pricing';
import type { BookingWithSlot } from '@/lib/types';

export default function BookingLookup({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = use(params);
  const [booking, setBooking] = useState<BookingWithSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/lookup?token=${qrToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booking) {
          setBooking(data.booking);
        } else {
          setNotFound(true);
        }
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
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
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
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">Booking ikke funnet</h1>
            <p className="text-stone-500">Ugyldig eller utløpt QR-kode.</p>
          </div>
        </Container>
      </div>
    );
  }

  const slot = booking.slot;
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-stone-100 text-stone-600',
    refunded: 'bg-blue-100 text-blue-800',
  };
  const statusLabels: Record<string, string> = {
    confirmed: 'Bekreftet',
    pending_payment: 'Venter på betaling',
    cancelled: 'Kansellert',
    expired: 'Utløpt',
    refunded: 'Refundert',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-6">Bookingdetaljer</h1>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{slot.sauna.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status] || 'bg-stone-100'}`}>
                {statusLabels[booking.status] || booking.status}
              </span>
            </div>

            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-stone-500">Dato</dt>
                <dd className="font-medium capitalize">{formatDateNorwegian(slot.date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Tid</dt>
                <dd className="font-medium">{formatHourRange(slot.hour)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Type</dt>
                <dd className="font-medium">{booking.booking_type === 'private' ? 'Privat' : 'Felles'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Antall</dt>
                <dd className="font-medium">{booking.num_people} {booking.num_people === 1 ? 'person' : 'personer'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Navn</dt>
                <dd className="font-medium">{booking.customer_name}</dd>
              </div>
              <hr className="border-stone-100" />
              <div className="flex justify-between text-lg">
                <dt className="font-semibold">Pris</dt>
                <dd className="font-bold">{formatPriceNOK(booking.price_nok)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Container>
    </div>
  );
}
