// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from './index';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('Modal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(
      <Modal open={false} onClose={onClose}>
        <div>Hidden</div>
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders children when open=true', () => {
    render(<Modal open onClose={onClose}>Visible content</Modal>);
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal open onClose={onClose} title="Test Title">Content</Modal>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Modal open onClose={onClose} title="Title" description="A description">Content</Modal>);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('has dialog role with aria-modal', () => {
    render(<Modal open onClose={onClose}>Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<Modal open onClose={onClose}>Content</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked with closeOnOverlayClick=true', () => {
    const { container } = render(<Modal open onClose={onClose}>Content</Modal>);
    const overlay = container.querySelector('.absolute.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose on overlay click when closeOnOverlayClick=false', () => {
    const { container } = render(
      <Modal open onClose={onClose} closeOnOverlayClick={false}>Content</Modal>,
    );
    const overlay = container.querySelector('.absolute.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('renders footer when provided', () => {
    render(
      <Modal open onClose={onClose} footer={<button>Save</button>}>
        Content
      </Modal>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not render footer when not provided', () => {
    render(<Modal open onClose={onClose}>Content</Modal>);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('sets body overflow to hidden when open', () => {
    render(<Modal open onClose={onClose}>Content</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('renders close button when title is present', () => {
    render(<Modal open onClose={onClose} title="Title">Content</Modal>);
    const closeBtn = screen.getByLabelText(/close|закрыть/i);
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Modal open onClose={onClose} title="Title">Content</Modal>);
    const closeBtn = screen.getByLabelText(/close|закрыть/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
