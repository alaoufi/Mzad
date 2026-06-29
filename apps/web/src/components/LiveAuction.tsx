'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isOpenEnd } from '@/lib/auction';
import { Countdown } from './Countdown';

interface BidRow { bidderName: string; amount: number; }

/**
 * مكوّن المزايدة: يدعم المزاد المؤقّت و"على السوم" (مفتوح بلا وقت).
 * canManage: لصاحب الإعلان/الدلال — يقدر ينهي ويقبل أعلى مساومة.
 */
export function LiveAuction({ auctionId, canManage }: { auctionId: string; canManage?: boolean }) {
  const { token, user } = useAuth();
  const [highest, setHighest] = useState(0);
  const [startPrice, setStartPrice] = useState(0);
  const [minIncrement, setMinIncrement] = useState(100);
  const [endAt, setEndAt] = useState('');
  const [startAt, setStartAt] = useState('');
  const [status, setStatus] = useState('LIVE');
  const [type, setType] = useState<{ name: string; icon?: string | null; commissionPct: number; requiresDeposit: boolean } | null>(null);
  const [bids, setBids] = useState<BidRow[]>([]);
  const [amount, setAmount] = useState(0);
  const [msg, setMsg] = useState('');
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastHighest = useRef(0);
  const touched = useRef(false);

  const open = isOpenEnd(endAt);

  const applyState = (s: any) => {
    const hb = s.highestBid ?? Number(s.startPrice);
    setHighest(hb);
    setStartPrice(Number(s.startPrice));
    setMinIncrement(Number(s.minIncrement));
    setEndAt(s.endAt);
    if (s.startAt) setStartAt(s.startAt);
    if (s.status) setStatus(s.status);
    if (s.type !== undefined) setType(s.type);
    setBids((s.bids ?? []).map((b: any) => ({ bidderName: b.bidder?.name ?? 'مزايد', amount: Number(b.amount) })));
    if (!touched.current) setAmount(hb + Number(s.minIncrement));
    if (hb > lastHighest.current && lastHighest.current !== 0) {
      setFlash(true); setTimeout(() => setFlash(false), 600);
    }
    lastHighest.current = hb;
  };

  useEffect(() => {
    let alive = true;
    const poll = () => api(`/auctions/${auctionId}`).then((s) => alive && applyState(s)).catch(() => {});
    poll();
    const t = setInterval(poll, 2500);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  const placeBid = async () => {
    setMsg('');
    if (!user) { setMsg('⚠️ يجب تسجيل الدخول'); return; }
    setBusy(true);
    try {
      const r = await api(`/auctions/${auctionId}/bids`, { method: 'POST', body: JSON.stringify({ amount }) });
      touched.current = false;
      setHighest(r.highestBid); setEndAt(r.endAt); setAmount(r.highestBid + minIncrement);
      setBids((prev) => [{ bidderName: r.bidderName, amount: r.amount }, ...prev].slice(0, 15));
      if (r.extended) setMsg('⏱️ تم تمديد الوقت');
    } catch (e: any) { setMsg('⚠️ ' + e.message); }
    finally { setBusy(false); }
  };

  const close = async () => {
    if (!confirm('إنهاء وقبول أعلى مبلغ؟')) return;
    try { await api(`/auctions/${auctionId}/close`, { method: 'POST' }); setStatus('ENDED'); }
    catch (e: any) { alert(e.message); }
  };

  const scheduled = status === 'SCHEDULED';
  const cancelled = status === 'CANCELLED';
  const ended = status === 'ENDED' || (!open && endAt && new Date(endAt).getTime() <= Date.now());

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">{open ? '🤝 على السوم' : '🔨 المزاد المباشر'}</h2>
        {scheduled ? (
          <span className="chip !bg-blue-100 !text-blue-700">مجدول</span>
        ) : open ? (
          <span className="chip">مزايدة مفتوحة بلا وقت</span>
        ) : endAt ? (
          <div className="rounded-xl bg-sand-100 px-3 py-2">ينتهي خلال <Countdown endAt={endAt} /></div>
        ) : null}
      </div>

      <div className={`mb-4 rounded-2xl p-5 text-center transition ${flash ? 'bg-gold/20' : 'bg-black/[0.03]'}`}>
        <div className="text-gray-500">{open ? 'أعلى مساومة حالياً' : 'أعلى مزايدة حالياً'}</div>
        <div className="text-4xl font-extrabold text-brand-dark text-emboss">{highest.toLocaleString('ar-SA')} ﷼</div>
        <div className="mt-1 text-sm text-gray-400">
          {open ? 'يبدأ من' : 'سعر البداية'} {startPrice.toLocaleString('ar-SA')} · أقل زيادة {minIncrement.toLocaleString('ar-SA')} ﷼
        </div>
      </div>

      {type && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <span className="chip">{type.icon || '🏷️'} نوع المزاد: {type.name}</span>
          {type.commissionPct > 0 && <span className="chip">عمولة {type.commissionPct}%</span>}
          {type.requiresDeposit && <span className="chip">يتطلب عربوناً</span>}
        </div>
      )}

      {msg && <div className="mb-3 rounded-2xl bg-amber-50 p-3 text-center text-amber-800">{msg}</div>}

      {cancelled ? (
        <div className="rounded-2xl bg-red-50 p-4 text-center font-bold text-red-700">أُلغي المزاد</div>
      ) : scheduled ? (
        <div className="rounded-2xl bg-blue-50 p-4 text-center font-bold text-blue-700">
          🗓️ يبدأ المزاد خلال {startAt ? <Countdown endAt={startAt} /> : '—'}
        </div>
      ) : !ended ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2">
              <button className="btn-outline !px-5 !py-3"
                onClick={() => { touched.current = true; setAmount((a) => Math.max(highest + minIncrement, a - minIncrement)); }}>−</button>
              <input className="input text-center text-2xl" type="number" value={amount}
                onChange={(e) => { touched.current = true; setAmount(Number(e.target.value)); }} />
              <button className="btn-outline !px-5 !py-3"
                onClick={() => { touched.current = true; setAmount((a) => a + minIncrement); }}>＋</button>
            </div>
            <button onClick={placeBid} disabled={busy} className="btn-gold sm:w-48 disabled:opacity-50">
              {busy ? '...' : open ? 'ساوم الآن' : 'زايد الآن'}
            </button>
          </div>
          {canManage && (
            <button onClick={close} className="btn-outline mt-3 w-full !py-3 !text-base !border-brand !text-brand">
              ✔ إنهاء وقبول أعلى مبلغ
            </button>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-green-50 p-4 text-center font-bold text-green-700">
          {open ? 'انتهت المساومة' : 'انتهى المزاد'}
        </div>
      )}

      <div className="mt-5">
        <h3 className="mb-2 font-bold text-gray-600">{open ? 'آخر المساومات' : 'آخر المزايدات'}</h3>
        <ul className="space-y-1">
          {bids.length === 0 && <li className="text-gray-400">لا توجد بعد — كن الأول</li>}
          {bids.map((b, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-2">
              <span className="font-medium">{b.bidderName}</span>
              <span className="font-bold text-brand-dark">{b.amount.toLocaleString('ar-SA')} ﷼</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
