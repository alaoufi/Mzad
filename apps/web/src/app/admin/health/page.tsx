'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Item {
  id: string;
  label: string;
  order: number;
  hidden: boolean;
}

export default function AdminHealthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api<{ items: Item[] }>('/admin/health-items')
      .then((r) => setItems(r.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const run = async (fn: () => Promise<any>) => {
    setError('');
    try { await fn(); load(); } catch (e: any) { setError(e.message); alert(e.message); }
  };

  const add = () => {
    const label = prompt('نص البند الجديد (مثل: مُطعّم، الأسنان سليمة):');
    if (!label?.trim()) return;
    run(() => api('/admin/health-items', { method: 'POST', body: JSON.stringify({ label }) }));
  };
  const rename = (it: Item) => {
    const label = prompt('النص الجديد:', it.label);
    if (label === null || !label.trim()) return;
    run(() => api(`/admin/health-items/${it.id}`, { method: 'PATCH', body: JSON.stringify({ label }) }));
  };
  const toggleHide = (it: Item) =>
    run(() => api(`/admin/health-items/${it.id}`, { method: 'PATCH', body: JSON.stringify({ hidden: !it.hidden }) }));
  const del = (it: Item) => {
    if (!confirm(`حذف البند "${it.label}"؟`)) return;
    run(() => api(`/admin/health-items/${it.id}`, { method: 'DELETE' }));
  };
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    run(async () => {
      await api(`/admin/health-items/${a.id}`, { method: 'PATCH', body: JSON.stringify({ order: b.order }) });
      await api(`/admin/health-items/${b.id}`, { method: 'PATCH', body: JSON.stringify({ order: a.order }) });
    });
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🩺</p>
          <p className="mb-4 text-lg">بنود الحالة الصحية — سجّل الدخول بحساب مشرف</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🩺 بنود الحالة الصحية</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>
      <p className="text-sm text-gray-500">
        بنود تظهر عند إضافة الإعلان، يحدّد البائع لكل بند: <b className="text-green-700">سليم</b> أو <b className="text-red-600">غير سليم</b>.
      </p>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <button onClick={add} className="btn-primary w-full">＋ إضافة بند</button>

      {items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">لا توجد بنود بعد — أضف أول بند.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className={`card flex items-center gap-2 p-3 ${it.hidden ? 'opacity-50' : ''}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="text-xs text-gray-400 disabled:opacity-30">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="text-xs text-gray-400 disabled:opacity-30">▼</button>
              </div>
              <span className="flex-1 font-bold">
                {it.label}{it.hidden && <span className="mr-1 text-xs text-red-500">(مخفي)</span>}
              </span>
              <Btn onClick={() => rename(it)}>✏️</Btn>
              <Btn onClick={() => toggleHide(it)}>{it.hidden ? '🙈' : '👁️'}</Btn>
              <Btn onClick={() => del(it)}>🗑️</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-sand-200 hover:bg-sand-50">
      {children}
    </button>
  );
}
