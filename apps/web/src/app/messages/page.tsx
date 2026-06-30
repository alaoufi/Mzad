'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Conv {
  id: string;
  listingId: string;
  title: string;
  image?: string | null;
  otherName: string;
  iAmSeller: boolean;
  lastMessage: string;
  lastAt: string;
}

const time = (s: string) => {
  try {
    const d = new Date(s);
    const today = new Date();
    const same = d.toDateString() === today.toDateString();
    return same
      ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d)
      : new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'numeric' }).format(d);
  } catch { return ''; }
};

export default function MessagesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ conversations: Conv[] }>('/conversations/mine')
      .then((r) => setConvs(r.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!ready) return <p className="py-16 text-center text-gray-400">جارٍ التحميل...</p>;
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
      <h1 className="mb-4 text-2xl font-extrabold text-engrave">💬 رسائلي</h1>
      {loading ? (
        <p className="py-8 text-center text-gray-500">جارٍ التحميل...</p>
      ) : convs.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <p className="text-4xl">📭</p>
          <p className="mt-3">لا توجد محادثات بعد</p>
          <p className="text-sm">افتح إعلاناً واضغط «مراسلة خاصة» للتواصل مع البائع.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-sand-200">
          {convs.map((c, i) => (
            <Link key={c.id} href={`/messages/${c.id}`}
              className={`flex items-center gap-3 p-3 transition hover:bg-sand-50 ${i ? 'border-t border-sand-100' : ''}`}>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sand-100">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl">🐾</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-gray-800">{c.otherName}</span>
                  <span className="shrink-0 text-[11px] text-gray-400">{time(c.lastAt)}</span>
                </div>
                <div className="truncate text-xs text-gray-400">📋 {c.title}</div>
                <div className="truncate text-sm text-gray-500">{c.lastMessage || 'لا رسائل بعد'}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
