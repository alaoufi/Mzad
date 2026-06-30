'use client';

import { useEffect, useState } from 'react';
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
}

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'مفتوح', cls: 'bg-amber-100 text-amber-700' },
  REVIEWING: { label: 'قيد المراجعة', cls: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'محلول', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'مرفوض', cls: 'bg-gray-200 text-gray-600' },
};

export default function DisputesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ disputes: Dispute[] }>('/disputes')
      .then((r) => setDisputes(r.disputes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">⚖️</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض نزاعاتك</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">⚖️ نزاعاتي</h1>
        <button onClick={() => router.push('/account')} className="text-sm font-bold text-brand">← حسابي</button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>
      ) : disputes.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <p className="text-4xl">🤝</p>
          <p className="mt-3">لا توجد نزاعات — نتمنّى أن تبقى صفقاتك سليمة.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const st = STATUS[d.status] ?? STATUS.OPEN;
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${st.cls}`}>{st.label}</span>
                  <span className="text-xs text-gray-400"><HijriDate value={d.createdAt} short /></span>
                </div>
                {d.listing && (
                  <Link href={`/listings/${d.listing.id}`} className="mt-2 block font-bold hover:text-brand">
                    📋 {d.listing.title}
                  </Link>
                )}
                <p className="mt-1 font-bold">{d.reason}</p>
                {d.detail && <p className="mt-1 text-sm text-gray-600">{d.detail}</p>}
                {d.resolution && (
                  <div className="mt-3 rounded-2xl bg-green-50 p-3 text-sm text-green-800">
                    <b>قرار الإدارة:</b> {d.resolution}
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
