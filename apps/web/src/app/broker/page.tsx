'use client';

import { useEffect, useState } from 'react';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Countdown } from '@/components/Countdown';
import { HijriDate } from '@/components/HijriDate';
import { isOpenEnd } from '@/lib/auction';

interface BAuction {
  id: string; listingId: string; title: string; city: string; image?: string | null;
  status: string; startAt: string; endAt: string; startPrice: string; bids: number;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: 'مجدول', cls: 'bg-blue-100 text-blue-700' },
  LIVE: { label: 'مباشر الآن', cls: 'bg-green-100 text-green-700' },
  ENDED: { label: 'منتهٍ', cls: 'bg-gray-200 text-gray-600' },
  CANCELLED: { label: 'ملغي', cls: 'bg-red-100 text-red-700' },
};

export default function BrokerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<BAuction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api<{ auctions: BAuction[] }>('/broker/auctions')
      .then((r) => setItems(r.auctions)).catch((e) => setError(e.message)).finally(() => setLoading(false));

  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user]);

  const act = async (id: string, action: string) => {
    if (action === 'cancel' && !await uiConfirm('إلغاء هذا المزاد؟')) return;
    try { await api(`/auctions/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }); load(); }
    catch (e: any) { uiToast(e.message); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🧑‍⚖️</p>
          <p className="mb-4 text-lg">لوحة الدلال — سجّل الدخول بحساب دلال</p>
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
        <p className="mt-1 text-sm text-gray-500">تحتاج صلاحية دلال. اطلبها من الإدارة.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🧑‍⚖️ لوحة الدلال</h1>
        <button onClick={() => router.push('/sell')} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">＋ مزاد جديد</button>
      </div>
      <p className="text-sm text-gray-500">جدول مزاداتك بموعد بداية، وابدأها أو ألغها. تتحوّل تلقائياً: مجدول ← مباشر ← منتهٍ.</p>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <p className="text-4xl">📭</p>
          <p className="mt-3">لا توجد مزادات تديرها بعد</p>
          <button className="btn-primary mt-4" onClick={() => router.push('/sell')}>أنشئ مزاداً مجدولاً</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const st = STATUS[a.status] ?? { label: a.status, cls: 'bg-gray-100' };
            const open = isOpenEnd(a.endAt);
            return (
              <div key={a.id} className="card p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-sand-100">
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt="" className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center text-2xl">🐾</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/listings/${a.listingId}`} className="block truncate font-bold hover:text-brand">{a.title}</Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`rounded-full px-2 py-0.5 font-bold ${st.cls}`}>{st.label}</span>
                      <span>{a.bids} مزايدة</span>
                      {a.status === 'SCHEDULED' && <span>يبدأ خلال <Countdown endAt={a.startAt} /></span>}
                      {a.status === 'LIVE' && !open && <span>ينتهي خلال <Countdown endAt={a.endAt} /></span>}
                    </div>
                    {a.status === 'SCHEDULED' && (
                      <div className="mt-0.5 text-[11px] text-gray-400">🗓️ <HijriDate value={a.startAt} withTime /></div>
                    )}
                  </div>
                </div>
                {(a.status === 'SCHEDULED' || a.status === 'LIVE') && (
                  <div className="mt-2 flex gap-2">
                    {a.status === 'SCHEDULED' && (
                      <button onClick={() => act(a.id, 'start')} className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-bold text-white">▶ ابدأ الآن</button>
                    )}
                    <button onClick={() => act(a.id, 'cancel')} className="flex-1 rounded-xl bg-red-100 py-2 text-sm font-bold text-red-600">إلغاء</button>
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
