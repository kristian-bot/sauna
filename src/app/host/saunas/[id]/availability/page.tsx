'use client';

import { useParams } from 'next/navigation';
import { HostShell } from '@/components/host/HostShell';
import { AvailabilityCalendar } from '@/components/host/AvailabilityCalendar';

export default function AvailabilityPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-8">Tilgjengelighet</h1>
      <AvailabilityCalendar saunaId={parseInt(id)} />
    </HostShell>
  );
}
