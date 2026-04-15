'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { type Lang, type Translations } from './i18n';

interface LanguageContextType {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang:    'en',
  setLang: () => {},
  t:       translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Persist preference in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('uvatn-lang');
    if (stored === 'tr' || stored === 'en') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('uvatn-lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
