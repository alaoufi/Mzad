'use client';

import { useEffect, useState } from 'react';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HijriDate } from '@/components/HijriDate';

interface Dispute {
  id: string;
  reason: string;
  detail?: string | null;
  status: string;
  resolution?: string | null;
  createdAt: string;
  listing?: { id: string; title: string } | null;
  openedBy?: { name: string; phone: string } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'مفتوح', cls: 'bg-amber-100 text-amber-700' },
  REVIEWING: { label: 'قيد المراجعة', cls: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'محلول', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'مرفوض', cls: 'bg-gray-200 text-gray-600' },
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api<{ disputes: Dispute[] }>('/admin/disputes')
      .then((r) => setDisputes(r.disputes))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setStatus = async (id: string, status: string) => {
    try { await api(`/admin/disputes/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (e: any) { uiToast(e.message); }
  };
  const resolve = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    const resolution = await uiPrompt(status === 'RESOLVED' ? 'قرار الإدارة (الحل):' : 'سبب الرفض:');
    if (resolution === null) return;
    try { await api(`/admin/disputes/${id}`, { method: 'PATCH', body: JSON.stringify({ status, resolution }) }); load(); }
    catch (e: any) { uiToast(e.message); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">⚖️</p>
          <p className="mb-4 text-lg">مركز النزاعات — سجّل الدخول بحساب مشرف</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  const openCount = disputes.filter((d) => d.status === 'OPEN' || d.status === 'REVIEWING').length;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">⚖️ مركز النزاعات</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>
      <p className="text-sm text-gray-500">{openCount} نزاع مفتوح يحتاج قراراً.</p>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      {disputes.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">لا توجد نزاعات 🎉</div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const st = STATUS[d.status] ?? STATUS.OPEN;
            const done = d.status === 'RESOLVED' || d.status === 'REJECTED';
            return (
              <div key={d.id} className={`card p-4 ${done ? 'opacity-70' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${st.cls}`}>{st.label}</span>
                  <span className="text-xs text-gray-400"><HijriDate value={d.createdAt} short /></span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  فتحه: {d.openedBy?.name ?? '—'} ({d.openedBy?.phone ?? '—'})
                </div>
                {d.listing && (
                  <Link href={`/listings/${d.listing.id}`} className="mt-1 block font-bold hover:text-brand">📋 {d.listing.title}</Link>
                )}
                <p className="mt-1 font-bold">{d.reason}</p>
                {d.detail && <p className="mt-1 text-sm text-gray-600">{d.detail}</p>}
                {d.resolution && (
                  <div className="mt-3 rounded-2xl bg-green-50 p-3 text-sm text-green-800"><b>القرار:</b> {d.resolution}</div>
                )}
                {!done && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {d.status === 'OPEN' && (
                      <button onClick={() => setStatus(d.id, 'REVIEWING')}
                        className="rounded-xl bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">بدء المراجعة</button>
                    )}
                    <button onClick={() => resolve(d.id, 'RESOLVED')}
                      className="rounded-xl bg-green-600 px-4 py-1.5 text-sm font-bold text-white">✔ حلّ بقرار</button>
                    <button onClick={() => resolve(d.id, 'REJECTED')}
                      className="rounded-xl bg-gray-200 px-4 py-1.5 text-sm font-bold text-gray-700">رفض</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
