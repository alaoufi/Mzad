// تنسيق التواريخ بتقويم أم القرى الهجري والميلادي معاً.
// يعتمد على Intl (ICU) المدمج، تقويم 'islamic-umalqura' الرسمي بالسعودية.

type DateInput = string | number | Date;

function toDate(d: DateInput): Date | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? null : date;
}

const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
const hijriShort = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
const gregDate = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' });
const gregShort = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'numeric', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { hour: 'numeric', minute: '2-digit', hour12: true });

// التاريخ الهجري (أم القرى) — مثال: ١٤ محرّم ١٤٤٨ هـ
export function formatHijri(d: DateInput, short = false): string {
  const date = toDate(d);
  if (!date) return '';
  return `${(short ? hijriShort : hijriDate).format(date)} هـ`;
}

// التاريخ الميلادي — مثال: ٢٩ يونيو ٢٠٢٦ م
export function formatGregorian(d: DateInput, short = false): string {
  const date = toDate(d);
  if (!date) return '';
  return `${(short ? gregShort : gregDate).format(date)} م`;
}

// الوقت — مثال: ٣:٤٥ م
export function formatTime(d: DateInput): string {
  const date = toDate(d);
  if (!date) return '';
  return timeFmt.format(date);
}

// التاريخان معاً — مثال: ١٤ محرّم ١٤٤٨ هـ · ٢٩ يونيو ٢٠٢٦ م
export function formatDual(d: DateInput, short = false): string {
  const date = toDate(d);
  if (!date) return '';
  return `${formatHijri(date, short)} · ${formatGregorian(date, short)}`;
}

// التاريخان مع الوقت
export function formatDualTime(d: DateInput): string {
  const date = toDate(d);
  if (!date) return '';
  return `${formatDual(date)} — ${formatTime(date)}`;
}
