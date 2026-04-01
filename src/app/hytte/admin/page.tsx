'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HytteShell } from '@/components/hytte/HytteShell';
import { BookingList } from '@/components/hytte/BookingList';

export default function AdminPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadBookings = useCallback(async () => {
    const url = filter === 'pending'
      ? '/api/hytte/bookings?status=pending'
      : '/api/hytte/bookings';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
    }
  }, [filter]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/hytte');
        return;
      }

      // Verify admin
      const { data: member } = await supabase
        .from('family_members')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!member?.is_admin) {
        router.push('/hytte/kalender');
        return;
      }

      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      loadBookings();
    }
  }, [loading, loadBookings]);

  async function handleAction(id: number, action: 'confirmed' | 'rejected' | 'cancelled') {
    setActionLoading(id);
    const res = await fetch(`/api/hytte/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    });

    if (res.ok) {
      await loadBookings();
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <HytteShell isAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-400">Laster...</div>
        </div>
      </HytteShell>
    );
  }

  return (
    <HytteShell isAdmin>
      <h1 className="text-2xl font-bold mb-6">Godkjenning</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-[var(--color-brand)] text-white'
              : 'bg-white border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Ventende
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[var(--color-brand)] text-white'
              : 'bg-white border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Alle
        </button>
      </div>

      <BookingList
        bookings={bookings}
        showMember
        onAction={handleAction}
        actionLoading={actionLoading}
        actions={['confirm', 'reject']}
      />
    </HytteShell>
  );
}
