'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HytteShell } from '@/components/hytte/HytteShell';
import { CabinCalendar } from '@/components/hytte/CabinCalendar';

export default function KalenderPage() {
  const router = useRouter();
  const [cabins, setCabins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/hytte');
        return;
      }

      const [cabinsRes, bookingsRes, memberRes] = await Promise.all([
        fetch('/api/hytte/cabins'),
        fetch('/api/hytte/bookings'),
        supabase.from('family_members').select('is_admin').eq('id', user.id).single(),
      ]);

      if (!cabinsRes.ok || !bookingsRes.ok) {
        router.push('/hytte');
        return;
      }

      const cabinsData = await cabinsRes.json();
      const bookingsData = await bookingsRes.json();
      setCabins(cabinsData.cabins || []);
      setBookings(bookingsData.bookings || []);
      setIsAdmin(memberRes.data?.is_admin || false);
      setLoading(false);
    }
    load();
  }, [router]);

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
      <h1 className="text-2xl font-bold mb-6">Kalender</h1>
      <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200 shadow-sm">
        <CabinCalendar cabins={cabins} bookings={bookings} />
      </div>
    </HytteShell>
  );
}
