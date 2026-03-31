import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getDayOfWeek, isSlotInPast } from '@/lib/timezone';
import type { SlotAvailability } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const saunaId = parseInt(id);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Ugyldig dato' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get sauna
  const { data: sauna } = await supabase
    .from('saunas')
    .select('*')
    .eq('id', saunaId)
    .single();

  if (!sauna) {
    return NextResponse.json({ error: 'Badstu ikke funnet' }, { status: 404 });
  }

  // Get opening hours for this day
  const dayOfWeek = getDayOfWeek(date);
  const { data: hours } = await supabase
    .from('opening_hours')
    .select('*')
    .eq('sauna_id', saunaId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!hours || hours.is_closed) {
    return NextResponse.json({ slots: [], sauna_name: sauna.name, closed: true });
  }

  // Get existing slots for this date
  const { data: existingSlots } = await supabase
    .from('slots')
    .select('*')
    .eq('sauna_id', saunaId)
    .eq('date', date);

  const slotMap = new Map((existingSlots || []).map((s) => [s.hour, s]));

  // Build availability for each hour
  const slots: SlotAvailability[] = [];
  for (let h = hours.open_hour; h < hours.close_hour; h++) {
    if (isSlotInPast(date, h)) {
      slots.push({ hour: h, available: false, booking_type: null, spots_left: null, is_full: true });
      continue;
    }

    const existing = slotMap.get(h);
    if (!existing) {
      // No bookings yet — available for any type
      slots.push({ hour: h, available: true, booking_type: null, spots_left: sauna.capacity, is_full: false });
    } else if (existing.is_full) {
      slots.push({
        hour: h,
        available: false,
        booking_type: existing.booking_type,
        spots_left: 0,
        is_full: true,
      });
    } else {
      // Slot exists but not full (shared)
      const spotsLeft = sauna.capacity - existing.current_people;
      slots.push({
        hour: h,
        available: spotsLeft > 0,
        booking_type: existing.booking_type,
        spots_left: spotsLeft,
        is_full: false,
      });
    }
  }

  return NextResponse.json({ slots, sauna_name: sauna.name });
}
