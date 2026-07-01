'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// موجز متابعة سريع: آخر المحادثات والإشعارات — يظهر أعلى الواجهة العامة للمتابعة بضغطة
export function FollowUpSummary() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<{ id: string; message: string; link?: string | null; read: boolean }[]>([]);
  const [unread, setUnread] = useState(0);
  const [convs, setConvs] = useState<{ id: string; otherName?: string; lastMessage?: string }[]>([]);

  useEffect(() => {
    api<any>('/notifications').then((r) => { setNotifs(r.items || []); setUnread(r.unread || 0); }).catch(() => {});
    api<any>('/conversations/mine').then((r) => setConvs(r.conversations || [])).catch(() => {});
  }, []);

  const preview = (b?: string) => (b?.startsWith('[[BANK]]') ? '🏦 بيانات بنكية' : (b || '—'));

  return (
    <div className="card float-box mb-4 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-extrabold text-engrave">🔔 متابعة سريعة</h2>
        <div className="flex gap-2">
          <button onClick={() => router.push('/messages')} className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand-dark">💬 الرسائل{convs.length ? ` (${convs.length})` : ''}</button>
          <button onClick={() => router.push('/notifications')} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">🔔 الإشعارات{unread ? ` (${unread})` : ''}</button>
        </div>
      </div>

      {convs.length > 0 && (
        <div className="mb-2">
          <div className="mb-1 text-xs font-bold text-gray-500">آخر المحادثات</div>
          <div className="space-y-1">
            {convs.slice(0, 3).map((c) => (
              <button key={c.id} onClick={() => router.push(`/messages/${c.id}`)} className="flex w-full items-center gap-2 rounded-xl bg-sand-50 p-2 text-right">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold">{c.otherName?.charAt(0) ?? '👤'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.otherName ?? '—'}</span>
                  <span className="block truncate text-xs text-gray-500">{preview(c.lastMessage)}</span>
                </span>
                <span className="shrink-0 text-gray-300">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {notifs.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-bold text-gray-500">آخر الإشعارات</div>
          <div className="space-y-1">
            {notifs.slice(0, 3).map((n) => (
              <button key={n.id} onClick={() => (n.link ? router.push(n.link) : router.push('/notifications'))}
                className={`flex w-full items-start gap-2 rounded-xl p-2 text-right text-sm ${n.read ? 'bg-sand-50 text-gray-600' : 'bg-amber-50 font-bold text-amber-900'}`}>
                <span className="shrink-0">{n.read ? '•' : '🔴'}</span>
                <span className="min-w-0 flex-1 truncate">{n.message}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {convs.length === 0 && notifs.length === 0 && (
        <p className="py-2 text-center text-sm text-gray-400">لا رسائل أو إشعارات جديدة للمتابعة.</p>
      )}
    </div>
  );
}
