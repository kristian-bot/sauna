'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { SaunaMap } from '@/components/map/SaunaMap';
import { SearchBar } from '@/components/map/SearchBar';
import { formatPriceNOK } from '@/lib/pricing';
import type { MapSauna } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [saunas, setSaunas] = useState<MapSauna[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaunas = useCallback(async (query?: string, city?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);

    try {
      const res = await fetch(`/api/saunas?${params}`);
      const data = await res.json();
      setSaunas(data.saunas || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSaunas(); }, [fetchSaunas]);

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  function handleSearch(query: string) {
    setSearchQuery(query);
    fetchSaunas(query, cityFilter);
  }

  function handleCityFilter(city: string) {
    setCityFilter(city);
    fetchSaunas(searchQuery, city);
  }

  function handleSaunaClick(sauna: MapSauna) {
    router.push(`/sauna/${sauna.slug}`);
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* Search overlay */}
      <div className="absolute top-[56px] left-0 right-0 z-[1000] px-4 pt-4 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <SearchBar onSearch={handleSearch} onCityFilter={handleCityFilter} />
        </div>
      </div>

      {/* Sauna count badge */}
      <div className="absolute top-[160px] left-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-3 py-1.5 text-xs font-medium text-stone-700">
          {saunas.length} badstuer
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && saunas.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-stone-100">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
          </div>
        ) : (
          <SaunaMap saunas={saunas} onSaunaClick={handleSaunaClick} />
        )}
      </div>

      {/* Mobile bottom list */}
      <div className="sm:hidden bg-white border-t border-stone-200 max-h-[40vh] overflow-y-auto">
        <div className="px-4 py-3 space-y-2">
          {saunas.slice(0, 10).map(sauna => (
            <button
              key={sauna.id}
              onClick={() => router.push(`/sauna/${sauna.slug}`)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-warm)] flex items-center justify-center text-lg shrink-0">
                🧖
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{sauna.name}</p>
                <p className="text-xs text-stone-400">{sauna.city}</p>
              </div>
              <div className="text-right shrink-0">
                {sauna.shared_price_per_person_oere ? (
                  <p className="text-xs font-medium text-[var(--color-accent)]">
                    fra {formatPriceNOK(sauna.shared_price_per_person_oere)}
                  </p>
                ) : sauna.private_price_oere ? (
                  <p className="text-xs font-medium text-[var(--color-accent)]">
                    {formatPriceNOK(sauna.private_price_oere)}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
