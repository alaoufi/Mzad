'use client';

import { useEffect, useState } from 'react';

// مخزن بحث بسيط مشترك بين العدسة في الهيدر والصفحة الرئيسية
let term = '';
const listeners = new Set<() => void>();

export function setSearchTerm(t: string) {
  term = t;
  listeners.forEach((l) => l());
}

export function useSearchTerm(): string {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return term;
}
