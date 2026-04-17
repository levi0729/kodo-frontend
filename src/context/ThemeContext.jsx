import { createContext, useContext, useState, useEffect } from 'react';
import translations from '@/i18n/translations';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => sessionStorage.getItem('kodo-theme') || 'dark');
  const [language, setLanguage] = useState(() => sessionStorage.getItem('kodo-lang') || 'hu');

  useEffect(() => {
    sessionStorage.setItem('kodo-theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    sessionStorage.setItem('kodo-lang', language);
  }, [language]);

  const t = translations[language] || translations.hu;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
