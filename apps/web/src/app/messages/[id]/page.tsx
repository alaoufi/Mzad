'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Msg { id: string; senderId: string; body: string; createdAt: string }
interface Data { listing: { id: string; title: string }; otherName: string; me: string; messages: Msg[] }

const time = (s: string) => {
  try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(s)); }
  catch { return ''; }
};

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(() => {
    api<Data>(`/conversations/${params.id}/messages`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [user, load]);

  // التمرير لأسفل عند وصول رسائل جديدة
  useEffect(() => {
    if (data && data.messages.length !== lastCount.current) {
      lastCount.current = data.messages.length;
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText(''); setSending(true);
    // تفاؤلي
    setData((d) => d ? { ...d, messages: [...d.messages, { id: 'tmp' + Date.now(), senderId: d.me, body, createdAt: new Date().toISOString() }] } : d);
    try { await api(`/conversations/${params.id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }); load(); }
    catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">💬</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض المحادثة</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#ece5dd]">
      {/* ترويسة المحادثة */}
      <div className="flex items-center gap-3 px-3 py-3 text-white shadow-md"
        style={{ backgroundImage: 'linear-gradient(120deg, #0a5246, #128C7E)' }}>
        <button onClick={() => router.push('/messages')} className="text-2xl" aria-label="رجوع">→</button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-lg font-bold">
          {data?.otherName?.charAt(0) ?? '👤'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{data?.otherName ?? '...'}</div>
          {data?.listing && (
            <button onClick={() => router.push(`/listings/${data.listing.id}`)} className="block truncate text-xs text-white/80">
              📋 {data.listing.title}
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 p-2 text-center text-sm text-red-700">{error}</div>}

      {/* الرسائل */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3"
        style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        {!data ? (
          <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>
        ) : data.messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-xs rounded-2xl bg-[#fff7d6] p-4 text-center text-sm text-gray-600 shadow">
            🤝 ابدأ المحادثة. يمكن للبائع إرسال رقم حسابه هنا لإتمام التحويل.
          </div>
        ) : (
          data.messages.map((m) => {
            const mine = m.senderId === data.me;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${mine ? 'bg-[#dcf8c6]' : 'bg-white'}`}>
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-800">{m.body}</p>
                  <div className="mt-0.5 text-left text-[10px] text-gray-400">{time(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* شريط الإدخال */}
      <div className="flex items-end gap-2 border-t border-black/5 bg-[#f0f0f0] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="اكتب رسالة..."
          className="max-h-28 flex-1 resize-none rounded-3xl bg-white px-4 py-2.5 text-[15px] outline-none" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow disabled:opacity-50"
          style={{ backgroundImage: 'linear-gradient(135deg, #128C7E, #25D366)' }}>
          ➤
        </button>
      </div>
    </div>
  );
}
