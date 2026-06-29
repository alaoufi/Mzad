'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, DEFAULT_THEME } from './themes';

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ActiveThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useActiveTheme = () => useContext(Ctx);

// خطّاف للصفحات المُثيّمة: يضبط ثيم الموقع كله ويعيده للافتراضي عند المغادرة
export function usePageTheme(theme: Theme) {
  const { setTheme } = useActiveTheme();
  useEffect(() => { setTheme(theme); }, [theme, setTheme]);
  useEffect(() => () => setTheme(DEFAULT_THEME), [setTheme]);
}
