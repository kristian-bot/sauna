'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';

interface VerifyResult {
  valid: boolean;
  error?: string;
  booking?: {
    id: string;
    customer_name: string;
    booking_type: string;
    num_people: number;
    status: string;
    slot: {
      date: string;
      hour: number;
      sauna: { name: string };
    };
  };
}

export default function AdminScan() {
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setResult(null);

    // Extract token from URL or use directly
    let token = qrInput.trim();
    const match = token.match(/\/booking\/([a-f0-9-]+)/i);
    if (match) token = match[1];

    try {
      const res = await fetch(`/api/admin/bookings/${token}/verify`, { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, error: 'Kunne ikke sjekke QR-kode' });
    }
    setChecking(false);
  }

  return (
    <AdminShell>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-8">QR-skanner</h1>

        <form onSubmit={handleVerify} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              QR-kode eller booking-token
            </label>
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Lim inn URL eller token..."
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={checking || !qrInput.trim()}
            className="bg-[var(--color-brand)] text-white px-6 py-3 rounded-xl font-medium hover:bg-[var(--color-brand-light)] transition-colors disabled:opacity-50"
          >
            {checking ? 'Sjekker...' : 'Verifiser'}
          </button>
        </form>

        {result && (
          <div className={`rounded-xl p-6 border ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h2 className={`text-lg font-bold mb-2 ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
              {result.valid ? 'Gyldig booking' : 'Ugyldig'}
            </h2>

            {result.error && (
              <p className="text-red-700 mb-4">{result.error}</p>
            )}

            {result.booking && (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Navn</dt>
                  <dd className="font-medium">{result.booking.customer_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Badstu</dt>
                  <dd className="font-medium">{result.booking.slot.sauna.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Dato</dt>
                  <dd className="font-medium capitalize">{formatDateNorwegian(result.booking.slot.date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Tid</dt>
                  <dd className="font-medium">{formatHourRange(result.booking.slot.hour)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Type</dt>
                  <dd className="font-medium">
                    {result.booking.booking_type === 'private' ? 'Privat' : `Felles (${result.booking.num_people} pers.)`}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
