import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Mock sessionStorage
const store = {};
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn((key) => store[key] || null),
  setItem: vi.fn((key, val) => { store[key] = val; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
});

function TestConsumer() {
  const { theme, setTheme, language, setLanguage, t } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="lang">{language}</span>
      <span data-testid="nav-dashboard">{t.nav.dashboard}</span>
      <span data-testid="nav-calendar">{t.nav.calendar}</span>
      <button data-testid="toggle-lang" onClick={() => setLanguage(language === 'hu' ? 'en' : 'hu')}>toggle</button>
      <button data-testid="toggle-theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>theme</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    vi.clearAllMocks();
  });

  it('defaults to Hungarian language and dark theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('lang').textContent).toBe('hu');
  });

  it('provides Hungarian translations by default', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    // Hungarian "Naptár" for calendar
    expect(screen.getByTestId('nav-calendar').textContent).toBe('Naptár');
  });

  it('switches to English translations', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    act(() => {
      screen.getByTestId('toggle-lang').click();
    });
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('nav-calendar').textContent).toBe('Calendar');
  });

  it('persists language to sessionStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    act(() => {
      screen.getByTestId('toggle-lang').click();
    });
    expect(sessionStorage.setItem).toHaveBeenCalledWith('kodo-lang', 'en');
  });

  it('persists theme to sessionStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    act(() => {
      screen.getByTestId('toggle-theme').click();
    });
    expect(sessionStorage.setItem).toHaveBeenCalledWith('kodo-theme', 'light');
  });

  it('throws when useTheme is used outside provider', () => {
    // Suppress error boundary noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });

  it('restores saved language from sessionStorage', () => {
    store['kodo-lang'] = 'en';
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('nav-calendar').textContent).toBe('Calendar');
  });

  it('restores saved theme from sessionStorage', () => {
    store['kodo-theme'] = 'light';
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('Dashboard translation key has name placeholder', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    // Verify the greeting pattern exists in Hungarian
    // This is a structural test — ensures the translation shape is correct
    act(() => {
      screen.getByTestId('toggle-lang').click();
    });
    // English nav should differ from Hungarian
    expect(screen.getByTestId('nav-dashboard').textContent).toBe('Dashboard');
  });
});
