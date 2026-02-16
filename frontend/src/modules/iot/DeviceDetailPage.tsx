import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Cpu, MapPin, Battery, Clock, Activity, Thermometer } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { iotApi } from '@/api/iot';
import { formatDateTime, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { IoTDevice, SensorReading } from './types';

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


const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: device, isLoading } = useQuery<IoTDevice>({
    queryKey: ['iot-device', id],
    queryFn: () => iotApi.getDevice(id!),
    enabled: !!id,
  });

  const { data: readings } = useQuery<SensorReading[]>({
    queryKey: ['iot-device-readings', id],
    queryFn: () => iotApi.getDeviceReadings(id!, { limit: 50 }),
    enabled: !!id,
  });

  if (isLoading || !device) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64 text-neutral-400">{t('common.loading')}</div>
      </div>
    );
  }

  const currentDevice = device;
  const currentReadings = readings ?? [];

  const deviceStatusLabels = getDeviceStatusLabels();
  const sensorTypeLabels = getSensorTypeLabels();

  const readingStats = (() => {
    if (currentReadings.length === 0) return { min: 0, max: 0, avg: 0, anomalies: 0 };
    const values = currentReadings.map((r) => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const anomalies = currentReadings.filter((r) => r.isAnomaly).length;
    return { min, max, avg, anomalies };
  })();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${currentDevice.code}: ${currentDevice.name}`}
        breadcrumbs={[
          { label: t('iot.detail.breadcrumbHome'), href: '/' },
          { label: t('iot.detail.breadcrumbIot'), href: '/iot/devices' },
          { label: currentDevice.code },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/iot/devices')}>
            {t('iot.detail.backToList')}
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Thermometer size={18} />}
          label={t('iot.detail.metricCurrentValue')}
          value={currentDevice.lastReadingValue != null ? `${currentDevice.lastReadingValue} ${currentDevice.lastReadingUnit}` : '---'}
        />
        <MetricCard
          icon={<Activity size={18} />}
          label={t('iot.detail.metricAverage')}
          value={`${readingStats.avg.toFixed(1)} ${currentDevice.lastReadingUnit ?? ''}`}
        />
        <MetricCard
          icon={<Battery size={18} />}
          label={t('iot.detail.metricBattery')}
          value={`${currentDevice.batteryLevel ?? '---'}%`}
          trend={{
            direction: (currentDevice.batteryLevel ?? 100) < 20 ? 'down' : 'neutral',
            value: (currentDevice.batteryLevel ?? 100) < 20 ? t('iot.detail.batteryLow') : t('iot.detail.batteryNormal'),
          }}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('iot.detail.metricAnomalies')}
          value={readingStats.anomalies}
          trend={{
            direction: readingStats.anomalies > 0 ? 'down' : 'neutral',
            value: readingStats.anomalies > 0 ? t('iot.detail.anomaliesFound') : t('iot.detail.anomaliesNone'),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readings table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('iot.detail.recentReadings')}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('iot.detail.colTime')}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('iot.detail.colValue')}</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('iot.detail.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {currentReadings.map((reading) => (
                  <tr
                    key={reading.id}
                    className={`border-b border-neutral-100 ${reading.isAnomaly ? 'bg-danger-50' : ''}`}
                  >
                    <td className="py-2 px-3 text-neutral-600 tabular-nums">
                      {formatDateTime(reading.timestamp)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                      {reading.value} {reading.unit}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {reading.isAnomaly ? (
                        <span className="text-xs font-medium text-danger-600 bg-danger-100 px-2 py-0.5 rounded-full">
                          {t('iot.detail.anomaly')}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">{t('iot.detail.normal')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple bar chart representation */}
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3">{t('iot.detail.valueRange')}</h4>
            <div className="flex items-end gap-1 h-20">
              {currentReadings.slice().reverse().map((reading) => {
                const range = readingStats.max - readingStats.min || 1;
                const height = Math.max(10, ((reading.value - readingStats.min) / range) * 100);
                return (
                  <div
                    key={reading.id}
                    className={`flex-1 rounded-t-sm ${reading.isAnomaly ? 'bg-danger-400' : 'bg-primary-400'}`}
                    style={{ height: `${height}%` }}
                    title={`${reading.value} ${reading.unit} - ${formatDateTime(reading.timestamp)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-neutral-400">{t('iot.detail.min')}: {readingStats.min}</span>
              <span className="text-[10px] text-neutral-400">{t('iot.detail.max')}: {readingStats.max}</span>
            </div>
          </div>
        </div>

        {/* Device info sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('iot.detail.deviceInfo')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('iot.detail.labelStatus')}</span>
                <StatusBadge
                  status={currentDevice.status}
                  colorMap={deviceStatusColorMap}
                  label={deviceStatusLabels[currentDevice.status]}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('iot.detail.labelSensorType')}</span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{sensorTypeLabels[currentDevice.sensorType]}</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-neutral-100">
                <MapPin size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('iot.detail.labelLocation')}</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentDevice.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Cpu size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('iot.detail.labelFirmware')}</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">v{currentDevice.firmwareVersion}</p>
                </div>
              </div>
              {currentDevice.projectName && (
                <div className="flex items-start gap-2">
                  <Activity size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('iot.detail.labelProject')}</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentDevice.projectName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('iot.detail.labelInstalled')}</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDate(currentDevice.installedDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('iot.detail.readingStats')}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('iot.detail.statMin')}</span>
                <span className="text-sm font-medium tabular-nums">{readingStats.min} {currentDevice.lastReadingUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('iot.detail.statMax')}</span>
                <span className="text-sm font-medium tabular-nums">{readingStats.max} {currentDevice.lastReadingUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('iot.detail.statAvg')}</span>
                <span className="text-sm font-medium tabular-nums">{readingStats.avg.toFixed(1)} {currentDevice.lastReadingUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('iot.detail.statAnomalies')}</span>
                <span className={`text-sm font-medium ${readingStats.anomalies > 0 ? 'text-danger-600' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {readingStats.anomalies}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailPage;
