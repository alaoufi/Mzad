'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiToast } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { accountTypeDef } from '@/lib/roles';

const TARGET_LABEL: Record<string, string> = { listing: 'إعلان', user: 'مستخدم', message: 'رسالة', auction: 'مزاد' };

export default function AdminMarketPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => api<any>('/admin/stats').then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user]);

  const setIdentity = async (id: string, identityStatus: string) => { try { await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ identityStatus }) }); load(); } catch (e: any) { uiToast(e.message, 'error'); } };
  const setReportStatus = async (id: string, status: string) => { try { await api(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); } catch (e: any) { uiToast(e.message, 'error'); } };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">للإدارة فقط.</p>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) return <div className="card p-6 text-center text-red-600">{error}</div>;

  const s = data.stats;
  const links = [
    { label: 'المستخدمون', icon: '👥', href: '/admin/users' },
    { label: 'النزاعات', icon: '⚖️', href: '/admin/disputes', badge: s.disputes },
    { label: 'الدلالون', icon: '🎖️', href: '/brokers' },
  ];

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ الإدارة</button>
        <h1 className="text-xl font-extrabold text-engrave">⚖️ السوق والمستخدمون والنزاعات</h1>
      </div>

      {/* حركة السوق */}
      <div className="grid grid-cols-3 gap-2">
        {[['👥 مستخدمون', s.users], ['📋 إعلانات', s.listings], ['🟢 نشطة', s.activeListings], ['🔨 مزادات', s.auctions], ['💰 مزايدات', s.bids], ['🚩 بلاغات', s.reports]].map(([l, v]) => (
          <div key={l as string} className="card float-box p-2 text-center">
            <div className="text-lg font-extrabold text-brand-dark text-emboss">{v as number}</div>
            <div className="text-[10px] leading-tight text-gray-500">{l as string}</div>
          </div>
        ))}
      </div>

      {/* روابط */}
      <div className="grid grid-cols-3 gap-2">
        {links.map((l) => (
          <button key={l.href} onClick={() => router.push(l.href)} className="card float-box relative flex flex-col items-center justify-center gap-1 p-3 text-center transition active:scale-95">
            {!!l.badge && l.badge > 0 && <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{l.badge}</span>}
            <span className="text-xl">{l.icon}</span><span className="text-[11px] font-bold text-gray-700">{l.label}</span>
          </button>
        ))}
      </div>

      {/* طلبات التوثيق */}
      <div className="card p-4">
        <h2 className="mb-3 text-lg font-bold">🛡️ طلبات توثيق الهوية ({data.verifications.length})</h2>
        {data.verifications.length === 0 ? <p className="py-4 text-center text-gray-400">لا طلبات معلّقة 🎉</p> : (
          <div className="space-y-2">
            {data.verifications.map((u: any) => (
              <div key={u.id} className="rounded-2xl bg-sand-50 p-3">
                <div className="font-bold">{u.name}</div>
                <div className="text-xs text-gray-500">{u.phone}{(u.city || u.region) && ` · ${[u.city, u.region].filter(Boolean).join('، ')}`} · {accountTypeDef(u.accountType).emoji} {accountTypeDef(u.accountType).label}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setIdentity(u.id, 'VERIFIED')} className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-bold text-white">✔ توثيق</button>
                  <button onClick={() => setIdentity(u.id, 'NONE')} className="flex-1 rounded-xl bg-gray-200 py-2 text-sm font-bold text-gray-700">رفض</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* البلاغات */}
      {data.openReports.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">🚩 بلاغات مفتوحة ({data.openReports.length})</h2>
          <ul className="space-y-2">
            {data.openReports.map((r: any) => (
              <li key={r.id} className="rounded-xl bg-red-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <b>{TARGET_LABEL[r.targetType] ?? r.targetType}</b>
                  {r.targetType === 'listing' && <Link href={`/listings/${r.targetId}`} className="text-xs font-bold text-brand">عرض ↗</Link>}
                </div>
                <p className="mt-1 text-gray-700">{r.reason}</p>
                <div className="mt-1 text-xs text-gray-400">بلّغ: {r.reporter?.name ?? '—'}{r.status === 'REVIEWING' && ' · قيد المراجعة'}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setReportStatus(r.id, 'RESOLVED')} className="flex-1 rounded-xl bg-green-600 py-1.5 text-xs font-bold text-white">✔ عولج</button>
                  {r.status !== 'REVIEWING' && <button onClick={() => setReportStatus(r.id, 'REVIEWING')} className="flex-1 rounded-xl bg-amber-100 py-1.5 text-xs font-bold text-amber-700">قيد المراجعة</button>}
                  <button onClick={() => setReportStatus(r.id, 'REJECTED')} className="flex-1 rounded-xl bg-gray-200 py-1.5 text-xs font-bold text-gray-700">رفض</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
