import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Truck,
  CircleDot,
  WifiOff,
  Navigation,
  Gauge,
  Route,
  Clock,
  X,
  Square,
  AlertTriangle,
  Compass,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { formatNumber, formatDate, formatTime } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { GpsVehicleStatus, GeofenceAlert } from './types';
import type { BadgeColor } from '@/design-system/components/StatusBadge';

const gpsStatusColorMap: Record<string, BadgeColor> = {
  MOVING: 'green',
  STOPPED: 'yellow',
  IDLE: 'orange',
  OFFLINE: 'gray',
  moving: 'green',
  idle: 'yellow',
  offline: 'gray',
};

type StatusFilterType = 'all' | 'MOVING' | 'STOPPED' | 'IDLE' | 'OFFLINE';

const normalizeStatus = (s: string): string => {
  const map: Record<string, string> = {
    moving: 'MOVING',
    idle: 'IDLE',
    offline: 'OFFLINE',
  };
  return map[s] ?? s;
};

const GpsTrackingPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<GpsVehicleStatus | null>(null);
  const [trackDate, setTrackDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showGeofenceAlerts, setShowGeofenceAlerts] = useState(false);

  // Real-time GPS positions with 5s polling
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['fleet-gps-statuses'],
    queryFn: () => fleetApi.getGpsStatuses(),
    refetchInterval: 5000,
  });

  // Vehicle track for selected vehicle
  const { data: trackData } = useQuery({
    queryKey: ['fleet-gps-track', selectedVehicle?.id ?? selectedVehicle?.vehicleId, trackDate],
    queryFn: () => {
      const vehicleId = selectedVehicle?.vehicleId ?? selectedVehicle?.id;
      return vehicleId ? fleetApi.getVehicleTrack(vehicleId, trackDate) : Promise.resolve(null);
    },
    enabled: !!selectedVehicle,
    refetchInterval: 30000,
  });

  // Geofence alerts
  const { data: geofenceAlerts = [] } = useQuery({
    queryKey: ['fleet-geofence-alerts'],
    queryFn: () => fleetApi.getGeofenceAlerts(),
    refetchInterval: 15000,
  });

  const filtered = useMemo(() => {
    let result = vehicles;
    if (statusFilter !== 'all') {
      result = result.filter((v) => normalizeStatus(v.status) === statusFilter);
    }
    if (vehicleTypeFilter) {
      result = result.filter((v) => v.vehicleType === vehicleTypeFilter);
    }
    return result;
  }, [vehicles, statusFilter, vehicleTypeFilter]);

  // Metrics
  const totalCount = vehicles.length;
  const movingCount = vehicles.filter(
    (v) => normalizeStatus(v.status) === 'MOVING',
  ).length;
  const stoppedCount = vehicles.filter(
    (v) => normalizeStatus(v.status) === 'STOPPED',
  ).length;
  const idleCount = vehicles.filter(
    (v) => normalizeStatus(v.status) === 'IDLE',
  ).length;
  const offlineCount = vehicles.filter(
    (v) => normalizeStatus(v.status) === 'OFFLINE',
  ).length;

  // Vehicle types for filter
  const vehicleTypes = useMemo(() => {
    const types = new Set(vehicles.map((v) => v.vehicleType).filter(Boolean));
    return Array.from(types).map((type) => ({ value: type!, label: type! }));
  }, [vehicles]);

  const statusIcon = (status: string) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'MOVING':
        return <Navigation className="w-4 h-4 text-success-500" />;
      case 'STOPPED':
        return <Square className="w-4 h-4 text-warning-500" />;
      case 'IDLE':
        return <CircleDot className="w-4 h-4 text-orange-500" />;
      case 'OFFLINE':
        return <WifiOff className="w-4 h-4 text-neutral-400" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const statusLabel = (status: string) => {
    const norm = normalizeStatus(status);
    const labels: Record<string, string> = {
      MOVING: t('fleet.gps.statusMoving'),
      STOPPED: t('fleet.gps.statusStopped'),
      IDLE: t('fleet.gps.statusIdle'),
      OFFLINE: t('fleet.gps.statusOffline'),
    };
    return labels[norm] ?? status;
  };

  const formatUpdateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return t('fleet.gps.justNow');
      if (diffMin < 60) return `${diffMin} ${t('fleet.gps.minutesAgo')}`;
      return formatTime(d);
    } catch {
      return '\u2014';
    }
  };

  const formatCoord = (lat?: number, lon?: number) => {
    if (lat == null || lon == null) return '\u2014';
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  };

  const filterTabs: { id: StatusFilterType; label: string; count: number }[] = [
    { id: 'all', label: t('fleet.gps.filterAll'), count: totalCount },
    { id: 'MOVING', label: t('fleet.gps.filterMoving'), count: movingCount },
    { id: 'STOPPED', label: t('fleet.gps.filterStopped'), count: stoppedCount },
    { id: 'IDLE', label: t('fleet.gps.filterIdle'), count: idleCount },
    { id: 'OFFLINE', label: t('fleet.gps.filterOffline'), count: offlineCount },
  ];

  const recentAlerts = geofenceAlerts.slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.gps.title')}
        subtitle={t('fleet.gps.subtitle')}
        breadcrumbs={[
          { label: t('fleet.gps.breadcrumbHome'), href: '/' },
          { label: t('fleet.gps.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.gps.breadcrumbGps') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Activity className="w-3.5 h-3.5 text-success-500 animate-pulse" />
              {t('fleet.gps.livePolling')}
            </div>
            {geofenceAlerts.length > 0 && (
              <button
                onClick={() => setShowGeofenceAlerts(!showGeofenceAlerts)}
                className="relative p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <AlertTriangle className="w-4 h-4 text-warning-500" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {geofenceAlerts.length}
                </span>
              </button>
            )}
          </div>
        }
      />

      {/* Geofence Alerts Panel */}
      {showGeofenceAlerts && recentAlerts.length > 0 && (
        <div className="rounded-xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-warning-700 dark:text-warning-300">
              {t('fleet.gps.geofenceAlertsTitle')}
            </h3>
            <button
              onClick={() => setShowGeofenceAlerts(false)}
              className="text-warning-400 hover:text-warning-600 dark:hover:text-warning-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium',
                    alert.eventType === 'ENTERED'
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                      : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
                  )}
                >
                  {alert.eventType === 'ENTERED'
                    ? t('fleet.gps.geofenceEntered')
                    : t('fleet.gps.geofenceExited')}
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {alert.vehicleName}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">{alert.zoneName}</span>
                <span className="ml-auto text-xs text-neutral-400 tabular-nums">
                  {formatUpdateTime(alert.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          icon={<Truck className="w-5 h-5" />}
          label={t('fleet.gps.metricTotal')}
          value={totalCount}
        />
        <MetricCard
          icon={<Navigation className="w-5 h-5" />}
          label={t('fleet.gps.metricMoving')}
          value={movingCount}
        />
        <MetricCard
          icon={<Square className="w-5 h-5" />}
          label={t('fleet.gps.metricStopped')}
          value={stoppedCount}
        />
        <MetricCard
          icon={<CircleDot className="w-5 h-5" />}
          label={t('fleet.gps.metricIdle')}
          value={idleCount}
        />
        <MetricCard
          icon={<WifiOff className="w-5 h-5" />}
          label={t('fleet.gps.metricOffline')}
          value={offlineCount}
        />
      </div>

      {/* Filter Tabs + Vehicle Type Filter */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 flex-1 border-b border-neutral-200 dark:border-neutral-700">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-neutral-400">({tab.count})</span>
            </button>
          ))}
        </div>
        {vehicleTypes.length > 0 && (
          <Select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="w-48"
            options={vehicleTypes}
            placeholder={t('fleet.gps.filterAllTypes')}
          />
        )}
      </div>

      {/* Empty state when no vehicles at all */}
      {!isLoading && vehicles.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 py-16 px-6 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            {t('fleet.gps.emptyTitle')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            {t('fleet.gps.emptyDescription')}
          </p>
        </div>
      )}

      {/* Main Content: Vehicle List + Detail */}
      {(isLoading || vehicles.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <div className="lg:col-span-1 space-y-2 max-h-[650px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
              {t('common.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
              {t('fleet.gps.emptyList')}
            </div>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedVehicle?.id === v.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(v.status)}
                    <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {v.vehicleName}
                    </span>
                  </div>
                  <StatusBadge
                    status={normalizeStatus(v.status)}
                    colorMap={gpsStatusColorMap}
                    label={statusLabel(v.status)}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{v.licensePlate}</span>
                  <span className="truncate ml-2">{v.lastLocationName || '\u2014'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mt-1">
                  <div className="flex items-center gap-3">
                    {v.currentSpeed != null && (
                      <span className="flex items-center gap-0.5">
                        <Gauge className="w-3 h-3" />
                        {v.currentSpeed} {t('fleet.gps.kmh')}
                      </span>
                    )}
                    {v.heading != null && (
                      <span className="flex items-center gap-0.5">
                        <Compass className="w-3 h-3" />
                        {v.heading}°
                      </span>
                    )}
                  </div>
                  <span>{formatUpdateTime(v.lastUpdate)}</span>
                </div>
                {/* Coordinates */}
                {v.lastLatitude != null && v.lastLongitude != null && (
                  <div className="text-[10px] text-neutral-400 mt-1 tabular-nums">
                    {formatCoord(v.lastLatitude, v.lastLongitude)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Right Panel: Map + Vehicle Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Area */}
          <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center min-h-[350px]">
            <div className="text-center text-neutral-400 dark:text-neutral-500">
              <MapPin className="w-12 h-12 mx-auto mb-3" />
              <p className="text-lg font-medium">{t('fleet.gps.mapPlaceholder')}</p>
              <p className="text-sm mt-1">{t('fleet.gps.mapPlaceholderDesc')}</p>
              {filtered.length > 0 && (
                <p className="text-xs mt-2">
                  {t('fleet.gps.mapVehicleCount', { count: String(filtered.length) })}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Detail Panel */}
          {selectedVehicle && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedVehicle.vehicleName}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedVehicle.licensePlate}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
                    {t('fleet.gps.detailSpeed')}
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {selectedVehicle.currentSpeed != null
                      ? `${selectedVehicle.currentSpeed} ${t('fleet.gps.kmh')}`
                      : '\u2014'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
                    {t('fleet.gps.detailLocation')}
                  </p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {selectedVehicle.lastLocationName || '\u2014'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
                    {t('fleet.gps.detailDistance')}
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {formatNumber(selectedVehicle.todayDistance)} {t('fleet.gps.km')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
                    {t('fleet.gps.detailStops')}
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {selectedVehicle.todayStops ?? '\u2014'}
                  </p>
                </div>
              </div>

              {/* Coordinates */}
              {selectedVehicle.lastLatitude != null && selectedVehicle.lastLongitude != null && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 tabular-nums">
                  {t('fleet.gps.detailCoordinates')}:{' '}
                  {formatCoord(selectedVehicle.lastLatitude, selectedVehicle.lastLongitude)}
                </div>
              )}

              {/* Track history for selected date */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('fleet.gps.trackHistoryTitle')}
                  </h4>
                  <Input
                    type="date"
                    value={trackDate}
                    onChange={(e) => setTrackDate(e.target.value)}
                    className="w-40 text-xs"
                  />
                </div>

                {trackData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('fleet.gps.trackDistance')}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatNumber(trackData.totalDistance)} {t('fleet.gps.km')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('fleet.gps.trackStops')}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">{trackData.totalStops}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('fleet.gps.trackAvgSpeed')}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {trackData.avgSpeed.toFixed(0)} {t('fleet.gps.kmh')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('fleet.gps.trackMaxSpeed')}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {trackData.maxSpeed.toFixed(0)} {t('fleet.gps.kmh')}
                        </p>
                      </div>
                    </div>

                    {/* Track points table */}
                    {trackData.points.length > 0 && (
                      <div className="max-h-[200px] overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <table className="w-full text-xs">
                          <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium text-neutral-500 dark:text-neutral-400">
                                {t('fleet.gps.trackColTime')}
                              </th>
                              <th className="px-2 py-1.5 text-left font-medium text-neutral-500 dark:text-neutral-400">
                                {t('fleet.gps.trackColLocation')}
                              </th>
                              <th className="px-2 py-1.5 text-right font-medium text-neutral-500 dark:text-neutral-400">
                                {t('fleet.gps.trackColSpeed')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {trackData.points.slice(0, 50).map((pt, i) => (
                              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <td className="px-2 py-1 tabular-nums text-neutral-700 dark:text-neutral-300">
                                  {formatTime(pt.timestamp)}
                                </td>
                                <td className="px-2 py-1 text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                                  {pt.address || formatCoord(pt.latitude, pt.longitude)}
                                </td>
                                <td className="px-2 py-1 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                                  {pt.speed} {t('fleet.gps.kmh')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-400 text-sm">
                    {t('fleet.gps.trackNoData')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default GpsTrackingPage;
