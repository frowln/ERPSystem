import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Clock, Fuel, Calculator, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { fleetApi, type EquipmentUsageLog, type MachineHourRate, type OwnVsRent } from '@/api/fleet';
import { useVehicleOptions, useProjectOptions } from '@/hooks/useSelectOptions';
import { formatDate, formatNumber, formatMoney } from '@/lib/format';
import { t } from '@/i18n';

type TabId = 'logs' | 'calculator' | 'comparison';

function CostRow({ label, perHour, perYear }: { label: string; perHour: number; perYear: number }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      <div className="flex gap-6">
        <span className="text-sm font-medium tabular-nums">{formatMoney(perHour)}{t('fleet.usageLogs.calcPerHour')}</span>
        <span className="text-sm text-neutral-500 tabular-nums w-32 text-right">{formatMoney(perYear)}{t('fleet.usageLogs.calcPerYear')}</span>
      </div>
    </div>
  );
}

const UsageLogListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('logs');
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Calculator state
  const [calcVehicleId, setCalcVehicleId] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');

  const { options: vehicleOptions } = useVehicleOptions();
  const { options: projectOptions } = useProjectOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-usage-logs', vehicleFilter, projectFilter],
    queryFn: () =>
      fleetApi.getUsageLogs({
        vehicleId: vehicleFilter || undefined,
        projectId: projectFilter || undefined,
        size: 200,
        page: 0,
      }),
    enabled: activeTab === 'logs',
  });

  const logs = data?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.operatorName?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.vehicleName?.toLowerCase().includes(q) ||
        l.projectName?.toLowerCase().includes(q),
    );
  }, [logs, search]);

  // Metrics
  const totalHours = logs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
  const totalEntries = logs.length;
  const uniqueDays = new Set(logs.map((l) => l.usageDate)).size;
  const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
  const totalFuel = logs.reduce((sum, l) => sum + (l.fuelConsumed || 0), 0);

  // Calculator query
  const { data: rateData, isLoading: calcLoading } = useQuery<MachineHourRate>({
    queryKey: ['machine-hour-rate', calcVehicleId, fuelPrice],
    queryFn: () => fleetApi.getMachineHourRate(calcVehicleId, fuelPrice ? Number(fuelPrice) : undefined),
    enabled: activeTab === 'calculator' && !!calcVehicleId,
  });

  // Own vs Rent query
  const { data: compData, isLoading: compLoading } = useQuery<OwnVsRent>({
    queryKey: ['own-vs-rent', calcVehicleId, fuelPrice],
    queryFn: () => fleetApi.getOwnVsRent(calcVehicleId, fuelPrice ? Number(fuelPrice) : undefined),
    enabled: activeTab === 'comparison' && !!calcVehicleId,
  });

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'logs', label: t('fleet.usageLogs.tabLogs'), icon: <Clock className="w-4 h-4" /> },
    { id: 'calculator', label: t('fleet.usageLogs.tabCalculator'), icon: <Calculator className="w-4 h-4" /> },
    { id: 'comparison', label: t('fleet.usageLogs.tabComparison'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const columns = useMemo<ColumnDef<EquipmentUsageLog, unknown>[]>(
    () => [
      {
        accessorKey: 'usageDate',
        header: t('fleet.usageLogs.colDate'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'vehicleName',
        header: t('fleet.usageLogs.colVehicle'),
        size: 200,
        cell: ({ getValue }) => <span className="font-medium truncate">{getValue<string>() ?? '—'}</span>,
      },
      {
        accessorKey: 'projectName',
        header: t('fleet.usageLogs.colProject'),
        size: 160,
        cell: ({ getValue }) => getValue<string>() || <span className="text-neutral-400">—</span>,
      },
      {
        accessorKey: 'operatorName',
        header: t('fleet.usageLogs.colOperator'),
        size: 150,
        cell: ({ getValue }) => getValue<string>() || <span className="text-neutral-400">—</span>,
      },
      {
        accessorKey: 'hoursWorked',
        header: t('fleet.usageLogs.colHoursWorked'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-semibold text-primary-600 dark:text-primary-400">
            {formatNumber(getValue<number>())} {t('fleet.usageLogs.hours')}
          </span>
        ),
      },
      {
        accessorKey: 'hoursStart',
        header: t('fleet.usageLogs.colHoursStart'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v != null ? <span className="tabular-nums">{formatNumber(v)}</span> : <span className="text-neutral-400">—</span>;
        },
      },
      {
        accessorKey: 'hoursEnd',
        header: t('fleet.usageLogs.colHoursEnd'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v != null ? <span className="tabular-nums">{formatNumber(v)}</span> : <span className="text-neutral-400">—</span>;
        },
      },
      {
        accessorKey: 'fuelConsumed',
        header: t('fleet.usageLogs.colFuelConsumed'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v != null ? <span className="tabular-nums">{formatNumber(v)}</span> : <span className="text-neutral-400">—</span>;
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.usageLogs.title')}
        subtitle={t('fleet.usageLogs.subtitle')}
        breadcrumbs={[
          { label: t('fleet.usageLogs.breadcrumbHome'), href: '/' },
          { label: t('fleet.usageLogs.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.usageLogs.breadcrumbUsageLogs') },
        ]}
        actions={
          <Button onClick={() => navigate('/fleet/usage-logs/new')} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('fleet.usageLogs.newEntry')}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label={t('fleet.usageLogs.metricTotalHours')} value={formatNumber(totalHours)} icon={<Clock className="w-5 h-5" />} />
            <MetricCard label={t('fleet.usageLogs.metricTotalEntries')} value={totalEntries} icon={<Clock className="w-5 h-5" />} />
            <MetricCard label={t('fleet.usageLogs.metricAvgHoursPerDay')} value={formatNumber(avgHoursPerDay)} icon={<Clock className="w-5 h-5" />} />
            <MetricCard label={t('fleet.usageLogs.metricTotalFuel')} value={formatNumber(totalFuel)} icon={<Fuel className="w-5 h-5" />} />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('fleet.usageLogs.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-56"
              options={vehicleOptions}
              placeholder={t('fleet.usageLogs.filterAllVehicles')}
            />
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-56"
              options={projectOptions}
              placeholder={t('fleet.usageLogs.filterAllProjects')}
            />
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            onRowClick={(row) => navigate(`/fleet/usage-logs/${row.id}`)}
            emptyTitle={t('fleet.usageLogs.emptyTitle')}
            emptyDescription={t('fleet.usageLogs.emptyDescription')}
            enableExport
          />
        </>
      )}

      {/* CALCULATOR TAB */}
      {(activeTab === 'calculator' || activeTab === 'comparison') && (
        <div className="space-y-6">
          {/* Vehicle selector (shared for both calculator and comparison) */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-base font-semibold mb-4">
              {activeTab === 'calculator' ? t('fleet.usageLogs.calcTitle') : t('fleet.usageLogs.compTitle')}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {activeTab === 'calculator' ? t('fleet.usageLogs.calcSubtitle') : t('fleet.usageLogs.compSubtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={calcVehicleId}
                onChange={(e) => setCalcVehicleId(e.target.value)}
                options={vehicleOptions}
                placeholder={t('fleet.usageLogs.calcSelectVehicle')}
              />
              <Input
                type="number"
                step="0.01"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                placeholder={t('fleet.usageLogs.calcFuelPricePlaceholder')}
              />
            </div>
          </div>

          {/* Calculator results */}
          {activeTab === 'calculator' && calcVehicleId && (
            <>
              {calcLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : rateData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Total Rate Card */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                    <h4 className="text-sm text-neutral-500 mb-2">{t('fleet.usageLogs.calcTotalRate')}</h4>
                    <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {formatMoney(rateData.totalRatePerHour)}
                      <span className="text-base font-normal text-neutral-500">{t('fleet.usageLogs.calcPerHour')}</span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      {t('fleet.usageLogs.calcAnnualTotal')}: {formatMoney(rateData.annualTotalCost)}
                    </div>
                  </div>

                  {/* Input Parameters */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                    <h4 className="text-sm font-semibold mb-3">{t('fleet.usageLogs.calcInputParams')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{t('fleet.usageLogs.calcParamPurchasePrice')}</span>
                        <span className="font-medium">{formatMoney(rateData.purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{t('fleet.usageLogs.calcParamUsefulLife')}</span>
                        <span className="font-medium">{formatNumber(rateData.usefulLifeYears)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{t('fleet.usageLogs.calcParamAnnualHours')}</span>
                        <span className="font-medium">{formatNumber(rateData.annualWorkingHours)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{t('fleet.usageLogs.calcParamFuelRate')}</span>
                        <span className="font-medium">{formatNumber(rateData.fuelConsumptionRate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                    <h4 className="text-sm font-semibold mb-3">{t('fleet.usageLogs.calcResultTitle')}</h4>
                    <CostRow label={t('fleet.usageLogs.calcDepreciation')} perHour={rateData.depreciationPerHour} perYear={rateData.annualDepreciation} />
                    <CostRow label={t('fleet.usageLogs.calcFuel')} perHour={rateData.fuelPerHour} perYear={rateData.annualFuelCost} />
                    <CostRow label={t('fleet.usageLogs.calcMaintenance')} perHour={rateData.maintenancePerHour} perYear={rateData.annualMaintenanceCost} />
                    <CostRow label={t('fleet.usageLogs.calcInsurance')} perHour={rateData.insurancePerHour} perYear={rateData.annualInsuranceCost} />
                    <CostRow label={t('fleet.usageLogs.calcOperator')} perHour={rateData.operatorPerHour} perYear={rateData.annualOperatorCost} />
                    <div className="flex justify-between py-2 mt-2 border-t-2 border-neutral-200 dark:border-neutral-700">
                      <span className="text-sm font-bold">{t('fleet.usageLogs.calcTotalRate')}</span>
                      <div className="flex gap-6">
                        <span className="text-sm font-bold tabular-nums text-primary-600">{formatMoney(rateData.totalRatePerHour)}{t('fleet.usageLogs.calcPerHour')}</span>
                        <span className="text-sm font-bold tabular-nums w-32 text-right">{formatMoney(rateData.annualTotalCost)}{t('fleet.usageLogs.calcPerYear')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Own vs Rent results */}
          {activeTab === 'comparison' && calcVehicleId && (
            <>
              {compLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : compData ? (
                <div className="space-y-6">
                  {compData.marketRentalRatePerHour === 0 ? (
                    <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-xl p-4 text-sm text-warning-700 dark:text-warning-300">
                      {t('fleet.usageLogs.compNoRentalRate')}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Own Costs */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                      <h4 className="text-sm font-semibold mb-4 text-primary-600">{t('fleet.usageLogs.compOwnCosts')}</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-neutral-500">{t('fleet.usageLogs.compPerHour')}</div>
                          <div className="text-lg font-bold tabular-nums">{formatMoney(compData.ownRatePerHour)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">{t('fleet.usageLogs.compPerMonth')}</div>
                          <div className="text-lg font-bold tabular-nums">{formatMoney(compData.ownMonthlyCost)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">{t('fleet.usageLogs.compPerYear')}</div>
                          <div className="text-lg font-bold tabular-nums">{formatMoney(compData.ownAnnualCost)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Rent Costs */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                      <h4 className="text-sm font-semibold mb-4 text-orange-600">{t('fleet.usageLogs.compRentCosts')}</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-neutral-500">{t('fleet.usageLogs.compPerHour')}</div>
                          <div className="text-lg font-bold tabular-nums">{formatMoney(compData.marketRentalRatePerHour)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">{t('fleet.usageLogs.compPerMonth')}</div>
                          <div className="text-lg font-bold tabular-nums">{formatMoney(compData.rentMonthlyCost)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500">{t('fleet.usageLogs.compPerYear')}</div>
                          <div className="text-lg font-bold tabular-nums">{formatMoney(compData.rentAnnualCost)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`rounded-xl border p-6 ${
                      compData.recommendation === 'OWN'
                        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700'
                        : compData.recommendation === 'RENT'
                          ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}>
                      <h4 className="text-sm font-semibold mb-4">{t('fleet.usageLogs.compRecommendation')}</h4>
                      <div className="text-lg font-bold mb-3">
                        {t(`fleet.usageLogs.compRecommend${compData.recommendation}`)}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">{t('fleet.usageLogs.compSavings')}</span>
                          <span className={`font-bold ${compData.savingsAnnual > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                            {formatMoney(compData.savingsAnnual)}{t('fleet.usageLogs.calcPerYear')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">{t('fleet.usageLogs.compSavingsPercent')}</span>
                          <span className="font-bold">{formatNumber(compData.savingsPercent)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UsageLogListPage;
