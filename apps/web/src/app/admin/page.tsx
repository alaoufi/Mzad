'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ACCOUNT_TYPES, accountTypeDef } from '@/lib/roles';

interface AdminData {
  stats: { users: number; listings: number; activeListings: number; pending: number; auctions: number; bids: number; reports: number; verifications: number; disputes: number };
  recent: any[];
  pendingList: any[];
  usersList: any[];
  openReports: any[];
  verifications: any[];
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'نشط', DRAFT: 'بانتظار الموافقة', SOLD: 'مُباع', CLOSED: 'مخفي' };
const TARGET_LABEL: Record<string, string> = { listing: 'إعلان', user: 'مستخدم', message: 'رسالة', auction: 'مزاد' };

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'verify' | 'listings' | 'users'>('pending');
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
  const setIdentity = async (id: string, identityStatus: string) => {
    try { await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ identityStatus }) }); load(); }
    catch (e: any) { alert(e.message); }
  };
  const setReportStatus = async (id: string, status: string) => {
    try { await api(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
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

  const goReports = () => {
    if (typeof document !== 'undefined') document.getElementById('reports-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  const cards: { label: string; value: number; icon: string; act?: () => void }[] = [
    { label: 'المستخدمون', value: data.stats.users, icon: '👥', act: () => setTab('users') },
    { label: 'الإعلانات', value: data.stats.listings, icon: '📋', act: () => setTab('listings') },
    { label: 'بانتظار الموافقة', value: data.stats.pending, icon: '⏳', act: () => setTab('pending') },
    { label: 'طلبات التوثيق', value: data.stats.verifications, icon: '🛡️', act: () => setTab('verify') },
    { label: 'المزادات', value: data.stats.auctions, icon: '🔨', act: () => router.push('/broker') },
    { label: 'المزايدات', value: data.stats.bids, icon: '💰' },
    { label: 'البلاغات', value: data.stats.reports, icon: '🚩', act: goReports },
  ];

  const services = [
    { label: 'التصنيفات', icon: '🗂️', href: '/admin/categories' },
    { label: 'الحالة الصحية', icon: '🩺', href: '/admin/health' },
    { label: 'النزاعات', icon: '⚖️', href: '/admin/disputes', badge: data.stats.disputes },
    { label: 'التسويق', icon: '📣', href: '/admin/marketing' },
  ];

  return (
    <div className="animate-fadeup space-y-4">
      <h1 className="text-2xl font-extrabold text-engrave">🛡️ لوحة الإدارة</h1>

      {/* خدمات الإدارة — مربّعات مدمجة */}
      <div className="grid grid-cols-4 gap-2">
        {services.map((s) => (
          <button key={s.href} onClick={() => router.push(s.href)}
            className="card float-box relative flex flex-col items-center justify-center gap-1 p-2.5 text-center transition active:scale-95">
            {!!s.badge && s.badge > 0 && (
              <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{s.badge}</span>
            )}
            <span className="text-xl">{s.icon}</span>
            <span className="text-[11px] font-bold leading-tight text-gray-700">{s.label}</span>
          </button>
        ))}
      </div>

      {/* الإحصائيات — مربّعات مدمجة قابلة للنقر */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c) => {
          const inner = (
            <>
              <div className="text-base">{c.icon}</div>
              <div className="text-lg font-extrabold text-brand-dark text-emboss">{c.value}</div>
              <div className="text-[10px] leading-tight text-gray-500">{c.label}</div>
            </>
          );
          return c.act ? (
            <button key={c.label} onClick={c.act} className="card float-box p-2 text-center transition active:scale-95">{inner}</button>
          ) : (
            <div key={c.label} className="card float-box p-2 text-center">{inner}</div>
          );
        })}
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
          ['verify', `التوثيق (${data.stats.verifications})`],
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

      {/* طلبات التوثيق */}
      {tab === 'verify' && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">🛡️ طلبات توثيق الهوية</h2>
          {data.verifications.length === 0 ? (
            <p className="py-6 text-center text-gray-400">لا توجد طلبات توثيق معلّقة 🎉</p>
          ) : (
            <div className="space-y-2">
              {data.verifications.map((u) => (
                <div key={u.id} className="rounded-2xl bg-sand-50 p-3">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-xs text-gray-500">
                    {u.phone}{(u.city || u.region) && ` · ${[u.city, u.region].filter(Boolean).join('، ')}`}
                    {' · '}{accountTypeDef(u.accountType).emoji} {accountTypeDef(u.accountType).label}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setIdentity(u.id, 'VERIFIED')}
                      className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-bold text-white">✔ توثيق</button>
                    <button onClick={() => setIdentity(u.id, 'NONE')}
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
                  <div className="truncate font-bold">
                    {u.name}{u.identityStatus === 'VERIFIED' && <span className="mr-1 text-green-600" title="موثّق">✔</span>}
                  </div>
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
        <div id="reports-section" className="card p-4 scroll-mt-4">
          <h2 className="mb-3 text-lg font-bold">🚩 بلاغات مفتوحة ({data.openReports.length})</h2>
          <ul className="space-y-2">
            {data.openReports.map((r) => (
              <li key={r.id} className="rounded-xl bg-red-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <b>{TARGET_LABEL[r.targetType] ?? r.targetType}</b>
                  {r.targetType === 'listing' && (
                    <Link href={`/listings/${r.targetId}`} className="text-xs font-bold text-brand">عرض ↗</Link>
                  )}
                </div>
                <p className="mt-1 text-gray-700">{r.reason}</p>
                <div className="mt-1 text-xs text-gray-400">
                  بلّغ: {r.reporter?.name ?? '—'}{r.status === 'REVIEWING' && ' · قيد المراجعة'}
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setReportStatus(r.id, 'RESOLVED')}
                    className="flex-1 rounded-xl bg-green-600 py-1.5 text-xs font-bold text-white">✔ عولج</button>
                  {r.status !== 'REVIEWING' && (
                    <button onClick={() => setReportStatus(r.id, 'REVIEWING')}
                      className="flex-1 rounded-xl bg-amber-100 py-1.5 text-xs font-bold text-amber-700">قيد المراجعة</button>
                  )}
                  <button onClick={() => setReportStatus(r.id, 'REJECTED')}
                    className="flex-1 rounded-xl bg-gray-200 py-1.5 text-xs font-bold text-gray-700">رفض</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
