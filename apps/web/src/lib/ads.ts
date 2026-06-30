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
// أو باسم مدينة الزائر اللاتيني (x-vercel-ip-city). code = رمز ISO 3166-2 للمنطقة.
export const REGIONS: { key: string; name: string; code?: string; aliases: string[] }[] = [
  { key: 'riyadh', name: 'الرياض', code: '01', aliases: ['riyadh', 'riad'] },
  { key: 'makkah', name: 'منطقة مكة المكرمة', code: '02', aliases: ['mecca', 'makkah'] },
  { key: 'jeddah', name: 'جدة', aliases: ['jeddah', 'jiddah', 'jed'] },
  { key: 'taif', name: 'الطائف', aliases: ['taif'] },
  { key: 'madinah', name: 'المدينة المنورة', code: '03', aliases: ['medina', 'madinah'] },
  { key: 'qassim', name: 'القصيم', code: '05', aliases: ['buraydah', 'buraidah', 'qassim', 'unayzah', 'unaizah'] },
  { key: 'eastern', name: 'المنطقة الشرقية', code: '04', aliases: ['dammam', 'khobar', 'dhahran', 'hofuf', 'hafuf', 'ahsa', 'jubail', 'qatif'] },
  { key: 'asir', name: 'عسير', code: '14', aliases: ['abha', 'khamis'] },
  { key: 'tabuk', name: 'تبوك', code: '07', aliases: ['tabuk'] },
  { key: 'hail', name: 'حائل', code: '06', aliases: ['hail', "ha'il"] },
  { key: 'jazan', name: 'جازان', code: '09', aliases: ['jazan', 'jizan'] },
  { key: 'najran', name: 'نجران', code: '10', aliases: ['najran'] },
  { key: 'northern', name: 'الحدود الشمالية', code: '08', aliases: ['arar'] },
  { key: 'jawf', name: 'الجوف', code: '12', aliases: ['sakaka', 'jawf', 'jouf'] },
  { key: 'bahah', name: 'الباحة', code: '11', aliases: ['bahah', 'baha'] },
];
export const regionName = (key: string) => REGIONS.find((r) => r.key === key)?.name ?? key;

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
