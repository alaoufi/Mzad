'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressImage } from '@/lib/image';

interface Msg { id: string; senderId: string; type?: string; body: string; mediaUrl?: string | null; transcript?: string | null; createdAt: string }
interface Data { listing: { id: string; title: string }; otherName: string; me: string; messages: Msg[] }

const time = (s: string) => {
  try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(s)); }
  catch { return ''; }
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // التسجيل الصوتي
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recogRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const canceledRef = useRef(false);
  const timerRef = useRef<any>(null);

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

  useEffect(() => {
    if (data && data.messages.length !== lastCount.current) {
      lastCount.current = data.messages.length;
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data]);

  const pushLocal = (m: Partial<Msg>) =>
    setData((d) => d ? { ...d, messages: [...d.messages, { id: 'tmp' + Date.now(), senderId: d.me, type: 'TEXT', body: '', createdAt: new Date().toISOString(), ...m }] } : d);

  const post = async (payload: any) => {
    setSending(true);
    try { await api(`/conversations/${params.id}/messages`, { method: 'POST', body: JSON.stringify(payload) }); load(); }
    catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    pushLocal({ type: 'TEXT', body });
    post({ type: 'TEXT', body });
  };

  const onPickImage = async (files: FileList | null) => {
    if (!files?.length) return;
    setSending(true);
    try {
      const mediaUrl = await compressImage(files[0]);
      pushLocal({ type: 'IMAGE', mediaUrl });
      await post({ type: 'IMAGE', mediaUrl });
    } catch { setError('تعذّر إرسال الصورة'); setSending(false); }
  };

  // ───────── تسجيل صوتي + تفريغ نصّي على الجهاز ─────────
  const startRec = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      canceledRef.current = false;
      transcriptRef.current = '';
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (canceledRef.current) return;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const mediaUrl = String(reader.result);
          const transcript = transcriptRef.current.trim();
          pushLocal({ type: 'VOICE', mediaUrl, transcript, body: transcript });
          post({ type: 'VOICE', mediaUrl, transcript });
        };
        reader.readAsDataURL(blob);
      };
      recRef.current = mr;
      mr.start();

      // التفريغ النصّي عبر Web Speech API (عربي) إن توفّر
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.lang = 'ar-SA'; r.continuous = true; r.interimResults = true;
        r.onresult = (e: any) => {
          let f = '';
          for (let i = 0; i < e.results.length; i++) if (e.results[i].isFinal) f += e.results[i][0].transcript + ' ';
          if (f) transcriptRef.current = f;
        };
        r.onerror = () => {};
        try { r.start(); } catch {}
        recogRef.current = r;
      }

      setRecording(true); setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => {
        if (s >= 120) { stopRec(true); return s; }
        return s + 1;
      }), 1000);
    } catch { setError('تعذّر الوصول للميكروفون — اسمح بالإذن'); }
  };

  const stopRec = (sendIt: boolean) => {
    clearInterval(timerRef.current);
    canceledRef.current = !sendIt;
    setRecording(false);
    try { recogRef.current?.stop(); } catch {}
    try { recRef.current?.stop(); } catch {}
  };

  if (!ready) return null;
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
            🤝 ابدأ المحادثة. يمكنك إرسال نص أو صورة أو رسالة صوتية (مع تفريغ نصّي).
          </div>
        ) : (
          data.messages.map((m) => {
            const mine = m.senderId === data.me;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-2.5 py-2 shadow-sm ${mine ? 'bg-[#dcf8c6]' : 'bg-white'}`}>
                  {m.type === 'IMAGE' && m.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.mediaUrl} alt="صورة" className="max-h-64 w-full rounded-xl object-cover" />
                  ) : m.type === 'VOICE' && m.mediaUrl ? (
                    <div className="min-w-[12rem]">
                      <audio controls src={m.mediaUrl} className="h-9 w-full" />
                      {m.transcript ? (
                        <p className="mt-1 border-t border-black/5 pt-1 text-[13px] leading-relaxed text-gray-600">📝 {m.transcript}</p>
                      ) : (
                        <p className="mt-1 text-[11px] text-gray-400">🎤 رسالة صوتية</p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words px-1 text-[15px] leading-relaxed text-gray-800">{m.body}</p>
                  )}
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
        {recording ? (
          <>
            <div className="flex flex-1 items-center gap-2 rounded-3xl bg-white px-4 py-3">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-bold text-red-600">{mmss(recSecs)}</span>
              <span className="text-xs text-gray-500">جارٍ التسجيل…</span>
              <button onClick={() => stopRec(false)} className="mr-auto rounded-lg px-2 py-1 text-sm font-bold text-gray-500">إلغاء</button>
            </div>
            <button onClick={() => stopRec(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow"
              style={{ backgroundImage: 'linear-gradient(135deg, #128C7E, #25D366)' }} aria-label="إرسال">➤</button>
          </>
        ) : (
          <>
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-xl shadow-sm" title="إرسال صورة">
              📷
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files)} />
            </label>
            <textarea value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="اكتب رسالة..."
              className="max-h-28 flex-1 resize-none rounded-3xl bg-white px-4 py-2.5 text-[15px] outline-none" />
            {text.trim() ? (
              <button onClick={send} disabled={sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow disabled:opacity-50"
                style={{ backgroundImage: 'linear-gradient(135deg, #128C7E, #25D366)' }} aria-label="إرسال">➤</button>
            ) : (
              <button onClick={startRec} disabled={sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm disabled:opacity-50"
                title="رسالة صوتية" aria-label="تسجيل صوتي">🎤</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
