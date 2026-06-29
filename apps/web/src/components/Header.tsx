'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-l from-brand-dark to-brand text-white shadow-lg shadow-brand/20">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold">
          <span className="text-3xl">🐪</span>
          <span>مزاد</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/sell"
            className="hidden rounded-xl bg-gradient-to-l from-gold to-amber-500 px-4 py-2 text-base font-bold shadow sm:inline-flex"
          >
            ＋ أضف إعلان
          </Link>
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 hover:bg-white/25"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm font-bold">
                {user.name.charAt(0)}
              </span>
              <span className="hidden text-sm font-bold sm:inline">حسابي</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-white/15 px-4 py-2 text-base font-bold hover:bg-white/25"
            >
              دخول
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
