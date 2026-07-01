'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { uiToast, uiConfirm } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ACCOUNT_TYPES, accountTypeDef, roleForAccountType } from '@/lib/roles';
import { RegionCityPicker } from '@/components/RegionCityPicker';

interface AdminUser {
  id: string; name: string; phone: string; role: string; accountType?: string;
  identityStatus: string; active?: boolean; city?: string | null; region?: string | null;
  bio?: string | null; experienceYears?: number | null;
  bankName?: string | null; bankAccount?: string | null; iban?: string | null;
  brokerSharePct?: number | null; brokerCategories?: string[];
  trustScore?: number; _count?: { listings: number; bids: number };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<AdminUser | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const load = useCallback((query = '') => {
    setLoading(true);
    api<{ users: AdminUser[] }>(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then((r) => setUsers(r.users)).catch((e) => uiToast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (user) load(); else setLoading(false); }, [user, load]);

  const patch = async (id: string, body: any) => {
    try { await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); load(q); }
    catch (e: any) { uiToast(e.message, 'error'); }
  };
  const del = async (u: AdminUser) => {
    if (!await uiConfirm(`حذف المستخدم «${u.name}» نهائياً؟`)) return;
    try { await api(`/admin/users/${u.id}`, { method: 'DELETE' }); uiToast('تم الحذف', 'success'); load(q); }
    catch (e: any) { uiToast(e.message, 'error'); }
  };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">ادخل بحساب الإدارة.</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ الإدارة</button>
        <h1 className="text-2xl font-extrabold text-engrave">👥 المستخدمون</h1>
      </div>

      {/* بحث */}
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="🔍 ابحث بالاسم أو الجوال..." value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(q); }} />
        <button onClick={() => load(q)} className="btn-primary !min-h-0 !px-5 !py-2">بحث</button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>
      ) : (
        <div className="space-y-2">
          {users.length === 0 && <p className="py-6 text-center text-gray-400">لا نتائج</p>}
          {users.map((u) => (
            <div key={u.id} className={`card p-3 ${u.active === false ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-extrabold text-brand-dark">{u.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate font-bold">
                    <span className="truncate">{u.name}</span>
                    {u.identityStatus === 'VERIFIED' && <span className="shrink-0 text-green-600" title="موثّق">✔</span>}
                    {roleForAccountType(u.accountType) !== 'USER' && (
                      <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold text-brand-dark" title="له مسؤولية في الموقع">
                        {accountTypeDef(u.accountType).emoji} {accountTypeDef(u.accountType).label}
                      </span>
                    )}
                    {u.active === false && <span className="shrink-0 text-xs text-red-500">(معطّل)</span>}
                  </div>
                  <div className="truncate text-xs text-gray-500">
                    {u.phone}{(u.city || u.region) ? ` · ${[u.city, u.region].filter(Boolean).join('، ')}` : ''}
                    {' · '}📋 {u._count?.listings ?? 0} · 💰 {u._count?.bids ?? 0}
                  </div>
                </div>
                <button onClick={() => setEdit(u)} className="shrink-0 rounded-xl bg-brand/10 px-3 py-2 text-sm font-bold text-brand-dark">✏️ تعديل</button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={u.accountType ?? 'SHOPPER'} onChange={(e) => patch(u.id, { accountType: e.target.value })}
                  className="rounded-xl border-2 border-sand-200 bg-white px-2 py-1.5 text-sm font-bold">
                  {ACCOUNT_TYPES.map((a) => <option key={a.key} value={a.key}>{a.emoji} {a.label}</option>)}
                </select>
                {u.identityStatus !== 'VERIFIED' ? (
                  <button onClick={() => patch(u.id, { identityStatus: 'VERIFIED' })} className="rounded-xl bg-green-100 px-3 py-1.5 text-sm font-bold text-green-700">✔ توثيق</button>
                ) : (
                  <button onClick={() => patch(u.id, { identityStatus: 'NONE' })} className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-600">إلغاء التوثيق</button>
                )}
                <button onClick={() => patch(u.id, { active: u.active === false })}
                  className={`rounded-xl px-3 py-1.5 text-sm font-bold ${u.active === false ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {u.active === false ? '▶ تفعيل' : '⏸ تعطيل'}
                </button>
                <button onClick={() => del(u)} className="mr-auto rounded-xl bg-red-100 px-3 py-1.5 text-sm font-bold text-red-600">🗑 حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && mounted && createPortal(
        <UserEditModal u={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(q); }} />, document.body)}
    </div>
  );
}

function UserEditModal({ u, onClose, onSaved }: { u: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: u.name ?? '', phone: u.phone ?? '', city: u.city ?? '', region: u.region ?? '',
    bio: u.bio ?? '', experienceYears: u.experienceYears != null ? String(u.experienceYears) : '',
    bankName: u.bankName ?? '', bankAccount: u.bankAccount ?? '', iban: u.iban ?? '',
  });
  // المسؤوليات والصلاحيات — منفصلة عن البيانات الشخصية
  const [accountType, setAccountType] = useState(u.accountType ?? 'SHOPPER');
  const [identityStatus, setIdentityStatus] = useState(u.identityStatus ?? 'NONE');
  const [active, setActive] = useState(u.active !== false);
  const [brokerSharePct, setBrokerSharePct] = useState(u.brokerSharePct != null ? String(u.brokerSharePct) : '');
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const isBroker = roleForAccountType(accountType) === 'BROKER';
  const scopeCount = u.brokerCategories?.length ?? 0;

  const save = async () => {
    if (!f.name.trim() || !f.phone.trim()) { uiToast('الاسم والجوال مطلوبان', 'error'); return; }
    setSaving(true);
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({
        // البيانات الشخصية
        name: f.name.trim(), phone: f.phone.trim(), city: f.city.trim() || null, region: f.region.trim() || null,
        bio: f.bio.trim() || null, experienceYears: f.experienceYears ? Number(f.experienceYears) : null,
        bankName: f.bankName.trim() || null, bankAccount: f.bankAccount.trim() || null, iban: f.iban.trim() || null,
        // المسؤوليات والصلاحيات
        accountType, identityStatus, active,
        brokerSharePct: isBroker ? (brokerSharePct === '' ? null : Number(brokerSharePct)) : null,
      }) });
      uiToast('✅ حُفظت بيانات المستخدم', 'success');
      onSaved();
    } catch (e: any) { uiToast(e.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">✏️ تعديل المستخدم</h3>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400">×</button>
        </div>

        {/* القسم ١: البيانات الشخصية */}
        <div className="mb-4 rounded-2xl border-2 border-sand-200 p-3">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-gray-700">👤 البيانات الشخصية</p>
          <div className="space-y-3">
            <F label="الاسم"><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></F>
            <F label="الجوال"><input className="input" inputMode="numeric" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></F>
            <RegionCityPicker region={f.region} city={f.city} onChange={(r, c) => setF((p) => ({ ...p, region: r, city: c }))} />
            <F label="التعريف"><textarea className="input min-h-[56px]" value={f.bio} onChange={(e) => set('bio', e.target.value)} /></F>
            <F label="سنوات الخبرة"><input className="input" inputMode="numeric" value={f.experienceYears} onChange={(e) => set('experienceYears', e.target.value.replace(/\D/g, ''))} /></F>
            <div className="rounded-xl bg-sand-50 p-3">
              <p className="mb-2 text-xs font-extrabold text-brand-dark">🏦 البيانات البنكية</p>
              <div className="space-y-3">
                <F label="البنك"><input className="input" value={f.bankName} onChange={(e) => set('bankName', e.target.value)} /></F>
                <F label="رقم الحساب"><input className="input" inputMode="numeric" value={f.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} /></F>
                <F label="الآيبان"><input className="input" value={f.iban} onChange={(e) => set('iban', e.target.value)} /></F>
              </div>
            </div>
          </div>
        </div>

        {/* القسم ٢: المسؤوليات والصلاحيات في الموقع — مفصولة بوضوح */}
        <div className="mb-1 rounded-2xl border-2 border-brand/30 bg-brand/5 p-3">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-brand-dark">🛡️ المسؤوليات والصلاحيات في الموقع</p>
          <div className="space-y-3">
            <F label="الدور / المسؤولية">
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)}
                className="input" >
                {ACCOUNT_TYPES.map((a) => <option key={a.key} value={a.key}>{a.emoji} {a.label}</option>)}
              </select>
            </F>
            <F label="توثيق الهوية">
              <select value={identityStatus} onChange={(e) => setIdentityStatus(e.target.value)} className="input">
                <option value="NONE">غير موثّق</option>
                <option value="PENDING">قيد المراجعة</option>
                <option value="VERIFIED">✔ موثّق</option>
              </select>
            </F>
            <label className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 ring-1 ring-sand-200">
              <span className="text-sm font-bold text-gray-700">الحساب مُفعّل</span>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5 accent-brand" />
            </label>
            {isBroker && (
              <div className="rounded-xl bg-white p-3 ring-1 ring-brand/20">
                <p className="mb-2 text-xs font-extrabold text-brand-dark">🧑‍⚖️ مسؤوليات الدلال</p>
                <F label="نصيب الدلال من العمولة % (اتركه فارغاً للنسبة العامة)">
                  <input className="input" inputMode="numeric" value={brokerSharePct}
                    onChange={(e) => setBrokerSharePct(e.target.value.replace(/[^\d.]/g, ''))} placeholder="مثال: 40" />
                </F>
                <p className="mt-2 text-xs text-gray-500">
                  نطاق التصنيفات المُسندة إليه: <b>{scopeCount}</b> تصنيف — يُدار بالتفصيل من لوحة «إدارة الدلالين ونطاقاتهم».
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">إلغاء</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? '...' : '💾 حفظ الكل'}</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-sm font-bold text-gray-600">{label}</label>{children}</div>;
}
