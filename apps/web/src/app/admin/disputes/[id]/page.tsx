'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiToast } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HijriDate } from '@/components/HijriDate';
import { accountTypeDef } from '@/lib/roles';
import { DISPUTE_STATUS, disputeCatEmoji, disputeCatLabel, disputeDesireLabel, paymentLabel } from '@/lib/disputes';

interface Party {
  id: string; name: string; phone: string; city?: string | null; region?: string | null;
  identityStatus?: string; accountType?: string; trustScore?: number; bio?: string | null;
  experienceYears?: number | null; bankName?: string | null; bankAccount?: string | null; iban?: string | null; createdAt?: string;
}
interface Detail {
  dispute: any; against: Party | null;
  openerHistory: { opened: number; against: number }; againstHistory: { opened: number; against: number };
}

export default function AdminDisputeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [party, setParty] = useState<'opener' | 'against'>('opener');
  const [resolution, setResolution] = useState('');

  const load = useCallback(() => {
    api<Detail>(`/admin/disputes/${params.id}`).then((r) => { setD(r); setResolution(r.dispute.resolution ?? ''); })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id]);
  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user, load]);

  const setStatus = async (status: string) => {
    try { await api(`/admin/disputes/${params.id}`, { method: 'PATCH', body: JSON.stringify({ status, resolution: resolution || undefined }) }); uiToast('تم التحديث', 'success'); load(); }
    catch (e: any) { uiToast(e.message, 'error'); }
  };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">ادخل بحساب الإدارة.</p>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) return <div className="card p-6 text-center text-red-600">{error}</div>;
  if (!d) return null;

  const dp = d.dispute;
  const opener = dp.openedBy as Party;
  const st = DISPUTE_STATUS[dp.status] ?? DISPUTE_STATUS.OPEN;
  const caseNo = `نز-${String(dp.id).slice(0, 8).toUpperCase()}`;
  const cur = party === 'opener' ? opener : d.against;
  const curHistory = party === 'opener' ? d.openerHistory : d.againstHistory;

  // ملفّ نصّي للجهات المختصة
  const authoritiesFile = [
    `ملف نزاع — منصة مزاد | رقم القضية: ${caseNo}`,
    `النوع: ${disputeCatLabel(dp.category)} | الحالة: ${st.label}`,
    `طريقة الدفع: ${paymentLabel(dp.paymentMethod)} | رقم الحوالة: ${dp.transferRef ?? '—'}`,
    dp.witnesses ? `الشهود: ${dp.witnesses}` : '',
    `الإعلان: ${dp.listing?.title ?? '—'}`,
    `المبلغ محل النزاع: ${dp.amount ? Number(dp.amount).toLocaleString('ar-SA') + ' ريال' : '—'}`,
    `المطلوب: ${disputeDesireLabel(dp.desired)}`,
    ``,
    `— الطرف الأول (المشتكي): ${opener?.name} | جوال: ${opener?.phone} | ${[opener?.city, opener?.region].filter(Boolean).join('، ')}`,
    opener?.bankName ? `  بنك: ${opener.bankName} | حساب: ${opener.bankAccount ?? '—'} | آيبان: ${opener.iban ?? '—'}` : '',
    `— الطرف الآخر (المشتكى عليه): ${d.against?.name ?? '—'} | جوال: ${d.against?.phone ?? '—'} | ${[d.against?.city, d.against?.region].filter(Boolean).join('، ')}`,
    d.against?.bankName ? `  بنك: ${d.against.bankName} | حساب: ${d.against.bankAccount ?? '—'} | آيبان: ${d.against.iban ?? '—'}` : '',
    ``,
    `إفادة المشتكي: ${dp.reason}${dp.detail ? ' — ' + dp.detail : ''}`,
    `إفادة الطرف الآخر: ${dp.response ?? '— لم يُقدّم رد بعد'}`,
  ].filter(Boolean).join('\n');
  const copyFile = async () => { try { await navigator.clipboard.writeText(authoritiesFile); uiToast('✅ نُسخ الملف', 'success'); } catch { uiToast('تعذّر النسخ', 'error'); } };

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin/disputes')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ النزاعات</button>
        <h1 className="text-xl font-extrabold text-engrave">⚖️ ملف النزاع</h1>
        <span className={`mr-auto rounded-full px-3 py-0.5 text-sm font-bold ${st.cls}`}>{st.label}</span>
      </div>
      <div className="text-xs font-bold text-gray-500">رقم القضية: <span className="text-brand-dark">{caseNo}</span> · فُتحت: <HijriDate value={dp.createdAt} short /></div>

      {/* الشكوى */}
      <div className="card p-4">
        <div className="text-lg font-extrabold">{disputeCatEmoji(dp.category)} {dp.reason}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span>النوع: {disputeCatLabel(dp.category)}</span>
          {dp.amount && <span>المبلغ: {Number(dp.amount).toLocaleString('ar-SA')} ﷼</span>}
          {dp.desired && <span>المطلوب: {disputeDesireLabel(dp.desired)}</span>}
          {dp.incidentAt && <span>تاريخ الواقعة: <HijriDate value={dp.incidentAt} short /></span>}
          {dp.paymentMethod && <span>الدفع: {paymentLabel(dp.paymentMethod)}</span>}
          {dp.transferRef && <span>الحوالة: {dp.transferRef}</span>}
        </div>
        {dp.detail && <p className="mt-2 text-sm text-gray-700">{dp.detail}</p>}
        {dp.witnesses && <p className="mt-1 text-sm text-gray-600">👥 الشهود: {dp.witnesses}</p>}
        {dp.listing && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link href={`/listings/${dp.listing.id}`} className="rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-brand-dark">📋 {dp.listing.title}</Link>
            <Link href={`/admin/conversations/${dp.listing.id}`} className="rounded-lg bg-sand-100 px-2 py-1 text-xs font-bold text-brand-dark">📨 المحادثات</Link>
          </div>
        )}
      </div>

      {/* الطرفان — تبويب واضح بلونين لمنع التداخل */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setParty('opener')}
          className={`rounded-2xl py-2.5 text-sm font-extrabold ring-1 transition ${party === 'opener' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-indigo-700 ring-indigo-200'}`}>
          🔵 الطرف الأول (المشتكي)
        </button>
        <button onClick={() => setParty('against')}
          className={`rounded-2xl py-2.5 text-sm font-extrabold ring-1 transition ${party === 'against' ? 'bg-orange-600 text-white ring-orange-600' : 'bg-white text-orange-700 ring-orange-200'}`}>
          🟠 الطرف الآخر (المشتكى عليه)
        </button>
      </div>

      <div className={`card border-2 p-4 ${party === 'opener' ? 'border-indigo-300 bg-indigo-50/40' : 'border-orange-300 bg-orange-50/40'}`}>
        {!cur ? (
          <p className="py-4 text-center text-gray-500">لم يُحدَّد الطرف الآخر لهذا النزاع.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-extrabold text-white ${party === 'opener' ? 'bg-indigo-500' : 'bg-orange-500'}`}>{cur.name?.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-extrabold">
                  {cur.name}
                  {cur.identityStatus === 'VERIFIED' && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-700">✔ موثّق</span>}
                </div>
                <div className="text-xs text-gray-500">{accountTypeDef(cur.accountType).emoji} {accountTypeDef(cur.accountType).label} · ⭐ {cur.trustScore?.toFixed(1) ?? '—'}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Info label="الجوال" value={cur.phone} copyable />
              <Info label="المدينة/المنطقة" value={[cur.city, cur.region].filter(Boolean).join('، ') || '—'} />
              <Info label="الخبرة" value={cur.experienceYears != null ? `${cur.experienceYears} سنة` : '—'} />
              <Info label="عضو منذ" value={cur.createdAt ? '' : '—'}>{cur.createdAt && <HijriDate value={cur.createdAt} short />}</Info>
            </div>
            {/* بيانات بنكية — للجهات المختصة */}
            {(cur.bankName || cur.bankAccount || cur.iban) && (
              <div className="mt-2 rounded-xl bg-white p-3 ring-1 ring-black/[0.04]">
                <div className="mb-1 text-xs font-extrabold text-brand-dark">🏦 البيانات البنكية</div>
                <div className="grid grid-cols-1 gap-1 text-sm">
                  <Info label="البنك" value={cur.bankName || '—'} />
                  <Info label="رقم الحساب" value={cur.bankAccount || '—'} copyable />
                  <Info label="الآيبان" value={cur.iban || '—'} copyable />
                </div>
              </div>
            )}
            {/* سوابق النزاعات */}
            <div className="mt-2 flex gap-2 text-xs">
              <span className="rounded-full bg-white px-3 py-1 font-bold text-gray-600 ring-1 ring-black/[0.05]">فتح نزاعات: <b>{curHistory.opened}</b></span>
              <span className="rounded-full bg-white px-3 py-1 font-bold text-gray-600 ring-1 ring-black/[0.05]">نزاعات ضدّه: <b>{curHistory.against}</b></span>
            </div>
            {/* إفادة/أدلّة هذا الطرف */}
            <div className="mt-3">
              <div className="mb-1 text-xs font-extrabold text-gray-600">{party === 'opener' ? 'إفادة المشتكي وأدلّته' : 'إفادة الطرف الآخر وأدلّته'}</div>
              {party === 'against' && (
                <p className="text-sm text-gray-700">{dp.response || <span className="text-gray-400">لم يُقدّم إفادته بعد.</span>}</p>
              )}
              <Evidence imgs={party === 'opener' ? (dp.evidence ?? []) : (dp.responseEvidence ?? [])} />
            </div>
          </>
        )}
      </div>

      {/* الخط الزمني للقضية */}
      <div className="card p-4">
        <h2 className="mb-2 font-extrabold">🕒 الخط الزمني</h2>
        <ol className="space-y-2 text-sm">
          <TimelineRow color="bg-indigo-500" label="فُتحت القضية من المشتكي" at={dp.createdAt} />
          {dp.respondedAt && <TimelineRow color="bg-orange-500" label="قدّم الطرف الآخر إفادته" at={dp.respondedAt} />}
          {(dp.status === 'RESOLVED' || dp.status === 'REJECTED') && (
            <TimelineRow color="bg-green-600" label={dp.status === 'RESOLVED' ? 'صدر قرار الإدارة (حلّ)' : 'رُفض النزاع'} at={dp.updatedAt} />
          )}
          {!dp.respondedAt && dp.status !== 'RESOLVED' && dp.status !== 'REJECTED' && (
            <li className="flex items-center gap-2 text-gray-400"><span className="h-2.5 w-2.5 rounded-full bg-gray-300" /> بانتظار إفادة الطرف الآخر…</li>
          )}
        </ol>
      </div>

      {/* ملف الجهات المختصة */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-extrabold">📄 ملف للجهات المختصة</h2>
          <div className="flex gap-2">
            <button onClick={copyFile} className="rounded-xl bg-brand/10 px-3 py-1.5 text-sm font-bold text-brand-dark">📋 نسخ</button>
            <button onClick={() => window.print()} className="rounded-xl bg-brand/10 px-3 py-1.5 text-sm font-bold text-brand-dark">🖨️ طباعة/PDF</button>
          </div>
        </div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-sand-50 p-3 text-xs leading-relaxed text-gray-700">{authoritiesFile}</pre>
        <p className="mt-2 text-[11px] text-gray-400">المنصة جهة توثيق محايدة وتنظيمية، ولا تُصدر حكماً قضائياً ولا تتحمّل مسؤولية الصفقة.</p>
      </div>

      {/* قرار الإدارة */}
      <div className="card space-y-3 p-4">
        <h2 className="font-extrabold">🧑‍⚖️ الفصل في النزاع</h2>
        {dp.resolution && <div className="rounded-2xl bg-green-50 p-3 text-sm text-green-800"><b>القرار الحالي:</b> {dp.resolution}</div>}
        <textarea className="input min-h-[70px]" placeholder="اكتب قرار الإدارة / الحل..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {dp.status === 'OPEN' && <button onClick={() => setStatus('REVIEWING')} className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">بدء المراجعة</button>}
          <button onClick={() => setStatus('RESOLVED')} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">✔ حلّ بقرار</button>
          <button onClick={() => setStatus('REJECTED')} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700">رفض</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, children, copyable }: { label: string; value: string; children?: React.ReactNode; copyable?: boolean }) {
  const copy = async () => { try { await navigator.clipboard.writeText(value); uiToast('نُسخ', 'success'); } catch {} };
  return (
    <div className="rounded-lg bg-white/70 px-2 py-1.5">
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className="flex items-center gap-1 font-bold text-gray-800">
        {children ?? <span className="truncate">{value}</span>}
        {copyable && value && value !== '—' && <button onClick={copy} className="text-xs text-brand" title="نسخ">📋</button>}
      </div>
    </div>
  );
}

function TimelineRow({ color, label, at }: { color: string; label: string; at?: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <span className="font-bold text-gray-700">{label}</span>
      {at && <span className="mr-auto text-xs text-gray-400"><HijriDate value={at} short /></span>}
    </li>
  );
}

function Evidence({ imgs }: { imgs: string[] }) {
  if (!imgs?.length) return <p className="text-xs text-gray-400">لا توجد أدلّة مرفقة.</p>;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {imgs.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <a key={i} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/10" /></a>
      ))}
    </div>
  );
}
