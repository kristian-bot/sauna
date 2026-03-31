const TIMEZONE = 'Europe/Oslo';

export function nowOslo(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

export function formatDateNorwegian(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function formatHourRange(hour: number): string {
  return `${formatHour(hour)} – ${formatHour(hour + 1)}`;
}

export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00');
  return date.getDay(); // 0 = Sunday
}

export function todayDateString(): string {
  const now = nowOslo();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateInPast(dateStr: string): boolean {
  return dateStr < todayDateString();
}

export function isSlotInPast(dateStr: string, hour: number): boolean {
  const now = nowOslo();
  const today = todayDateString();
  if (dateStr > today) return false;
  if (dateStr < today) return true;
  return hour <= now.getHours();
}
