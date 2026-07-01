'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiToast, uiConfirm } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AdminNav } from '@/components/AdminNav';

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'نشط', DRAFT: 'بانتظار الموافقة', SOLD: 'مُباع', CLOSED: 'مخفي' };

export function ListingsSection({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const load = () => api<any>('/admin/stats').then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user]);

  const setStatus = async (id: string, status: string) => { try { await api(`/admin/listings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); } catch (e: any) { uiToast(e.message, 'error'); } };
  const remove = async (id: string) => { if (!await uiConfirm('حذف هذا الإعلان نهائياً؟')) return; try { await api(`/admin/listings/${id}`, { method: 'DELETE' }); load(); } catch (e: any) { uiToast(e.message, 'error'); } };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">للإدارة فقط.</p>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) return <div className="card p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="animate-fadeup space-y-4">
      {!embedded && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/admin')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ الإدارة</button>
            <h1 className="text-2xl font-extrabold text-engrave">📋 إدارة الإعلانات</h1>
          </div>
          <AdminNav />
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[['pending', `بانتظار الموافقة (${data.stats.pending})`], ['all', 'كل الإعلانات']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} className={`rounded-2xl py-2.5 text-sm font-bold transition ${tab === k ? 'bg-brand text-white' : 'bg-white ring-1 ring-sand-200 text-gray-600'}`}>{l}</button>
        ))}
      </div>

      {tab === 'pending' ? (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">⏳ إعلانات بانتظار موافقتك</h2>
          {data.pendingList.length === 0 ? <p className="py-6 text-center text-gray-400">لا شيء بانتظار الموافقة 🎉</p> : (
            <div className="space-y-2">
              {data.pendingList.map((l: any) => (
                <div key={l.id} className="rounded-2xl bg-amber-50 p-3">
                  <Link href={`/listings/${l.id}`} className="font-bold hover:text-brand">{l.title}</Link>
                  <div className="text-xs text-gray-500">{l.category?.parent?.name} / {l.category?.name} · {l.city} · {l.seller?.name}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setStatus(l.id, 'ACTIVE')} className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-bold text-white">✔ موافقة</button>
                    <button onClick={() => setStatus(l.id, 'CLOSED')} className="flex-1 rounded-xl bg-gray-200 py-2 text-sm font-bold text-gray-700">رفض</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">أحدث الإعلانات</h2>
          <div className="space-y-2">
            {data.recent.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${l.id}`} className="truncate font-bold hover:text-brand">{l.title}</Link>
                  <div className="text-xs text-gray-500">{l.city} · {l.seller?.name} · <b>{STATUS_LABEL[l.status] ?? l.status}</b>{l.saleType === 'AUCTION' && ' · 🔨'}</div>
                </div>
                {l.status !== 'ACTIVE' && <button onClick={() => setStatus(l.id, 'ACTIVE')} className="shrink-0 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700">إظهار</button>}
                {l.status === 'ACTIVE' && <button onClick={() => setStatus(l.id, 'CLOSED')} className="shrink-0 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700">إخفاء</button>}
                <button onClick={() => remove(l.id)} className="shrink-0 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-600">حذف</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

