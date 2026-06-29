'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useActiveTheme } from '@/lib/theme-context';
import { gradient } from '@/lib/themes';

export function Header() {
  const { user } = useAuth();
  const { theme } = useActiveTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 text-white shadow-lg transition-all duration-500"
      style={{ backgroundImage: `linear-gradient(120deg, ${theme.from}, ${theme.to})` }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {!isHome && (
            <button onClick={() => router.back()} aria-label="رجوع"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl ring-1 ring-white/25 active:scale-95">
              →
            </button>
          )}
          <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold text-emboss-light">
            <span className="text-3xl drop-shadow">🐪</span>
            <span>مزاد</span>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          <Link href="/sell"
            className="hidden rounded-2xl px-4 py-2 text-base font-bold text-white shadow-md sm:inline-flex"
            style={{ backgroundImage: 'linear-gradient(135deg, #e0b85a, #b9852b)' }}>
            ＋ أضف إعلان
          </Link>
          {user ? (
            <Link href="/account" className="flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 ring-1 ring-white/20 hover:bg-white/25">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm font-bold">
                {user.name.charAt(0)}
              </span>
              <span className="hidden text-sm font-bold sm:inline">حسابي</span>
            </Link>
          ) : (
            <Link href="/login" className="rounded-2xl bg-white/15 px-4 py-2 text-base font-bold ring-1 ring-white/20 hover:bg-white/25">
              دخول
            </Link>
          )}
        </nav>
      </div>
      <div className="h-0.5 w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, #e0b85a, transparent)' }} />
    </header>
  );
}
