'use client';

import { useEffect, useState } from 'react';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HijriDate } from '@/components/HijriDate';

interface Txn {
  id: string;
  type: string;
  amount: string | number;
  note?: string | null;
  createdAt: string;
}

const TXN_META: Record<string, { label: string; icon: string }> = {
  TOPUP: { label: 'شحن المحفظة', icon: '➕' },
  COMMISSION: { label: 'عمولة السوق', icon: '🧾' },
  BROKER_SHARE: { label: 'نصيب الدلال', icon: '🧑‍⚖️' },
  SUPERVISOR_SHARE: { label: 'نصيب مشرف الدلالين', icon: '🎖️' },
  DEPOSIT_HOLD: { label: 'حجز عربون', icon: '🔒' },
  DEPOSIT_RELEASE: { label: 'فكّ عربون', icon: '🔓' },
  PAYOUT: { label: 'تحويل', icon: '🏦' },
  REFUND: { label: 'استرداد', icon: '↩️' },
};

export default function WalletPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<{ balance: number; txns: Txn[] }>('/wallet')
      .then((r) => { setBalance(r.balance); setTxns(r.txns); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const topup = async () => {
    const amount = Number(await uiPrompt('مبلغ الشحن (ريال):', '500') || 0);
    if (!amount || amount <= 0) return;
    setBusy(true);
    try { await api('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) }); await load(); }
    catch (e: any) { uiToast(e.message); }
    finally { setBusy(false); }
  };

  if (!ready) return <p className="py-16 text-center text-gray-400">جارٍ التحميل...</p>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">👛</p>
          <p className="mb-4 text-lg">سجّل الدخول لعرض محفظتك</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeup space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">👛 المحفظة</h1>
        <button onClick={() => router.push('/account')} className="text-sm font-bold text-brand">← حسابي</button>
      </div>

      {/* بطاقة الرصيد */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand-light p-6 text-white shadow-xl"
        style={{ boxShadow: '0 24px 48px -22px rgba(10,92,80,0.5)' }}>
        <div className="text-sm text-white/80">الرصيد الحالي</div>
        <div className="mt-1 text-4xl font-extrabold text-emboss-light">
          {balance.toLocaleString('ar-SA')} <span className="text-2xl">﷼</span>
        </div>
        <button onClick={topup} disabled={busy}
          className="mt-4 rounded-2xl bg-white/25 px-5 py-2.5 text-sm font-bold transition hover:bg-white/30 disabled:opacity-50">
          {busy ? '...' : '➕ شحن المحفظة'}
        </button>
      </div>

      <p className="rounded-2xl bg-sand-50 p-3 text-center text-xs text-gray-500">
        💳 الشحن تجريبي حالياً — سيُربط ببوابة دفع حقيقية (مدى/Apple Pay) لاحقاً.
      </p>

      {/* السجل المالي */}
      <div>
        <h2 className="mb-3 text-lg font-bold">السجل المالي</h2>
        {loading ? (
          <p className="py-8 text-center text-gray-500">جارٍ التحميل...</p>
        ) : txns.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">
            <p className="text-4xl">🧾</p>
            <p className="mt-3">لا توجد حركات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txns.map((t) => {
              const amt = Number(t.amount);
              const meta = TXN_META[t.type] ?? { label: t.type, icon: '•' };
              return (
                <div key={t.id} className="card flex items-center gap-3 p-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{meta.label}</div>
                    <div className="truncate text-xs text-gray-500">
                      {t.note ?? ''} · <HijriDate value={t.createdAt} short />
                    </div>
                  </div>
                  <div className={`shrink-0 font-extrabold ${amt < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {amt < 0 ? '−' : '+'}{Math.abs(amt).toLocaleString('ar-SA')} ﷼
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
