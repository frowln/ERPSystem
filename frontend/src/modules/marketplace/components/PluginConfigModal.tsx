import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { marketplaceApi, type MarketplacePlugin, type PluginConfig } from '@/api/marketplace';

// ---------------------------------------------------------------------------
// Types for dynamic config schema
// ---------------------------------------------------------------------------

interface ConfigFieldSchema {
  type: 'text' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface ConfigSchema {
  fields: Record<string, ConfigFieldSchema>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PluginConfigModalProps {
  open: boolean;
  onClose: () => void;
  plugin: MarketplacePlugin;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PluginConfigModal: React.FC<PluginConfigModalProps> = ({ open, onClose, plugin }) => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [enabled, setEnabled] = useState(true);

  const { data: config, isLoading } = useQuery({
    queryKey: ['plugin-config', plugin.id],
    queryFn: () => marketplaceApi.getPluginConfig(plugin.id),
    enabled: open,
  });

  useEffect(() => {
    if (config) {
      setSettings(config.settings);
      setEnabled(config.enabled);
    }
  }, [config]);

  const schema = plugin.configSchema as ConfigSchema | undefined;

  const updateMutation = useMutation({
    mutationFn: (data: PluginConfig) => marketplaceApi.updatePluginConfig(plugin.id, data),
    onSuccess: () => {
      toast.success(t('marketplace.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['plugin-config', plugin.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      onClose();
    },
    onError: () => {
      toast.error(t('marketplace.configError'));
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      pluginId: plugin.id,
      settings,
      enabled,
    });
  }, [updateMutation, plugin.id, settings, enabled]);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('marketplace.pluginConfiguration')}
      description={plugin.name}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            {t('marketplace.saveConfig')}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enabled toggle */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t('marketplace.pluginEnabled')}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {enabled ? t('marketplace.enabled') : t('marketplace.disabled')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                  enabled ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          {/* Dynamic config fields */}
          {schema?.fields && Object.entries(schema.fields).map(([key, field]) => {
            const value = settings[key] ?? field.default ?? '';

            if (field.type === 'boolean') {
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {field.label}
                    </p>
                    {field.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {field.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!value}
                    onClick={() => handleFieldChange(key, !value)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                      value ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                        value ? 'translate-x-6' : 'translate-x-1',
                      )}
                    />
                  </button>
                </div>
              );
            }

            if (field.type === 'select' && field.options) {
              return (
                <FormField key={key} label={field.label} hint={field.description} required={field.required}>
                  <Select
                    options={field.options}
                    value={String(value)}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                  />
                </FormField>
              );
            }

            if (field.type === 'number') {
              return (
                <FormField key={key} label={field.label} hint={field.description} required={field.required}>
                  <Input
                    type="number"
                    value={String(value)}
                    onChange={(e) => handleFieldChange(key, Number(e.target.value))}
                  />
                </FormField>
              );
            }

            // Default: text input
            return (
              <FormField key={key} label={field.label} hint={field.description} required={field.required}>
                <Input
                  type="text"
                  value={String(value)}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                />
              </FormField>
            );
          })}

          {/* If no config schema, show a message */}
          {(!schema?.fields || Object.keys(schema.fields).length === 0) && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
              {t('marketplace.pluginEnabled')}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PluginConfigModal;
