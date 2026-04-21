import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/services/api', () => ({
  participants: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
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

import NewTaskModal from '@/components/NewTaskModal';

describe('NewTaskModal', () => {
  const mockClose = vi.fn();
  const mockCreate = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(
      <NewTaskModal
        isOpen={true}
        onClose={mockClose}
        onTaskCreate={mockCreate}
        projectId={1}
        {...props}
      />
    );

  it('renders nothing when not open', () => {
    const { container } = render(
      <NewTaskModal isOpen={false} onClose={mockClose} onTaskCreate={mockCreate} projectId={1} />
    );
    // Modal should not render its form content
    expect(container.querySelector('form')).toBeNull();
  });

  it('renders the modal form when open', () => {
    renderModal();
    // Should show the title input
    expect(screen.getByPlaceholderText('e.g. Dashboard redesign')).toBeTruthy();
  });

  it('shows priority options', () => {
    renderModal();
    expect(screen.getByText('Low')).toBeTruthy();
    expect(screen.getByText('Medium')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('shows validation error when submitting without title', async () => {
    renderModal();
    const submitBtn = screen.getByText('Create task');
    fireEvent.click(submitBtn);
    await waitFor(() => {
      // Should show title required error
      expect(screen.getByText('Task name is required')).toBeTruthy();
    });
  });

  it('calls onTaskCreate with form data when valid', async () => {
    renderModal();
    const titleInput = screen.getByPlaceholderText('e.g. Dashboard redesign');
    fireEvent.change(titleInput, { target: { value: 'My new task' } });
    const submitBtn = screen.getByText('Create task');
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  it('closes on Escape key', () => {
    renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalled();
  });

  it('shows label suggestions', () => {
    renderModal();
    // Label suggestions render as "+ label"
    expect(screen.getByText('+ frontend')).toBeTruthy();
    expect(screen.getByText('+ backend')).toBeTruthy();
  });
});
