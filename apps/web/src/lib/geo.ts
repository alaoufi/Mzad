'use client';

import { nearestRegion } from './ads';

const KEY = 'mzad_region';

export function storedRegion(): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
}
export function clearRegion() { try { localStorage.removeItem(KEY); } catch {} }

// يلتقط إحداثيات GPS الخام (بإذن الزائر) — للموقع الدقيق في الإعلانات
export function getCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  });
}

// يطلب إذن الموقع (آمن) ويحسب أقرب منطقة محلياً (خصوصية تامة) ويخزّن المفتاح
export function detectRegionViaGPS(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const key = nearestRegion(pos.coords.latitude, pos.coords.longitude);
        if (key) { try { localStorage.setItem(KEY, key); } catch {} }
        resolve(key);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 },
    );
  });
}
