import { createContext, useContext, useState, useEffect } from 'react';
import translations from '@/i18n/translations';

const ThemeContext = createContext();

const FONT_SIZE_MAP = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => sessionStorage.getItem('kodo-theme') || 'dark');
  const [language, setLanguage] = useState(() => sessionStorage.getItem('kodo-lang') || 'hu');
  const [fontSize, setFontSize] = useState(() => sessionStorage.getItem('kodo-font-size') || 'medium');

  useEffect(() => {
    sessionStorage.setItem('kodo-theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    sessionStorage.setItem('kodo-lang', language);
  }, [language]);

  useEffect(() => {
    sessionStorage.setItem('kodo-font-size', fontSize);
    document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] || '16px';
  }, [fontSize]);

  const t = translations[language] || translations.hu;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage, fontSize, setFontSize, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
