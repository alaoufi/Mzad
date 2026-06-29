'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveTheme } from '@/lib/theme-context';

const ITEMS = [
  { href: '/', label: 'الرئيسية', icon: '🏠' },
  { href: '/favorites', label: 'المفضلة', icon: '❤️' },
  { href: '/sell', label: 'أضف', icon: '＋', primary: true },
  { href: '/messages', label: 'رسائلي', icon: '💬' },
  { href: '/account', label: 'حسابي', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme } = useActiveTheme();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
      <div className="glass mx-auto flex max-w-5xl items-stretch rounded-t-3xl border-t border-white/40 px-1">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 items-center justify-center">
                <span className="-mt-7 flex h-15 w-15 items-center justify-center rounded-full text-3xl text-white shadow-lg shadow-gold/30 ring-4 ring-white"
                  style={{ height: '3.6rem', width: '3.6rem', backgroundImage: 'linear-gradient(135deg, #e0b85a, #b9852b)' }}>
                  {item.icon}
                </span>
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href} className="navitem"
              style={active ? { color: theme.accent } : undefined}>
              <span className="flex h-8 w-12 items-center justify-center rounded-full text-xl transition-all"
                style={active ? { backgroundColor: `${theme.accent}1f` } : undefined}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
