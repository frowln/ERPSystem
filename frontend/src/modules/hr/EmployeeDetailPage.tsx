import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Edit3,
  User,
  Phone,
  Mail,
  Calendar,
  Building2,
  Briefcase,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  employeeStatusColorMap,
  employeeStatusLabels,
} from '@/design-system/components/StatusBadge';
import { hrApi } from '@/api/hr';
import { formatDate, formatDateLong } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Employee } from '@/types';

interface Certificate {
  id: string;
  name: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

interface ProjectAssignment {
  id: string;
  projectName: string;
  role: string;
  startDate: string;
  endDate?: string;
}

type DetailTab = 'info' | 'certificates' | 'projects' | 'hours';

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  const { data: employee } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => hrApi.getEmployee(id!),
    enabled: !!id,
  });

  const e = employee;

  const certColumns = useMemo<ColumnDef<Certificate, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('hr.employeeDetail.certColumnName'),
        size: 260,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'number',
        header: t('hr.employeeDetail.certColumnNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'issuedDate',
        header: t('hr.employeeDetail.certColumnIssued'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('hr.employeeDetail.certColumnExpiry'),
        size: 140,
        cell: ({ row }) => (
          <span className={cn(
            'tabular-nums',
            row.original.isExpired && 'text-danger-600 font-medium',
            row.original.isExpiringSoon && 'text-warning-600 font-medium',
          )}>
            {formatDate(row.original.expiryDate)}
            {row.original.isExpiringSoon && !row.original.isExpired && ` (${t('hr.employeeDetail.expiringSoon')})`}
            {row.original.isExpired && ` (${t('hr.employeeDetail.expired')})`}
          </span>
        ),
      },
    ],
    [],
  );

  const assignmentColumns = useMemo<ColumnDef<ProjectAssignment, unknown>[]>(
    () => [
      {
        accessorKey: 'projectName',
        header: t('hr.employeeDetail.assignColumnProject'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: t('hr.employeeDetail.assignColumnRole'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: t('hr.employeeDetail.assignColumnStart'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: t('hr.employeeDetail.assignColumnEnd'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<string>() ? formatDate(getValue<string>()) : t('hr.employeeDetail.toPresent')}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={e?.fullName ?? ''}
        subtitle={`${e?.employeeNumber ?? ''} / ${e?.position ?? ''}`}
        backTo="/hr/employees"
        breadcrumbs={[
          { label: t('hr.employeeDetail.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel') },
          { label: t('hr.employeeList.title'), href: '/hr/employees' },
          { label: e?.fullName ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={e?.status ?? ''}
              colorMap={employeeStatusColorMap}
              label={employeeStatusLabels[e?.status ?? ''] ?? e?.status ?? ''}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/hr/employees/${id}/edit`)}
            >
              {t('hr.employeeDetail.btnEdit')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'info', label: t('hr.employeeDetail.tabInfo') },
          { id: 'certificates', label: t('hr.employeeDetail.tabCertificates') },
          { id: 'projects', label: t('hr.employeeDetail.tabProjects') },
          { id: 'hours', label: t('hr.employeeDetail.tabHours') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<Briefcase size={18} />} label={t('hr.employeeDetail.metricPosition')} value={e?.position ?? ''} />
            <MetricCard icon={<Building2 size={18} />} label={t('hr.employeeDetail.metricDepartment')} value={e?.departmentName ?? '---'} />
            <MetricCard icon={<Calendar size={18} />} label={t('hr.employeeDetail.metricHireDate')} value={formatDate(e?.hireDate ?? '')} />
            <MetricCard icon={<Shield size={18} />} label={t('hr.employeeDetail.metricCertificates')} value={String(e?.certificateCount ?? 0)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('hr.employeeDetail.sectionPersonalData')}</h3>
              <div className="space-y-4">
                <InfoItem icon={<User size={15} />} label={t('hr.employeeDetail.labelFullName')} value={e?.fullName ?? ''} />
                <InfoItem icon={<Briefcase size={15} />} label={t('hr.employeeDetail.labelEmployeeNumber')} value={e?.employeeNumber ?? ''} />
                {e?.phone && <InfoItem icon={<Phone size={15} />} label={t('hr.employeeDetail.labelPhone')} value={e.phone} />}
                {e?.email && <InfoItem icon={<Mail size={15} />} label={t('hr.employeeDetail.labelEmail')} value={e.email} />}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('hr.employeeDetail.sectionWorkInfo')}</h3>
              <div className="space-y-4">
                <InfoItem icon={<Building2 size={15} />} label={t('hr.employeeDetail.labelDepartment')} value={e?.departmentName ?? '---'} />
                <InfoItem icon={<Briefcase size={15} />} label={t('hr.employeeDetail.labelPosition')} value={e?.position ?? ''} />
                <InfoItem icon={<Calendar size={15} />} label={t('hr.employeeDetail.labelHireDate')} value={formatDateLong(e?.hireDate ?? '')} />
                <div className="flex items-start gap-3">
                  <span className="text-neutral-400 mt-0.5 flex-shrink-0"><Clock size={15} /></span>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('hr.employeeDetail.labelTenure')}</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {e?.hireDate ? Math.floor((Date.now() - new Date(e.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0} {t('hr.employeeDetail.years')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {([] as any[]).some((c) => c.isExpiringSoon) && (
            <div className="flex items-center gap-2 px-4 py-3 bg-warning-50 border border-warning-200 rounded-lg">
              <AlertTriangle size={16} className="text-warning-600" />
              <span className="text-sm text-warning-700">{t('hr.employeeDetail.expiryWarning')}</span>
            </div>
          )}
          <DataTable<Certificate>
            data={[]}
            columns={certColumns}
            loading={false}
            enableExport
            pageSize={20}
            emptyTitle={t('hr.employeeDetail.emptyCertTitle')}
            emptyDescription={t('hr.employeeDetail.emptyCertDescription')}
          />
        </div>
      )}

      {activeTab === 'projects' && (
        <DataTable<ProjectAssignment>
          data={[]}
          columns={assignmentColumns}
          loading={false}
          enableExport
          pageSize={20}
          emptyTitle={t('hr.employeeDetail.emptyAssignTitle')}
          emptyDescription={t('hr.employeeDetail.emptyAssignDescription')}
        />
      )}

      {activeTab === 'hours' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard icon={<Clock size={18} />} label={t('hr.employeeDetail.metricHoursMonth')} value="168" />
            <MetricCard icon={<Clock size={18} />} label={t('hr.employeeDetail.metricOvertime')} value="12" trend={{ direction: 'up', value: '7,1%' }} />
            <MetricCard icon={<Calendar size={18} />} label={t('hr.employeeDetail.metricWorkDays')} value="21" />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Clock size={40} strokeWidth={1.5} className="text-neutral-300 mb-4" />
              <h3 className="text-base font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('hr.employeeDetail.sectionHoursDetail')}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                {t('hr.employeeDetail.infoHoursDetail')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default EmployeeDetailPage;
