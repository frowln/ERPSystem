import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  employeeStatusColorMap,
  employeeStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Employee } from '@/types';

const statusOptions = [
  { value: '', label: t('hr.employeeList.statusLabels.all') },
  { value: 'ACTIVE', label: t('hr.employeeList.statusLabels.active') },
  { value: 'ON_LEAVE', label: t('hr.employeeList.statusLabels.onLeave') },
  { value: 'TERMINATED', label: t('hr.employeeList.statusLabels.terminated') },
  { value: 'SUSPENDED', label: t('hr.employeeList.statusLabels.suspended') },
];

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['EMPLOYEES'],
    queryFn: () => hrApi.getEmployees(),
  });

  const employees = employeesData?.content ?? [];

  const filteredEmployees = useMemo(() => {
    let filtered = employees ?? [];

    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(lower) ||
          e.employeeNumber.toLowerCase().includes(lower) ||
          e.position.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [employees, statusFilter, search]);

  const columns = useMemo<ColumnDef<Employee, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeNumber',
        header: t('hr.employeeList.columnEmployeeNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'fullName',
        header: t('hr.employeeList.columnFullName'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'position',
        header: t('hr.employeeList.columnPosition'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'departmentName',
        header: t('hr.employeeList.columnDepartment'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('hr.employeeList.columnStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={employeeStatusColorMap}
            label={employeeStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'certificateCount',
        header: t('hr.employeeList.columnCertificates'),
        size: 120,
        cell: ({ getValue }) => {
          const count = getValue<number>();
          return (
            <span className="tabular-nums text-center block">{count > 0 ? count : '---'}</span>
          );
        },
      },
      {
        accessorKey: 'hireDate',
        header: t('hr.employeeList.columnHireDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (employee: Employee) => navigate(`/hr/employees/${employee.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.employeeList.title')}
        subtitle={t('hr.employeeList.subtitle', { count: (employees ?? []).length })}
        breadcrumbs={[
          { label: t('hr.employeeList.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel') },
          { label: t('hr.employeeList.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/hr/employees/new')}>
            {t('hr.employeeList.newEmployee')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('hr.employeeList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<Employee>
        data={filteredEmployees}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('hr.employeeList.emptyTitle')}
        emptyDescription={t('hr.employeeList.emptyDescription')}
      />
    </div>
  );
};

export default EmployeeListPage;
