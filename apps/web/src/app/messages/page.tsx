'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Conv {
  listingId: string;
  title: string;
  image?: string | null;
  lastMessage: string;
  count: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ conversations: Conv[] }>('/conversations/mine')
      .then((r) => setConvs(r.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">💬</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض رسائلك</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeup">
      <h1 className="mb-4 text-2xl font-extrabold">رسائلي</h1>
      {loading ? (
        <p className="py-8 text-center text-gray-500">جارٍ التحميل...</p>
      ) : convs.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <p className="text-4xl">📭</p>
          <p className="mt-3">لا توجد محادثات بعد</p>
          <p className="text-sm">راسل بائعاً من صفحة الإعلان</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((c) => (
            <Link key={c.listingId} href={`/listings/${c.listingId}`}
              className="card flex items-center gap-3 p-3 hover:shadow-md">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-sand-100">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🐾</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{c.title}</div>
                <div className="truncate text-sm text-gray-500">{c.lastMessage || 'لا رسائل'}</div>
              </div>
              <span className="chip">{c.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
