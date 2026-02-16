import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Thermometer,
  Droplets,
  Activity,
  Gauge,
  MapPin,
  Wind,
  Volume2,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
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

const sensorTypeIcons: Record<string, React.ReactNode> = {
  temperature: <Thermometer size={18} className="text-red-500" />,
  humidity: <Droplets size={18} className="text-blue-500" />,
  vibration: <Activity size={18} className="text-orange-500" />,
  pressure: <Gauge size={18} className="text-purple-500" />,
  gps: <MapPin size={18} className="text-green-500" />,
  dust: <Wind size={18} className="text-yellow-500" />,
  noise: <Volume2 size={18} className="text-cyan-500" />,
  structural: <Building2 size={18} className="text-gray-500" />,
};

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


const SensorDashboardPage: React.FC = () => {
  const { data: deviceData } = useQuery<PaginatedResponse<IoTDevice>>({
    queryKey: ['iot-devices'],
    queryFn: () => iotApi.getDevices(),
  });

  const devices = deviceData?.content ?? [];

  const sensorGroups = useMemo(() => {
    const sensorTypeLabels = getSensorTypeLabels();
    const groups: Record<string, IoTDevice[]> = {};
    devices.forEach((d) => {
      if (!groups[d.sensorType]) groups[d.sensorType] = [];
      groups[d.sensorType].push(d);
    });
    return Object.entries(groups).map(([type, devs]) => ({
      type,
      label: sensorTypeLabels[type] ?? type,
      icon: sensorTypeIcons[type] ?? <Activity size={18} />,
      devices: devs,
      online: devs.filter((d) => d.status === 'ONLINE').length,
      total: devs.length,
    }));
  }, [devices]);

  const overallMetrics = useMemo(() => ({
    totalSensors: devices.length,
    online: devices.filter((d) => d.status === 'ONLINE').length,
    types: new Set(devices.map((d) => d.sensorType)).size,
    alerts: devices.filter((d) => [ 'WARNING', 'ERROR'].includes(d.status)).length,
  }), [devices]);

  const deviceStatusLabels = getDeviceStatusLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('iot.sensors.title')}
        subtitle={t('iot.sensors.subtitle')}
        breadcrumbs={[
          { label: t('iot.sensors.breadcrumbHome'), href: '/' },
          { label: t('iot.sensors.breadcrumbIot'), href: '/iot/devices' },
          { label: t('iot.sensors.breadcrumbSensors') },
        ]}
      />

      {/* Overall metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Activity size={18} />} label={t('iot.sensors.metricTotalSensors')} value={overallMetrics.totalSensors} />
        <MetricCard icon={<Thermometer size={18} />} label={t('iot.sensors.metricSensorTypes')} value={overallMetrics.types} />
        <MetricCard
          icon={<MapPin size={18} />}
          label={t('iot.sensors.metricOnline')}
          value={overallMetrics.online}
          trend={{ direction: 'neutral', value: `${Math.round((overallMetrics.online / Math.max(1, overallMetrics.totalSensors)) * 100)}%` }}
        />
        <MetricCard
          icon={<Activity size={18} />}
          label={t('iot.sensors.metricAlerts')}
          value={overallMetrics.alerts}
          trend={{ direction: overallMetrics.alerts > 0 ? 'down' : 'neutral', value: overallMetrics.alerts > 0 ? t('iot.sensors.trendAttention') : t('iot.sensors.trendNo') }}
        />
      </div>

      {/* Sensor groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sensorGroups.map((group) => (
          <div key={group.type} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {group.icon}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{group.label}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{group.online}/{group.total} {t('iot.sensors.onlineSuffix')}</p>
                </div>
              </div>
              <div className="w-16 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full"
                  style={{ width: `${(group.online / Math.max(1, group.total)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {group.devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{device.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{device.location}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    {device.lastReadingValue != null && (
                      <span className="text-sm font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                        {device.lastReadingValue} {device.lastReadingUnit}
                      </span>
                    )}
                    <StatusBadge
                      status={device.status}
                      colorMap={deviceStatusColorMap}
                      label={deviceStatusLabels[device.status]}
                    />
                  </div>
                </div>
              ))}
            </div>

            {group.devices.length > 0 && (
              <p className="text-[10px] text-neutral-400 mt-3">
                {t('iot.sensors.lastUpdate')} {formatDateTime(group.devices[0].lastReadingAt ?? new Date().toISOString())}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorDashboardPage;
