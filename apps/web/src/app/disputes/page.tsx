'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiToast } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';
import { HijriDate } from '@/components/HijriDate';
import { DISPUTE_STATUS, disputeCatEmoji, disputeCatLabel, disputeDesireLabel } from '@/lib/disputes';

interface Dispute {
  id: string; reason: string; detail?: string | null; status: string; resolution?: string | null;
  createdAt: string; myRole: 'OPENER' | 'AGAINST';
  category?: string | null; amount?: string | null; desired?: string | null; incidentAt?: string | null;
  evidence?: string[]; response?: string | null; responseEvidence?: string[]; respondedAt?: string | null;
  listing?: { id: string; title: string } | null; openedBy?: { name: string } | null;
}

export default function DisputesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondFor, setRespondFor] = useState<string | null>(null);
  const [respText, setRespText] = useState('');
  const [respEv, setRespEv] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => api<{ disputes: Dispute[] }>('/disputes').then((r) => setDisputes(r.disputes)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user]);

  const openRespond = (id: string) => { setRespondFor(id); setRespText(''); setRespEv([]); };
  const addRespFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const imgs: string[] = [];
    for (const f of Array.from(files).slice(0, 8 - respEv.length)) imgs.push(await compressImage(f, 900, 0.6));
    setRespEv((p) => [...p, ...imgs].slice(0, 8));
  };
  const submitResponse = async (id: string) => {
    if (!respText.trim()) { uiToast('اكتب إفادتك', 'error'); return; }
    setBusy(true);
    try {
      await api(`/disputes/${id}`, { method: 'PATCH', body: JSON.stringify({ response: respText.trim(), responseEvidence: respEv }) });
      uiToast('✅ سُجّلت إفادتك', 'success'); setRespondFor(null); load();
    } catch (e: any) { uiToast(e.message, 'error'); } finally { setBusy(false); }
  };

  if (!ready) return null;
  if (!user) return (
    <div className="mx-auto max-w-md text-center"><div className="card p-8">
      <p className="mb-4 text-5xl">⚖️</p><p className="mb-4 text-lg">سجّل الدخول لعرض نزاعاتك</p>
      <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
    </div></div>
  );

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">⚖️ نزاعاتي</h1>
        <button onClick={() => router.push('/account')} className="text-sm font-bold text-brand">← حسابي</button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>
      ) : disputes.length === 0 ? (
        <div className="card p-10 text-center text-gray-500"><p className="text-4xl">🤝</p><p className="mt-3">لا توجد نزاعات.</p></div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const st = DISPUTE_STATUS[d.status] ?? DISPUTE_STATUS.OPEN;
            const against = d.myRole === 'AGAINST';
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${st.cls}`}>{st.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${against ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {against ? '🟠 مرفوع ضدّي' : '🔵 فتحته أنا'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400"><HijriDate value={d.createdAt} short /></span>
                </div>
                {d.listing && <Link href={`/listings/${d.listing.id}`} className="mt-2 block font-bold hover:text-brand">📋 {d.listing.title}</Link>}
                <p className="mt-1 font-bold">{disputeCatEmoji(d.category)} {d.reason}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  {d.category && <span>النوع: {disputeCatLabel(d.category)}</span>}
                  {d.amount && <span>المبلغ: {Number(d.amount).toLocaleString('ar-SA')} ﷼</span>}
                  {d.desired && <span>المطلوب: {disputeDesireLabel(d.desired)}</span>}
                </div>
                {d.detail && <p className="mt-1 text-sm text-gray-600">{d.detail}</p>}

                {d.response && (
                  <div className="mt-3 rounded-2xl bg-orange-50 p-3 text-sm"><b className="text-orange-800">إفادة الطرف الآخر:</b> <span className="text-gray-700">{d.response}</span></div>
                )}
                {d.resolution && (
                  <div className="mt-3 rounded-2xl bg-green-50 p-3 text-sm text-green-800"><b>قرار الإدارة:</b> {d.resolution}</div>
                )}

                {/* رد الطرف الآخر */}
                {against && !d.response && d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                  respondFor === d.id ? (
                    <div className="mt-3 space-y-2 rounded-2xl bg-sand-50 p-3">
                      <textarea className="input min-h-[80px]" placeholder="اكتب إفادتك وردّك على النزاع..." value={respText} onChange={(e) => setRespText(e.target.value)} />
                      <div className="flex flex-wrap gap-2">
                        {respEv.map((s, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={s} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-sand-200" />
                        ))}
                        {respEv.length < 8 && (
                          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-sand-300 text-xl text-gray-400">＋
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addRespFiles(e.target.files)} />
                          </label>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setRespondFor(null)} className="btn-outline flex-1 !min-h-0 !py-2">إلغاء</button>
                        <button onClick={() => submitResponse(d.id)} disabled={busy} className="btn-primary flex-1 !min-h-0 !py-2 disabled:opacity-50">{busy ? '...' : 'إرسال الإفادة'}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => openRespond(d.id)} className="mt-3 w-full rounded-2xl bg-brand/10 py-2.5 text-sm font-extrabold text-brand-dark">✍️ قدّم إفادتك على النزاع</button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
