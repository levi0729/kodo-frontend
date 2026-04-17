import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '@/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct width for a normal value', () => {
    const { container } = render(<ProgressBar value={50} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('50%');
  });

  it('clamps value at 100 when exceeding', () => {
    const { container } = render(<ProgressBar value={150} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('100%');
  });

  it('clamps value at 0 for negative values', () => {
    const { container } = render(<ProgressBar value={-10} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('0%');
  });

  it('applies custom height', () => {
    const { container } = render(<ProgressBar value={50} height={12} />);
    const wrapper = container.firstChild;
    expect(wrapper.style.height).toBe('12px');
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar value={50} className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('renders 0% for zero value', () => {
    const { container } = render(<ProgressBar value={0} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('0%');
  });

  it('renders 100% for full value', () => {
    const { container } = render(<ProgressBar value={100} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('100%');
  });
});
