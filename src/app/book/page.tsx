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

  function handleNext() {
    if (selectedSauna && selectedDate) {
      router.push(`/book/${selectedSauna}/${selectedDate}`);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <StepIndicator currentStep={1} />
        <h1 className="text-2xl font-bold mb-6">Velg badstu og dato</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium mb-3">Velg badstu</h2>
              <SaunaGrid
                saunas={saunas}
                selectedId={selectedSauna}
                onSelect={setSelectedSauna}
              />
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">Velg dato</h2>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedSauna || !selectedDate}
              className="bg-[var(--color-brand)] text-white px-8 py-3 rounded-xl font-medium hover:bg-[var(--color-brand-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Velg tid →
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
