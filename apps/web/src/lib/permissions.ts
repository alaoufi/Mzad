// نظام الصلاحيات: أقسام الإدارة الأربعة × الأفعال الأربعة (اطلاع/إضافة/تعديل/حذف)
// مصفوفة صلاحيات لكل دور (accountType) — مرجع قويّ وموحّد يُبنى عليه العرض والتحكّم.

export type Section = 'profile' | 'site' | 'listings' | 'market';
export type Action = 'view' | 'add' | 'edit' | 'delete';

export const SECTIONS: { key: Section; label: string; icon: string; desc: string; href: string }[] = [
  { key: 'profile', label: 'الملف الشخصي', icon: '👤', desc: 'بياناتك واهتماماتك وإحصائياتك', href: '/account' },
  { key: 'site', label: 'تجهيزات الموقع', icon: '⚙️', desc: 'الإعدادات والتصنيفات والنصوص والثيمات والتسويق', href: '/admin/site' },
  { key: 'listings', label: 'إدارة الإعلانات', icon: '📋', desc: 'الموافقات والإعلانات وترتيبها', href: '/admin/listings' },
  { key: 'market', label: 'المستخدمون وحركة السوق والنزاعات', icon: '⚖️', desc: 'المستخدمون والإحصائيات والبلاغات وفكّ النزاعات', href: '/admin/market' },
];

export const ACTIONS: { key: Action; label: string }[] = [
  { key: 'view', label: 'اطلاع' },
  { key: 'add', label: 'إضافة' },
  { key: 'edit', label: 'تعديل' },
  { key: 'delete', label: 'حذف' },
];

const ALL: Action[] = ['view', 'add', 'edit', 'delete'];

// مصفوفة الصلاحيات: الدور → القسم → الأفعال المسموحة
export const PERMISSIONS: Record<string, Partial<Record<Section, Action[]>>> = {
  SUPER_ADMIN: { profile: ALL, site: ALL, listings: ALL, market: ALL },
  ADMIN:       { profile: ['view', 'edit'], site: ALL, listings: ALL, market: ALL },
  BROKERS_LEAD:{ profile: ['view', 'edit'], site: ['view'], listings: ['view', 'edit'], market: ['view', 'edit'] },
  BROKER:      { profile: ['view', 'edit'], listings: ['view', 'add', 'edit'], market: ['view'] },
  MARKETER:    { profile: ['view', 'edit'], site: ['view', 'add', 'edit'], listings: ['view'], market: ['view'] },
  MERCHANT:    { profile: ['view', 'edit'], listings: ['view', 'add', 'edit'] },
  SHOPPER:     { profile: ['view', 'edit'] },
  VISITOR:     { profile: ['view'] },
};

export function can(accountType: string | null | undefined, section: Section, action: Action): boolean {
  return !!PERMISSIONS[accountType ?? 'SHOPPER']?.[section]?.includes(action);
}
export function canAny(accountType: string | null | undefined, section: Section): boolean {
  return (PERMISSIONS[accountType ?? 'SHOPPER']?.[section]?.length ?? 0) > 0;
}
// الأقسام التي يملك الدور صلاحية اطلاع عليها (لبناء لوحة الأقسام)
export function visibleSections(accountType: string | null | undefined): Section[] {
  return SECTIONS.map((s) => s.key).filter((k) => can(accountType, k, 'view'));
}
