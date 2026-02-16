import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Settings,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { apiClient } from '@/api/client';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeatherSite {
  id: string;
  name: string;
  projectName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  isSafe: boolean;
  safetyNote: string;
  updatedAt: string;
}

interface WeatherConfig {
  apiKey: string;
  updateIntervalMinutes: number;
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'ms' | 'kmh';
}

const defaultWeatherConfig: WeatherConfig = {
  apiKey: '',
  updateIntervalMinutes: 30,
  temperatureUnit: 'celsius',
  windSpeedUnit: 'ms',
};

const safetyColorMap: Record<string, 'green' | 'red'> = {
  safe: 'green',
  unsafe: 'red',
};

const getSafetyLabels = (): Record<string, string> => ({
  safe: t('integrations.weather.safe'),
  unsafe: t('integrations.weather.unsafe'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeatherIcon(condition: string) {
  switch (condition) {
    case 'CLEAR':
      return <Sun size={24} className="text-yellow-500" />;
    case 'CLOUDY':
      return <Cloud size={24} className="text-neutral-400" />;
    case 'RAIN':
      return <CloudRain size={24} className="text-blue-500" />;
    case 'SNOW':
      return <CloudSnow size={24} className="text-cyan-400" />;
    case 'WIND':
      return <Wind size={24} className="text-orange-500" />;
    case 'FROST':
      return <Thermometer size={24} className="text-purple-500" />;
    default:
      return <Cloud size={24} className="text-neutral-400" />;
  }
}

function formatTemp(temp: number): string {
  return `${temp > 0 ? '+' : ''}${temp}\u00B0C`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WeatherPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<WeatherConfig>(defaultWeatherConfig);

  // Fetch sites weather
  const { data: sites, isLoading } = useQuery<WeatherSite[]>({
    queryKey: ['weather-sites'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/weather/sites');
        return res.data as WeatherSite[];
      } catch {
        return [];
      }
    },
    placeholderData: [],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch config
  const { data: config } = useQuery<WeatherConfig>({
    queryKey: ['weather-config'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/weather/config');
        return res.data as WeatherConfig;
      } catch {
        return defaultWeatherConfig;
      }
    },
    placeholderData: defaultWeatherConfig,
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: WeatherConfig) => {
      await apiClient.post('/integrations/weather/config', data);
    },
    onSuccess: () => {
      toast.success(t('integrations.weather.settingsSaved'));
      setShowConfigModal(false);
      queryClient.invalidateQueries({ queryKey: ['weather-config'] });
    },
    onError: () => {
      toast.error(t('integrations.weather.settingsSaveError'));
    },
  });

  // Refresh weather mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/integrations/weather/refresh');
    },
    onSuccess: () => {
      toast.success(t('integrations.weather.dataRefreshed'));
      queryClient.invalidateQueries({ queryKey: ['weather-sites'] });
    },
    onError: () => {
      toast.error(t('integrations.weather.refreshError'));
    },
  });

  const allSites = sites ?? [];
  const cfg = config ?? defaultWeatherConfig;

  const safeSites = allSites.filter((s) => s.isSafe).length;
  const unsafeSites = allSites.filter((s) => !s.isSafe).length;
  const avgTemp =
    allSites.length > 0
      ? Math.round(allSites.reduce((s, site) => s + site.temperature, 0) / allSites.length)
      : 0;
  const maxWind = allSites.length > 0 ? Math.max(...allSites.map((s) => s.windSpeed)) : 0;

  const handleOpenConfig = useCallback(() => {
    setConfigForm(cfg);
    setShowConfigModal(true);
  }, [cfg]);

  const handleSaveConfig = useCallback(() => {
    saveConfigMutation.mutate(configForm);
  }, [configForm, saveConfigMutation]);

  const safetyLabels = getSafetyLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.weather.title')}
        subtitle={t('integrations.weather.subtitle')}
        breadcrumbs={[
          { label: t('integrations.weather.breadcrumbHome'), href: '/' },
          { label: t('integrations.weather.breadcrumbSettings'), href: '/settings' },
          { label: t('integrations.weather.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.weather.title') },
        ]}
        backTo="/integrations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<Settings size={16} />}
              onClick={handleOpenConfig}
            >
              {t('integrations.weather.settings')}
            </Button>
            <Button
              iconLeft={<RefreshCw size={16} />}
              onClick={() => refreshMutation.mutate()}
              loading={refreshMutation.isPending}
            >
              {t('integrations.weather.refresh')}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<MapPin size={18} />} label={t('integrations.weather.metricSites')} value={allSites.length} />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label={t('integrations.weather.metricSafe')}
          value={safeSites}
          subtitle={`${t('integrations.weather.metricOutOf')} ${allSites.length}`}
        />
        <MetricCard
          icon={<Thermometer size={18} />}
          label={t('integrations.weather.metricAvgTemp')}
          value={formatTemp(avgTemp)}
        />
        <MetricCard
          icon={<Wind size={18} />}
          label={t('integrations.weather.metricMaxWind')}
          value={`${maxWind.toFixed(1)} ${t('integrations.weather.windUnitMs')}`}
        />
      </div>

      {/* Unsafe sites alert */}
      {unsafeSites > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ShieldAlert size={20} className="text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger-800">
              {unsafeSites} {unsafeSites === 1 ? t('integrations.weather.unsafeSitesSingular') : t('integrations.weather.unsafeSitesPlural')} {t('integrations.weather.withUnsafeConditions')}
            </p>
            <p className="text-xs text-danger-700 mt-1">
              {t('integrations.weather.unsafeWarning')}
            </p>
          </div>
        </div>
      )}

      {/* Weather cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 animate-pulse"
            >
              <div className="h-5 w-40 bg-neutral-200 rounded mb-3" />
              <div className="h-10 w-20 bg-neutral-200 rounded mb-4" />
              <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-3 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allSites.map((site) => (
            <div
              key={site.id}
              className={cn(
                'bg-white dark:bg-neutral-900 rounded-xl border p-5 transition-shadow hover:shadow-sm',
                site.isSafe ? 'border-neutral-200 dark:border-neutral-700' : 'border-danger-200',
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{site.name}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{site.projectName}</p>
                </div>
                <StatusBadge
                  status={site.isSafe ? 'safe' : 'unsafe'}
                  colorMap={safetyColorMap}
                  label={safetyLabels[site.isSafe ? 'safe' : 'unsafe']}
                  size="sm"
                />
              </div>

              {/* Temperature and icon */}
              <div className="flex items-center gap-4 mb-4">
                {getWeatherIcon(site.condition)}
                <div>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {formatTemp(site.temperature)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('integrations.weather.feelsLike')} {formatTemp(site.feelsLike)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">{site.description}</p>

              {/* Details */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Wind size={13} className="text-neutral-400" />
                  <span className="text-neutral-600">{site.windSpeed} {t('integrations.weather.windUnitMs')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets size={13} className="text-neutral-400" />
                  <span className="text-neutral-600">{site.humidity}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={13} className="text-neutral-400" />
                  <span className="text-neutral-600">
                    {site.latitude.toFixed(2)}, {site.longitude.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Safety note */}
              <div
                className={cn(
                  'rounded-lg p-2.5 text-xs',
                  site.isSafe
                    ? 'bg-success-50 text-success-800'
                    : 'bg-danger-50 text-danger-800',
                )}
              >
                {site.isSafe ? (
                  <ShieldCheck size={13} className="inline mr-1.5 text-success-500" />
                ) : (
                  <ShieldAlert size={13} className="inline mr-1.5 text-danger-500" />
                )}
                {site.safetyNote}
              </div>

              {/* Updated at */}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-400">
                <Clock size={12} />
                <span>{t('integrations.weather.updated')}: {formatDateTime(site.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration modal */}
      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={t('integrations.weather.configTitle')}
        description={t('integrations.weather.configDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
              {t('integrations.weather.cancel')}
            </Button>
            <Button
              onClick={handleSaveConfig}
              loading={saveConfigMutation.isPending}
            >
              {t('integrations.weather.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.weather.fieldApiKey')} required>
            <Input
              placeholder={t('integrations.weather.fieldApiKeyPlaceholder')}
              value={configForm.apiKey}
              onChange={(e) =>
                setConfigForm((prev) => ({ ...prev, apiKey: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t('integrations.weather.fieldUpdateInterval')}>
            <Select
              options={[
                { value: '15', label: t('integrations.weather.intervalEvery15min') },
                { value: '30', label: t('integrations.weather.intervalEvery30min') },
                { value: '60', label: t('integrations.weather.intervalEveryHour') },
                { value: '120', label: t('integrations.weather.intervalEvery2hours') },
              ]}
              value={String(configForm.updateIntervalMinutes)}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  updateIntervalMinutes: parseInt(e.target.value, 10),
                }))
              }
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('integrations.weather.fieldTempUnit')}>
              <Select
                options={[
                  { value: 'celsius', label: t('integrations.weather.tempCelsius') },
                  { value: 'fahrenheit', label: t('integrations.weather.tempFahrenheit') },
                ]}
                value={configForm.temperatureUnit}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    temperatureUnit: e.target.value as 'celsius' | 'fahrenheit',
                  }))
                }
              />
            </FormField>
            <FormField label={t('integrations.weather.fieldWindUnit')}>
              <Select
                options={[
                  { value: 'ms', label: t('integrations.weather.windUnitMs') },
                  { value: 'kmh', label: t('integrations.weather.windUnitKmh') },
                ]}
                value={configForm.windSpeedUnit}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    windSpeedUnit: e.target.value as 'ms' | 'kmh',
                  }))
                }
              />
            </FormField>
          </div>

          {/* Configured sites list */}
          <div className="pt-2">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('integrations.weather.linkedSites')} ({allSites.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allSites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-neutral-400" />
                    <span className="text-neutral-700 dark:text-neutral-300">{site.name}</span>
                  </div>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WeatherPage;
