// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PageHeader } from './index';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

afterEach(cleanup);

describe('PageHeader', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders title', () => {
    render(<PageHeader title="Projects" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projects');
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Projects" subtitle="All active projects" />);
    expect(screen.getByText('All active projects')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<PageHeader title="Projects" />);
    expect(screen.queryByText('All active projects')).not.toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'Detail' },
    ];
    render(<PageHeader title="Project Detail" breadcrumbs={breadcrumbs} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('navigates when breadcrumb with href is clicked', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Current' },
    ];
    render(<PageHeader title="Page" breadcrumbs={breadcrumbs} />);
    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does not navigate for breadcrumb without href', () => {
    const breadcrumbs = [{ label: 'Current' }];
    render(<PageHeader title="Page" breadcrumbs={breadcrumbs} />);
    expect(screen.getByText('Current').tagName).toBe('SPAN');
  });

  it('renders actions slot', () => {
    render(
      <PageHeader title="Projects" actions={<button>Create</button>} />,
    );
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders tabs', () => {
    const tabs = [
      { id: 'all', label: 'All', count: 10 },
      { id: 'active', label: 'Active', count: 5 },
    ];
    render(<PageHeader title="Projects" tabs={tabs} activeTab="all" />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn();
    const tabs = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];
    render(
      <PageHeader title="Projects" tabs={tabs} activeTab="all" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByText('Active'));
    expect(onTabChange).toHaveBeenCalledWith('active');
  });

  it('renders back button when backTo is provided', () => {
    render(<PageHeader title="Detail" backTo="/projects" />);
    const backBtn = screen.getByLabelText(/back|назад/i);
    expect(backBtn).toBeInTheDocument();
  });

  it('navigates when back button is clicked', () => {
    render(<PageHeader title="Detail" backTo="/projects" />);
    const backBtn = screen.getByLabelText(/back|назад/i);
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('applies custom className', () => {
    const { container } = render(<PageHeader title="Page" className="custom" />);
    expect(container.firstElementChild?.className).toContain('custom');
  });

  it('does not render breadcrumbs nav when breadcrumbs is empty', () => {
    const { container } = render(<PageHeader title="Page" breadcrumbs={[]} />);
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });
});
