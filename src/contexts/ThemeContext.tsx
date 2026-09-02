import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  effectiveTheme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const settings = getSettings();
    setThemeState(settings.theme);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (t: Theme) => {
      const effective = t === 'system' ? (mq.matches ? 'dark' : 'light') : t;
      setEffectiveTheme(effective);
      document.documentElement.classList.toggle('dark', effective === 'dark');
    };
    apply(theme);
    const handler = () => { if (theme === 'system') apply('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    const settings = getSettings();
    saveSettings({ ...settings, theme: t });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
