'use client';

import { REGION_NAMES, citiesOf, regionOfCity } from '@/lib/saudi-regions';

// منتقي المنطقة والمدينة — قائمتان متتاليتان تُستخدمان في كل مكان
export function RegionCityPicker({
  region, city, onChange, required, className = '',
}: {
  region?: string | null; city?: string | null;
  onChange: (region: string, city: string) => void;
  required?: boolean; className?: string;
}) {
  // استنتاج المنطقة من المدينة إن لم تُمرَّر
  const reg = region || regionOfCity(city) || '';
  const cities = citiesOf(reg);
  return (
    <div dir="rtl" className={`grid grid-cols-2 gap-3 ${className}`}>
      <select className="input" value={reg} onChange={(e) => onChange(e.target.value, '')}>
        <option value="">اختر المنطقة{required ? ' *' : ''}</option>
        {REGION_NAMES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select className="input disabled:opacity-60" value={city || ''} disabled={!reg} onChange={(e) => onChange(reg, e.target.value)}>
        <option value="">{reg ? `اختر المدينة${required ? ' *' : ''}` : 'اختر المنطقة أولاً'}</option>
        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
