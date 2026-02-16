import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Cpu, Wifi, WifiOff, AlertTriangle, Battery } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { iotApi } from '@/api/iot';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import type { IoTDevice } from './types';
import type { PaginatedResponse } from '@/types';

const deviceStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  online: 'green',
  offline: 'gray',
  warning: 'yellow',
  error: 'red',
  maintenance: 'purple',
};

const getDeviceStatusLabels = (): Record<string, string> => ({
  online: t('iot.statusOnline'),
  offline: t('iot.statusOffline'),
  warning: t('iot.statusWarning'),
  error: t('iot.statusError'),
  maintenance: t('iot.statusMaintenance'),
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

const sensorTypeColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  temperature: 'red',
  humidity: 'blue',
  vibration: 'orange',
  pressure: 'purple',
  gps: 'green',
  dust: 'yellow',
  noise: 'cyan',
  structural: 'gray',
};

type TabId = 'all' | 'ONLINE' | 'WARNING' | 'OFFLINE';

const getSensorTypeFilterOptions = () => [
  { value: '', label: t('iot.devices.allTypes') },
  ...Object.entries(getSensorTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
];


const DeviceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [sensorTypeFilter, setSensorTypeFilter] = useState('');

  const { data: deviceData, isLoading } = useQuery<PaginatedResponse<IoTDevice>>({
    queryKey: ['iot-devices'],
    queryFn: () => iotApi.getDevices(),
  });

  const devices = deviceData?.content ?? [];

  const filteredDevices = useMemo(() => {
    let filtered = devices;

    if (activeTab === 'ONLINE') {
      filtered = filtered.filter((d) => d.status === 'ONLINE');
    } else if (activeTab === 'WARNING') {
      filtered = filtered.filter((d) => [ 'WARNING', 'ERROR'].includes(d.status));
    } else if (activeTab === 'OFFLINE') {
      filtered = filtered.filter((d) => ['OFFLINE', 'MAINTENANCE'].includes(d.status));
    }

    if (sensorTypeFilter) {
      filtered = filtered.filter((d) => d.sensorType === sensorTypeFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.code.toLowerCase().includes(lower) ||
          d.name.toLowerCase().includes(lower) ||
          d.location.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [devices, activeTab, sensorTypeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: devices.length,
    online: devices.filter((d) => d.status === 'ONLINE').length,
    warning: devices.filter((d) => [ 'WARNING', 'ERROR'].includes(d.status)).length,
    offline: devices.filter((d) => ['OFFLINE', 'MAINTENANCE'].includes(d.status)).length,
  }), [devices]);

  const metrics = useMemo(() => {
    const online = devices.filter((d) => d.status === 'ONLINE').length;
    const alertCount = devices.filter((d) => [ 'WARNING', 'ERROR'].includes(d.status)).length;
    const lowBattery = devices.filter((d) => (d.batteryLevel ?? 100) < 20).length;
    return { total: devices.length, online, alertCount, lowBattery };
  }, [devices]);

  const columns = useMemo<ColumnDef<IoTDevice, unknown>[]>(
    () => {
      const deviceStatusLabels = getDeviceStatusLabels();
      const sensorTypeLabels = getSensorTypeLabels();
      return [
        {
          accessorKey: 'code',
          header: t('iot.devices.colCode'),
          size: 120,
          cell: ({ getValue }) => (
            <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
          ),
        },
        {
          accessorKey: 'name',
          header: t('iot.devices.colDevice'),
          size: 250,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
            </div>
          ),
        },
        {
          accessorKey: 'sensorType',
          header: t('iot.devices.colType'),
          size: 130,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={sensorTypeColorMap}
              label={sensorTypeLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'status',
          header: t('iot.devices.colStatus'),
          size: 140,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={deviceStatusColorMap}
              label={deviceStatusLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'lastReadingValue',
          header: t('iot.devices.colReading'),
          size: 120,
          cell: ({ row }) => {
            const val = row.original.lastReadingValue;
            const unit = row.original.lastReadingUnit;
            return val != null ? (
              <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{val} {unit}</span>
            ) : (
              <span className="text-neutral-400">---</span>
            );
          },
        },
        {
          accessorKey: 'batteryLevel',
          header: t('iot.devices.colBattery'),
          size: 100,
          cell: ({ getValue }) => {
            const level = getValue<number | undefined>();
            if (level == null) return <span className="text-neutral-400">---</span>;
            const color = level > 50 ? 'text-success-600' : level > 20 ? 'text-warning-600' : 'text-danger-600';
            return <span className={`tabular-nums font-medium ${color}`}>{level}%</span>;
          },
        },
        {
          accessorKey: 'projectName',
          header: t('iot.devices.colProject'),
          size: 160,
          cell: ({ getValue }) => (
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">{getValue<string>() ?? '---'}</span>
          ),
        },
        {
          accessorKey: 'lastReadingAt',
          header: t('iot.devices.colLastReading'),
          size: 150,
          cell: ({ getValue }) => (
            <span className="text-neutral-600 text-xs">{formatDateTime(getValue<string>())}</span>
          ),
        },
      ];
    },
    [],
  );

  const handleRowClick = useCallback(
    (device: IoTDevice) => navigate(`/iot/devices/${device.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('iot.devices.title')}
        subtitle={t('iot.devices.subtitleDevices', { count: String(devices.length) })}
        breadcrumbs={[
          { label: t('iot.devices.breadcrumbHome'), href: '/' },
          { label: t('iot.devices.breadcrumbIot') },
          { label: t('iot.devices.breadcrumbDevices') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            {t('iot.devices.addDevice')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('iot.devices.tabAll'), count: tabCounts.all },
          { id: 'ONLINE', label: t('iot.devices.tabOnline'), count: tabCounts.online },
          { id: 'WARNING', label: t('iot.devices.tabWarning'), count: tabCounts.warning },
          { id: 'OFFLINE', label: t('iot.devices.tabOffline'), count: tabCounts.offline },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Cpu size={18} />} label={t('iot.devices.metricTotal')} value={metrics.total} />
        <MetricCard
          icon={<Wifi size={18} />}
          label={t('iot.devices.metricOnline')}
          value={metrics.online}
          trend={{ direction: 'neutral', value: `${Math.round((metrics.online / Math.max(1, metrics.total)) * 100)}%` }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('iot.devices.metricAlerts')}
          value={metrics.alertCount}
          trend={{ direction: metrics.alertCount > 0 ? 'down' : 'neutral', value: metrics.alertCount > 0 ? t('iot.devices.trendNeedAttention') : t('iot.devices.trendNo') }}
        />
        <MetricCard
          icon={<Battery size={18} />}
          label={t('iot.devices.metricLowBattery')}
          value={metrics.lowBattery}
          trend={{ direction: metrics.lowBattery > 0 ? 'down' : 'neutral', value: metrics.lowBattery > 0 ? t('iot.devices.trendReplaceBattery') : t('iot.devices.trendNormal') }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('iot.devices.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getSensorTypeFilterOptions()}
          value={sensorTypeFilter}
          onChange={(e) => setSensorTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<IoTDevice>
        data={filteredDevices}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('iot.devices.emptyTitle')}
        emptyDescription={t('iot.devices.emptyDescription')}
      />
    </div>
  );
};

export default DeviceListPage;
