'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, DEFAULT_THEME } from './themes';

// قسم يُعرض داخل الهيدر (دمج الترويسة مع الهيدر)
export interface HeaderSection {
  label: string; emoji: string; subtitle?: string;
  motif?: string; mood?: string; font?: string; edgeColor?: string;
}

const Ctx = createContext<{
  theme: Theme; setTheme: (t: Theme) => void;
  section: HeaderSection | null; setSection: (s: HeaderSection | null) => void;
}>({
  theme: DEFAULT_THEME, setTheme: () => {},
  section: null, setSection: () => {},
});

export function ActiveThemeProvider({ children }: { children: ReactNode }) {
  // نقرأ الثيم المحفوظ مباشرةً عند أول تصيير على العميل — فلا يبدأ بالأخضر الافتراضي ثم يتغيّر
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try { const t = sessionStorage.getItem('mzad_theme'); if (t) return JSON.parse(t); } catch {}
    }
    return DEFAULT_THEME;
  });
  const [section, setSection] = useState<HeaderSection | null>(null);

  // متغيّرات شريط الهيدر + لون شريط المتصفّح يتبعان الثيم الحالي (يُضبطان مبكراً عبر سكربت الإقلاع أيضاً)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const s = document.documentElement.style;
    s.setProperty('--th-band-from', theme.from);
    s.setProperty('--th-band-to', theme.to);
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = theme.from || '#0f7b6c';
  }, [theme]);

  return <Ctx.Provider value={{ theme, setTheme, section, setSection }}>{children}</Ctx.Provider>;
}

export const useActiveTheme = () => useContext(Ctx);

// خطّاف للصفحات المُثيّمة: يضبط ثيم الموقع كله ويعيده للافتراضي عند المغادرة.
// لا يُطبّق الثيم إلا حين يكون جاهزاً (ready) حتى لا يطمس الثيم الافتراضي الثيمَ المحفوظ ويسبّب وميضاً.
export function usePageTheme(theme: Theme, ready = true) {
  const { setTheme } = useActiveTheme();
  useEffect(() => {
    if (!ready) return;
    setTheme(theme);
    try { sessionStorage.setItem('mzad_theme', JSON.stringify(theme)); } catch {}
  }, [theme, ready, setTheme]);
  useEffect(() => () => setTheme(DEFAULT_THEME), [setTheme]);
}

// يعرض هوية القسم داخل الهيدر — تعتمد على قيم بسيطة لتفادي التحديث اللانهائي
export function useHeaderSection(
  label: string, emoji: string, subtitle?: string,
  motif?: string, mood?: string, font?: string, edgeColor?: string,
) {
  const { setSection } = useActiveTheme();
  useEffect(() => {
    setSection({ label, emoji, subtitle, motif, mood, font, edgeColor });
    return () => setSection(null);
  }, [label, emoji, subtitle, motif, mood, font, edgeColor, setSection]);
}
