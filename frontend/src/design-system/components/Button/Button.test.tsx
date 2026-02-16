// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Button } from './index';

afterEach(cleanup);

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('is disabled when loading is true', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
  });

  it('does not set aria-busy when not loading', () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole('button', { name: 'Normal' })).not.toHaveAttribute('aria-busy');
  });

  it('renders with default variant (primary)', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button', { name: 'Primary' });
    expect(btn.className).toContain('bg-primary-600');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn.className).toContain('bg-danger-600');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.className).toContain('hover:bg-neutral-100');
  });

  it('applies success variant styles', () => {
    render(<Button variant="success">Success</Button>);
    const btn = screen.getByRole('button', { name: 'Success' });
    expect(btn.className).toContain('bg-success-600');
  });

  it('applies fullWidth class when fullWidth=true', () => {
    render(<Button fullWidth>Full Width</Button>);
    const btn = screen.getByRole('button', { name: 'Full Width' });
    expect(btn.className).toContain('w-full');
  });

  it('does not apply fullWidth class by default', () => {
    render(<Button>Normal Width</Button>);
    const btn = screen.getByRole('button', { name: 'Normal Width' });
    expect(btn.className).not.toContain('w-full');
  });

  it('renders iconLeft when not loading', () => {
    const icon = <span data-testid="icon-left">L</span>;
    render(<Button iconLeft={icon}>With Icon</Button>);
    expect(screen.getByTestId('icon-left')).toBeInTheDocument();
  });

  it('replaces iconLeft with spinner when loading', () => {
    const icon = <span data-testid="icon-left">L</span>;
    render(<Button iconLeft={icon} loading>Loading</Button>);
    expect(screen.queryByTestId('icon-left')).not.toBeInTheDocument();
  });

  it('renders iconRight when not loading', () => {
    const icon = <span data-testid="icon-right">R</span>;
    render(<Button iconRight={icon}>With Icon</Button>);
    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
  });

  it('hides iconRight when loading', () => {
    const icon = <span data-testid="icon-right">R</span>;
    render(<Button iconRight={icon} loading>Loading</Button>);
    expect(screen.queryByTestId('icon-right')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    expect(screen.getByRole('button', { name: 'Custom' }).className).toContain('my-custom-class');
  });

  it('forwards additional HTML button attributes', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const btn = screen.getByTestId('submit-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });

  it('has displayName set', () => {
    expect(Button.displayName).toBe('Button');
  });
});
