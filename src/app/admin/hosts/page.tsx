'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';
import type { Host } from '@/lib/types';

export default function AdminHosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHosts() {
      const supabase = createClient();
      const { data } = await supabase
        .from('hosts')
        .select('*')
        .order('created_at', { ascending: false });
      setHosts(data || []);
      setLoading(false);
    }
    loadHosts();
  }, []);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold mb-8">Hosts</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : hosts.length === 0 ? (
        <p className="text-stone-500">Ingen hosts registrert ennå.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 text-left text-sm text-stone-500">
                <th className="px-4 py-3 font-medium">Navn</th>
                <th className="px-4 py-3 font-medium">E-post</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Opprettet</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map(host => (
                <tr key={host.id} className="border-b border-stone-50 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">
                        {host.name[0]}
                      </div>
                      <span className="text-sm font-medium">{host.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">{host.email}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">{host.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {host.is_verified ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Verifisert</span>
                    ) : (
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">Ikke verifisert</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-400">
                    {new Date(host.created_at).toLocaleDateString('nb-NO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
