'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Countdown } from './Countdown';

interface BidRow {
  bidderName: string;
  amount: number;
  createdAt?: string;
}

export function LiveAuction({ auctionId }: { auctionId: string }) {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [highest, setHighest] = useState<number>(0);
  const [startPrice, setStartPrice] = useState<number>(0);
  const [minIncrement, setMinIncrement] = useState<number>(100);
  const [endAt, setEndAt] = useState<string>('');
  const [bids, setBids] = useState<BidRow[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [msg, setMsg] = useState<string>('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const socket = io(WS_URL, { auth: { token: token ?? '' } });
    socketRef.current = socket;

    socket.emit('join_auction', { auctionId });

    socket.on('auction_state', (s: any) => {
      const hb = s.highestBid ?? Number(s.startPrice);
      setHighest(hb);
      setStartPrice(Number(s.startPrice));
      setMinIncrement(Number(s.minIncrement));
      setEndAt(s.endAt);
      setAmount(hb + Number(s.minIncrement));
      setBids(
        (s.bids ?? []).map((b: any) => ({
          bidderName: b.bidder?.name ?? 'مزايد',
          amount: Number(b.amount),
        })),
      );
    });

    socket.on('bid_update', (r: any) => {
      setHighest(r.highestBid);
      setEndAt(r.endAt);
      setAmount(r.highestBid + minIncrement);
      setBids((prev) => [{ bidderName: r.bidderName, amount: r.amount }, ...prev].slice(0, 15));
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      if (r.extended) setMsg('⏱️ تم تمديد الوقت بسبب مزايدة الدقيقة الأخيرة');
    });

    socket.on('bid_error', (e: any) => setMsg('⚠️ ' + e.message));

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, token]);

  const placeBid = () => {
    setMsg('');
    if (!user) {
      setMsg('⚠️ يجب تسجيل الدخول للمزايدة');
      return;
    }
    socketRef.current?.emit('place_bid', { auctionId, amount });
  };

  const ended = endAt && new Date(endAt).getTime() <= Date.now();

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">🔨 المزاد المباشر</h2>
        {endAt && (
          <div className="rounded-xl bg-sand-100 px-3 py-2">
            ينتهي خلال <Countdown endAt={endAt} />
          </div>
        )}
      </div>

      <div
        className={`mb-4 rounded-2xl p-5 text-center transition ${
          flash ? 'bg-gold/20' : 'bg-sand-50'
        }`}
      >
        <div className="text-gray-500">أعلى مزايدة حالياً</div>
        <div className="text-4xl font-extrabold text-brand-dark">
          {highest.toLocaleString('ar-SA')} ﷼
        </div>
        <div className="mt-1 text-sm text-gray-400">
          سعر البداية {startPrice.toLocaleString('ar-SA')} · أقل زيادة{' '}
          {minIncrement.toLocaleString('ar-SA')} ﷼
        </div>
      </div>

      {msg && (
        <div className="mb-3 rounded-2xl bg-amber-50 p-3 text-center text-amber-800">
          {msg}
        </div>
      )}

      {!ended ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <button
              className="btn-outline !px-5 !py-3"
              onClick={() => setAmount((a) => Math.max(highest + minIncrement, a - minIncrement))}
            >
              −
            </button>
            <input
              className="input text-center text-2xl"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              className="btn-outline !px-5 !py-3"
              onClick={() => setAmount((a) => a + minIncrement)}
            >
              ＋
            </button>
          </div>
          <button onClick={placeBid} className="btn-gold sm:w-48">
            زايد الآن
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-red-50 p-4 text-center font-bold text-red-700">
          انتهى المزاد
        </div>
      )}

      {/* سجل المزايدات */}
      <div className="mt-5">
        <h3 className="mb-2 font-bold text-gray-600">آخر المزايدات</h3>
        <ul className="space-y-1">
          {bids.length === 0 && (
            <li className="text-gray-400">لا توجد مزايدات بعد — كن أول المزايدين</li>
          )}
          {bids.map((b, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-2"
            >
              <span className="font-medium">{b.bidderName}</span>
              <span className="font-bold text-brand-dark">
                {b.amount.toLocaleString('ar-SA')} ﷼
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
