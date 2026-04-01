'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HostShell } from '@/components/host/HostShell';
import { formatPriceNOK } from '@/lib/pricing';
import type { Sauna } from '@/lib/types';

export default function HostSaunas() {
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/host/saunas')
      .then(r => r.json())
      .then(data => { setSaunas(data.saunas || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <HostShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mine badstuer</h1>
        <Link
          href="/host/saunas/new"
          className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-all"
        >
          + Ny badstu
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : saunas.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <p className="text-lg mb-2">Ingen badstuer ennå</p>
          <p className="text-sm">Klikk &quot;+ Ny badstu&quot; for å komme i gang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saunas.map(sauna => (
            <div key={sauna.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="relative h-32 bg-[var(--color-warm)]">
                {sauna.image_urls && sauna.image_urls.length > 0 ? (
                  <Image
                    src={sauna.image_urls[0]}
                    alt={sauna.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-4xl">🧖</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[var(--color-brand)] mb-1">{sauna.name}</h3>
                <p className="text-xs text-stone-400 mb-3">{sauna.city} &middot; Maks {sauna.max_people || sauna.capacity} pers.</p>
                <div className="flex gap-2 text-xs mb-3">
                  {sauna.private_price_oere && (
                    <span className="bg-[var(--color-accent-light)] text-[var(--color-accent)] px-2 py-0.5 rounded-full">
                      Privat: {formatPriceNOK(sauna.private_price_oere)}
                    </span>
                  )}
                  {sauna.shared_price_per_person_oere && (
                    <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      Felles: {formatPriceNOK(sauna.shared_price_per_person_oere)}/pers
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/host/saunas/${sauna.id}/edit`} className="flex-1 text-center text-xs py-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
                    Rediger
                  </Link>
                  <Link href={`/host/saunas/${sauna.id}/events`} className="flex-1 text-center text-xs py-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
                    Events
                  </Link>
                  <Link href={`/host/saunas/${sauna.id}/availability`} className="flex-1 text-center text-xs py-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
                    Timer
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </HostShell>
  );
}
