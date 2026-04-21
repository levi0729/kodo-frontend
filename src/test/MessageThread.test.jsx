import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 1, display_name: 'Me' },
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

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

import MessageThread from '@/components/messages/MessageThread';

const makeMsg = (overrides = {}) => ({
  id: 1,
  sender_id: 2,
  content: 'Hello world',
  created_at: '2026-04-19T10:00:00Z',
  is_pinned: false,
  reactions: [],
  attachments: [],
  ...overrides,
});

const mockGetUserById = (id) => ({
  id,
  display_name: id === 1 ? 'Me' : 'Other User',
  avatar_url: null,
  presence_status: 'online',
});

describe('MessageThread', () => {
  const defaultProps = {
    messages: [],
    messagesLoading: false,
    activeDmUserId: 2,
    dmUser: { display_name: 'Other User', job_title: 'Dev' },
    activeTeam: null,
    activeChannel: null,
    activeConversation: null,
    getUserById: mockGetUserById,
    toggleReaction: vi.fn(),
  };

  it('shows loading spinner when messagesLoading is true', () => {
    const { container } = render(
      <MessageThread {...defaultProps} messagesLoading={true} />
    );
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state with DM user name when no messages', () => {
    render(<MessageThread {...defaultProps} />);
    expect(screen.getByText('Other User')).toBeTruthy();
    expect(screen.getByText('Start chatting!')).toBeTruthy();
  });

  it('shows channel name in empty state', () => {
    render(
      <MessageThread
        {...defaultProps}
        activeDmUserId={null}
        dmUser={null}
        activeChannel={{ name: 'general', description: 'Main channel' }}
      />
    );
    expect(screen.getByText('#general')).toBeTruthy();
  });

  it('renders messages correctly', () => {
    const messages = [
      makeMsg({ id: 1, sender_id: 2, content: 'Hello from other' }),
      makeMsg({ id: 2, sender_id: 1, content: 'Hello from me' }),
    ];
    render(<MessageThread {...defaultProps} messages={messages} />);
    expect(screen.getByText('Hello from other')).toBeTruthy();
    expect(screen.getByText('Hello from me')).toBeTruthy();
  });

  it('shows sender name on first message', () => {
    const messages = [makeMsg({ id: 1, sender_id: 2, content: 'Test' })];
    render(<MessageThread {...defaultProps} messages={messages} />);
    expect(screen.getByText('Other User')).toBeTruthy();
  });

  it('shows pinned indicator for pinned messages', () => {
    const messages = [makeMsg({ id: 1, is_pinned: true })];
    const { container } = render(
      <MessageThread {...defaultProps} messages={messages} />
    );
    // Pin icon should be rendered
    const pinSvg = container.querySelector('.text-amber-400');
    expect(pinSvg).toBeTruthy();
  });

  it('renders reactions on messages', () => {
    const messages = [
      makeMsg({
        id: 1,
        reactions: [{ emoji: '🎉', users: [1, 2] }],
      }),
    ];
    render(<MessageThread {...defaultProps} messages={messages} />);
    // 🎉 is not in QUICK_EMOJIS, so only one element
    expect(screen.getByText('🎉')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders file attachments', () => {
    const messages = [
      makeMsg({
        id: 1,
        attachments: [{ file_name: 'report.pdf', file_url: 'https://example.com/report.pdf', file_type: 'application/pdf', file_size: 1048576 }],
      }),
    ];
    render(<MessageThread {...defaultProps} messages={messages} />);
    expect(screen.getByText('report.pdf')).toBeTruthy();
    expect(screen.getByText('1.0 MB')).toBeTruthy();
  });

  it('renders image attachments as img tags', () => {
    const messages = [
      makeMsg({
        id: 1,
        attachments: [{ file_name: 'photo.jpg', file_url: 'https://example.com/photo.jpg', file_type: 'image/jpeg' }],
      }),
    ];
    render(<MessageThread {...defaultProps} messages={messages} />);
    const img = screen.getByAltText('photo.jpg');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });

  it('shows no messages when no active conversation', () => {
    render(
      <MessageThread
        {...defaultProps}
        activeDmUserId={null}
        dmUser={null}
        activeChannel={null}
        activeTeam={null}
        activeConversation={null}
        messages={[makeMsg()]}
      />
    );
    // displayMessages should be empty, so it shows empty state
    expect(screen.getByText('Start chatting!')).toBeTruthy();
  });

  it('groups consecutive messages from same sender', () => {
    const messages = [
      makeMsg({ id: 1, sender_id: 2, content: 'First' }),
      makeMsg({ id: 2, sender_id: 2, content: 'Second' }),
    ];
    const { container } = render(
      <MessageThread {...defaultProps} messages={messages} />
    );
    // Only one header with username should show (not two)
    const nameElements = screen.getAllByText('Other User');
    expect(nameElements.length).toBe(1);
  });
});
