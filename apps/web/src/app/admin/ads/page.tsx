'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uiToast, uiConfirm } from '@/lib/ui';
import { compressImage } from '@/lib/image';
import { AD_PLACEMENTS, AD_PACKAGES, COUNTRIES, placementLabel, packageByKey, countryName, riyals } from '@/lib/ads';

interface Ad {
  id: string; title: string; imageUrl?: string | null; link?: string | null; placement: string;
  status: string; priority: number; advertiser?: string | null; targetCountries?: string | null;
  packageKey?: string | null; priceHalalas?: number | null; maxImpressions?: number | null;
  startAt?: string | null; endAt?: string | null; impressions: number; clicks: number;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'نشط', cls: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'موقوف', cls: 'bg-gray-200 text-gray-600' },
  PENDING: { label: 'بانتظار الموافقة', cls: 'bg-amber-100 text-amber-700' },
  EXPIRED: { label: 'منتهٍ', cls: 'bg-red-100 text-red-700' },
};

interface Draft {
  title: string; advertiser: string; placement: string; imageUrl: string; link: string;
  packageKey: string; countries: string[]; priority: string; status: string;
}
const EMPTY: Draft = { title: '', advertiser: '', placement: 'HOME_TOP', imageUrl: '', link: '', packageKey: '', countries: [], priority: '0', status: 'ACTIVE' };

const daysLeft = (endAt?: string | null) => {
  if (!endAt) return null;
  const d = Math.ceil((new Date(endAt).getTime() - Date.now()) / 86400000);
  return d;
};

