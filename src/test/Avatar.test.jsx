import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar, { AvatarStack } from '@/components/Avatar';

const makeUser = (overrides = {}) => ({
  id: 1,
  display_name: 'John Doe',
  avatar_url: null,
  presence_status: 'online',
  ...overrides,
});

describe('Avatar', () => {
  it('returns null when no user is provided', () => {
    const { container } = render(<Avatar user={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders initials when no avatar_url', () => {
    const user = makeUser({ display_name: 'John Doe' });
    const { container } = render(<Avatar user={user} />);
    expect(container.textContent).toBe('JD');
  });

  it('renders single initial for single-word name', () => {
    const user = makeUser({ display_name: 'Admin' });
    const { container } = render(<Avatar user={user} />);
    expect(container.textContent).toBe('A');
  });

  it('renders max 2 initials for 3+ word names', () => {
    const user = makeUser({ display_name: 'John Michael Doe' });
    const { container } = render(<Avatar user={user} />);
    expect(container.textContent).toBe('JM');
  });

  it('renders image when avatar_url is set', () => {
    const user = makeUser({ avatar_url: 'https://example.com/photo.jpg' });
    render(<Avatar user={user} />);
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('applies correct size to the wrapper', () => {
    const user = makeUser();
    const { container } = render(<Avatar user={user} size={48} />);
    const wrapper = container.firstChild;
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
  });

  it('shows status indicator when showStatus is true', () => {
    const user = makeUser({ presence_status: 'online' });
    const { container } = render(<Avatar user={user} showStatus />);
    // The status dot is the second child of the wrapper
    const statusDot = container.firstChild.children[1];
    expect(statusDot).toBeTruthy();
    expect(statusDot.style.backgroundColor).toBe('rgb(34, 197, 94)'); // #22c55e
  });

  it('shows offline status color for unknown status', () => {
    const user = makeUser({ presence_status: 'unknown_status' });
    const { container } = render(<Avatar user={user} showStatus />);
    const statusDot = container.firstChild.children[1];
    expect(statusDot.style.backgroundColor).toBe('rgb(82, 82, 91)'); // #52525b (offline)
  });

  it('does not show status indicator when showStatus is false', () => {
    const user = makeUser();
    const { container } = render(<Avatar user={user} />);
    expect(container.firstChild.children.length).toBe(1);
  });

  it('assigns consistent color based on user id', () => {
    const user1 = makeUser({ id: 1 });
    const user2 = makeUser({ id: 9 }); // 9 % 8 === 1, same color
    const { container: c1 } = render(<Avatar user={user1} />);
    const { container: c2 } = render(<Avatar user={user2} />);
    const bg1 = c1.querySelector('[style]').children[0]?.style?.backgroundColor
      || c1.firstChild.children[0].style.backgroundColor;
    const bg2 = c2.querySelector('[style]').children[0]?.style?.backgroundColor
      || c2.firstChild.children[0].style.backgroundColor;
    expect(bg1).toBe(bg2);
  });
});

describe('AvatarStack', () => {
  const users = Array.from({ length: 6 }, (_, i) => makeUser({ id: i + 1, display_name: `User ${i + 1}` }));

  it('shows max number of avatars', () => {
    const { container } = render(<AvatarStack users={users} max={4} />);
    // 4 avatars + 1 overflow indicator
    const children = container.firstChild.children;
    expect(children.length).toBe(5); // 4 avatars + "+2" badge
  });

  it('shows overflow count', () => {
    const { container } = render(<AvatarStack users={users} max={4} />);
    expect(container.textContent).toContain('+2');
  });

  it('does not show overflow when users fit within max', () => {
    const fewUsers = users.slice(0, 3);
    const { container } = render(<AvatarStack users={fewUsers} max={4} />);
    expect(container.textContent).not.toContain('+');
  });

  it('renders all users when count equals max', () => {
    const exactUsers = users.slice(0, 4);
    const { container } = render(<AvatarStack users={exactUsers} max={4} />);
    expect(container.firstChild.children.length).toBe(4);
  });
});
