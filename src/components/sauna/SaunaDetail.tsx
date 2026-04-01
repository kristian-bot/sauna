'use client';

import Link from 'next/link';
import { formatPriceNOK } from '@/lib/pricing';
import type { SaunaWithHost, Event } from '@/lib/types';
import { EventCard } from './EventCard';

interface SaunaDetailProps {
  sauna: SaunaWithHost;
  events: Event[];
}

export function SaunaDetail({ sauna, events }: SaunaDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-brand)] mb-2">
          {sauna.name}
        </h1>
        <p className="text-stone-500 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sauna.address}, {sauna.city}
        </p>
      </div>

      {/* Image gallery placeholder */}
      <div className="bg-[var(--color-warm)] rounded-2xl h-48 sm:h-64 flex items-center justify-center text-6xl">
        🧖
      </div>

      {/* Description */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-brand)] mb-2">Om badstuen</h2>
        <p className="text-stone-600 leading-relaxed">{sauna.description}</p>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-xs text-stone-400 mb-1">Kapasitet</p>
          <p className="font-semibold">{sauna.max_people || sauna.capacity} pers.</p>
        </div>
        {sauna.private_price_oere && (
          <div className="bg-white rounded-xl p-4 border border-stone-100">
            <p className="text-xs text-stone-400 mb-1">Privat</p>
            <p className="font-semibold">{formatPriceNOK(sauna.private_price_oere)}/time</p>
          </div>
        )}
        {sauna.shared_price_per_person_oere && (
          <div className="bg-white rounded-xl p-4 border border-stone-100">
            <p className="text-xs text-stone-400 mb-1">Felles</p>
            <p className="font-semibold">{formatPriceNOK(sauna.shared_price_per_person_oere)}/pers</p>
          </div>
        )}
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-xs text-stone-400 mb-1">Min. personer</p>
          <p className="font-semibold">{sauna.min_people} pers.</p>
        </div>
      </div>

      {/* Host info */}
      {sauna.host && (
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <h2 className="text-lg font-semibold text-[var(--color-brand)] mb-3">Din host</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-xl font-bold text-[var(--color-accent)]">
              {sauna.host.name[0]}
            </div>
            <div>
              <p className="font-semibold">{sauna.host.name}</p>
              {sauna.host.bio && <p className="text-sm text-stone-500 mt-0.5">{sauna.host.bio}</p>}
              {sauna.host.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] mt-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verifisert host
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {events.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-brand)] mb-4">Kommende events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} saunaSlug={sauna.slug!} />
            ))}
          </div>
        </div>
      )}

      {/* Book button */}
      <Link
        href={`/sauna/${sauna.slug}/book`}
        className="block w-full text-center bg-[var(--color-accent)] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[var(--color-accent)]/90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--color-accent)]/20"
      >
        Book denne badstuen
      </Link>
    </div>
  );
}
