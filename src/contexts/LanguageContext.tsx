import React, { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATIONS } from '@/lib/mockData';
import { getSettings, saveSettings } from '@/lib/storage';

type Lang = 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';

interface LangContextValue {
  language: Lang;
  setLanguage: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Lang>(() => {
    try {
      const s = getSettings();
      return (s.language as Lang) || 'en';
    } catch { return 'en'; }
  });

  const setLanguage = useCallback((l: Lang) => {
    setLangState(l);
    const settings = getSettings();
    saveSettings({ ...settings, language: l });
  }, []);

  const t = useCallback((key: string): string => {
    const langDict = TRANSLATIONS[language] || {};
    const enDict = TRANSLATIONS['en'] || {};
    return langDict[key] || enDict[key] || key;
  }, [language]);

  return (
    <LangContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
export const LANG_LABELS: Record<Lang, string> = {
  en: 'English', ta: 'தமிழ்', hi: 'हिंदी', te: 'తెలుగు', ml: 'മലയാളം', kn: 'ಕನ್ನಡ'
};
export type { Lang };
