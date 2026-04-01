'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HostShell } from '@/components/host/HostShell';
import { SaunaForm } from '@/components/host/SaunaForm';
import type { Sauna } from '@/lib/types';

export default function EditSauna() {
  const { id } = useParams<{ id: string }>();
  const [sauna, setSauna] = useState<Sauna | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/host/saunas')
      .then(r => r.json())
      .then(data => {
        const found = (data.saunas || []).find((s: Sauna) => s.id === parseInt(id));
        setSauna(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-8">Rediger badstu</h1>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : sauna ? (
        <SaunaForm saunaId={sauna.id} initialData={sauna} />
      ) : (
        <p className="text-stone-500">Badstu ikke funnet.</p>
      )}
    </HostShell>
  );
}
