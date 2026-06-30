// إعدادات الإعلانات المبوبة: المواضع، الباقات، الدول

export interface Placement { key: string; label: string; where: string }
export const AD_PLACEMENTS: Placement[] = [
  { key: 'HOME_TOP', label: 'أعلى الرئيسية', where: 'يظهر فوق قوائم الرئيسية' },
  { key: 'HOME_MID', label: 'وسط الرئيسية', where: 'بين نتائج الرئيسية' },
  { key: 'LISTING_DETAIL', label: 'صفحة الإعلان', where: 'داخل صفحة تفاصيل الإعلان' },
  { key: 'SUPPLIES_TOP', label: 'أعلى المستلزمات', where: 'فوق سوق المستلزمات' },
  { key: 'MARKET_TOP', label: 'أعلى السوق', where: 'فوق قوائم المزادات/العروض' },
];
export const placementLabel = (k: string) => AD_PLACEMENTS.find((p) => p.key === k)?.label ?? k;

export interface AdPackage { key: string; label: string; days: number; maxImpressions: number; priceHalalas: number }
// الباقة تنتهي عند انتهاء المدة أو بلوغ سقف المشاهدات — أيهما أوّل
export const AD_PACKAGES: AdPackage[] = [
  { key: 'try_3d', label: 'تجربة · 3 أيام · 3,000 مشاهدة', days: 3, maxImpressions: 3000, priceHalalas: 3000_00 },
  { key: 'wk_10k', label: 'أسبوع · 10,000 مشاهدة', days: 7, maxImpressions: 10000, priceHalalas: 9000_00 },
  { key: 'mo_50k', label: 'شهر · 50,000 مشاهدة', days: 30, maxImpressions: 50000, priceHalalas: 30000_00 },
  { key: 'mo_150k', label: 'شهر · 150,000 مشاهدة (مميّزة)', days: 30, maxImpressions: 150000, priceHalalas: 70000_00 },
];
export const packageByKey = (k?: string | null) => AD_PACKAGES.find((p) => p.key === k);
export const riyals = (halalas?: number | null) => ((halalas ?? 0) / 100).toLocaleString('ar-SA');

// دول الخليج + شائعة (الكود ISO-2)
export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'SA', name: 'السعودية' }, { code: 'AE', name: 'الإمارات' }, { code: 'KW', name: 'الكويت' },
  { code: 'QA', name: 'قطر' }, { code: 'BH', name: 'البحرين' }, { code: 'OM', name: 'عُمان' },
  { code: 'JO', name: 'الأردن' }, { code: 'EG', name: 'مصر' }, { code: 'IQ', name: 'العراق' },
  { code: 'YE', name: 'اليمن' }, { code: 'SD', name: 'السودان' },
];
export const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;

// مناطق المملكة للاستهداف — تُطابَق برمز المنطقة الرسمي (x-vercel-ip-country-region)
// أو باسم مدينة الزائر اللاتيني (x-vercel-ip-city). code = رمز ISO 3166-2، lat/lng = مركز تقريبي (لأقرب منطقة عبر GPS).
export const REGIONS: { key: string; name: string; code?: string; aliases: string[]; lat: number; lng: number }[] = [
  { key: 'riyadh', name: 'الرياض', code: '01', aliases: ['riyadh', 'riad'], lat: 24.71, lng: 46.68 },
  { key: 'makkah', name: 'منطقة مكة المكرمة', code: '02', aliases: ['mecca', 'makkah'], lat: 21.39, lng: 39.86 },
  { key: 'jeddah', name: 'جدة', aliases: ['jeddah', 'jiddah', 'jed'], lat: 21.49, lng: 39.19 },
  { key: 'taif', name: 'الطائف', aliases: ['taif'], lat: 21.27, lng: 40.42 },
  { key: 'madinah', name: 'المدينة المنورة', code: '03', aliases: ['medina', 'madinah'], lat: 24.47, lng: 39.61 },
  { key: 'qassim', name: 'القصيم', code: '05', aliases: ['buraydah', 'buraidah', 'qassim', 'unayzah', 'unaizah'], lat: 26.33, lng: 43.97 },
  { key: 'eastern', name: 'المنطقة الشرقية', code: '04', aliases: ['dammam', 'khobar', 'dhahran', 'hofuf', 'hafuf', 'ahsa', 'jubail', 'qatif'], lat: 26.43, lng: 50.10 },
  { key: 'asir', name: 'عسير', code: '14', aliases: ['abha', 'khamis'], lat: 18.22, lng: 42.51 },
  { key: 'tabuk', name: 'تبوك', code: '07', aliases: ['tabuk'], lat: 28.38, lng: 36.57 },
  { key: 'hail', name: 'حائل', code: '06', aliases: ['hail', "ha'il"], lat: 27.52, lng: 41.69 },
  { key: 'jazan', name: 'جازان', code: '09', aliases: ['jazan', 'jizan'], lat: 16.89, lng: 42.57 },
  { key: 'najran', name: 'نجران', code: '10', aliases: ['najran'], lat: 17.49, lng: 44.13 },
  { key: 'northern', name: 'الحدود الشمالية', code: '08', aliases: ['arar'], lat: 30.98, lng: 41.04 },
  { key: 'jawf', name: 'الجوف', code: '12', aliases: ['sakaka', 'jawf', 'jouf'], lat: 29.97, lng: 40.21 },
  { key: 'bahah', name: 'الباحة', code: '11', aliases: ['bahah', 'baha'], lat: 20.01, lng: 41.47 },
];
export const regionName = (key: string) => REGIONS.find((r) => r.key === key)?.name ?? key;

// أقرب منطقة لإحداثيات GPS (حساب محلي بلا خدمة خارجية) — تُعيد المفتاح أو null إن بعُدت
export function nearestRegion(lat: number, lng: number): string | null {
  const dist = (aLat: number, aLng: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(aLat - lat), dLng = toRad(aLng - lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(aLat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); // كم
  };
  let best: string | null = null, bestD = Infinity;
  for (const r of REGIONS) { const d = dist(r.lat, r.lng); if (d < bestD) { bestD = d; best = r.key; } }
  return bestD <= 350 ? best : null; // خارج نطاق المملكة تقريباً
}

// مدينة ورمز تمثيليان لمفتاح منطقة (لإعادة استخدام نفس منطق المطابقة مع موقع GPS)
export function regionCityCode(key: string): { city: string; code: string } {
  const r = REGIONS.find((x) => x.key === key);
  return { city: r?.aliases[0] ?? '', code: r?.code ?? '' };
}

// طبّع رمز المنطقة القادم من الترويسة (قد يأتي "01" أو "SA-01" أو "SA01")
function normRegionCode(v: string): string {
  return (v || '').toUpperCase().replace(/^SA-?/, '').trim();
}

// هل يطابق الزائر أياً من المناطق المستهدفة؟ (رمز المنطقة أولاً ثم اسم المدينة)
export function regionMatches(targetRegionsCsv: string | null | undefined, city: string, regionCode = ''): boolean {
  const keys = (targetRegionsCsv || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!keys.length) return true;                 // بلا استهداف منطقة = كل المناطق
  if (!city && !regionCode) return true;         // لا نعرف الموقع = لا نُقصِي
  const c = (city || '').toLowerCase();
  const rc = normRegionCode(regionCode);
  return keys.some((key) => {
    const r = REGIONS.find((x) => x.key === key);
    if (!r) return c.includes(key.toLowerCase());
    if (r.code && rc && rc === r.code) return true;
    return r.aliases.some((al) => c.includes(al));
  });
}
