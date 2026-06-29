'use client';

import { useEffect, useState } from 'react';

export function Countdown({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = useState(() => diff(endAt));

  useEffect(() => {
    const t = setInterval(() => setRemaining(diff(endAt)), 1000);
    return () => clearInterval(t);
  }, [endAt]);

  if (remaining <= 0) {
    return <span className="font-bold text-red-600">انتهى المزاد</span>;
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const urgent = remaining < 120;

  return (
    <span className={`font-bold tabular-nums ${urgent ? 'text-red-600 animate-pulse' : 'text-brand-dark'}`}>
      {h > 0 ? `${h} س ` : ''}
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function diff(endAt: string): number {
  return Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1000));
}
