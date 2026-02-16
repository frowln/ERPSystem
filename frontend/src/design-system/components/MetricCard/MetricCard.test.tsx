// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MetricCard } from './index';

afterEach(cleanup);

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Revenue" value="$100,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<MetricCard label="Count" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="metric-icon">I</span>;
    render(<MetricCard label="Revenue" value="$100" icon={icon} />);
    expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
  });

  it('renders trend with up direction', () => {
    render(
      <MetricCard
        label="Revenue"
        value="$100"
        trend={{ direction: 'up', value: '+12%' }}
      />,
    );
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders trend with down direction', () => {
    render(
      <MetricCard
        label="Cost"
        value="$50"
        trend={{ direction: 'down', value: '-5%' }}
      />,
    );
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders trend with neutral direction', () => {
    render(
      <MetricCard
        label="Stable"
        value="$75"
        trend={{ direction: 'neutral', value: '0%' }}
      />,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<MetricCard label="Revenue" value="$100" subtitle="vs last month" />);
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<MetricCard label="Revenue" value="$100" loading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('$100')).not.toBeInTheDocument();
  });

  it('does not show loading skeleton when loading=false', () => {
    const { container } = render(<MetricCard label="Revenue" value="$100" />);
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MetricCard label="Revenue" value="$100" className="custom-class" />,
    );
    expect(container.firstElementChild?.className).toContain('custom-class');
  });

  it('renders compact variant with smaller padding', () => {
    const { container } = render(
      <MetricCard label="Revenue" value="$100" compact />,
    );
    expect(container.firstElementChild?.className).toContain('p-4');
  });

  it('renders normal variant with larger padding', () => {
    const { container } = render(
      <MetricCard label="Revenue" value="$100" />,
    );
    expect(container.firstElementChild?.className).toContain('p-5');
  });
});
