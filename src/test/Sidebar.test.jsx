import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// --- Mocks for context providers ---
const mockNavigate = vi.fn();
const mockMobileClose = vi.fn();

vi.mock('@/context/ProjectContext', () => ({
  useProject: () => ({
    activeProject: { id: 1, name: 'Test Project', color: '#6366f1' },
    setActiveProjectId: vi.fn(),
    userProjects: [
      { id: 1, name: 'Test Project', color: '#6366f1' },
      { id: 2, name: 'Second Project', color: '#ec4899' },
    ],
  }),
}));

vi.mock('@/context/MessagesContext', () => ({
  useMessages: () => ({ unreadCount: 3 }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 1,
      display_name: 'Test User',
      presence_status: 'online',
      avatar_url: null,
    },
  }),
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

vi.mock('@/components/CreateProjectModal', () => ({
  default: () => null,
}));

vi.mock('@/components/UserStatusPopup', () => ({
  default: () => null,
}));

import Sidebar from '@/components/Sidebar';

describe('Sidebar', () => {
  const renderSidebar = (props = {}) =>
    render(
      <Sidebar
        activePage="dashboard"
        onNavigate={mockNavigate}
        mobileOpen={false}
        onMobileClose={mockMobileClose}
        {...props}
      />
    );

  it('renders all navigation items', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Calendar')).toBeTruthy();
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Teams')).toBeTruthy();
    expect(screen.getByText('Messages')).toBeTruthy();
    expect(screen.getByText('Time Tracking')).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByText('Activity')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('shows unread badge on Messages', () => {
    renderSidebar();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('displays active project name', () => {
    renderSidebar();
    expect(screen.getByText('Test Project')).toBeTruthy();
  });

  it('calls onNavigate when clicking a nav item', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Calendar'));
    expect(mockNavigate).toHaveBeenCalledWith('calendar');
  });

  it('calls onMobileClose when navigating', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Teams'));
    expect(mockMobileClose).toHaveBeenCalled();
  });

  it('shows user display name', () => {
    renderSidebar();
    expect(screen.getByText('Test User')).toBeTruthy();
  });

  it('displays KODO brand text', () => {
    renderSidebar();
    expect(screen.getByText('KODO')).toBeTruthy();
  });

  it('shows project dropdown with all projects on click', () => {
    renderSidebar();
    // Click the project selector button
    fireEvent.click(screen.getByText('Test Project'));
    // Should show both projects in the dropdown
    expect(screen.getByText('Second Project')).toBeTruthy();
  });

  it('renders the settings nav item in the footer', () => {
    renderSidebar();
    expect(screen.getByText('Settings')).toBeTruthy();
  });
});
