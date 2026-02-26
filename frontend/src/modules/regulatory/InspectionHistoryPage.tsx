import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate, formatMoney } from '@/lib/format';
import type { InspectionRecord } from './types';
import { t } from '@/i18n';

type TabId = 'all' | 'completed' | 'in_progress' | 'appealed';

const inspRecordStatusColorMap: Record<string, string> = {
  completed: 'green',
  in_progress: 'yellow',
  appealed: 'orange',
};

const inspRecordResultColorMap: Record<string, string> = {
  passed: 'green',
  violations_found: 'red',
  pending: 'gray',
};

const inspRecordTypeColorMap: Record<string, string> = {
  planned: 'blue',
  unplanned: 'orange',
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

const InspectionHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<InspectionRecord | null>(null);

  const { data: records = [], isLoading } = useQuery<InspectionRecord[]>({
    queryKey: ['inspection-history', yearFilter],
    queryFn: () =>
      regulatoryApi.getInspectionHistory({
        year: yearFilter || undefined,
        type: undefined,
      }),
  });

  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (activeTab !== 'all')
      filtered = filtered.filter((r) => r.status === activeTab);
    if (typeFilter)
      filtered = filtered.filter((r) => r.inspectionType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.authority.toLowerCase().includes(lower) ||
          r.findings.some((f) => f.toLowerCase().includes(lower)),
      );
    }
    return filtered;
  }, [records, activeTab, typeFilter, search]);

  const metrics = useMemo(() => {
    const total = records.length;
    const totalFines = records.reduce((sum, r) => sum + r.fineAmount, 0);
    const lastInspection =
      records.length > 0
        ? records
            .slice()
            .sort(
              (a, b) =>
                new Date(b.checkDate).getTime() -
                new Date(a.checkDate).getTime(),
            )[0]
        : null;

    let avgDaysBetween = 0;
    if (records.length > 1) {
      const sorted = records
        .slice()
        .sort(
          (a, b) =>
            new Date(a.checkDate).getTime() - new Date(b.checkDate).getTime(),
        );
      let totalDays = 0;
      for (let i = 1; i < sorted.length; i++) {
        const diff =
          new Date(sorted[i].checkDate).getTime() -
          new Date(sorted[i - 1].checkDate).getTime();
        totalDays += diff / (1000 * 60 * 60 * 24);
      }
      avgDaysBetween = Math.round(totalDays / (sorted.length - 1));
    }

    return {
      total,
      totalFines,
      lastInspectionDate: lastInspection
        ? formatDate(lastInspection.checkDate)
        : '---',
      avgDaysBetween,
    };
  }, [records]);

  const tabCounts = useMemo(
    () => ({
      all: records.length,
      completed: records.filter((r) => r.status === 'completed').length,
      in_progress: records.filter((r) => r.status === 'in_progress').length,
      appealed: records.filter((r) => r.status === 'appealed').length,
    }),
    [records],
  );

  const getRecordStatusLabel = useCallback((status: string): string => {
    const map: Record<string, string> = {
      completed: t('regulatory.ihStatusCompleted'),
      in_progress: t('regulatory.ihStatusInProgress'),
      appealed: t('regulatory.ihStatusAppealed'),
    };
    return map[status] ?? status;
  }, []);

  const getRecordResultLabel = useCallback((result: string): string => {
    const map: Record<string, string> = {
      passed: t('regulatory.ihResultPassed'),
      violations_found: t('regulatory.ihResultViolations'),
      pending: t('regulatory.ihResultPending'),
    };
    return map[result] ?? result;
  }, []);

  const getRecordTypeLabel = useCallback((type: string): string => {
    const map: Record<string, string> = {
      planned: t('regulatory.ihTypePlanned'),
      unplanned: t('regulatory.ihTypeUnplanned'),
    };
    return map[type] ?? type;
  }, []);

  const columns = useMemo<ColumnDef<InspectionRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'checkDate',
        header: t('regulatory.ihColDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'authority',
        header: t('regulatory.ihColAuthority'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'inspectionType',
        header: t('regulatory.ihColType'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspRecordTypeColorMap}
            label={getRecordTypeLabel(getValue<string>())}
          />
        ),
      },
      {
        accessorKey: 'result',
        header: t('regulatory.ihColResult'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspRecordResultColorMap}
            label={getRecordResultLabel(getValue<string>())}
          />
        ),
      },
      {
        accessorKey: 'fineAmount',
        header: t('regulatory.ihColFines'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return val > 0 ? (
            <span className="font-medium text-danger-600 dark:text-danger-400 tabular-nums text-xs">
              {formatMoney(val)}
            </span>
          ) : (
            <span className="text-neutral-400 text-xs">---</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('regulatory.ihColStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspRecordStatusColorMap}
            label={getRecordStatusLabel(getValue<string>())}
          />
        ),
      },
      {
        accessorKey: 'findings',
        header: t('regulatory.ihColFindings'),
        size: 80,
        cell: ({ getValue }) => {
          const findings = getValue<string[]>();
          return (
            <span className="text-neutral-700 dark:text-neutral-300 text-xs">
              {findings.length}
            </span>
          );
        },
      },
    ],
    [getRecordStatusLabel, getRecordResultLabel, getRecordTypeLabel],
  );

  const handleRowClick = useCallback((record: InspectionRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.ihTitle')}
        subtitle={t('regulatory.ihSubtitle', {
          count: String(records.length),
        })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          {
            label: t('regulatory.breadcrumbRegulatory'),
            href: '/regulatory/dashboard',
          },
          { label: t('regulatory.ihBreadcrumb') },
        ]}
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          {
            id: 'completed',
            label: t('regulatory.ihTabCompleted'),
            count: tabCounts.completed,
          },
          {
            id: 'in_progress',
            label: t('regulatory.ihTabInProgress'),
            count: tabCounts.in_progress,
          },
          {
            id: 'appealed',
            label: t('regulatory.ihTabAppealed'),
            count: tabCounts.appealed,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardCheck size={18} />}
          label={t('regulatory.ihMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('regulatory.ihMetricFinesTotal')}
          value={metrics.totalFines > 0 ? formatMoney(metrics.totalFines) : '0'}
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('regulatory.ihMetricLastDate')}
          value={metrics.lastInspectionDate}
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('regulatory.ihMetricAvgInterval')}
          value={
            metrics.avgDaysBetween > 0
              ? t('regulatory.ihDaysValue', {
                  days: String(metrics.avgDaysBetween),
                })
              : '---'
          }
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('regulatory.ihSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('regulatory.ihTypeFilterAll') },
            { value: 'planned', label: t('regulatory.ihTypePlanned') },
            { value: 'unplanned', label: t('regulatory.ihTypeUnplanned') },
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={[
            { value: '', label: t('regulatory.ihYearFilterAll') },
            ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
          ]}
          value={String(yearFilter)}
          onChange={(e) =>
            setYearFilter(e.target.value ? Number(e.target.value) : '')
          }
          className="w-36"
        />
      </div>

      <DataTable<InspectionRecord>
        data={filteredRecords}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('regulatory.ihEmptyTitle')}
        emptyDescription={t('regulatory.ihEmptyDesc')}
      />

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={t('regulatory.ihDetailTitle')}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  {t('regulatory.ihColDate')}
                </p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">
                  {formatDate(selectedRecord.checkDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  {t('regulatory.ihColAuthority')}
                </p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">
                  {selectedRecord.authority}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  {t('regulatory.ihColType')}
                </p>
                <StatusBadge
                  status={selectedRecord.inspectionType}
                  colorMap={inspRecordTypeColorMap}
                  label={getRecordTypeLabel(selectedRecord.inspectionType)}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  {t('regulatory.ihColResult')}
                </p>
                <StatusBadge
                  status={selectedRecord.result}
                  colorMap={inspRecordResultColorMap}
                  label={getRecordResultLabel(selectedRecord.result)}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  {t('regulatory.ihColFines')}
                </p>
                <p
                  className={
                    selectedRecord.fineAmount > 0
                      ? 'text-sm text-danger-600 dark:text-danger-400 font-medium'
                      : 'text-sm text-neutral-900 dark:text-neutral-100'
                  }
                >
                  {selectedRecord.fineAmount > 0
                    ? formatMoney(selectedRecord.fineAmount)
                    : '---'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                  {t('regulatory.ihColStatus')}
                </p>
                <StatusBadge
                  status={selectedRecord.status}
                  colorMap={inspRecordStatusColorMap}
                  label={getRecordStatusLabel(selectedRecord.status)}
                />
              </div>
            </div>

            {selectedRecord.findings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
                  {t('regulatory.ihDetailFindings')}
                </p>
                <ul className="space-y-2">
                  {selectedRecord.findings.map((finding, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <AlertTriangle
                        size={14}
                        className="text-warning-500 shrink-0 mt-0.5"
                      />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InspectionHistoryPage;
