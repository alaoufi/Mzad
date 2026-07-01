// أنواع الشكاوى والمطلوب منها — لتوحيد جمع البيانات وعرضها على الإدارة/الجهات المختصة
export const DISPUTE_CATEGORIES = [
  { key: 'NOT_AS_DESCRIBED', label: 'مخالفة الوصف للواقع', emoji: '📝' },
  { key: 'HIDDEN_DEFECT', label: 'عيب مخفي لم يُذكر', emoji: '🩹' },
  { key: 'NOT_DELIVERED', label: 'عدم استلام المبيع', emoji: '📦' },
  { key: 'NOT_PAID', label: 'عدم دفع المشتري', emoji: '💸' },
  { key: 'FRAUD', label: 'احتيال أو نصب', emoji: '🚨' },
  { key: 'PRICE_DISPUTE', label: 'خلاف على السعر أو العمولة', emoji: '💰' },
  { key: 'HEALTH', label: 'مشكلة صحية في الحيوان', emoji: '🩺' },
  { key: 'OTHER', label: 'أخرى', emoji: '⚠️' },
];

export const DISPUTE_DESIRES = [
  { key: 'REFUND', label: 'استرجاع المبلغ' },
  { key: 'REPLACE', label: 'استبدال' },
  { key: 'COMPENSATION', label: 'تعويض' },
  { key: 'CANCEL', label: 'إلغاء الصفقة' },
  { key: 'COMPLETE', label: 'إتمام الصفقة' },
  { key: 'OTHER', label: 'أخرى' },
];

export const disputeCatLabel = (k?: string | null) => DISPUTE_CATEGORIES.find((c) => c.key === k)?.label ?? (k || '—');
export const disputeCatEmoji = (k?: string | null) => DISPUTE_CATEGORIES.find((c) => c.key === k)?.emoji ?? '⚠️';
export const disputeDesireLabel = (k?: string | null) => DISPUTE_DESIRES.find((c) => c.key === k)?.label ?? (k || '—');

export const DISPUTE_STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'مفتوح', cls: 'bg-amber-100 text-amber-700' },
  REVIEWING: { label: 'قيد المراجعة', cls: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'محلول', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'مرفوض', cls: 'bg-gray-200 text-gray-600' },
};
