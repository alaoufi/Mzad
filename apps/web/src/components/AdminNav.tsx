'use client';

import { useRouter, usePathname } from 'next/navigation';

// أربعة أقسام إدارية كأزرار تبويب ثلاثية الأبعاد بارزة أعلى كل صفحة — كل زرّ يفتح قسمه المستقل
const TABS = [
  { label: 'الملف الشخصي', icon: '👤', href: '/account' },
  { label: 'تجهيزات الموقع', icon: '⚙️', href: '/admin/site' },
  { label: 'إدارة الإعلانات', icon: '📋', href: '/admin/listings' },
  { label: 'السوق والنزاعات', icon: '⚖️', href: '/admin/market' },
];

export function AdminNav() {
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <button key={t.href} onClick={() => router.push(t.href)}
            className={`float-box flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition active:scale-95 ${
              active ? 'text-white ring-2 ring-white/60' : 'bg-white text-gray-700 ring-1 ring-black/[0.05] hover:-translate-y-0.5'}`}
            style={active ? { backgroundImage: 'linear-gradient(135deg, #1aa893, #0a5246)' } : undefined}>
            <span className="text-2xl drop-shadow-sm">{t.icon}</span>
            <span className="text-[12px] font-extrabold leading-tight">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
