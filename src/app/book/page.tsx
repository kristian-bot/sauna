'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { SaunaGrid } from '@/components/booking/SaunaGrid';
import { DatePicker } from '@/components/booking/DatePicker';
import type { Sauna } from '@/lib/types';

export default function BookStep1() {
  const router = useRouter();
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSauna, setSelectedSauna] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/saunas')
      .then((r) => r.json())
      .then((data) => {
        setSaunas(data.saunas || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const canContinue = selectedSauna && selectedDate;

  function handleNext() {
    if (canContinue) {
      router.push(`/book/${selectedSauna}/${selectedDate}`);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container className="pb-28 sm:pb-8">
        <StepIndicator currentStep={1} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand)] mb-3">Velg badstu</h2>
              <SaunaGrid
                saunas={saunas}
                selectedId={selectedSauna}
                onSelect={setSelectedSauna}
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand)] mb-3">Velg dato</h2>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </div>

            {/* Desktop button */}
            <button
              onClick={handleNext}
              disabled={!canContinue}
              className="hidden sm:flex w-full bg-[var(--color-accent)] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed items-center justify-center gap-2"
            >
              Velg tid
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </Container>

      {/* Sticky mobile bottom bar */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 sm:hidden safe-pb">
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className="w-full bg-[var(--color-accent)] text-white py-4 rounded-2xl font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Velg tid
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
