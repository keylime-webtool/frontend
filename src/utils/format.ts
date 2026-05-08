import type { DateFormat, TimeFormat } from '@/store/visualizationStore';

function formatDatePart(date: Date, format: DateFormat, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  switch (format) {
    case 'YYYY/MM/DD': return `${y}/${m}/${d}`;
    case 'DD/MM/YYYY': return `${d}/${m}/${y}`;
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
    case 'YYYY-MM-DD': return `${y}-${m}-${d}`;
    case 'DD-MM-YYYY': return `${d}-${m}-${y}`;
    case 'MM-DD-YYYY': return `${m}-${d}-${y}`;
  }
}

export function formatTimestamp(
  value: string | number | Date | null | undefined,
  timezone: string,
  dateFormat?: DateFormat,
  timeFormat?: TimeFormat,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (value == null) return '--';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  if (options) {
    const hour12 = (timeFormat ?? '24h') === '12h';
    return date.toLocaleString(undefined, { timeZone: timezone, hour12, ...options });
  }
  const datePart = formatDatePart(date, dateFormat ?? 'DD-MM-YYYY', timezone);
  const hour12 = (timeFormat ?? '24h') === '12h';
  const timePart = date.toLocaleTimeString(undefined, {
    timeZone: timezone,
    hour12,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}
