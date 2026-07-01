'use client';

import { useRouter, usePathname } from 'next/navigation';

// شريط تنقّل بين أقسام الإدارة الأربعة — لتسهيل الوصول من أي صفحة
const TABS = [
  { label: '👤 حسابي', href: '/account' },
  { label: '⚙️ الموقع', href: '/admin/site' },
  { label: '📋 الإعلانات', href: '/admin/listings' },
  { label: '⚖️ السوق', href: '/admin/market' },
];

export function AdminNav() {
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      <button onClick={() => router.push('/admin')}
        className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition ${path === '/admin' ? 'bg-brand text-white' : 'bg-white text-gray-600 ring-1 ring-sand-200'}`}>🛡️ اللوحة</button>
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <button key={t.href} onClick={() => router.push(t.href)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition ${active ? 'bg-brand text-white' : 'bg-white text-gray-600 ring-1 ring-sand-200'}`}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
