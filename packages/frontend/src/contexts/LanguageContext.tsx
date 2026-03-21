import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Lang } from '../types';
import de from '../translations/de.json';
import en from '../translations/en.json';
import ru from '../translations/ru.json';

const translations: Record<Lang, Record<string, string>> = { de, en, ru };

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('fb_lang') as Lang) || 'de',
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('fb_lang', l);
  }, []);

  const t = useCallback(
    (key: string) => translations[lang]?.[key] || translations['de']?.[key] || key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
