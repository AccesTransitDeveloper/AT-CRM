import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { en } from '../locales/en';
import { ru } from '../locales/ru';
import { Globe, Check } from 'lucide-react';

export type Language = 'en' | 'ru';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  isRussian: boolean;
  isEnglish: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'at_crm_language';

const dictionaries = {
  en,
  ru
};

// Helper to access nested keys like "drivers.title"
function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ru' || saved === 'en') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  const t = useMemo(() => {
    return (keyPath: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[language];
      const enDict = dictionaries.en;
      
      let text = getNestedValue(dict, keyPath) || getNestedValue(enDict, keyPath) || keyPath;
      
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }
      
      return text;
    };
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRussian: language === 'ru',
    isEnglish: language === 'en'
  }), [language, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export const useI18n = useTranslation;

/**
 * Header Language Switcher Component
 * Placed cleanly next to "LOGGED IN AS"
 */
export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="relative group">
      <button
        type="button"
        id="language-switcher-btn"
        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-all text-xs text-slate-200"
        title="Switch Language / Сменить язык"
      >
        <Globe className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-semibold uppercase tracking-wider">{language === 'ru' ? 'RU' : 'EN'}</span>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-1 w-36 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-1 hidden group-hover:block hover:block z-50">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
            language === 'en'
              ? 'bg-sky-600/30 text-sky-300 font-semibold border border-sky-500/30'
              : 'hover:bg-slate-700/60 text-slate-300'
          }`}
        >
          <span>English (EN)</span>
          {language === 'en' && <Check className="w-3.5 h-3.5 text-sky-400" />}
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ru')}
          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between mt-0.5 ${
            language === 'ru'
              ? 'bg-sky-600/30 text-sky-300 font-semibold border border-sky-500/30'
              : 'hover:bg-slate-700/60 text-slate-300'
          }`}
        >
          <span>Русский (RU)</span>
          {language === 'ru' && <Check className="w-3.5 h-3.5 text-sky-400" />}
        </button>
      </div>
    </div>
  );
};
