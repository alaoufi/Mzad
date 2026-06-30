// سجلّ النصوص الظاهرة للزائر والتاجر — قابلة للتعديل من الإدارة (تُخزَّن بمفتاح txt_<key>)
export interface SiteText { key: string; label: string; def: string; multiline?: boolean }

export const SITE_TEXTS: SiteText[] = [
  { key: 'sellWarning', label: 'تحذير الشراء (أسفل الوصف)', def: 'لا تشتري حتى ترى بعينك أو من تثق به' },
  { key: 'sellDescPlaceholder', label: 'تلميح حقل الوصف', def: 'اكتب ما تعرفه من مميزاتها', multiline: true },
  { key: 'sellDefectsTitle', label: 'عنوان حقل العيوب', def: 'عيوب لم تُذكر أعلاه' },
  { key: 'sellDefectsPlaceholder', label: 'تلميح حقل العيوب', def: 'اذكر أي عيب أو ملاحظة لم تظهر في الخيارات (اختياري)', multiline: true },
  { key: 'sellHealthHint', label: 'تلميح قسم الصحة', def: 'إفصاح صادق يرفع ثقتك.' },
  { key: 'sellLocationHint', label: 'تلميح الموقع', def: 'حدّد موقعك بدقّة ليصل المشترون إليك — أو أدخل المدينة يدوياً.', multiline: true },
  { key: 'interestSubtitle', label: 'وصف منتقي الاهتمامات', def: 'اختر ما تحب متابعته — نوعاً أو لوناً أو سلالة. تظهر لك اهتماماتك فقط في كل المنصة.', multiline: true },
  { key: 'homeEmpty', label: 'رسالة لا توجد نتائج (الرئيسية)', def: 'كن أوّل من يضيف هنا، أو جرّب تصنيفاً آخر.', multiline: true },
  { key: 'trust1', label: 'شارة الثقة 1', def: 'بائعون موثّقون' },
  { key: 'trust2', label: 'شارة الثقة 2', def: 'تفاوض مباشر' },
  { key: 'trust3', label: 'شارة الثقة 3', def: 'حماية النزاعات' },
  { key: 'trust4', label: 'شارة الثقة 4', def: 'مراسلات خاصة' },
  { key: 'chatPrivateNote', label: 'تنويه المراسلة الخاصة', def: 'هنا ترسل جوالك أو رقم حسابك لإتمام التحويل.', multiline: true },
];

export const TEXT_DEFAULTS: Record<string, string> = Object.fromEntries(SITE_TEXTS.map((t) => [t.key, t.def]));

// يبني خريطة النصوص من إعدادات AppSetting (مفاتيح txt_*) مع الرجوع للافتراضي
export function buildTexts(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of SITE_TEXTS) {
    const v = map['txt_' + t.key];
    out[t.key] = v && String(v).trim() ? String(v) : t.def;
  }
  return out;
}
