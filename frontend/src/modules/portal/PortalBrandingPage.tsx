import React, { useRef, useState } from 'react';
import {
  Palette,
  Eye,
  Upload,
  RotateCcw,
  Building2,
  CheckCircle2,
  Paintbrush,
  Type,
  Image,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField } from '@/design-system/components/FormField';
import { usePortalBrandingStore } from '@/stores/portalBrandingStore';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#64748b', // slate
  '#171717', // black
];

const PortalBrandingPage: React.FC = () => {
  const { logoUrl, primaryColor, accentColor, companyName, setBranding, resetBranding } =
    usePortalBrandingStore();

  const [localLogo, setLocalLogo] = useState<string | null>(logoUrl);
  const [localPrimary, setLocalPrimary] = useState(primaryColor);
  const [localAccent, setLocalAccent] = useState(accentColor);
  const [localName, setLocalName] = useState(companyName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('portal.branding.logoTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setLocalLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLocalLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    setBranding({
      logoUrl: localLogo,
      primaryColor: localPrimary,
      accentColor: localAccent,
      companyName: localName,
    });
    toast.success(t('portal.branding.saveSuccess'));
  };

  const handleReset = () => {
    resetBranding();
    setLocalLogo(null);
    setLocalPrimary('#6366f1');
    setLocalAccent('#f59e0b');
    setLocalName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success(t('portal.branding.resetSuccess'));
  };

  const isDirty =
    localLogo !== logoUrl ||
    localPrimary !== primaryColor ||
    localAccent !== accentColor ||
    localName !== companyName;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.branding.title')}
        subtitle={t('portal.branding.subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.branding.breadcrumb') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw size={14} className="mr-1.5" />
              {t('portal.branding.reset')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty}>
              <CheckCircle2 size={14} className="mr-1.5" />
              {t('portal.branding.save')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Logo Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Image size={18} className="text-primary-500" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('portal.branding.logoSection')}
              </h2>
            </div>

            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors',
                  localLogo
                    ? 'border-neutral-200 dark:border-neutral-700'
                    : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500 bg-neutral-50 dark:bg-neutral-800',
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {localLogo ? (
                  <img src={localLogo} alt="Logo" loading="lazy" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 size={28} className="text-neutral-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button variant="secondary" size="xs" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} className="mr-1" />
                    {t('portal.branding.uploadLogo')}
                  </Button>
                  {localLogo && (
                    <Button variant="ghost" size="xs" onClick={handleRemoveLogo}>
                      {t('portal.branding.removeLogo')}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('portal.branding.logoHint')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* Company Name */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Type size={18} className="text-primary-500" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('portal.branding.companySection')}
              </h2>
            </div>

            <FormField label={t('portal.branding.companyName')}>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder={t('portal.branding.companyNamePlaceholder')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              />
            </FormField>
          </div>

          {/* Colors Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Paintbrush size={18} className="text-primary-500" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('portal.branding.colorsSection')}
              </h2>
            </div>

            {/* Primary Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('portal.branding.primaryColor')}
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                {t('portal.branding.primaryColorHint')}
              </p>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={localPrimary}
                  onChange={(e) => setLocalPrimary(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={localPrimary}
                  onChange={(e) => setLocalPrimary(e.target.value)}
                  placeholder="#6366f1"
                  className="w-28 px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono transition-colors"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-inner"
                  style={{ backgroundColor: localPrimary }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={`primary-${color}`}
                    type="button"
                    onClick={() => setLocalPrimary(color)}
                    className={cn(
                      'w-7 h-7 rounded-lg border-2 transition-all hover:scale-110',
                      localPrimary === color
                        ? 'border-neutral-900 dark:border-white ring-2 ring-offset-1 ring-neutral-400 dark:ring-neutral-500'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('portal.branding.accentColor')}
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                {t('portal.branding.accentColorHint')}
              </p>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={localAccent}
                  onChange={(e) => setLocalAccent(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={localAccent}
                  onChange={(e) => setLocalAccent(e.target.value)}
                  placeholder="#f59e0b"
                  className="w-28 px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono transition-colors"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-inner"
                  style={{ backgroundColor: localAccent }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={`accent-${color}`}
                    type="button"
                    onClick={() => setLocalAccent(color)}
                    className={cn(
                      'w-7 h-7 rounded-lg border-2 transition-all hover:scale-110',
                      localAccent === color
                        ? 'border-neutral-900 dark:border-white ring-2 ring-offset-1 ring-neutral-400 dark:ring-neutral-500'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-5">
              <Eye size={18} className="text-primary-500" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('portal.branding.previewTitle')}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              {t('portal.branding.previewDescription')}
            </p>

            {/* Portal Preview */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
              {/* Branded Header */}
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: localPrimary }}
              >
                {localLogo ? (
                  <img
                    src={localLogo}
                    alt="Logo"
                    loading="lazy"
                    className="w-9 h-9 rounded-lg object-contain bg-white/20 p-0.5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <Building2 size={18} className="text-white" />
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {localName || t('portal.branding.companyNamePlaceholder')}
                  </span>
                  <span className="text-xs text-white/70">
                    {t('portal.branding.previewPortalLabel')}
                  </span>
                </div>
              </div>

              {/* Preview Navigation */}
              <div
                className="px-4 py-2 flex items-center gap-4 text-xs"
                style={{ backgroundColor: localAccent }}
              >
                <span className="text-white/90 font-medium">{t('portal.branding.previewNavProjects')}</span>
                <span className="text-white/70">{t('portal.branding.previewNavDocuments')}</span>
                <span className="text-white/70">{t('portal.branding.previewNavMessages')}</span>
              </div>

              {/* Preview Body */}
              <div className="p-5 bg-neutral-50 dark:bg-neutral-800 space-y-4">
                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('portal.branding.previewMetricProjects'), value: '12' },
                    { label: t('portal.branding.previewMetricDocs'), value: '48' },
                    { label: t('portal.branding.previewMetricTasks'), value: '5' },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-lg p-3 text-center"
                      style={{ backgroundColor: `${localPrimary}10` }}
                    >
                      <p className="text-lg font-bold" style={{ color: localPrimary }}>
                        {m.value}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <button
                  type="button"
                  className="w-full py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: localAccent }}
                >
                  {t('portal.branding.previewAction')}
                </button>

                {/* Mock list items */}
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: i === 1 ? localAccent : localPrimary }}
                      />
                      <div className="flex-1">
                        <div className="h-2.5 rounded bg-neutral-200 dark:bg-neutral-700 w-3/4" />
                        <div className="h-2 rounded bg-neutral-100 dark:bg-neutral-800 w-1/2 mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 text-center">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {t('portal.branding.previewPoweredBy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Color swatches summary */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border border-neutral-200 dark:border-neutral-700"
                  style={{ backgroundColor: localPrimary }}
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {t('portal.branding.primaryColor')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border border-neutral-200 dark:border-neutral-700"
                  style={{ backgroundColor: localAccent }}
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {t('portal.branding.accentColor')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalBrandingPage;
