import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  AlertTriangle,
  Thermometer,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { bimApi } from '@/api/bim';
import type { DefectHeatmapZone } from '@/modules/bim/types';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const defectSeverityColorMap: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'gray',
};

function getDensityColor(density: number): string {
  if (density >= 0.8) return 'bg-red-500/80 dark:bg-red-600/70';
  if (density >= 0.6) return 'bg-orange-500/70 dark:bg-orange-600/60';
  if (density >= 0.4) return 'bg-yellow-500/60 dark:bg-yellow-600/50';
  if (density >= 0.2) return 'bg-lime-500/50 dark:bg-lime-600/40';
  return 'bg-green-500/40 dark:bg-green-600/30';
}

function getDensityBorder(density: number): string {
  if (density >= 0.8) return 'border-red-400 dark:border-red-500';
  if (density >= 0.6) return 'border-orange-400 dark:border-orange-500';
  if (density >= 0.4) return 'border-yellow-400 dark:border-yellow-500';
  if (density >= 0.2) return 'border-lime-400 dark:border-lime-500';
  return 'border-green-400 dark:border-green-500';
}

const DefectHeatmapPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedZone, setSelectedZone] = useState<DefectHeatmapZone | null>(null);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['defect-heatmap'],
    queryFn: () => bimApi.getDefectHeatmap(),
  });

  const filtered = useMemo(() => {
    let result = zones;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (z) =>
          z.zoneName.toLowerCase().includes(lower) ||
          z.floor.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [zones, search]);

  const filteredDefects = useMemo(() => {
    if (!selectedZone) return [];
    let defects = selectedZone.defects;
    if (typeFilter)
      defects = defects.filter((d) => d.type === typeFilter);
    if (severityFilter)
      defects = defects.filter((d) => d.severity === severityFilter);
    return defects;
  }, [selectedZone, typeFilter, severityFilter]);

  const totalDefects = zones.reduce((sum, z) => sum + z.defectCount, 0);
  const criticalZones = zones.filter((z) => z.criticalCount > 0).length;
  const avgDensity =
    zones.length > 0
      ? (zones.reduce((sum, z) => sum + z.density, 0) / zones.length).toFixed(2)
      : '0';

  // Group by floor
  const floors = useMemo(() => {
    const map = new Map<string, DefectHeatmapZone[]>();
    for (const zone of filtered) {
      const existing = map.get(zone.floor) ?? [];
      existing.push(zone);
      map.set(zone.floor, existing);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const defectTypes = useMemo(() => {
    const types = new Set<string>();
    for (const zone of zones) {
      for (const defect of zone.defects) {
        types.add(defect.type);
      }
    }
    return Array.from(types);
  }, [zones]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.heatmapTitle')}
        subtitle={t('bim.heatmapSubtitle')}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.heatmapBreadcrumb') },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('bim.heatmapMetricTotalDefects')}
          value={totalDefects}
          loading={isLoading}
        />
        <MetricCard
          icon={<MapPin size={18} />}
          label={t('bim.heatmapMetricCriticalZones')}
          value={criticalZones}
          loading={isLoading}
        />
        <MetricCard
          icon={<Thermometer size={18} />}
          label={t('bim.heatmapMetricAvgDensity')}
          value={avgDensity}
          loading={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('bim.heatmapSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{t('bim.heatmapLegend')}:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500/40 dark:bg-green-600/30" />
          {t('bim.heatmapLegendFew')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500/60 dark:bg-yellow-600/50" />
          {t('bim.heatmapLegendModerate')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500/80 dark:bg-red-600/70" />
          {t('bim.heatmapLegendMany')}
        </span>
      </div>

      {/* Heatmap Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : floors.length === 0 ? (
        <div className="text-center py-12">
          <Layers size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('bim.heatmapEmptyTitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {floors.map(([floor, floorZones]) => (
            <div key={floor}>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                {floor}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {floorZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setSelectedZone(zone);
                      setTypeFilter('');
                      setSeverityFilter('');
                    }}
                    className={cn(
                      'relative rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] hover:shadow-md',
                      getDensityColor(zone.density),
                      getDensityBorder(zone.density),
                    )}
                  >
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">
                      {zone.zoneName}
                    </p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                      {zone.defectCount}
                    </p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
                      {t('bim.heatmapZoneDefects')}
                    </p>
                    {zone.criticalCount > 0 && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        <AlertTriangle size={10} />
                        {zone.criticalCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone Detail Modal */}
      <Modal
        open={!!selectedZone}
        onClose={() => setSelectedZone(null)}
        title={selectedZone?.zoneName ?? ''}
        description={t('bim.heatmapModalDescription', {
          floor: selectedZone?.floor ?? '',
          count: String(selectedZone?.defectCount ?? 0),
        })}
        size="lg"
      >
        {selectedZone && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Select
                options={[
                  { value: '', label: t('bim.heatmapFilterAllTypes') },
                  ...defectTypes.map((dt) => ({ value: dt, label: dt })),
                ]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-48"
              />
              <Select
                options={[
                  { value: '', label: t('bim.heatmapFilterAllSeverities') },
                  { value: 'critical', label: t('bim.clashResultSevCritical') },
                  { value: 'high', label: t('bim.clashResultSevHigh') },
                  { value: 'medium', label: t('bim.clashResultSevMedium') },
                  { value: 'low', label: t('bim.clashResultSevLow') },
                ]}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {filteredDefects.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  {t('bim.heatmapNoDefectsInZone')}
                </p>
              ) : (
                filteredDefects.map((defect) => (
                  <div
                    key={defect.id}
                    className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {defect.description}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {defect.type}
                      </p>
                    </div>
                    <StatusBadge
                      status={defect.severity}
                      colorMap={defectSeverityColorMap}
                      label={defect.severity}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DefectHeatmapPage;
