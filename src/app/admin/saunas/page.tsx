'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';
import type { Sauna, OpeningHours } from '@/lib/types';

const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

export default function AdminSaunas() {
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [selectedSauna, setSelectedSauna] = useState<Sauna | null>(null);
  const [hours, setHours] = useState<OpeningHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('saunas').select('*').order('id');
      setSaunas(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function selectSauna(sauna: Sauna) {
    setSelectedSauna(sauna);
    const supabase = createClient();
    const { data } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('sauna_id', sauna.id)
      .order('day_of_week');
    setHours(data || []);
  }

  async function toggleActive(sauna: Sauna) {
    const supabase = createClient();
    await supabase.from('saunas').update({ is_active: !sauna.is_active }).eq('id', sauna.id);
    setSaunas(saunas.map((s) => (s.id === sauna.id ? { ...s, is_active: !s.is_active } : s)));
  }

  async function updateHours(hourId: number, field: string, value: number | boolean) {
    const supabase = createClient();
    await supabase.from('opening_hours').update({ [field]: value }).eq('id', hourId);
    setHours(hours.map((h) => (h.id === hourId ? { ...h, [field]: value } : h)));
  }

  async function updateCapacity(saunaId: number, capacity: number) {
    if (capacity < 1) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('saunas').update({ capacity }).eq('id', saunaId);
    setSaunas(saunas.map((s) => (s.id === saunaId ? { ...s, capacity } : s)));
    if (selectedSauna?.id === saunaId) {
      setSelectedSauna({ ...selectedSauna, capacity });
    }
    setSaving(false);
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold mb-8">Badstuer</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sauna list */}
          <div className="space-y-3">
            {saunas.map((sauna) => (
              <div
                key={sauna.id}
                className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all ${
                  selectedSauna?.id === sauna.id
                    ? 'border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
                onClick={() => selectSauna(sauna)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{sauna.name}</h3>
                    <p className="text-sm text-stone-500">Kapasitet: {sauna.capacity}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleActive(sauna); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sauna.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sauna.is_active ? 'Aktiv' : 'Inaktiv'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Opening hours editor */}
          {selectedSauna && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <h2 className="font-semibold text-lg mb-4">{selectedSauna.name}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-1">Kapasitet</label>
                <input
                  type="number"
                  min={1}
                  value={selectedSauna.capacity}
                  onChange={(e) => updateCapacity(selectedSauna.id, parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <h3 className="text-sm font-medium text-stone-700 mb-3">Åpningstider</h3>
              <div className="space-y-3">
                {hours.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="w-20 text-sm">{dayNames[h.day_of_week]}</span>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!h.is_closed}
                        onChange={(e) => updateHours(h.id, 'is_closed', !e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-stone-500">Åpen</span>
                    </label>
                    {!h.is_closed && (
                      <>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={h.open_hour}
                          onChange={(e) => updateHours(h.id, 'open_hour', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-stone-300 rounded text-sm"
                        />
                        <span className="text-stone-400">–</span>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={h.close_hour}
                          onChange={(e) => updateHours(h.id, 'close_hour', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-stone-300 rounded text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
