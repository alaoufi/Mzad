'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uiToast } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';
import { DISPUTE_CATEGORIES, DISPUTE_DESIRES, PAYMENT_METHODS } from '@/lib/disputes';

interface Party { id: string; name: string; phone: string; city?: string | null; region?: string | null; identityStatus?: string }

export default function NewDisputePage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>}>
      <NewDisputeInner />
    </Suspense>
  );
}

function NewDisputeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const listingId = sp.get('listingId') ?? '';
  const { user, ready } = useAuth();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<{ listing: { id: string; title: string }; myRole: string; against: Party | null; candidates: Party[] } | null>(null);
  const [againstId, setAgainstId] = useState('');
  const [category, setCategory] = useState('');
  const [desired, setDesired] = useState('');
  const [amount, setAmount] = useState('');
  const [incidentAt, setIncidentAt] = useState('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [contact, setContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [declared, setDeclared] = useState(false);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || !listingId) { setLoading(false); return; }
    api<any>(`/disputes/parties?listingId=${listingId}`)
      .then((r) => { setInfo(r); if (r.against) setAgainstId(r.against.id); })
      .catch((e) => uiToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [user, listingId]);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const imgs: string[] = [];
      for (const f of Array.from(files).slice(0, 8 - evidence.length)) {
        imgs.push(await compressImage(f, 900, 0.6));
      }
      setEvidence((p) => [...p, ...imgs].slice(0, 8));
    } catch { uiToast('تعذّر إرفاق الصورة', 'error'); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!reason.trim()) { uiToast('اكتب سبب النزاع باختصار', 'error'); return; }
    if (info?.myRole === 'SELLER' && !againstId) { uiToast('حدّد الطرف الآخر (المشتري)', 'error'); return; }
    if (!declared) { uiToast('يجب الإقرار بصحة المعلومات', 'error'); return; }
    setBusy(true);
    try {
      await api('/disputes', { method: 'POST', body: JSON.stringify({
        listingId, reason: reason.trim(), detail: detail.trim() || null,
        category: category || null, desired: desired || null,
        amount: amount ? Number(amount) : null, incidentAt: incidentAt || null,
        contact: contact.trim() || null, evidence,
        paymentMethod: paymentMethod || null, transferRef: transferRef.trim() || null,
        witnesses: witnesses.trim() || null, declared,
        againstId: info?.myRole === 'SELLER' ? againstId : undefined,
      }) });
      uiToast('✅ فُتح النزاع — ستراجعه الإدارة، وأُشعر الطرف الآخر لتقديم إفادته', 'success');
      router.push('/disputes');
    } catch (e: any) { uiToast(e.message, 'error'); } finally { setBusy(false); }
  };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">سجّل الدخول لفتح نزاع.</p>;
  if (!listingId) return (
    <div className="card p-8 text-center">
      <p className="text-4xl">⚖️</p>
      <p className="mt-3 font-bold">افتح النزاع من صفحة الإعلان محلّ النزاع</p>
      <p className="mt-1 text-sm text-gray-500">ادخل الإعلان ثم اضغط «فتح نزاع» ليُحدَّد الإعلان والطرف الآخر تلقائياً.</p>
    </div>
  );
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ رجوع</button>
        <h1 className="text-2xl font-extrabold text-engrave">⚖️ فتح نزاع</h1>
      </div>

      {/* الإعلان والطرف الآخر */}
      <div className="card p-4">
        <div className="text-xs text-gray-500">الإعلان محل النزاع</div>
        <div className="font-extrabold">📋 {info?.listing.title}</div>

        <div className="mt-3 rounded-2xl bg-sand-50 p-3">
          <div className="mb-1 text-xs font-bold text-gray-500">
            {info?.myRole === 'SELLER' ? 'أنت البائع — حدّد المشتري محل النزاع' : 'الطرف الآخر (صاحب الإعلان)'}
          </div>
          {info?.myRole === 'BUYER' ? (
            <div className="font-bold">{info.against?.name} · <span className="text-sm text-gray-500">{info.against?.phone}</span></div>
          ) : info!.candidates.length ? (
            <select value={againstId} onChange={(e) => setAgainstId(e.target.value)} className="input">
              <option value="">— اختر المشتري —</option>
              {info!.candidates.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </select>
          ) : (
            <p className="text-sm text-amber-700">لا يوجد مشترون متفاعلون مسجّلون على هذا الإعلان (محادثات/مزايدات). لا يمكن تحديد طرف آخر.</p>
          )}
        </div>
      </div>

      {/* نوع الشكوى */}
      <div className="card p-4">
        <div className="mb-2 text-sm font-extrabold">نوع الشكوى</div>
        <div className="flex flex-wrap gap-2">
          {DISPUTE_CATEGORIES.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${category === c.key ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* التفاصيل والأدلة */}
      <div className="card space-y-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">سبب النزاع باختصار *</label>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: الحيوان غير مطابق للوصف" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">شرح ما حدث بالتفصيل</label>
          <textarea className="input min-h-[90px]" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="اسرد التفاصيل: متى، كيف، ما الذي حصل، وأي وعود أو اتفاقات." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">المبلغ محل النزاع (ريال)</label>
            <input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="مثال: 5000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">تاريخ الواقعة</label>
            <input type="date" className="input" value={incidentAt} onChange={(e) => setIncidentAt(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm font-bold text-gray-600">المطلوب</div>
          <div className="flex flex-wrap gap-2">
            {DISPUTE_DESIRES.map((d) => (
              <button key={d.key} type="button" onClick={() => setDesired(d.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${desired === d.key ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">طريقة الدفع</label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">— اختر —</option>
              {PAYMENT_METHODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">رقم الحوالة/إثبات الدفع</label>
            <input className="input" value={transferRef} onChange={(e) => setTransferRef(e.target.value)} placeholder="اختياري" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">شهود أو أطراف ذات علاقة (اختياري)</label>
          <input className="input" value={witnesses} onChange={(e) => setWitnesses(e.target.value)} placeholder="أسماء/أرقام من حضر أو له علاقة" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">وسيلة تواصل إضافية (اختياري)</label>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="جوال/واتساب للتواصل بخصوص النزاع" />
        </div>

        {/* الأدلة */}
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">الأدلّة (صور المستندات/المحادثات/الحيوان) — حتى ٨</label>
          <div className="flex flex-wrap gap-2">
            {evidence.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-sand-200" />
                <button type="button" onClick={() => setEvidence((p) => p.filter((_, k) => k !== i))}
                  className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
              </div>
            ))}
            {evidence.length < 8 && (
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-sand-300 text-2xl text-gray-400">
                {uploading ? '…' : '＋'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            )}
          </div>
        </div>

        <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-800">
          تُعرض هذه المعلومات على الإدارة للفصل، وقد تُسلَّم للطرفين لتقديمها للجهات المختصة. المنصة جهة توثيق محايدة ولا تتحمّل مسؤولية الصفقة.
        </p>
        <label className="flex items-start gap-2 rounded-xl bg-sand-50 p-3 text-sm">
          <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span className="text-gray-700">أقرّ بأن جميع المعلومات والمستندات المقدَّمة صحيحة، وأتحمّل المسؤولية القانونية الكاملة عند تقديم بيانات أو مستندات مزوّرة.</span>
        </label>
        <button onClick={submit} disabled={busy || !declared} className="btn-primary w-full disabled:opacity-50">{busy ? '...' : '⚖️ فتح النزاع'}</button>
      </div>
    </div>
  );
}
