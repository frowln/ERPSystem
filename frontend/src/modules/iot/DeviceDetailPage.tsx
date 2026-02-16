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
import type { IoTDevice, SensorReading } from './types';

const deviceStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  online: 'green',
  offline: 'gray',
  warning: 'yellow',
  error: 'red',
  maintenance: 'purple',
};

const deviceStatusLabels: Record<string, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
  warning: 'Предупреждение',
  error: 'Ошибка',
  maintenance: 'Обслуживание',
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
        <div className="flex items-center justify-center h-64 text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  const currentDevice = device;
  const currentReadings = readings ?? [];

  const readingStats = useMemo(() => {
    if (currentReadings.length === 0) return { min: 0, max: 0, avg: 0, anomalies: 0 };
    const values = currentReadings.map((r) => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const anomalies = currentReadings.filter((r) => r.isAnomaly).length;
    return { min, max, avg, anomalies };
  }, [currentReadings]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${currentDevice.code}: ${currentDevice.name}`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'IoT мониторинг', href: '/iot/devices' },
          { label: currentDevice.code },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/iot/devices')}>
            Назад к списку
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Thermometer size={18} />}
          label="Текущее значение"
          value={currentDevice.lastReadingValue != null ? `${currentDevice.lastReadingValue} ${currentDevice.lastReadingUnit}` : '---'}
        />
        <MetricCard
          icon={<Activity size={18} />}
          label="Среднее"
          value={`${readingStats.avg.toFixed(1)} ${currentDevice.lastReadingUnit ?? ''}`}
        />
        <MetricCard
          icon={<Battery size={18} />}
          label="Заряд батареи"
          value={`${currentDevice.batteryLevel ?? '---'}%`}
          trend={{
            direction: (currentDevice.batteryLevel ?? 100) < 20 ? 'down' : 'neutral',
            value: (currentDevice.batteryLevel ?? 100) < 20 ? 'Низкий' : 'Норма',
          }}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Аномалий"
          value={readingStats.anomalies}
          trend={{
            direction: readingStats.anomalies > 0 ? 'down' : 'neutral',
            value: readingStats.anomalies > 0 ? 'Обнаружены' : 'Нет',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readings table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Последние показания</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Время</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Значение</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Статус</th>
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
                          Аномалия
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Норма</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple bar chart representation */}
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3">Диапазон значений</h4>
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
              <span className="text-[10px] text-neutral-400">Мин: {readingStats.min}</span>
              <span className="text-[10px] text-neutral-400">Макс: {readingStats.max}</span>
            </div>
          </div>
        </div>

        {/* Device info sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Информация об устройстве</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Статус</span>
                <StatusBadge
                  status={currentDevice.status}
                  colorMap={deviceStatusColorMap}
                  label={deviceStatusLabels[currentDevice.status]}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Тип датчика</span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{sensorTypeLabels[currentDevice.sensorType]}</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-neutral-100">
                <MapPin size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Расположение</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentDevice.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Cpu size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Прошивка</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">v{currentDevice.firmwareVersion}</p>
                </div>
              </div>
              {currentDevice.projectName && (
                <div className="flex items-start gap-2">
                  <Activity size={14} className="text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Проект</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">{currentDevice.projectName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Установлен</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDate(currentDevice.installedDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Статистика показаний</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Минимум</span>
                <span className="text-sm font-medium tabular-nums">{readingStats.min} {currentDevice.lastReadingUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Максимум</span>
                <span className="text-sm font-medium tabular-nums">{readingStats.max} {currentDevice.lastReadingUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Среднее</span>
                <span className="text-sm font-medium tabular-nums">{readingStats.avg.toFixed(1)} {currentDevice.lastReadingUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Аномалий</span>
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
