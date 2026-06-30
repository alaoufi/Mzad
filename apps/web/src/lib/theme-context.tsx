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
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [section, setSection] = useState<HeaderSection | null>(null);
  return <Ctx.Provider value={{ theme, setTheme, section, setSection }}>{children}</Ctx.Provider>;
}

export const useActiveTheme = () => useContext(Ctx);

// خطّاف للصفحات المُثيّمة: يضبط ثيم الموقع كله ويعيده للافتراضي عند المغادرة
export function usePageTheme(theme: Theme) {
  const { setTheme } = useActiveTheme();
  useEffect(() => { setTheme(theme); }, [theme, setTheme]);
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
