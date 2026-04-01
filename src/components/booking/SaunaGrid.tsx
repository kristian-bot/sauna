'use client';

import type { Sauna } from '@/lib/types';

interface SaunaGridProps {
  saunas: Sauna[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function SaunaGrid({ saunas, selectedId, onSelect }: SaunaGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
      {saunas.map((sauna) => {
        const isSelected = selectedId === sauna.id;
        return (
          <button
            key={sauna.id}
            onClick={() => onSelect(sauna.id)}
            className={`relative p-3 sm:p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.97] ${
              isSelected
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-md'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="text-2xl mb-1">🧖</div>
            <h3 className="font-semibold text-sm sm:text-base">{sauna.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Maks {sauna.capacity}
            </p>
          </button>
        );
      })}
    </div>
  );
}
