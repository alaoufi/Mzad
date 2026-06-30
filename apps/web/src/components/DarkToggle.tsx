'use client';

import { useEffect, useState } from 'react';

export function DarkToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  const toggle = () => {
    const n = !dark;
    setDark(n);
    document.documentElement.classList.toggle('dark', n);
    try { localStorage.setItem('mzad_dark', n ? '1' : '0'); } catch {}
  };
  return (
    <button onClick={toggle} aria-label="الوضع الليلي/النهاري" title="الوضع الليلي"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl ring-1 ring-white/20 hover:bg-white/25">
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
