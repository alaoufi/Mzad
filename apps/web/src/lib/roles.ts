// الأدوار السبعة: كل دور له اسم عربي وصلاحية أساسية (role enum)
export type PermRole = 'USER' | 'BROKER' | 'ADMIN';

export interface AccountTypeDef {
  key: string;
  label: string;
  role: PermRole; // الصلاحية الأساسية المشتقّة
  emoji: string;
}

export const ACCOUNT_TYPES: AccountTypeDef[] = [
  { key: 'SUPER_ADMIN', label: 'مشرف عام', role: 'ADMIN', emoji: '👑' },
  { key: 'ADMIN', label: 'مشرف', role: 'ADMIN', emoji: '🛡️' },
  { key: 'BROKERS_LEAD', label: 'كبير الدلالين', role: 'BROKER', emoji: '🎖️' },
  { key: 'BROKER', label: 'دلال', role: 'BROKER', emoji: '🧑‍⚖️' },
  { key: 'MARKETER', label: 'مسوّق', role: 'USER', emoji: '📣' },
  { key: 'MERCHANT', label: 'تاجر', role: 'USER', emoji: '🏪' },
  { key: 'SHOPPER', label: 'متسوّق', role: 'USER', emoji: '🛍️' },
  { key: 'VISITOR', label: 'زائر', role: 'USER', emoji: '👋' },
];

const MAP = Object.fromEntries(ACCOUNT_TYPES.map((a) => [a.key, a]));

export function accountTypeDef(key?: string | null): AccountTypeDef {
  return (key && MAP[key]) || MAP['SHOPPER'];
}

export function roleForAccountType(key?: string | null): PermRole {
  return accountTypeDef(key).role;
}
