// أداة تمييز "على السوم" (مزايدة مفتوحة بلا وقت) عن المزاد المؤقّت.
// "على السوم" يُمثّل بمزاد نهايته تاريخ بعيد جداً (سنتينل) فلا ينتهي بالوقت.
export const OPEN_END_ISO = '2999-12-31T00:00:00.000Z';

export function isOpenEnd(endAt?: string | Date | null): boolean {
  if (!endAt) return false;
  return new Date(endAt).getUTCFullYear() >= 2900;
}
