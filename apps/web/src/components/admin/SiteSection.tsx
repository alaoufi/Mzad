'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uiToast, uiConfirm } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { REQ_FIELD_OPTIONS } from '@/lib/sellFields';
import { AdminNav } from '@/components/AdminNav';

function Field({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-gray-600">{label}{hint && <span className="text-gray-400"> ({hint})</span>}</label>
      <input type="number" min={0} max={100} className="input !py-2 text-center" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

export function SiteSection({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entryMode, setEntryMode] = useState<'GENERAL' | 'SPECIALIZED'>('GENERAL');
  const [comm, setComm] = useState({ marketCommissionPct: 0, brokerSharePct: 0, supervisorSharePct: 0, commissionNote: '', zeroCommissionNote: '' });
  const [savingComm, setSavingComm] = useState(false);
  const [reqFields, setReqFields] = useState<string[]>([]);
  const [savingReq, setSavingReq] = useState(false);
  const [dbBusy, setDbBusy] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<any>('/admin/settings').then((r) => {
      setEntryMode(r.entryMode);
      setComm({ marketCommissionPct: r.marketCommissionPct ?? 0, brokerSharePct: r.brokerSharePct ?? 0, supervisorSharePct: r.supervisorSharePct ?? 0, commissionNote: r.commissionNote ?? '', zeroCommissionNote: r.zeroCommissionNote ?? '' });
      setReqFields(Array.isArray(r.reqFields) ? r.reqFields : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const changeEntryMode = async (m: 'GENERAL' | 'SPECIALIZED') => {
    setEntryMode(m);
    try { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify({ entryMode: m }) }); } catch (e: any) { uiToast(e.message); }
  };
  const saveCommission = async () => { setSavingComm(true); try { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify(comm) }); uiToast('✅ حُفظت العمولات', 'success'); } catch (e: any) { uiToast(e.message, 'error'); } finally { setSavingComm(false); } };
  const saveReqFields = async () => { setSavingReq(true); try { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify({ reqFields }) }); uiToast('✅ حُفظت الحقول المطلوبة', 'success'); } catch (e: any) { uiToast(e.message, 'error'); } finally { setSavingReq(false); } };
  const dbSetup = async () => {
    if (!await uiConfirm('تطبيق تهيئة قاعدة البيانات (إضافة الأعمدة الناقصة بأمان)؟')) return;
    setDbBusy(true);
    try { const r = await api<{ ok: boolean; applied: number; failed: any[] }>('/admin/db-setup', { method: 'POST' }); uiToast(r.ok ? `✅ تمّت التهيئة (${r.applied})` : `فشل ${r.failed.length}`, r.ok ? 'success' : 'error'); }
    catch (e: any) { uiToast(e.message, 'error'); } finally { setDbBusy(false); }
  };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">للإدارة فقط.</p>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  const services = [
    { label: 'التصنيفات', icon: '🗂️', href: '/admin/categories' },
    { label: 'الحالة الصحية', icon: '🩺', href: '/admin/health' },
    { label: 'النصوص', icon: '📝', href: '/admin/texts' },
    { label: 'الإعلانات المبوبة', icon: '📣', href: '/admin/ads' },
    { label: 'التسويق', icon: '🛠️', href: '/admin/marketing' },
    { label: 'الصلاحيات', icon: '🔑', href: '/admin/roles' },
  ];

  return (
    <div className="animate-fadeup space-y-4">
      {!embedded && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/admin')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ الإدارة</button>
            <h1 className="text-2xl font-extrabold text-engrave">⚙️ تجهيزات الموقع</h1>
          </div>
          <AdminNav />
        </>
      )}

      <div className="grid grid-cols-3 gap-2">
        {services.map((s) => (
          <button key={s.href} onClick={() => router.push(s.href)} className="card float-box flex flex-col items-center justify-center gap-1 p-3 text-center transition active:scale-95">
            <span className="text-xl">{s.icon}</span><span className="text-[11px] font-bold text-gray-700">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-lg font-bold">🚪 وضع الدخول للموقع</h2>
        <p className="mb-3 text-sm text-gray-500">العام: يتصفّح الزائر كل الأسواق مختلطة. المتخصص: يختار النوع أول دخول ويتصفّح داخله بثيمه.</p>
        <div className="grid grid-cols-2 gap-2">
          {([['GENERAL', '🌐 عام', 'كل الأنواع مختلطة'], ['SPECIALIZED', '🎯 متخصص', 'يختار النوع أولاً']] as [typeof entryMode, string, string][]).map(([m, label, hint]) => (
            <button key={m} onClick={() => changeEntryMode(m)} className={`rounded-2xl border-2 p-3 text-right transition ${entryMode === m ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>
              <div className="font-bold">{label}</div><div className="text-xs text-gray-500">{hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-bold">💰 العمولات</h2>
        <div className="grid grid-cols-3 gap-2">
          <Field label="عمولة السوق %" value={comm.marketCommissionPct} onChange={(v) => setComm((c) => ({ ...c, marketCommissionPct: v }))} />
          <Field label="نصيب الدلال %" hint="من العمولة" value={comm.brokerSharePct} onChange={(v) => setComm((c) => ({ ...c, brokerSharePct: v }))} />
          <Field label="نصيب المشرف %" hint="من العمولة" value={comm.supervisorSharePct} onChange={(v) => setComm((c) => ({ ...c, supervisorSharePct: v }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">عبارة الإفصاح (عند وجود عمولة)</label>
          <textarea className="input min-h-[60px]" value={comm.commissionNote} onChange={(e) => setComm((c) => ({ ...c, commissionNote: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-600">عبارة «بدون عمولة»</label>
          <textarea className="input min-h-[52px]" value={comm.zeroCommissionNote} placeholder="🎉 جميع العروض والمزادات بدون عمولة حالياً." onChange={(e) => setComm((c) => ({ ...c, zeroCommissionNote: e.target.value }))} />
        </div>
        <button onClick={saveCommission} disabled={savingComm} className="btn-primary w-full disabled:opacity-50">{savingComm ? '...' : 'حفظ العمولات'}</button>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-bold">📝 حقول الإعلان المطلوبة</h2>
        <p className="text-xs text-gray-500">حدّد الإلزامي عند إضافة الإعلان (العنوان والوصف والتصنيف والسعر إلزامية دائماً).</p>
        <div className="flex flex-wrap gap-2">
          {REQ_FIELD_OPTIONS.map((f) => {
            const on = reqFields.includes(f.key);
            return (
              <button key={f.key} type="button" onClick={() => setReqFields((p) => on ? p.filter((x) => x !== f.key) : [...p, f.key])}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${on ? 'bg-red-500 text-white ring-red-500' : 'bg-green-50 text-green-700 ring-green-200'}`}>
                {on ? '🔴 مطلوب' : '🟢 اختياري'} · {f.label}
              </button>
            );
          })}
        </div>
        <button onClick={saveReqFields} disabled={savingReq} className="btn-primary w-full disabled:opacity-50">{savingReq ? '...' : 'حفظ الحقول المطلوبة'}</button>
      </div>

      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div><div className="font-bold">تهيئة قاعدة البيانات</div><div className="text-xs text-gray-500">يطبّق الأعمدة الجديدة بأمان دون تكرار.</div></div>
        </div>
        <button onClick={dbSetup} disabled={dbBusy} className="btn-primary !min-h-0 !px-4 !py-2 !text-sm disabled:opacity-50">{dbBusy ? '...' : 'تطبيق'}</button>
      </div>
    </div>
  );
}

