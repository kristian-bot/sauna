'use client';

import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';

interface Booking {
  id: number;
  cabin_id: number;
  check_in: string;
  check_out: string;
  status: string;
  note: string | null;
  created_at: string;
  cabins: { name: string; color: string };
  family_members: { name: string; email: string };
}

interface BookingListProps {
  bookings: Booking[];
  showMember?: boolean;
  onAction?: (id: number, action: 'confirmed' | 'rejected' | 'cancelled') => void;
  actionLoading?: number | null;
  actions?: ('confirm' | 'reject' | 'cancel')[];
}

const statusLabels: Record<string, string> = {
  pending: 'Venter',
  confirmed: 'Godkjent',
  rejected: 'Avslått',
  cancelled: 'Kansellert',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-stone-100 text-stone-600',
};

export function BookingList({
  bookings,
  showMember = false,
  onAction,
  actionLoading,
  actions = [],
}: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <p>Ingen bookinger å vise.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: booking.cabins.color }}
              />
              <div>
                <p className="font-medium">{booking.cabins.name}</p>
                <p className="text-sm text-stone-500">
                  {format(parseISO(booking.check_in), 'd. MMM', { locale: nb })} –{' '}
                  {format(parseISO(booking.check_out), 'd. MMM yyyy', { locale: nb })}
                </p>
                {showMember && (
                  <p className="text-sm text-stone-500">{booking.family_members.name}</p>
                )}
                {booking.note && (
                  <p className="text-sm text-stone-400 mt-1 italic">{booking.note}</p>
                )}
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                statusColors[booking.status] || 'bg-stone-100 text-stone-600'
              }`}
            >
              {statusLabels[booking.status] || booking.status}
            </span>
          </div>

          {onAction && actions.length > 0 && booking.status === 'pending' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
              {actions.includes('confirm') && (
                <button
                  onClick={() => onAction(booking.id, 'confirmed')}
                  disabled={actionLoading === booking.id}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Godkjenn
                </button>
              )}
              {actions.includes('reject') && (
                <button
                  onClick={() => onAction(booking.id, 'rejected')}
                  disabled={actionLoading === booking.id}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Avslå
                </button>
              )}
              {actions.includes('cancel') && (
                <button
                  onClick={() => onAction(booking.id, 'cancelled')}
                  disabled={actionLoading === booking.id}
                  className="px-3 py-1.5 text-sm bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                >
                  Kanseller
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
