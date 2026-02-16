// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmDialog } from './index';

afterEach(cleanup);

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
    defaultProps.onConfirm.mockClear();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} open={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title when open=true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ConfirmDialog {...defaultProps} description="This action cannot be undone." />,
    );
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(<ConfirmDialog {...defaultProps} />);
    // Default labels come from i18n t() -- let's find buttons in footer
    const buttons = screen.getAllByRole('button');
    // At least 2 buttons: cancel and confirm (plus close button from Modal header)
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders custom confirm label', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Yes, delete" />);
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
  });

  it('renders custom cancel label', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="No, keep" />);
    expect(screen.getByText('No, keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Confirm" />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="Cancel" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders items list when items provided', () => {
    render(
      <ConfirmDialog {...defaultProps} items={['Item 1', 'Item 2', 'Item 3']} />,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('limits visible items to maxVisibleItems', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    render(<ConfirmDialog {...defaultProps} items={items} maxVisibleItems={3} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('shows "and more" text for hidden items', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F'];
    render(<ConfirmDialog {...defaultProps} items={items} maxVisibleItems={3} />);
    // Should show some kind of "+3 more" text
    const container = screen.getByText(/3/);
    expect(container).toBeInTheDocument();
  });

  it('does not render items section when items is empty', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} items={[]} />);
    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });

  it('disables buttons when loading=true', () => {
    render(<ConfirmDialog {...defaultProps} loading confirmLabel="Confirm" cancelLabel="Cancel" />);
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
  });
});
