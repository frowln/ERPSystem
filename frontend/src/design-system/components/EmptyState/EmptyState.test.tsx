// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EmptyState } from './index';

afterEach(cleanup);

describe('EmptyState', () => {
  it('renders with default "no-data" variant', () => {
    render(<EmptyState />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<EmptyState description="Add your first item" />);
    expect(screen.getByText('Add your first item')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon={<span data-testid="custom-icon">IC</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Create" onAction={onAction} />);
    const btn = screen.getByRole('button', { name: /Create/i });
    expect(btn).toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', () => {
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Create" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when only actionLabel is provided', () => {
    render(<EmptyState actionLabel="Create" />);
    expect(screen.queryByRole('button', { name: /Create/i })).not.toBeInTheDocument();
  });

  it('does not render action button when only onAction is provided', () => {
    render(<EmptyState onAction={() => {}} />);
    // No button should be rendered as there is no label
    const status = screen.getByRole('status');
    expect(status.querySelector('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="my-empty" />);
    expect(container.firstElementChild?.className).toContain('my-empty');
  });

  it('renders no-results variant', () => {
    render(<EmptyState variant="no-results" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders ERROR variant', () => {
    render(<EmptyState variant="ERROR" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
