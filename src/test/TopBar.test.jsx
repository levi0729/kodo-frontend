import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/context/ProjectContext', () => ({
  useProject: () => ({
    activeProject: { id: 1, name: 'Test Project' },
  }),
}));

vi.mock('@/context/MessagesContext', () => ({
  useMessages: () => ({
    notifications: [],
    markAllNotificationsRead: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  notifications: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    markAllRead: vi.fn(() => Promise.resolve()),
  },
  users: {
    show: vi.fn(() => Promise.resolve({ user: null })),
  },
}));

vi.mock('@/context/ThemeContext', async () => {
  const translations = (await import('@/i18n/translations')).default;
  return {
    useTheme: () => ({
      t: translations.en,
      language: 'en',
    }),
  };
});

import TopBar from '@/components/TopBar';

describe('TopBar', () => {
  const mockMenuToggle = vi.fn();
  const mockSearchOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTopBar = (props = {}) =>
    render(
      <TopBar
        activePage="dashboard"
        onMenuToggle={mockMenuToggle}
        onSearchOpen={mockSearchOpen}
        {...props}
      />
    );

  it('displays the active page label', () => {
    renderTopBar();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('displays the active project name', () => {
    renderTopBar();
    expect(screen.getByText('Test Project')).toBeTruthy();
  });

  it('shows correct page label for different pages', () => {
    renderTopBar({ activePage: 'calendar' });
    expect(screen.getByText('Calendar')).toBeTruthy();
  });

  it('calls onSearchOpen when search button is clicked', () => {
    renderTopBar();
    // aria-label is t.common.search = "Search..."
    const searchButtons = screen.getAllByLabelText('Search...');
    fireEvent.click(searchButtons[0]);
    expect(mockSearchOpen).toHaveBeenCalled();
  });

  it('calls onMenuToggle when menu button is clicked', () => {
    renderTopBar();
    const menuBtn = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuBtn);
    expect(mockMenuToggle).toHaveBeenCalled();
  });

  it('renders notification bell', () => {
    renderTopBar();
    expect(screen.getByLabelText('Notifications')).toBeTruthy();
  });

  it('shows keyboard shortcut in search button', () => {
    renderTopBar();
    // Should show either ⌘K or Ctrl+K depending on platform
    const kbd = document.querySelector('kbd');
    expect(kbd).toBeTruthy();
    expect(kbd.textContent).toMatch(/⌘K|Ctrl\+K/);
  });

  it('opens notification panel on bell click', () => {
    renderTopBar();
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Mark all read')).toBeTruthy();
  });
});