export default function AdminAdsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [warn, setWarn] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const load = async () => {
    setWarn('');
    try { const r = await api<{ ads: Ad[] }>('/admin/ads'); setAds(r.ads); }
    catch (e: any) { setWarn(e.message); setAds([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user]);

  const run = async (fn: () => Promise<any>) => { try { await fn(); load(); } catch (e: any) { uiToast(e.message); } };

  const openAdd = () => { setEditId(null); setDraft(EMPTY); setAdding(true); };
  const openEdit = (a: Ad) => {
    setAdding(false); setEditId(a.id);
    setDraft({
      title: a.title, advertiser: a.advertiser ?? '', placement: a.placement, imageUrl: a.imageUrl ?? '',
      link: a.link ?? '', packageKey: a.packageKey ?? '', countries: (a.targetCountries || '').split(',').map((s) => s.trim()).filter(Boolean),
      priority: String(a.priority ?? 0), status: a.status,
    });
  };
  const close = () => { setEditId(null); setAdding(false); };

  const pickImage = async (f: FileList | null) => {
    if (!f?.length) return;
    setUploading(true);
    try { setDraft((d) => ({ ...d, imageUrl: '' })); const url = await compressImage(f[0]); setDraft((d) => ({ ...d, imageUrl: url })); }
    catch { uiToast('تعذّر تحميل الصورة'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!draft.title.trim()) { uiToast('العنوان مطلوب'); return; }
    setSaving(true);
    const body = {
      title: draft.title, advertiser: draft.advertiser, placement: draft.placement, imageUrl: draft.imageUrl,
      link: draft.link, packageKey: draft.packageKey, targetCountries: draft.countries.join(','),
      priority: draft.priority, status: draft.status,
    };
    try {
      if (editId) await api(`/admin/ads/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await api('/admin/ads', { method: 'POST', body: JSON.stringify(body) });
      close(); load();
    } catch (e: any) { uiToast(e.message); }
    finally { setSaving(false); }
  };

  const approve = (a: Ad) => {
    const pkg = packageByKey(a.packageKey);
    const now = new Date();
    const endAt = pkg ? new Date(now.getTime() + pkg.days * 86400000).toISOString() : undefined;
    run(() => api(`/admin/ads/${a.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ACTIVE', startAt: now.toISOString(), endAt }) }));
  };
  const toggle = (a: Ad) => run(() => api(`/admin/ads/${a.id}`, { method: 'PATCH', body: JSON.stringify({ status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }) }));
  const del = async (a: Ad) => { if (await uiConfirm(`حذف إعلان «${a.title}»؟`, { danger: true })) run(() => api(`/admin/ads/${a.id}`, { method: 'DELETE' })); };

  if (!user) return <Center onLogin={() => router.push('/login')} />;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">📣 الإعلانات المبوبة</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>
      {warn && <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">{warn}</div>}

      <button onClick={openAdd} className="btn-primary w-full">＋ إعلان جديد</button>

      {ads && ads.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">لا توجد إعلانات بعد</div>
      ) : (
        <div className="space-y-3">
          {ads?.map((a) => {
            const st = STATUS[a.status] ?? STATUS.PAUSED;
            const pkg = packageByKey(a.packageKey);
            const dl = daysLeft(a.endAt);
            const cap = a.maxImpressions ?? 0;
            const pct = cap ? Math.min(100, Math.round((a.impressions / cap) * 100)) : 0;
            const ctr = a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(1) : '0';
            const countries = (a.targetCountries || '').split(',').map((s) => s.trim()).filter(Boolean);
            return (
              <div key={a.id} className="card p-4">
                <div className="flex items-start gap-3">
                  {a.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-2xl">📣</div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-extrabold">{a.title}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {placementLabel(a.placement)}{a.advertiser ? ` · ${a.advertiser}` : ''}{pkg ? ` · ${pkg.label}` : ''}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      🌍 {countries.length ? countries.map(countryName).join('، ') : 'كل الدول'}
                      {a.priceHalalas != null && ` · 💰 ${riyals(a.priceHalalas)} ﷼`}
                    </div>
                  </div>
                </div>

                {/* إحصاء سريع */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <Stat n={a.impressions.toLocaleString('ar-SA')} l="مشاهدة" />
                  <Stat n={a.clicks.toLocaleString('ar-SA')} l="نقرة" />
                  <Stat n={`${ctr}%`} l="نسبة النقر" />
                  <Stat n={dl == null ? '∞' : dl < 0 ? 'انتهى' : `${dl} يوم`} l="المتبقّي" />
                </div>
                {cap > 0 && (
                  <div className="mt-2">
                    <div className="h-2 overflow-hidden rounded-full bg-sand-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400">{a.impressions.toLocaleString('ar-SA')} / {cap.toLocaleString('ar-SA')} مشاهدة</div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === 'PENDING' && (
                    <button onClick={() => approve(a)} className="rounded-xl bg-green-600 px-3 py-1.5 text-sm font-bold text-white">✔ موافقة وتفعيل</button>
                  )}
                  {(a.status === 'ACTIVE' || a.status === 'PAUSED') && (
                    <button onClick={() => toggle(a)} className="rounded-xl bg-sand-100 px-3 py-1.5 text-sm font-bold text-gray-700">
                      {a.status === 'ACTIVE' ? '⏸ إيقاف' : '▶ تفعيل'}
                    </button>
                  )}
                  <Link href={`/admin/ads/${a.id}`} className="rounded-xl bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">📊 إحصائيات</Link>
                  <button onClick={() => openEdit(a)} className="rounded-xl bg-sand-100 px-3 py-1.5 text-sm font-bold text-gray-700">✏️ تعديل</button>
                  <button onClick={() => del(a)} className="rounded-xl bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600">🗑️ حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(adding || editId) && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={close}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{editId ? '✏️ تعديل إعلان' : '＋ إعلان جديد'}</h3>
              <button onClick={close} className="text-2xl leading-none text-gray-400">×</button>
            </div>

            <Field label="عنوان الإعلان">
              <input className="input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </Field>
            <Field label="اسم المُعلِن (اختياري)">
              <input className="input" value={draft.advertiser} onChange={(e) => setDraft((d) => ({ ...d, advertiser: e.target.value }))} />
            </Field>

            <Field label="الصورة">
              <div className="flex items-center gap-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand-100 text-xl">
                  {draft.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" /> : (uploading ? '⏳' : '📷')}
                </div>
                <label className="cursor-pointer rounded-xl bg-sand-100 px-4 py-2 text-sm font-bold text-gray-700">
                  {uploading ? 'جارٍ...' : 'اختر صورة'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files)} />
                </label>
                {draft.imageUrl && <button onClick={() => setDraft((d) => ({ ...d, imageUrl: '' }))} className="text-sm font-bold text-red-500">مسح</button>}
              </div>
            </Field>

            <Field label="الرابط (داخلي /sell أو خارجي https://...)">
              <input className="input" value={draft.link} placeholder="https://..." onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} />
            </Field>

            <Field label="الموضع">
              <select className="input" value={draft.placement} onChange={(e) => setDraft((d) => ({ ...d, placement: e.target.value }))}>
                {AD_PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.label} — {p.where}</option>)}
              </select>
            </Field>

            <Field label="الباقة (مدة + سقف مشاهدات — أيهما أوّل)">
              <select className="input" value={draft.packageKey} onChange={(e) => setDraft((d) => ({ ...d, packageKey: e.target.value }))}>
                <option value="">بلا باقة (يدوي/دائم)</option>
                {AD_PACKAGES.map((p) => <option key={p.key} value={p.key}>{p.label} — {riyals(p.priceHalalas)} ﷼</option>)}
              </select>
            </Field>

            <Field label="الدول المستهدفة (فارغ = كل الدول)">
              <div className="flex flex-wrap gap-1.5">
                {COUNTRIES.map((c) => {
                  const on = draft.countries.includes(c.code);
                  return (
                    <button key={c.code} type="button"
                      onClick={() => setDraft((d) => ({ ...d, countries: on ? d.countries.filter((x) => x !== c.code) : [...d.countries, c.code] }))}
                      className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${on ? 'bg-brand text-white ring-brand' : 'bg-white text-gray-600 ring-sand-200'}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="الأولوية">
                <input type="number" className="input" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))} />
              </Field>
              <Field label="الحالة">
                <select className="input" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                  <option value="ACTIVE">نشط</option>
                  <option value="PAUSED">موقوف</option>
                  <option value="PENDING">بانتظار</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={close} className="btn-outline flex-1">إلغاء</button>
              <button onClick={save} disabled={saving || uploading} className="btn-primary flex-1 disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return <div className="rounded-xl bg-sand-50 py-2"><div className="text-base font-extrabold text-brand-dark">{n}</div><div className="text-[10px] text-gray-400">{l}</div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className="mb-1 block text-sm font-bold text-gray-600">{label}</label>{children}</div>;
}
function Center({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="card p-8"><p className="mb-4 text-5xl">📣</p><p className="mb-4 text-lg">إدارة الإعلانات — سجّل الدخول بحساب مشرف</p>
        <button className="btn-primary w-full" onClick={onLogin}>تسجيل الدخول</button></div>
    </div>
  );
}
