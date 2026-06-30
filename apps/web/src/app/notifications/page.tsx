'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HijriDate } from '@/components/HijriDate';

interface Notif {
  id: string; type: string; message: string; link?: string | null; read: boolean; createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ items: Notif[] }>('/notifications')
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
    // علّم الكل كمقروء عند الفتح
    api('/notifications', { method: 'PATCH' }).catch(() => {});
  }, [user]);

  if (!ready) return <p className="py-16 text-center text-gray-400">جارٍ التحميل...</p>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🔔</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض إشعاراتك</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🔔 الإشعارات</h1>
        <button onClick={() => router.push('/account')} className="text-sm font-bold text-brand">← حسابي</button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-4xl">🔕</p>
          <p className="mt-3">لا توجد إشعارات بعد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => n.link && router.push(n.link)}
              className={`card flex w-full items-start gap-3 p-4 text-right ${n.read ? '' : 'ring-2 ring-brand/30'}`}>
              {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
              <div className="flex-1">
                <p className="font-bold text-gray-800">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400"><HijriDate value={n.createdAt} short /></p>
              </div>
              {n.link && <span className="text-gray-300">‹</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
