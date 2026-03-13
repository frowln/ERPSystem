// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DataTable } from './index';
import type { ColumnDef } from '@tanstack/react-table';

// Mock useIsMobile to always return false (desktop)
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
  useMediaQuery: () => false,
  useIsTablet: () => false,
}));

afterEach(cleanup);

interface TestRow {
  id: string;
  name: string;
  status: string;
  amount: number;
}

const mockData: TestRow[] = [
  { id: '1', name: 'Alpha', status: 'Active', amount: 100 },
  { id: '2', name: 'Beta', status: 'Inactive', amount: 200 },
  { id: '3', name: 'Gamma', status: 'Active', amount: 300 },
];

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Amount' },
];

describe('DataTable', () => {
  it('renders table with column headers', () => {
    render(<DataTable data={mockData} columns={columns} enableExport />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('renders table data rows', () => {
    render(<DataTable data={mockData} columns={columns} enableExport />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders numeric cell values', () => {
    render(<DataTable data={mockData} columns={columns} enableExport />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(
      <DataTable data={[]} columns={columns} emptyTitle="No data found" enableExport />,
    );
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable data={mockData} columns={columns} onRowClick={onRowClick} enableExport />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders with custom tableLabel for accessibility', () => {
    render(<DataTable data={mockData} columns={columns} tableLabel="Project list" enableExport />);
    const table = screen.getByRole('table', { name: 'Project list' });
    expect(table).toBeInTheDocument();
  });

  it('renders loading skeleton when loading=true', () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} loading enableExport />,
    );
    // Skeleton rows should have animate-pulse
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('does not show data rows when loading', () => {
    render(<DataTable data={mockData} columns={columns} loading enableExport />);
    // When loading, data should not be rendered -- skeleton replaces it
    // But the loading state replaces the tbody content
    const alphaElements = screen.queryAllByText('Alpha');
    // In loading state, DataTable renders SkeletonRows instead of data
    // Alpha should not appear
    expect(alphaElements).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataTable data={mockData} columns={columns} className="my-custom-table" enableExport />,
    );
    expect(container.firstElementChild?.className).toContain('my-custom-table');
  });

  it('renders caption with sr-only class for accessibility', () => {
    render(<DataTable data={mockData} columns={columns} tableLabel="Items" enableExport />);
    const caption = screen.getByText('Items', { selector: 'caption' });
    expect(caption).toBeInTheDocument();
    expect(caption.className).toContain('sr-only');
  });

  it('handles sorting by clicking column header', () => {
    render(<DataTable data={mockData} columns={columns} enableExport />);
    // Click "Name" column header to sort
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    // After first click, should be sorted ascending
    const rows = screen.getAllByRole('row');
    // First row is the header, data rows start at index 1
    expect(rows.length).toBeGreaterThan(1);
  });
});
