import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { FavoritesProvider } from '@/lib/favorites';
import { ActiveThemeProvider } from '@/lib/theme-context';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { UIHost } from '@/lib/ui';
import { VersionGuard } from '@/components/VersionGuard';
import { GlobalLoadingBar } from '@/components/GlobalLoadingBar';

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
        {/* تطبيق الثيم المحفوظ قبل الرسم — يمنع وميض الثيم الأخضر الافتراضي عند التحديث */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=JSON.parse(sessionStorage.getItem('mzad_theme')||'null');if(t&&t.from){var s=document.documentElement.style;s.setProperty('--th-band-from',t.from);s.setProperty('--th-band-to',t.to);var m=document.querySelector('meta[name=\\'theme-color\\']');if(m)m.content=t.from;}}catch(e){}" }} />
        <AuthProvider>
          <FavoritesProvider>
            <ActiveThemeProvider>
              <GlobalLoadingBar />
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
