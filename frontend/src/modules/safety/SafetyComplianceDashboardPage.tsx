import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, MetricCard, DataTable, Button, StatusBadge, Modal, FormField } from '@/design-system/components';
import { ShieldCheck, AlertTriangle, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { t } from '@/i18n';
import { safetyComplianceApi } from '@/api/safetyCompliance';
import type { AccessBlock, PrescriptionTracker } from '@/api/safetyCompliance';
import type { ColumnDef } from '@tanstack/react-table';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'red',
  RESOLVED: 'green',
  VALID: 'green',
  EXPIRING_SOON: 'yellow',
  EXPIRED: 'red',
  OVERDUE: 'red',
};

export default function SafetyComplianceDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [checkEmployeeId, setCheckEmployeeId] = useState('');
  const [showCheckModal, setShowCheckModal] = useState(false);

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['safety-compliance-dashboard'],
    queryFn: safetyComplianceApi.getDashboard,
  });

  const { data: accessBlocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['safety-access-blocks'],
    queryFn: safetyComplianceApi.getAccessBlocks,
    enabled: activeTab === 'blocks',
  });

  const { data: prescriptions = [], isLoading: prescLoading } = useQuery({
    queryKey: ['safety-prescriptions'],
    queryFn: safetyComplianceApi.getPrescriptions,
    enabled: activeTab === 'prescriptions',
  });

  const scheduleMut = useMutation({
    mutationFn: safetyComplianceApi.autoSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-compliance-dashboard'] }),
  });

  const resolveMut = useMutation({
    mutationFn: (employeeId: string) => safetyComplianceApi.resolveAccessBlock(employeeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-access-blocks'] }),
  });

  const tabs = [
    { id: 'dashboard', label: t('safetyCompliance.tabDashboard') },
    { id: 'blocks', label: t('safetyCompliance.tabBlocks'), count: accessBlocks.filter(b => b.status === 'ACTIVE').length || undefined },
    { id: 'prescriptions', label: t('safetyCompliance.tabPrescriptions'), count: prescriptions.filter(p => p.status === 'OVERDUE').length || undefined },
  ];

  const blockColumns: ColumnDef<AccessBlock>[] = [
    { accessorKey: 'employeeName', header: t('safetyCompliance.colEmployee') },
    { accessorKey: 'reason', header: t('safetyCompliance.colReason') },
    {
      accessorKey: 'status',
      header: t('safetyCompliance.colStatus'),
      cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={STATUS_COLORS} />,
    },
    { accessorKey: 'blockedAt', header: t('safetyCompliance.colBlockedAt'), cell: ({ row }) => new Date(row.original.blockedAt).toLocaleDateString() },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) =>
        row.original.status === 'ACTIVE' ? (
          <Button variant="success" size="sm" onClick={() => resolveMut.mutate(row.original.employeeId)}>
            {t('safetyCompliance.resolveBtn')}
          </Button>
        ) : null,
    },
  ];

  const prescriptionColumns: ColumnDef<PrescriptionTracker>[] = [
    { accessorKey: 'prescriptionNumber', header: t('safetyCompliance.colNumber') },
    { accessorKey: 'description', header: t('safetyCompliance.colDescription') },
    { accessorKey: 'issuedBy', header: t('safetyCompliance.colIssuedBy') },
    { accessorKey: 'deadline', header: t('safetyCompliance.colDeadline'), cell: ({ row }) => new Date(row.original.deadline).toLocaleDateString() },
    {
      accessorKey: 'daysRemaining',
      header: t('safetyCompliance.colDaysRemaining'),
      cell: ({ row }) => {
        const d = row.original.daysRemaining;
        return <span className={d < 0 ? 'text-red-600 font-semibold' : d < 7 ? 'text-yellow-600' : ''}>{d} {t('common.days')}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: t('safetyCompliance.colStatus'),
      cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={STATUS_COLORS} />,
    },
    { accessorKey: 'responsiblePerson', header: t('safetyCompliance.colResponsible') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('safetyCompliance.title')}
        subtitle={t('safetyCompliance.subtitle')}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCheckModal(true)}>
              {t('safetyCompliance.checkEmployee')}
            </Button>
            <Button variant="primary" onClick={() => scheduleMut.mutate()} loading={scheduleMut.isPending}>
              {t('safetyCompliance.autoScheduleBtn')}
            </Button>
          </div>
        }
      />

      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label={t('safetyCompliance.metricTotal')} value={dashboard?.totalEmployees ?? 0} icon={<Users className="h-5 w-5" />} />
            <MetricCard label={t('safetyCompliance.metricCompliant')} value={dashboard?.compliantCount ?? 0} icon={<CheckCircle className="h-5 w-5" />} trend={dashboard ? { direction: 'neutral' as const, value: `${dashboard.complianceRate}%` } : undefined} />
            <MetricCard label={t('safetyCompliance.metricNonCompliant')} value={dashboard?.nonCompliantCount ?? 0} icon={<AlertTriangle className="h-5 w-5" />} />
            <MetricCard label={t('safetyCompliance.metricExpiring')} value={dashboard?.expiringSoonCount ?? 0} icon={<Clock className="h-5 w-5" />} />
            <MetricCard label={t('safetyCompliance.metricScheduled')} value={dashboard?.briefingsScheduled ?? 0} icon={<Calendar className="h-5 w-5" />} />
            <MetricCard label={t('safetyCompliance.metricOverdue')} value={dashboard?.overdueBriefings ?? 0} icon={<AlertTriangle className="h-5 w-5" />} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">{t('safetyCompliance.complianceOverview')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t('safetyCompliance.complianceRate')}</span>
                  <span className="font-semibold">{dashboard?.complianceRate ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${(dashboard?.complianceRate ?? 0) >= 90 ? 'bg-green-500' : (dashboard?.complianceRate ?? 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${dashboard?.complianceRate ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'blocks' && (
        <DataTable columns={blockColumns} data={accessBlocks} loading={blocksLoading} />
      )}

      {activeTab === 'prescriptions' && (
        <DataTable columns={prescriptionColumns} data={prescriptions} loading={prescLoading} />
      )}

      <Modal open={showCheckModal} onClose={() => setShowCheckModal(false)} title={t('safetyCompliance.checkModalTitle')}>
        <div className="space-y-4">
          <FormField label={t('safetyCompliance.employeeIdField')}>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={checkEmployeeId}
              onChange={(e) => setCheckEmployeeId(e.target.value)}
              placeholder={t('safetyCompliance.employeeIdPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCheckModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={() => setShowCheckModal(false)}>{t('safetyCompliance.checkBtn')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
