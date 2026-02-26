import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Camera, MapPin, Cloud, Thermometer, Users } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { mobileApi } from '@/api/mobile';
import { projectsApi } from '@/api/projects';
import { formatDateTime } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import {
  clearMobileReportDraft,
  enqueueMobileSubmission,
  loadMobileReportDraft,
  loadStoredMobilePhotoFiles,
  removeStoredMobilePhotoFiles,
  saveMobileReportDraft,
  storeMobilePhotoFiles,
  type StoredMobilePhotoRef,
} from './draftStore';
import type { CreateFieldReportRequest } from './types';
import toast from 'react-hot-toast';
import { t } from '@/i18n';


const getWeatherOptions = () => [
  { value: '', label: t('mobileModule.reportNew.selectWeather') },
  { value: 'Ясно', label: t('mobileModule.reportNew.weatherClear') },
  { value: 'Облачно', label: t('mobileModule.reportNew.weatherCloudy') },
  { value: 'Дождь', label: t('mobileModule.reportNew.weatherRain') },
  { value: 'Снег', label: t('mobileModule.reportNew.weatherSnow') },
  { value: 'Мороз', label: t('mobileModule.reportNew.weatherFrost') },
  { value: 'Ветер', label: t('mobileModule.reportNew.weatherWind') },
];

const parseOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const FieldReportCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: projectsData } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.getProjects() });
  const projectOptions = [
    { value: '', label: t('mobileModule.reportNew.selectProject') },
    ...(projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [location, setLocation] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('');
  const [temperature, setTemperature] = useState('');
  const [workersOnSite, setWorkersOnSite] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoRefs, setPhotoRefs] = useState<StoredMobilePhotoRef[]>([]);
  const [remoteDraftId, setRemoteDraftId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoringPhotos, setIsRestoringPhotos] = useState(false);
  const [restoredDraftAt, setRestoredDraftAt] = useState<string | null>(null);
  const [restoredPhotoCount, setRestoredPhotoCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const restoreDraft = async () => {
      const draft = loadMobileReportDraft();
      if (!draft || !isMounted) return;

      setTitle(draft.title);
      setDescription(draft.description);
      setProjectId(draft.projectId);
      setLocation(draft.location);
      setWeatherCondition(draft.weatherCondition);
      setTemperature(draft.temperature);
      setWorkersOnSite(draft.workersOnSite);
      setReportDate(draft.reportDate);
      setRemoteDraftId(draft.remoteId);
      setRestoredDraftAt(draft.savedAt);
      setPhotoRefs(draft.photos);
      setRestoredPhotoCount(draft.photos.length);

      if (!draft.photos.length) return;

      setIsRestoringPhotos(true);
      try {
        const restoredPhotos = await loadStoredMobilePhotoFiles(draft.photos);
        if (!isMounted) return;
        setPhotos(restoredPhotos);
        if (restoredPhotos.length !== draft.photos.length) {
          toast.error(t('mobileModule.reportNew.toastPhotoRestorePartial'));
        }
      } catch {
        if (isMounted) {
          toast.error(t('mobileModule.reportNew.toastPhotoRestoreFailed'));
        }
      } finally {
        if (isMounted) {
          setIsRestoringPhotos(false);
        }
      }
    };

    void restoreDraft();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (!selectedFiles.length) return;

    try {
      const refs = await storeMobilePhotoFiles(selectedFiles);
      setPhotos((prev) => [...prev, ...selectedFiles]);
      setPhotoRefs((prev) => [...prev, ...refs]);
    } catch {
      toast.error(t('mobileModule.reportNew.toastPhotoSaveFailed'));
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const refToDelete = photoRefs[index];
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoRefs((prev) => prev.filter((_, i) => i !== index));

    if (!refToDelete) return;
    try {
      await removeStoredMobilePhotoFiles([refToDelete]);
    } catch {
      toast.error(t('mobileModule.reportNew.toastPhotoDeleteFailed'));
    }
  };

  const draftSnapshot = useMemo(() => ({
    title,
    description,
    projectId,
    location,
    weatherCondition,
    temperature,
    workersOnSite,
    reportDate,
    photos: photoRefs,
    remoteId: remoteDraftId,
    savedAt: new Date().toISOString(),
  }), [
    title,
    description,
    projectId,
    location,
    weatherCondition,
    temperature,
    workersOnSite,
    reportDate,
    photoRefs,
    remoteDraftId,
  ]);

  useEffect(() => {
    const hasAnyValue = Boolean(
      title.trim()
      || description.trim()
      || projectId
      || location.trim()
      || weatherCondition
      || temperature.trim()
      || workersOnSite.trim()
      || photoRefs.length,
    );

    if (!hasAnyValue) return;

    const timer = window.setTimeout(() => {
      saveMobileReportDraft(draftSnapshot);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    title,
    description,
    projectId,
    location,
    weatherCondition,
    temperature,
    workersOnSite,
    reportDate,
    photoRefs.length,
    draftSnapshot,
  ]);

  const buildPayload = (): CreateFieldReportRequest => ({
    title: title.trim(),
    description: description.trim(),
    projectId,
    location: location.trim() || undefined,
    weatherCondition: weatherCondition || undefined,
    temperature: parseOptionalNumber(temperature),
    workersOnSite: parseOptionalNumber(workersOnSite),
    reportDate,
  });

  const handleSaveDraft = async () => {
    if (!isValid || isSubmitting) return;
    if (guardDemoModeAction(t('mobileModule.reportNew.demoSaveDraft'))) return;

    setIsSubmitting(true);
    const payload = buildPayload();

    try {
      let nextRemoteDraftId = remoteDraftId;

      if (navigator.onLine) {
        if (nextRemoteDraftId) {
          await mobileApi.updateFieldReport(nextRemoteDraftId, payload);
        } else {
          const created = await mobileApi.createFieldReport(payload);
          nextRemoteDraftId = created.id;
          setRemoteDraftId(created.id);
        }
      }

      saveMobileReportDraft({
        ...draftSnapshot,
        remoteId: nextRemoteDraftId,
        savedAt: new Date().toISOString(),
      });
      toast.success(navigator.onLine ? t('mobileModule.reportNew.toastDraftSaved') : t('mobileModule.reportNew.toastDraftSavedLocally'));
      navigate('/mobile/reports');
    } catch {
      saveMobileReportDraft({ ...draftSnapshot, savedAt: new Date().toISOString() });
      toast.error(t('mobileModule.reportNew.toastServerUnavailable'));
      navigate('/mobile/reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!isValid || isSubmitting) return;
    if (guardDemoModeAction(t('mobileModule.reportNew.demoSubmitReport'))) return;

    setIsSubmitting(true);
    const payload = buildPayload();
    let reportId = remoteDraftId;

    const enqueueSubmission = () => {
      enqueueMobileSubmission({ payload, remoteId: reportId, photos: photoRefs });
      clearMobileReportDraft();
    };

    try {
      if (!navigator.onLine) {
        enqueueSubmission();
        toast.success(t('mobileModule.reportNew.toastQueuedForSync'));
        navigate('/mobile/reports');
        return;
      }

      if (reportId) {
        await mobileApi.updateFieldReport(reportId, payload);
      } else {
        const created = await mobileApi.createFieldReport(payload);
        reportId = created.id;
      }

      const photoFiles = await loadStoredMobilePhotoFiles(photoRefs);
      for (const file of photoFiles) {
        await mobileApi.uploadPhoto(reportId, file);
      }

      await mobileApi.submitFieldReport(reportId);
      clearMobileReportDraft();
      try {
        await removeStoredMobilePhotoFiles(photoRefs);
      } catch {
        toast.error(t('mobileModule.reportNew.toastSubmittedPhotoCleanupFailed'));
      }
      toast.success(t('mobileModule.reportNew.toastReportSubmitted'));
      navigate('/mobile/reports');
    } catch {
      enqueueSubmission();
      toast.error(t('mobileModule.reportNew.toastSubmitFailedQueued'));
      navigate('/mobile/reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = Boolean(title.trim() && description.trim() && projectId && reportDate);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('mobileModule.reportNew.pageTitle')}
        subtitle={t('mobileModule.reportNew.pageSubtitle')}
        breadcrumbs={[
          { label: t('mobileModule.reportNew.breadcrumbHome'), href: '/' },
          { label: t('mobileModule.reportNew.breadcrumbMobile') },
          { label: t('mobileModule.reportNew.breadcrumbReports'), href: '/mobile/reports' },
          { label: t('mobileModule.reportNew.breadcrumbNew') },
        ]}
        actions={
          <Button
            variant="secondary"
            iconLeft={<ArrowLeft size={16} />}
            onClick={() => navigate('/mobile/reports')}
            disabled={isSubmitting}
          >
            {t('mobileModule.reportNew.backToList')}
          </Button>
        }
      />

      {restoredDraftAt && (
        <div className="max-w-3xl mb-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          {t('mobileModule.reportNew.draftRestoredAt', { date: formatDateTime(restoredDraftAt) })}
          {restoredPhotoCount > 0 && ` ${t('mobileModule.reportNew.draftRestoredPhotos', { count: String(restoredPhotoCount) })}`}
        </div>
      )}

      <div className="max-w-3xl">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
          {/* Basic info */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('mobileModule.reportNew.sectionBasicInfo')}</h3>
            <div className="space-y-4">
              <FormField label={t('mobileModule.reportNew.labelTitle')} required>
                <Input
                  placeholder={t('mobileModule.reportNew.placeholderTitle')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>

              <FormField label={t('mobileModule.reportNew.labelDescription')} required>
                <Textarea
                  placeholder={t('mobileModule.reportNew.placeholderDescription')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t('mobileModule.reportNew.labelProject')} required>
                  <Select
                    options={projectOptions}
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  />
                </FormField>

                <FormField label={t('mobileModule.reportNew.labelReportDate')} required>
                  <Input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Location & conditions */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-neutral-400" />
              {t('mobileModule.reportNew.sectionSiteConditions')}
            </h3>
            <div className="space-y-4">
              <FormField label={t('mobileModule.reportNew.labelLocation')}>
                <Input
                  placeholder={t('mobileModule.reportNew.placeholderLocation')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label={t('mobileModule.reportNew.labelWeather')}>
                  <div className="flex items-center gap-2">
                    <Cloud size={16} className="text-neutral-400 flex-shrink-0" />
                    <Select
                      options={getWeatherOptions()}
                      value={weatherCondition}
                      onChange={(e) => setWeatherCondition(e.target.value)}
                    />
                  </div>
                </FormField>

                <FormField label={t('mobileModule.reportNew.labelTemperature')}>
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-neutral-400 flex-shrink-0" />
                    <Input
                      type="number"
                      placeholder="-5"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                    />
                  </div>
                </FormField>

                <FormField label={t('mobileModule.reportNew.labelWorkersOnSite')}>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-neutral-400 flex-shrink-0" />
                    <Input
                      type="number"
                      placeholder="25"
                      value={workersOnSite}
                      onChange={(e) => setWorkersOnSite(e.target.value)}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-neutral-400" />
              {t('mobileModule.reportNew.sectionPhotoDocumentation')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden group">
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Camera size={24} />
                  </div>
                  <p className="absolute bottom-0 left-0 right-0 bg-neutral-900/60 text-white text-[10px] px-2 py-1 truncate">
                    {photo.name}
                  </p>
                  <button
                    onClick={() => void handleRemovePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-danger-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    x
                  </button>
                </div>
              ))}

              <label className="aspect-square border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <Camera size={20} className="text-neutral-400 mb-1" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportNew.addPhoto')}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handlePhotoUpload(e)}
                />
              </label>
            </div>
            {isRestoringPhotos && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportNew.restoringPhotos')}</p>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate('/mobile/reports')} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={!isValid || isSubmitting}>
              {t('mobileModule.reportNew.saveDraft')}
            </Button>
            <Button onClick={handleSubmitReport} disabled={!isValid} loading={isSubmitting}>
              {t('mobileModule.reportNew.submitReport')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldReportCreatePage;
