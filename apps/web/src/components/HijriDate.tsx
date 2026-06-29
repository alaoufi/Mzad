import { formatHijri, formatGregorian, formatDual, formatTime } from '@/lib/dates';

// عرض التاريخ بتقويم أم القرى الهجري والميلادي. الافتراضي سطر واحد مدمج.
export function HijriDate({
  value,
  withTime = false,
  short = false,
  stacked = false,
  className = '',
}: {
  value: string | number | Date;
  withTime?: boolean;
  short?: boolean;
  stacked?: boolean;
  className?: string;
}) {
  if (!value) return null;

  if (stacked) {
    return (
      <span className={className}>
        <span className="block font-bold">{formatHijri(value, short)}</span>
        <span className="block text-gray-400">
          {formatGregorian(value, short)}{withTime ? ` — ${formatTime(value)}` : ''}
        </span>
      </span>
    );
  }

  return (
    <span className={className} title={formatGregorian(value)}>
      {formatDual(value, short)}{withTime ? ` — ${formatTime(value)}` : ''}
    </span>
  );
}
