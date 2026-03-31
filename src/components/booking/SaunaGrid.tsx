'use client';

import type { Sauna } from '@/lib/types';

interface SaunaGridProps {
  saunas: Sauna[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function SaunaGrid({ saunas, selectedId, onSelect }: SaunaGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {saunas.map((sauna) => (
        <button
          key={sauna.id}
          onClick={() => onSelect(sauna.id)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            selectedId === sauna.id
              ? 'border-[var(--color-brand)] bg-[var(--color-warm)] shadow-md'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
          }`}
        >
          <h3 className="font-semibold text-lg">{sauna.name}</h3>
          <p className="text-sm text-stone-500 mt-1">
            Kapasitet: {sauna.capacity} personer
          </p>
        </button>
      ))}
    </div>
  );
}
