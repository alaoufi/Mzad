'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ACCOUNT_TYPES, accountTypeDef } from '@/lib/roles';

interface AdminData {
  stats: { users: number; listings: number; activeListings: number; pending: number; auctions: number; bids: number; reports: number };
  recent: any[];
  pendingList: any[];
  usersList: any[];
  openReports: any[];
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'نشط', DRAFT: 'بانتظار الموافقة', SOLD: 'مُباع', CLOSED: 'مخفي' };

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'listings' | 'users'>('pending');
  const [entryMode, setEntryMode] = useState<'GENERAL' | 'SPECIALIZED'>('GENERAL');

  const load = () =>
    api<AdminData>('/admin/stats').then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    api<{ entryMode: 'GENERAL' | 'SPECIALIZED' }>('/admin/settings').then((r) => setEntryMode(r.entryMode)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const changeEntryMode = async (m: 'GENERAL' | 'SPECIALIZED') => {
    setEntryMode(m);
    try { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify({ entryMode: m }) }); }
    catch (e: any) { alert(e.message); }
  };

  const setStatus = async (id: string, status: string) => {
    try { await api(`/admin/listings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (e: any) { alert(e.message); }
  };
  const remove = async (id: string) => {
    if (!confirm('حذف هذا الإعلان نهائياً؟')) return;
    try { await api(`/admin/listings/${id}`, { method: 'DELETE' }); load(); } catch (e: any) { alert(e.message); }
  };
  const setRole = async (id: string, accountType: string) => {
    try { await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ accountType }) }); load(); }
    catch (e: any) { alert(e.message); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🛡️</p>
          <p className="mb-4 text-lg">لوحة الإدارة — سجّل الدخول بحساب مشرف</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-5xl">🚫</p>
        <p className="mt-3 text-lg font-bold">{error}</p>
        <p className="mt-1 text-sm text-gray-500">ادخل بحساب الإدارة (الجوال 0500000000).</p>
      </div>
    );
  }
  if (!data) return null;

  const cards = [
    { label: 'المستخدمون', value: data.stats.users, icon: '👥' },
    { label: 'الإعلانات', value: data.stats.listings, icon: '📋' },
    { label: 'بانتظار الموافقة', value: data.stats.pending, icon: '⏳' },
    { label: 'المزادات', value: data.stats.auctions, icon: '🔨' },
    { label: 'المزايدات', value: data.stats.bids, icon: '💰' },
    { label: 'البلاغات', value: data.stats.reports, icon: '🚩' },
  ];

  return (
    <div className="animate-fadeup space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🛡️ لوحة الإدارة</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push('/admin/categories')}
            className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white">🗂️ التصنيفات</button>
          <button onClick={() => router.push('/admin/health')}
            className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white">🩺 الحالة الصحية</button>
          <button onClick={() => router.push('/admin/marketing')}
            className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white">📣 التسويق</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card float-box p-4 text-center">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-1 text-2xl font-extrabold text-brand-dark text-emboss">{c.value}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* وضع الدخول: عام أو متخصص */}
      <div className="card p-4">
        <h2 className="mb-1 text-lg font-bold">🚪 وضع الدخول للموقع</h2>
        <p className="mb-3 text-sm text-gray-500">
          العام: يتصفّح الزائر كل الأسواق مختلطة. المتخصص: يختار النوع أول دخول ويتصفّح داخله كأنه موقع مستقل بثيمه.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([['GENERAL', '🌐 عام', 'كل الأنواع مختلطة'], ['SPECIALIZED', '🎯 متخصص', 'يختار النوع أولاً']] as [typeof entryMode, string, string][]).map(
            ([m, label, hint]) => (
              <button key={m} onClick={() => changeEntryMode(m)}
                className={`rounded-2xl border-2 p-3 text-right transition ${entryMode === m ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>
                <div className="font-bold">{label}</div>
                <div className="text-xs text-gray-500">{hint}</div>
              </button>
            ),
          )}
        </div>
      </div>

      {/* تبويبات */}
      <div className="flex gap-2">
        {[
          ['pending', `بانتظار الموافقة (${data.stats.pending})`],
          ['listings', 'كل الإعلانات'],
          ['users', 'المستخدمون'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${
              tab === k ? 'bg-brand text-white' : 'bg-white ring-1 ring-sand-200 text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* بانتظار الموافقة */}
      {tab === 'pending' && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">⏳ إعلانات بانتظار موافقتك</h2>
          {data.pendingList.length === 0 ? (
            <p className="py-6 text-center text-gray-400">لا توجد إعلانات بانتظار الموافقة 🎉</p>
          ) : (
            <div className="space-y-2">
              {data.pendingList.map((l) => (
                <div key={l.id} className="rounded-2xl bg-amber-50 p-3">
                  <Link href={`/listings/${l.id}`} className="font-bold hover:text-brand">{l.title}</Link>
                  <div className="text-xs text-gray-500">
                    {l.category?.parent?.name} / {l.category?.name} · {l.city} · {l.seller?.name}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setStatus(l.id, 'ACTIVE')}
                      className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-bold text-white">✔ موافقة</button>
                    <button onClick={() => setStatus(l.id, 'CLOSED')}
                      className="flex-1 rounded-xl bg-gray-200 py-2 text-sm font-bold text-gray-700">رفض</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* كل الإعلانات */}
      {tab === 'listings' && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">أحدث الإعلانات</h2>
          <div className="space-y-2">
            {data.recent.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${l.id}`} className="truncate font-bold hover:text-brand">{l.title}</Link>
                  <div className="text-xs text-gray-500">
                    {l.city} · {l.seller?.name} · <b>{STATUS_LABEL[l.status] ?? l.status}</b>
                    {l.saleType === 'AUCTION' && ' · 🔨'}
                  </div>
                </div>
                {l.status !== 'ACTIVE' && (
                  <button onClick={() => setStatus(l.id, 'ACTIVE')}
                    className="shrink-0 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700">إظهار</button>
                )}
                {l.status === 'ACTIVE' && (
                  <button onClick={() => setStatus(l.id, 'CLOSED')}
                    className="shrink-0 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700">إخفاء</button>
                )}
                <button onClick={() => remove(l.id)}
                  className="shrink-0 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-600">حذف</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* المستخدمون */}
      {tab === 'users' && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">إدارة المستخدمين والصلاحيات</h2>
          <div className="space-y-2">
            {data.usersList.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{u.name}</div>
                  <div className="text-xs text-gray-500">
                    {u.phone} · {accountTypeDef(u.accountType).emoji} {accountTypeDef(u.accountType).label}
                  </div>
                </div>
                <select value={u.accountType ?? 'SHOPPER'} onChange={(e) => setRole(u.id, e.target.value)}
                  className="rounded-xl border-2 border-sand-200 bg-white px-2 py-2 text-sm font-bold">
                  {ACCOUNT_TYPES.map((a) => (
                    <option key={a.key} value={a.key}>{a.emoji} {a.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* البلاغات */}
      {data.openReports.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">🚩 بلاغات مفتوحة</h2>
          <ul className="space-y-2">
            {data.openReports.map((r) => (
              <li key={r.id} className="rounded-xl bg-red-50 p-3 text-sm"><b>{r.targetType}</b> — {r.reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
