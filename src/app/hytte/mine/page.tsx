'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HytteShell } from '@/components/hytte/HytteShell';
import { BookingList } from '@/components/hytte/BookingList';

export default function MinePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadBookings = useCallback(async () => {
    const res = await fetch('/api/hytte/bookings?mine=true');
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/hytte');
        return;
      }

      const memberRes = await supabase
        .from('family_members')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setIsAdmin(memberRes.data?.is_admin || false);
      await loadBookings();
      setLoading(false);
    }
    load();
  }, [router, loadBookings]);

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
      <HytteShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-400">Laster...</div>
        </div>
      </HytteShell>
    );
  }

  return (
    <HytteShell isAdmin={isAdmin}>
      <h1 className="text-2xl font-bold mb-6">Mine bookinger</h1>
      <BookingList
        bookings={bookings}
        onAction={handleAction}
        actionLoading={actionLoading}
        actions={['cancel']}
      />
    </HytteShell>
  );
}
