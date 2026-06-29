'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold">
          <span>🐪</span>
          <span>مزاد</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/sell" className="btn-gold !px-4 !py-2 !text-base !min-h-0">
            ＋ أضف إعلان
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-xl bg-brand-dark px-3 py-2 text-sm font-bold"
              >
                خروج
              </button>
            </div>
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
