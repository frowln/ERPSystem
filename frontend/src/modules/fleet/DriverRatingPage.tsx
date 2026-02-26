import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Users,
  Star,
  Trophy,
  AlertTriangle,
  Fuel,
  Gauge,
  Shield,
  Timer,
  Route,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { DriverRating, DriverRatingPeriod } from './types';

/** Rating bar 0-100 with color gradient */
const RatingBar: React.FC<{ value: number; showLabel?: boolean }> = ({ value, showLabel = true }) => {
  const clamped = Math.max(0, Math.min(100, value));
  let barColor = 'bg-danger-500';
  if (clamped >= 80) barColor = 'bg-success-500';
  else if (clamped >= 50) barColor = 'bg-warning-500';

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'text-xs font-bold tabular-nums w-8 text-right',
            clamped >= 80
              ? 'text-success-600 dark:text-success-400'
              : clamped >= 50
                ? 'text-warning-600 dark:text-warning-400'
                : 'text-danger-600 dark:text-danger-400',
          )}
        >
          {clamped}
        </span>
      )}
    </div>
  );
};

/** Mini breakdown chart for rating components */
const RatingBreakdown: React.FC<{ driver: DriverRating }> = ({ driver }) => {
  const items = [
    {
      label: t('fleet.driverRating.breakdownFuel'),
      value: driver.fuelEfficiencyScore ?? 0,
      weight: 40,
      icon: <Fuel className="w-3 h-3" />,
    },
    {
      label: t('fleet.driverRating.breakdownSpeed'),
      value: driver.speedComplianceScore ?? 0,
      weight: 30,
      icon: <Gauge className="w-3 h-3" />,
    },
    {
      label: t('fleet.driverRating.breakdownMaintenance'),
      value: driver.maintenanceCareScore ?? 0,
      weight: 15,
      icon: <Shield className="w-3 h-3" />,
    },
    {
      label: t('fleet.driverRating.breakdownIdle'),
      value: driver.idleTimeScore ?? 0,
      weight: 15,
      icon: <Timer className="w-3 h-3" />,
    },
  ];

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400 w-4">{item.icon}</span>
          <span className="text-neutral-600 dark:text-neutral-400 w-24 truncate">
            {item.label} ({item.weight}%)
          </span>
          <div className="flex-1">
            <RatingBar value={item.value} showLabel={false} />
          </div>
          <span className="tabular-nums w-6 text-right text-neutral-500 dark:text-neutral-400 font-medium">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const DriverRatingPage: React.FC = () => {
  const [period, setPeriod] = useState<DriverRatingPeriod>('MONTH');
  const [selectedDriver, setSelectedDriver] = useState<DriverRating | null>(null);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['fleet-driver-ratings', period],
    queryFn: () => fleetApi.getDriverRatings(period),
  });

  // Sort by rating desc
  const sortedDrivers = useMemo(
    () => [...drivers].sort((a, b) => b.overallRating - a.overallRating),
    [drivers],
  );

  // Metrics
  const totalDrivers = drivers.length;
  const avgRating =
    totalDrivers > 0 ? Math.round(drivers.reduce((s, d) => s + d.overallRating, 0) / totalDrivers) : 0;
  const bestDriver = sortedDrivers[0] ?? null;
  const worstPerformer = sortedDrivers[sortedDrivers.length - 1] ?? null;
  const totalViolations = drivers.reduce((s, d) => s + d.speedViolations, 0);
  const totalDistance = drivers.reduce((s, d) => s + (d.totalDistance ?? 0), 0);

  // Top 3 and bottom 3 performers
  const topPerformers = sortedDrivers.slice(0, 3);
  const bottomPerformers = sortedDrivers.length > 3 ? sortedDrivers.slice(-3).reverse() : [];

  const periodOptions = [
    { value: 'MONTH', label: t('fleet.driverRating.periodMonth') },
    { value: 'QUARTER', label: t('fleet.driverRating.periodQuarter') },
    { value: 'YEAR', label: t('fleet.driverRating.periodYear') },
  ];

  const columns = useMemo<ColumnDef<DriverRating, unknown>[]>(
    () => [
      {
        accessorKey: 'rankPosition',
        header: '#',
        size: 50,
        cell: ({ getValue }) => {
          const rank = getValue<number>();
          return (
            <span
              className={cn(
                'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                rank === 1
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : rank === 2
                    ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                    : rank === 3
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {rank}
            </span>
          );
        },
      },
      {
        accessorKey: 'driverName',
        header: t('fleet.driverRating.colDriver'),
        size: 170,
        cell: ({ getValue, row }) => {
          const rating = row.original.overallRating;
          const isTop = rating >= 80;
          const isBottom = rating < 50;
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {getValue<string>()}
              </span>
              {isTop && <TrendingUp className="w-3.5 h-3.5 text-success-500" />}
              {isBottom && <TrendingDown className="w-3.5 h-3.5 text-danger-500" />}
            </div>
          );
        },
      },
      {
        accessorKey: 'vehicleNames',
        header: t('fleet.driverRating.colVehicles'),
        size: 180,
        cell: ({ getValue }) => {
          const names = getValue<string[]>();
          return (
            <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
              {names.length > 0 ? names.join(', ') : '\u2014'}
            </span>
          );
        },
      },
      {
        accessorKey: 'tripsCount',
        header: t('fleet.driverRating.colTrips'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'totalDistance',
        header: t('fleet.driverRating.colDistance'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return v != null ? (
            <span className="tabular-nums">
              {formatNumber(v)} {t('fleet.driverRating.km')}
            </span>
          ) : (
            <span className="text-neutral-400">\u2014</span>
          );
        },
      },
      {
        accessorKey: 'avgFuelConsumption',
        header: t('fleet.driverRating.colAvgFuel'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {getValue<number>().toFixed(1)} {t('fleet.driverRating.lPer100km')}
          </span>
        ),
      },
      {
        accessorKey: 'speedViolations',
        header: t('fleet.driverRating.colViolations'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span
              className={cn(
                'tabular-nums font-medium',
                v > 5
                  ? 'text-danger-600 dark:text-danger-400'
                  : v > 0
                    ? 'text-warning-600 dark:text-warning-400'
                    : 'text-success-600 dark:text-success-400',
              )}
            >
              {v}
            </span>
          );
        },
      },
      {
        accessorKey: 'overallRating',
        header: t('fleet.driverRating.colRating'),
        size: 180,
        cell: ({ getValue, row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDriver(row.original);
            }}
            className="w-full hover:opacity-80 transition-opacity"
            title={t('fleet.driverRating.clickForBreakdown')}
          >
            <RatingBar value={getValue<number>()} />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.driverRating.title')}
        subtitle={t('fleet.driverRating.subtitle')}
        breadcrumbs={[
          { label: t('fleet.driverRating.breadcrumbHome'), href: '/' },
          { label: t('fleet.driverRating.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.driverRating.breadcrumbDriverRating') },
        ]}
        actions={
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as DriverRatingPeriod)}
            className="w-44"
            options={periodOptions}
          />
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label={t('fleet.driverRating.metricTotal')}
          value={totalDrivers}
        />
        <MetricCard
          icon={<Star className="w-5 h-5" />}
          label={t('fleet.driverRating.metricAvgRating')}
          value={avgRating}
        />
        <MetricCard
          icon={<Trophy className="w-5 h-5" />}
          label={t('fleet.driverRating.metricBestDriver')}
          value={bestDriver?.driverName ?? '\u2014'}
          subtitle={bestDriver ? `${t('fleet.driverRating.rating')}: ${bestDriver.overallRating}` : ''}
        />
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label={t('fleet.driverRating.metricWorstPerformer')}
          value={worstPerformer?.driverName ?? '\u2014'}
          subtitle={
            worstPerformer
              ? `${t('fleet.driverRating.rating')}: ${worstPerformer.overallRating}`
              : ''
          }
        />
        <MetricCard
          icon={<Gauge className="w-5 h-5" />}
          label={t('fleet.driverRating.metricTotalViolations')}
          value={totalViolations}
        />
        <MetricCard
          icon={<Route className="w-5 h-5" />}
          label={t('fleet.driverRating.metricTotalDistance')}
          value={`${formatNumber(totalDistance)} ${t('fleet.driverRating.km')}`}
        />
      </div>

      {/* Top / Bottom Performers Highlight */}
      {sortedDrivers.length > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top performers */}
          <div className="rounded-xl border border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/10 p-4">
            <h3 className="text-sm font-semibold text-success-700 dark:text-success-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              {t('fleet.driverRating.topPerformers')}
            </h3>
            <div className="space-y-2">
              {topPerformers.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      i === 0
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {d.driverName}
                  </span>
                  <RatingBar value={d.overallRating} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom performers */}
          {bottomPerformers.length > 0 && (
            <div className="rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50/50 dark:bg-danger-900/10 p-4">
              <h3 className="text-sm font-semibold text-danger-700 dark:text-danger-400 mb-3 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                {t('fleet.driverRating.bottomPerformers')}
              </h3>
              <div className="space-y-2">
                {bottomPerformers.map((d) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {d.rankPosition}
                    </span>
                    <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {d.driverName}
                    </span>
                    <RatingBar value={d.overallRating} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating Legend */}
      <div className="flex gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-success-500" />
          {t('fleet.driverRating.legendGood')} (80+)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-warning-500" />
          {t('fleet.driverRating.legendAverage')} (50-79)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-danger-500" />
          {t('fleet.driverRating.legendPoor')} (&lt;50)
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={sortedDrivers}
        loading={isLoading}
        enableExport
        pageSize={20}
        emptyTitle={t('fleet.driverRating.emptyTitle')}
        emptyDescription={t('fleet.driverRating.emptyDescription')}
      />

      {/* Rating Breakdown Panel */}
      {selectedDriver && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-2xl z-50 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('fleet.driverRating.breakdownTitle')}
              </h3>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Driver info */}
            <div className="mb-6">
              <h4 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {selectedDriver.driverName}
              </h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {selectedDriver.vehicleNames.join(', ') || '\u2014'}
              </p>
            </div>

            {/* Overall Rating */}
            <div className="text-center mb-6">
              <div
                className={cn(
                  'inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold',
                  selectedDriver.overallRating >= 80
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                    : selectedDriver.overallRating >= 50
                      ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                      : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
                )}
              >
                {selectedDriver.overallRating}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                {t('fleet.driverRating.overallScore')}
              </p>
            </div>

            {/* Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                {t('fleet.driverRating.ratingComponents')}
              </h4>
              <RatingBreakdown driver={selectedDriver} />
            </div>

            {/* Stats */}
            <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('fleet.driverRating.statsTitle')}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('fleet.driverRating.colTrips')}
                  </p>
                  <p className="font-semibold tabular-nums">{selectedDriver.tripsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('fleet.driverRating.colDistance')}
                  </p>
                  <p className="font-semibold tabular-nums">
                    {selectedDriver.totalDistance != null
                      ? `${formatNumber(selectedDriver.totalDistance)} ${t('fleet.driverRating.km')}`
                      : '\u2014'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('fleet.driverRating.colAvgFuel')}
                  </p>
                  <p className="font-semibold tabular-nums">
                    {selectedDriver.avgFuelConsumption.toFixed(1)} {t('fleet.driverRating.lPer100km')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('fleet.driverRating.colViolations')}
                  </p>
                  <p
                    className={cn(
                      'font-semibold tabular-nums',
                      selectedDriver.speedViolations > 5
                        ? 'text-danger-600 dark:text-danger-400'
                        : selectedDriver.speedViolations > 0
                          ? 'text-warning-600 dark:text-warning-400'
                          : 'text-success-600 dark:text-success-400',
                    )}
                  >
                    {selectedDriver.speedViolations}
                  </p>
                </div>
                {selectedDriver.idleTimeMinutes != null && (
                  <div className="col-span-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('fleet.driverRating.statIdleTime')}
                    </p>
                    <p className="font-semibold tabular-nums">
                      {Math.floor(selectedDriver.idleTimeMinutes / 60)}
                      {t('fleet.driverRating.hours')}{' '}
                      {selectedDriver.idleTimeMinutes % 60}
                      {t('fleet.driverRating.minutes')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for sidebar */}
      {selectedDriver && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          onClick={() => setSelectedDriver(null)}
        />
      )}
    </div>
  );
};

export default DriverRatingPage;
