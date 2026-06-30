'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HijriDate } from '@/components/HijriDate';

interface Msg { id: string; senderName: string; type?: string; body: string; mediaUrl?: string | null; transcript?: string | null; createdAt: string }
interface Conv { id: string; isPublic: boolean; buyerName: string | null; messages: Msg[] }
interface Data { listing: { id: string; title: string; sellerName: string }; conversations: Conv[] }

export default function AdminConversationsPage({ params }: { params: { listingId: string } }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<Data>(`/admin/conversations/${params.listingId}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, params.listingId]);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8"><p className="mb-4 text-5xl">📨</p><p className="mb-4 text-lg">للإدارة فقط</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button></div>
      </div>
    );
  }
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) return <div className="card p-8 text-center"><p className="text-5xl">🚫</p><p className="mt-3 font-bold">{error}</p></div>;
  if (!data) return null;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-engrave">📨 محادثات الإعلان</h1>
        <button onClick={() => router.back()} className="text-sm font-bold text-brand">← رجوع</button>
      </div>
      <div className="card p-3">
        <Link href={`/listings/${data.listing.id}`} className="font-bold hover:text-brand">📋 {data.listing.title}</Link>
        <div className="text-xs text-gray-500">البائع: {data.listing.sellerName}</div>
      </div>

      {data.conversations.length === 0 || data.conversations.every((c) => c.messages.length === 0) ? (
        <div className="card p-10 text-center text-gray-400">لا توجد رسائل على هذا الإعلان</div>
      ) : (
        data.conversations.filter((c) => c.messages.length > 0).map((c) => (
          <div key={c.id} className="card p-4">
            <div className="mb-3">
              {c.isPublic ? (
                <span className="chip !bg-blue-100 !text-blue-700">🌐 محادثة عامة</span>
              ) : (
                <span className="chip !bg-amber-100 !text-amber-700">🔒 خاصة: {c.buyerName} ↔ {data.listing.sellerName}</span>
              )}
            </div>
            <div className="space-y-2">
              {c.messages.map((m) => (
                <div key={m.id} className="rounded-2xl bg-sand-50 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-brand-dark">{m.senderName}</span>
                    <span className="text-[10px] text-gray-400"><HijriDate value={m.createdAt} short /></span>
                  </div>
                  {m.type === 'IMAGE' && m.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.mediaUrl} alt="صورة" className="mt-1 max-h-56 rounded-xl" />
                  ) : m.type === 'VOICE' && m.mediaUrl ? (
                    <div className="mt-1">
                      <audio controls src={m.mediaUrl} className="h-9 w-full max-w-xs" />
                      {m.transcript && <p className="mt-1 text-sm text-gray-700">📝 {m.transcript}</p>}
                    </div>
                  ) : (
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-800">{m.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
