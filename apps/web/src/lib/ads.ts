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
