'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Review {
  id: string;
  rating: number;
  descMatch?: number | null;
  comment?: string | null;
  author: { name: string };
  createdAt: string;
}

export function SellerReviews({ sellerId }: { sellerId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<{ reviews: Review[]; avgRating: number; count: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [descMatch, setDescMatch] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api(`/users/${sellerId}/reviews`).then(setData).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sellerId]);

  const submit = async () => {
    setBusy(true);
    setMsg('');
    try {
      await api(`/users/${sellerId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, descMatch, comment, role: 'SELLER' }),
      });
      setOpen(false);
      setComment('');
      load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const canReview = user && user.id !== sellerId;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">⭐ تقييمات البائع</h2>
        {data && data.count > 0 && (
          <span className="chip">{data.avgRating.toFixed(1)} من 5 · {data.count} تقييم</span>
        )}
      </div>

      {msg && <div className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-700">{msg}</div>}

      {data && data.reviews.length > 0 ? (
        <ul className="space-y-2">
          {data.reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-sand-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">{r.author.name}</span>
                <span className="text-gold">{'⭐'.repeat(r.rating)}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">لا توجد تقييمات بعد</p>
      )}

      {canReview && !open && (
        <button onClick={() => setOpen(true)} className="btn-outline mt-4 w-full !py-3 !text-base">
          أضف تقييماً
        </button>
      )}

      {canReview && open && (
        <div className="mt-4 space-y-3 rounded-2xl border-2 border-sand-200 p-3">
          <div>
            <label className="mb-1 block text-sm font-bold">التقييم العام</label>
            <Stars value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold">مطابقة الوصف للواقع</label>
            <Stars value={descMatch} onChange={setDescMatch} />
          </div>
          <textarea className="input min-h-[80px] !py-3 !text-base" placeholder="اكتب تعليقك (اختياري)"
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="btn-primary flex-1 !py-3 !text-base disabled:opacity-50">
              {busy ? '...' : 'إرسال'}
            </button>
            <button onClick={() => setOpen(false)} className="btn-outline !py-3 !text-base">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className={`text-3xl ${n <= value ? '' : 'opacity-30'}`}>
          ⭐
        </button>
      ))}
    </div>
  );
}
