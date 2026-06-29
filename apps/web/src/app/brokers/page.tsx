'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { InterestPicker } from '@/components/InterestPicker';

interface Broker {
  id: string;
  name: string;
  phone: string;
  accountType?: string;
  brokerCategories?: string[];
}

export default function BrokersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Broker | null>(null);

  const load = () =>
    api<{ brokers: Broker[] }>('/brokers')
      .then((r) => setBrokers(r.brokers))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveScope = async (id: string, ids: string[]) => {
    setEditing(null);
    try { await api(`/brokers/${id}`, { method: 'PATCH', body: JSON.stringify({ brokerCategories: ids }) }); load(); }
    catch (e: any) { alert(e.message); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🎖️</p>
          <p className="mb-4 text-lg">إدارة الدلالين — سجّل الدخول</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) return <div className="card p-8 text-center"><p className="text-5xl">🚫</p><p className="mt-3 font-bold">{error}</p></div>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🎖️ إدارة الدلالين</h1>
        <button onClick={() => router.push('/account')} className="text-sm font-bold text-brand">← حسابي</button>
      </div>
      <p className="text-sm text-gray-500">
        أسنِد لكل دلال نطاقه من التصنيفات (نوعاً كاملاً أو أصنافاً محددة مثل «مجاهيم» فقط). يدير الدلال — عرضاً أو مزاداً — ما أُسند إليه فقط.
      </p>

      {brokers.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">لا يوجد دلالون بعد. عيّن دور «دلال» لمستخدم من لوحة الإدارة.</div>
      ) : (
        <div className="space-y-2">
          {brokers.map((b) => (
            <div key={b.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-bold">{b.name}</div>
                <div className="text-xs text-gray-500">
                  {b.phone} ·{' '}
                  {b.brokerCategories?.length ? `${b.brokerCategories.length} تصنيف مُسند` : 'نطاق كامل (غير محدّد)'}
                </div>
              </div>
              <button onClick={() => setEditing(b)} className="btn-primary !min-h-0 shrink-0 !px-4 !py-2 !text-sm">🎯 النطاق</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <InterestPicker
          initial={editing.brokerCategories ?? []}
          title={`نطاق الدلال — ${editing.name}`}
          subtitle="اختر التصنيفات التي يديرها هذا الدلال (نوعاً أو أصنافاً محددة). اتركها فارغة لمنحه نطاقاً كاملاً."
          onSave={(ids) => saveScope(editing.id, ids)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
