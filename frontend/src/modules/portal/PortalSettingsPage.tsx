import React, { useRef, useState } from 'react';
import {
  Settings,
  Palette,
  Eye,
  Bell,
  Upload,
  RotateCcw,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { usePortalSettingsStore } from '@/stores/portalSettingsStore';
import type { PortalVisibility } from '@/stores/portalSettingsStore';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const VISIBILITY_KEYS: { key: keyof PortalVisibility; icon: string }[] = [
  { key: 'progress', icon: '📊' },
  { key: 'schedule', icon: '📅' },
  { key: 'budget', icon: '💰' },
  { key: 'documents', icon: '📄' },
  { key: 'photos', icon: '📷' },
  { key: 'ks2Acts', icon: '📋' },
  { key: 'defects', icon: '🔧' },
  { key: 'teamContacts', icon: '👥' },
  { key: 'chat', icon: '💬' },
];

const PortalSettingsPage: React.FC = () => {
  const { branding, visibility, notifications, setBranding, setVisibility, setNotifications, resetSettings } =
    usePortalSettingsStore();

  const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      setBranding({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    resetSettings();
    setLogoPreview('');
    toast.success(t('portalSettings.resetSuccess'));
  };

  const handleSave = () => {
    toast.success(t('portalSettings.saveSuccess'));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portalSettings.title')}
        subtitle={t('portalSettings.subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: t('portalSettings.breadcrumb') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw size={14} className="mr-1.5" />
              {t('portalSettings.reset')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              <CheckCircle2 size={14} className="mr-1.5" />
              {t('portalSettings.save')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette size={18} className="text-primary-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('portalSettings.brandingTitle')}
            </h2>
          </div>

          {/* Logo Upload */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t('portalSettings.branding.logo')}
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-800 cursor-pointer hover:border-primary-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" loading="lazy" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={24} className="text-neutral-400" />
                )}
              </div>
              <div className="flex-1">
                <Button variant="secondary" size="xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1" />
                  {t('portalSettings.branding.uploadLogo')}
                </Button>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('portalSettings.branding.logoHint')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* Company Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('portalSettings.branding.companyName')}
            </label>
            <input
              type="text"
              value={branding.companyName}
              onChange={(e) => setBranding({ companyName: e.target.value })}
              placeholder={t('portalSettings.branding.companyNamePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Primary Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('portalSettings.branding.primaryColor')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ primaryColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ primaryColor: e.target.value })}
                placeholder="#6366f1"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
              />
              <div
                className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700"
                style={{ backgroundColor: branding.primaryColor }}
              />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('portalSettings.branding.welcomeMessage')}
            </label>
            <textarea
              value={branding.welcomeMessage}
              onChange={(e) => setBranding({ welcomeMessage: e.target.value })}
              placeholder={t('portalSettings.branding.welcomeMessagePlaceholder')}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Contact Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <Phone size={14} className="inline mr-1" />
              {t('portalSettings.branding.contactPhone')}
            </label>
            <input
              type="tel"
              value={branding.contactPhone}
              onChange={(e) => setBranding({ contactPhone: e.target.value })}
              placeholder={t('portalSettings.branding.contactPhonePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <Mail size={14} className="inline mr-1" />
              {t('portalSettings.branding.contactEmail')}
            </label>
            <input
              type="email"
              value={branding.contactEmail}
              onChange={(e) => setBranding({ contactEmail: e.target.value })}
              placeholder={t('portalSettings.branding.contactEmailPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Eye size={18} className="text-primary-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('portalSettings.previewTitle')}
            </h2>
          </div>

          {/* Portal Preview Mock */}
          <div
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
            style={{ '--portal-brand': branding.primaryColor } as React.CSSProperties}
          >
            {/* Branded Header */}
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" loading="lazy" className="w-8 h-8 rounded-md object-contain bg-white/20 p-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Building2 size={16} className="text-white" />
                </div>
              )}
              <span className="text-sm font-semibold text-white">
                {branding.companyName || t('portalSettings.branding.companyNamePlaceholder')}
              </span>
            </div>

            {/* Preview Body */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800">
              {branding.welcomeMessage && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 italic">
                  {branding.welcomeMessage}
                </p>
              )}

              <div className="space-y-2">
                {VISIBILITY_KEYS.filter((v) => visibility[v.key]).map((v) => (
                  <div
                    key={v.key}
                    className="h-6 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center px-2"
                  >
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t(`portalSettings.visibility.${v.key}` as any)}
                    </span>
                  </div>
                ))}
                {VISIBILITY_KEYS.filter((v) => visibility[v.key]).length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-4">{t('portalSettings.previewEmpty')}</p>
                )}
              </div>

              {(branding.contactPhone || branding.contactEmail) && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {branding.contactPhone && <span className="mr-3">{branding.contactPhone}</span>}
                    {branding.contactEmail && <span>{branding.contactEmail}</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Eye size={18} className="text-primary-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('portalSettings.visibilityTitle')}
            </h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {t('portalSettings.visibilityDescription')}
          </p>

          <div className="space-y-1">
            {VISIBILITY_KEYS.map(({ key }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {t(`portalSettings.visibility.${key}` as any)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {t(`portalSettings.visibility.${key}Desc` as any)}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={visibility[key]}
                    onClick={() => setVisibility({ [key]: !visibility[key] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
                      visibility[key] ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        visibility[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell size={18} className="text-primary-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('portalSettings.notificationsTitle')}
            </h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {t('portalSettings.notificationsDescription')}
          </p>

          <div className="space-y-1">
            {(
              [
                { key: 'milestones' as const },
                { key: 'weeklySummary' as const },
                { key: 'documentUploads' as const },
              ] as const
            ).map(({ key }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {t(`portalSettings.notifications.${key}` as any)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {t(`portalSettings.notifications.${key}Desc` as any)}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[key]}
                    onClick={() => setNotifications({ [key]: !notifications[key] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
                      notifications[key] ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        notifications[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSettingsPage;
