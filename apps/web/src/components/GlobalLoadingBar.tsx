'use client';

import { useEffect, useState } from 'react';
import { onApiActivity } from '@/lib/api';

// شريط تحميل علوي يظهر أثناء أي طلب للخادم — إشارة واضحة أن الموقع يعمل ولا يبدو معلّقاً.
// نؤخّر ظهوره قليلاً حتى لا يومض في الطلبات السريعة.
export function GlobalLoadingBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: any = null;
    const off = onApiActivity((n) => {
      if (n > 0) {
        if (!timer && !show) timer = setTimeout(() => { setShow(true); timer = null; }, 160);
      } else {
        if (timer) { clearTimeout(timer); timer = null; }
        setShow(false);
      }
    });
    return () => { if (timer) clearTimeout(timer); off(); };
  }, [show]);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-brand/15">
      <div className="loadbar-seg h-full w-1/3 rounded-full bg-gradient-to-l from-brand-light via-brand to-brand-dark" />
    </div>
  );
}
