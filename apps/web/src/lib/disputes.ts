// أنواع الشكاوى والمطلوب منها — لتوحيد جمع البيانات وعرضها على الإدارة/الجهات المختصة
export const DISPUTE_CATEGORIES = [
  { key: 'NOT_AS_DESCRIBED', label: 'عدم مطابقة المواشي للوصف', emoji: '📝' },
  { key: 'CANCEL_AFTER_DEAL', label: 'إلغاء الصفقة بعد الاتفاق', emoji: '↩️' },
  { key: 'NOT_PAID', label: 'عدم السداد', emoji: '💸' },
  { key: 'LATE_PAYMENT', label: 'تأخّر السداد', emoji: '⏰' },
  { key: 'HIDDEN_DEFECT', label: 'عيوب مخفية', emoji: '🩹' },
  { key: 'AUCTION_MANIPULATION', label: 'التلاعب في المزاد', emoji: '🎭' },
  { key: 'IMPERSONATION', label: 'انتحال شخصية', emoji: '🕵️' },
  { key: 'PLATFORM_ABUSE', label: 'إساءة استخدام المنصة', emoji: '🚫' },
  { key: 'MISLEADING', label: 'محتوى أو إعلان مضلّل', emoji: '⚠️' },
  { key: 'DEPOSIT_DISPUTE', label: 'نزاع على العربون', emoji: '🪙' },
  { key: 'DELIVERY_DISPUTE', label: 'نزاع على الاستلام أو التسليم', emoji: '📦' },
  { key: 'HEALTH', label: 'مشكلة صحية في الحيوان', emoji: '🩺' },
  { key: 'OTHER', label: 'أخرى', emoji: '❓' },
];

// طرق الدفع — لتوثيق الصفقة
export const PAYMENT_METHODS = [
  { key: 'CASH', label: 'نقداً' },
  { key: 'BANK_TRANSFER', label: 'تحويل بنكي' },
  { key: 'STC_PAY', label: 'محفظة إلكترونية (STC Pay…)' },
  { key: 'PLATFORM', label: 'عبر المنصة' },
  { key: 'NONE', label: 'لم يتم الدفع بعد' },
  { key: 'OTHER', label: 'أخرى' },
];
export const paymentLabel = (k?: string | null) => PAYMENT_METHODS.find((p) => p.key === k)?.label ?? (k || '—');

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
