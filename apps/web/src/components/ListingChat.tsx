'use client';

import { useEffect, useRef, useState } from 'react';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Msg {
  id: string;
  body: string;
  sender: { id: string; name: string };
  createdAt: string;
}

export function ListingChat({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = () =>
    api<{ messages: Msg[] }>(`/listings/${listingId}/messages`)
      .then((r) => setMessages(r.messages))
      .catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api(`/listings/${listingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
      });
      setText('');
      load();
    } catch (e: any) {
      uiToast(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-lg font-bold">💬 محادثة عامة</h2>
      <p className="mb-3 text-xs text-gray-400">تظهر للجميع — للتفاهم العام. لإرسال جوال أو رقم حساب استخدم «مراسلة خاصة» أعلى الصفحة.</p>

      <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-gray-400">لا توجد رسائل — اسأل البائع عن الحلال</p>
        ) : (
          messages.map((m) => {
            const mine = user?.id === m.sender.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    mine ? 'bg-brand text-white' : 'bg-sand-100 text-gray-800'
                  }`}
                >
                  {!mine && <div className="text-xs font-bold text-brand-dark">{m.sender.name}</div>}
                  <div>{m.body}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {user ? (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input className="input flex-1 !py-3 !text-base" placeholder="اكتب رسالتك..."
            value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" disabled={busy} className="btn-primary !px-5 !py-3 disabled:opacity-50">
            إرسال
          </button>
        </form>
      ) : (
        <p className="rounded-2xl bg-sand-50 p-3 text-center text-gray-500">سجّل الدخول للمراسلة</p>
      )}
    </div>
  );
}
