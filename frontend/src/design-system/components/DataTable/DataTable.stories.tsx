import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './index';

interface Contract {
  id: string;
  number: string;
  counterparty: string;
  value: number;
  status: 'active' | 'completed' | 'draft';
  startDate: string;
}

const COLUMNS: ColumnDef<Contract, unknown>[] = [
  { accessorKey: 'number', header: 'Contract #', enableSorting: true },
  { accessorKey: 'counterparty', header: 'Counterparty', enableSorting: true },
  {
    accessorKey: 'value',
    header: 'Value (RUB)',
    enableSorting: true,
    cell: ({ getValue }) =>
      (getValue() as number).toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue() as Contract['status'];
      const colour: Record<Contract['status'], string> = {
        active: 'bg-success-100 text-success-700',
        completed: 'bg-neutral-100 text-neutral-600',
        draft: 'bg-warning-100 text-warning-700',
      };
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colour[v]}`}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </span>
      );
    },
  },
  { accessorKey: 'startDate', header: 'Start Date', enableSorting: true },
];

const ROWS: Contract[] = [
  { id: '1', number: 'CTR-2026-00142', counterparty: 'Alpha Stroy LLC', value: 12_500_000, status: 'active', startDate: '2026-01-10' },
  { id: '2', number: 'CTR-2026-00139', counterparty: 'Beta Montazh JSC', value: 4_780_000, status: 'draft', startDate: '2026-01-22' },
  { id: '3', number: 'CTR-2025-00088', counterparty: 'Gamma Servis Ltd', value: 31_200_000, status: 'completed', startDate: '2025-07-01' },
  { id: '4', number: 'CTR-2026-00155', counterparty: 'Delta Stroy OOO', value: 8_950_000, status: 'active', startDate: '2026-02-03' },
  { id: '5', number: 'CTR-2026-00161', counterparty: 'Epsilon Pipe PAO', value: 55_000_000, status: 'draft', startDate: '2026-02-15' },
];

const meta: Meta<typeof DataTable> = {
  title: 'Design System/DataTable',
  component: DataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Feature-rich table powered by TanStack Table v8. Supports sorting, filtering, ' +
          'column-visibility, density toggle, row selection, bulk actions, and pagination.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const EmptyTable: Story = {
  name: 'EmptyTable',
  render: () => (
    <div className="p-6">
      <DataTable<Contract>
        columns={COLUMNS}
        data={[]}
        emptyTitle="No contracts found"
        emptyDescription="Create your first contract to get started."
        tableLabel="Contracts table — empty"
      />
    </div>
  ),
};

export const WithData: Story = {
  name: 'WithData (5 rows)',
  render: () => (
    <div className="p-6">
      <DataTable<Contract>
        columns={COLUMNS}
        data={ROWS}
        tableLabel="Contracts table"
      />
    </div>
  ),
};

export const WithSorting: Story = {
  name: 'WithSorting',
  render: () => (
    <div className="p-6">
      <DataTable<Contract>
        columns={COLUMNS}
        data={ROWS}
        tableLabel="Contracts table — click headers to sort"
      />
    </div>
  ),
};

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <div className="p-6">
      <DataTable<Contract>
        columns={COLUMNS}
        data={[]}
        loading={true}
        tableLabel="Contracts table — loading"
      />
    </div>
  ),
};
