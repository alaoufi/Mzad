import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { FavoritesProvider } from '@/lib/favorites';
import { ActiveThemeProvider } from '@/lib/theme-context';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { UIHost } from '@/lib/ui';
import { VersionGuard } from '@/components/VersionGuard';

export const metadata: Metadata = {
  title: 'مزاد — سوق ومزادات المواشي',
  description: 'بيع وشراء ومزادات الإبل والغنم والماعز والبقر والخيل بمصداقية.',
};

export const viewport: Viewport = {
  themeColor: '#0f7b6c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <FavoritesProvider>
            <ActiveThemeProvider>
              <Header />
              <main className="mx-auto max-w-5xl px-4 py-6 pb-28">{children}</main>
              <BottomNav />
              <UIHost />
              <VersionGuard />
            </ActiveThemeProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
