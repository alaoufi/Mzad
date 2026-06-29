'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'الرئيسية', icon: '🏠' },
  { href: '/messages', label: 'رسائلي', icon: '💬' },
  { href: '/sell', label: 'أضف', icon: '➕', primary: true },
  { href: '/account', label: 'حسابي', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-5xl items-stretch">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 items-center justify-center">
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-l from-gold to-amber-500 text-2xl text-white shadow-lg shadow-gold/30">
                  {item.icon}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`navitem ${active ? 'navitem-active' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
