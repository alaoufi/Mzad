'use client';

import { useEffect } from 'react';

// يكشف إن كانت حزمة المتصفّح قديمة (مخزّنة) مقابل النشر الحالي على الخادم، ويفرض تحديثاً مرّة واحدة.
export function VersionGuard() {
  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID;
    if (!mine || mine === 'dev') return;

    const check = async () => {
      try {
        const r = await fetch('/api/version', { cache: 'no-store' });
        const { build } = await r.json();
        if (build && build !== mine) {
          // نسخة قديمة في المتصفّح — نُحدّث مرّة واحدة فقط لتفادي أي حلقة
          const flag = `mzad_reloaded_${build}`;
          if (!sessionStorage.getItem(flag)) {
            sessionStorage.setItem(flag, '1');
            location.reload();
          }
        }
      } catch {}
    };

    check();
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return null;
}
