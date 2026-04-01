'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCityFilter: (city: string) => void;
}

const CITIES = ['Alle', 'Oslo', 'Bergen', 'Trondheim', 'Tromsø', 'Stavanger', 'Kristiansand', 'Bodø', 'Ålesund', 'Drammen', 'Fredrikstad'];

export function SearchBar({ onSearch, onCityFilter }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [activeCity, setActiveCity] = useState('Alle');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
  }

  function handleCityClick(city: string) {
    setActiveCity(city);
    onCityFilter(city === 'Alle' ? '' : city);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Søk etter badstu eller sted..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white shadow-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-medium hover:bg-[var(--color-accent)]/90 transition-all shadow-sm"
        >
          Søk
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => handleCityClick(city)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCity === city
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
            }`}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
