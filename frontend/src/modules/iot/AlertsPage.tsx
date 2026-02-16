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
import type { IoTAlert, AlertRule } from './types';
import toast from 'react-hot-toast';

const alertSeverityColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'cyan'> = {
  info: 'blue',
  warning: 'yellow',
  critical: 'red',
};

const alertSeverityLabels: Record<string, string> = {
  info: 'Информация',
  warning: 'Предупреждение',
  critical: 'Критический',
};

const sensorTypeLabels: Record<string, string> = {
  temperature: 'Температура',
  humidity: 'Влажность',
  vibration: 'Вибрация',
  pressure: 'Давление',
  gps: 'GPS-трекер',
  dust: 'Пыль',
  noise: 'Шум',
  structural: 'Структурный',
};

type TabId = 'alerts' | 'rules';

const severityFilterOptions = [
  { value: '', label: 'Все уровни' },
  { value: 'INFO', label: 'Информация' },
  { value: 'WARNING', label: 'Предупреждение' },
  { value: 'CRITICAL', label: 'Критический' },
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
    () => [
      {
        accessorKey: 'severity',
        header: 'Уровень',
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
        header: 'Устройство',
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
        header: 'Сообщение',
        size: 280,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Значение',
        size: 100,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
            {row.original.value} / {row.original.threshold}
          </span>
        ),
      },
      {
        accessorKey: 'triggeredAt',
        header: 'Время',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 text-xs tabular-nums">{formatDateTime(getValue<string>())}</span>
        ),
      },
      {
        id: 'ACKNOWLEDGED',
        header: 'Подтверждено',
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
              toast.success(`Оповещение подтверждено: ${row.original.deviceName}`);
            }}
          >
            Подтвердить
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Оповещения и правила"
        subtitle={`${alerts.length} оповещений, ${alertRules.length} правил`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'IoT мониторинг', href: '/iot/devices' },
          { label: 'Оповещения' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setRuleModalOpen(true)}>
            Новое правило
          </Button>
        }
        tabs={[
          { id: 'alerts', label: 'Оповещения', count: alerts.length },
          { id: 'rules', label: 'Правила', count: alertRules.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Bell size={18} />} label="Всего оповещений" value={metrics.total} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Не подтверждены"
          value={metrics.unacknowledged}
          trend={{ direction: metrics.unacknowledged > 0 ? 'down' : 'neutral', value: metrics.unacknowledged > 0 ? 'Требуют внимания' : 'Все подтверждены' }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Критические"
          value={metrics.critical}
          trend={{ direction: metrics.critical > 0 ? 'down' : 'neutral', value: metrics.critical > 0 ? 'Срочно' : 'Нет' }}
        />
        <MetricCard icon={<Shield size={18} />} label="Активных правил" value={metrics.activeRules} />
      </div>

      {activeTab === 'alerts' ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Поиск по устройству, сообщению..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={severityFilterOptions}
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
            emptyTitle="Нет оповещений"
            emptyDescription="Система мониторинга работает в штатном режиме"
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
                    {rule.condition === 'above' && `Выше ${rule.thresholdMax}`}
                    {rule.condition === 'below' && `Ниже ${rule.thresholdMin}`}
                    {rule.condition === 'out_of_range' && `Вне диапазона ${rule.thresholdMin}-${rule.thresholdMax}`}
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
                  onClick={() => toast.success(rule.isActive ? 'Правило отключено' : 'Правило включено')}
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
        title="Новое правило оповещения"
        description="Настройте условия для автоматических оповещений"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRuleModalOpen(false)}>Отмена</Button>
            <Button
              onClick={() => {
                toast.success('Правило оповещения создано');
                setRuleModalOpen(false);
              }}
            >
              Создать правило
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Название правила" required>
            <Input placeholder="Напр. Перегрев бетона" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Тип датчика" required>
              <Select options={Object.entries(sensorTypeLabels).map(([v, l]) => ({ value: v, label: l }))} />
            </FormField>
            <FormField label="Уровень" required>
              <Select options={Object.entries(alertSeverityLabels).map(([v, l]) => ({ value: v, label: l }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Условие" required>
              <Select options={[
                { value: 'above', label: 'Выше порога' },
                { value: 'below', label: 'Ниже порога' },
                { value: 'out_of_range', label: 'Вне диапазона' },
              ]} />
            </FormField>
            <FormField label="Пороговое значение" required>
              <Input type="number" placeholder="25" />
            </FormField>
          </div>
          <FormField label="Email для уведомлений">
            <Input placeholder="email@example.com" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default AlertConfigPage;
