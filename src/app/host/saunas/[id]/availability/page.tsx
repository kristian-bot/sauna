'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HostShell } from '@/components/host/HostShell';
import { WeeklyScheduler } from '@/components/host/WeeklyScheduler';

export default function AvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const saunaId = parseInt(id);
  const [initialSchedule, setInitialSchedule] = useState<Record<number, number[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/host/saunas/${saunaId}/availability`)
      .then(r => r.json())
      .then(data => {
        setInitialSchedule(data.schedule || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Kunne ikke hente tilgjengelighet');
        setLoading(false);
      });
  }, [saunaId]);

  async function handleSave(schedule: Record<number, number[]>) {
    const res = await fetch(`/api/host/saunas/${saunaId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule }),
    });
    if (!res.ok) {
      throw new Error('Kunne ikke lagre');
    }
  }

  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-2">Tilgjengelighet</h1>
      <p className="text-sm text-stone-500 mb-6">Velg hvilke timer badstuen er tilgjengelig for booking.</p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <WeeklyScheduler
          saunaId={saunaId}
          initialSchedule={initialSchedule || {}}
          onSave={handleSave}
        />
      )}
    </HostShell>
  );
}
