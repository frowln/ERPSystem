import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Bell, BellOff, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { iotApi } from '@/api/iot';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import type { IoTAlert, AlertRule } from './types';
import toast from 'react-hot-toast';

const alertSeverityColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'cyan'> = {
  info: 'blue',
  warning: 'yellow',
  critical: 'red',
};

const getAlertSeverityLabels = (): Record<string, string> => ({
  info: t('iot.alerts.severityInfo'),
  warning: t('iot.alerts.severityWarning'),
  critical: t('iot.alerts.severityCritical'),
});

const getSensorTypeLabels = (): Record<string, string> => ({
  temperature: t('iot.sensorTemperature'),
  humidity: t('iot.sensorHumidity'),
  vibration: t('iot.sensorVibration'),
  pressure: t('iot.sensorPressure'),
  gps: t('iot.sensorGps'),
  dust: t('iot.sensorDust'),
  noise: t('iot.sensorNoise'),
  structural: t('iot.sensorStructural'),
});

type TabId = 'alerts' | 'rules';

const getSeverityFilterOptions = () => [
  { value: '', label: t('iot.alerts.allLevels') },
  { value: 'INFO', label: t('iot.alerts.severityInfo') },
  { value: 'WARNING', label: t('iot.alerts.severityWarning') },
  { value: 'CRITICAL', label: t('iot.alerts.severityCritical') },
];

const AlertConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('alerts');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  const { data: alertData, isLoading: alertsLoading } = useQuery({
    queryKey: ['iot-alerts'],
    queryFn: () => iotApi.getAlerts(),
  });

  const { data: rules } = useQuery({
    queryKey: ['iot-alert-rules'],
    queryFn: () => iotApi.getAlertRules(),
  });

  const alerts = alertData?.content ?? [];
  const alertRules = rules ?? [];

  const filteredAlerts = useMemo(() => {
    let filtered = alerts;
    if (severityFilter) filtered = filtered.filter((a) => a.severity === severityFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.deviceName.toLowerCase().includes(lower) || a.message.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [alerts, severityFilter, search]);

  const metrics = useMemo(() => ({
    total: alerts.length,
    unacknowledged: alerts.filter((a) => !a.acknowledgedAt).length,
    critical: alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledgedAt).length,
    activeRules: alertRules.filter((r: AlertRule) => r.isActive).length,
  }), [alerts, alertRules]);

  const alertColumns = useMemo<ColumnDef<IoTAlert, unknown>[]>(
    () => {
      const alertSeverityLabels = getAlertSeverityLabels();
      return [
        {
          accessorKey: 'severity',
          header: t('iot.alerts.colSeverity'),
          size: 140,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={alertSeverityColorMap}
              label={alertSeverityLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'deviceName',
          header: t('iot.alerts.colDevice'),
          size: 220,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.deviceName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.ruleName}</p>
            </div>
          ),
        },
        {
          accessorKey: 'message',
          header: t('iot.alerts.colMessage'),
          size: 280,
          cell: ({ getValue }) => (
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">{getValue<string>()}</span>
          ),
        },
        {
          accessorKey: 'value',
          header: t('iot.alerts.colValue'),
          size: 100,
          cell: ({ row }) => (
            <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.value} / {row.original.threshold}
            </span>
          ),
        },
        {
          accessorKey: 'triggeredAt',
          header: t('iot.alerts.colTime'),
          size: 150,
          cell: ({ getValue }) => (
            <span className="text-neutral-600 text-xs tabular-nums">{formatDateTime(getValue<string>())}</span>
          ),
        },
        {
          id: 'ACKNOWLEDGED',
          header: t('iot.alerts.colAcknowledged'),
          size: 140,
          cell: ({ row }) => row.original.acknowledgedAt ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-success-500" />
              <span className="text-xs text-neutral-600">{row.original.acknowledgedByName}</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                toast.success(t('iot.alerts.toastAcknowledged', { device: row.original.deviceName }));
              }}
            >
              {t('iot.alerts.acknowledge')}
            </Button>
          ),
        },
      ];
    },
    [],
  );

  const sensorTypeLabels = getSensorTypeLabels();
  const alertSeverityLabels = getAlertSeverityLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('iot.alerts.title')}
        subtitle={t('iot.alerts.subtitleAlerts', { alertCount: String(alerts.length), ruleCount: String(alertRules.length) })}
        breadcrumbs={[
          { label: t('iot.alerts.breadcrumbHome'), href: '/' },
          { label: t('iot.alerts.breadcrumbIot'), href: '/iot/devices' },
          { label: t('iot.alerts.breadcrumbAlerts') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setRuleModalOpen(true)}>
            {t('iot.alerts.newRule')}
          </Button>
        }
        tabs={[
          { id: 'alerts', label: t('iot.alerts.tabAlerts'), count: alerts.length },
          { id: 'rules', label: t('iot.alerts.tabRules'), count: alertRules.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Bell size={18} />} label={t('iot.alerts.metricTotal')} value={metrics.total} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('iot.alerts.metricUnacknowledged')}
          value={metrics.unacknowledged}
          trend={{ direction: metrics.unacknowledged > 0 ? 'down' : 'neutral', value: metrics.unacknowledged > 0 ? t('iot.alerts.trendNeedAttention') : t('iot.alerts.trendAllAcknowledged') }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('iot.alerts.metricCritical')}
          value={metrics.critical}
          trend={{ direction: metrics.critical > 0 ? 'down' : 'neutral', value: metrics.critical > 0 ? t('iot.alerts.trendUrgent') : t('iot.alerts.trendNo') }}
        />
        <MetricCard icon={<Shield size={18} />} label={t('iot.alerts.metricActiveRules')} value={metrics.activeRules} />
      </div>

      {activeTab === 'alerts' ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder={t('iot.alerts.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={getSeverityFilterOptions()}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <DataTable<IoTAlert>
            data={filteredAlerts ?? []}
            columns={alertColumns}
            loading={alertsLoading}
            enableRowSelection
            enableExport
            pageSize={20}
            emptyTitle={t('iot.alerts.emptyTitle')}
            emptyDescription={t('iot.alerts.emptyDescription')}
          />
        </>
      ) : (
        <div className="space-y-3">
          {(alertRules ?? []).map((rule: AlertRule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-success-500' : 'bg-neutral-300'}`} />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{rule.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {sensorTypeLabels[rule.sensorType]} &middot;{' '}
                    {rule.condition === 'above' && t('iot.alerts.ruleConditionAbove', { value: String(rule.thresholdMax) })}
                    {rule.condition === 'below' && t('iot.alerts.ruleConditionBelow', { value: String(rule.thresholdMin) })}
                    {rule.condition === 'out_of_range' && t('iot.alerts.ruleConditionOutOfRange', { min: String(rule.thresholdMin), max: String(rule.thresholdMax) })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={rule.severity}
                  colorMap={alertSeverityColorMap}
                  label={alertSeverityLabels[rule.severity]}
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toast.success(rule.isActive ? t('iot.alerts.toastRuleDisabled') : t('iot.alerts.toastRuleEnabled'))}
                >
                  {rule.isActive ? <BellOff size={14} /> : <Bell size={14} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create rule modal */}
      <Modal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={t('iot.alerts.modalTitle')}
        description={t('iot.alerts.modalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRuleModalOpen(false)}>{t('iot.alerts.modalCancel')}</Button>
            <Button
              onClick={() => {
                toast.success(t('iot.alerts.toastRuleCreated'));
                setRuleModalOpen(false);
              }}
            >
              {t('iot.alerts.modalCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('iot.alerts.labelRuleName')} required>
            <Input placeholder={t('iot.alerts.placeholderRuleName')} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('iot.alerts.labelSensorType')} required>
              <Select options={Object.entries(sensorTypeLabels).map(([v, l]) => ({ value: v, label: l }))} />
            </FormField>
            <FormField label={t('iot.alerts.labelSeverity')} required>
              <Select options={Object.entries(alertSeverityLabels).map(([v, l]) => ({ value: v, label: l }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('iot.alerts.labelCondition')} required>
              <Select options={[
                { value: 'above', label: t('iot.alerts.conditionAbove') },
                { value: 'below', label: t('iot.alerts.conditionBelow') },
                { value: 'out_of_range', label: t('iot.alerts.conditionOutOfRange') },
              ]} />
            </FormField>
            <FormField label={t('iot.alerts.labelThreshold')} required>
              <Input type="number" placeholder="25" />
            </FormField>
          </div>
          <FormField label={t('iot.alerts.labelEmail')}>
            <Input placeholder="email@example.com" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default AlertConfigPage;
