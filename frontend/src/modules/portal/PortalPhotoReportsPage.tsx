import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  CalendarDays,
  FolderKanban,
  Tag,
  Search,
  Plus,
  Upload,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import type { PortalPhotoReport, PhotoCategory } from './types';

const tp = (k: string) => t(`portal.photos.${k}`);

const CATEGORIES: PhotoCategory[] = ['PROGRESS', 'DEFECT', 'MATERIAL', 'SAFETY', 'GENERAL'];

const categoryColorMap: Record<PhotoCategory, string> = {
  PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  QUALITY: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  DEFECT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  MATERIAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  SAFETY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
};

const getCategoryLabel = (cat: PhotoCategory): string => {
  const map: Record<PhotoCategory, string> = {
    PROGRESS: 'catProgress',
    QUALITY: 'catQuality',
    DEFECT: 'catDefect',
    MATERIAL: 'catMaterial',
    SAFETY: 'catSafety',
    GENERAL: 'catGeneral',
  };
  return tp(map[cat]);
};

const PortalPhotoReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<PhotoCategory | ''>('');

  const { data: photoData, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal-photos', projectFilter],
    queryFn: () => portalApi.getPhotos({ projectId: projectFilter || undefined, size: 200 }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const photos = photoData?.content ?? [];

  const filteredPhotos = useMemo(() => {
    let filtered = photos;
    if (categoryFilter) filtered = filtered.filter((p) => p.category === categoryFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title ?? '').toLowerCase().includes(lower) ||
          (p.projectName ?? '').toLowerCase().includes(lower) ||
          (p.uploadedByName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [photos, categoryFilter, search]);

  const metrics = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return {
      total: photos.length,
      thisWeek: photos.filter((p) => new Date(p.createdAt) >= weekAgo).length,
      projectCount: new Set(photos.map((p) => p.projectId)).size,
      categoryCount: new Set(photos.map((p) => p.category)).size,
    };
  }, [photos]);

  const projectOptions = useMemo(
    () => [
      { value: '', label: tp('allProjects') },
      ...(projects?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: '', label: tp('allCategories') },
      ...CATEGORIES.map((c) => ({ value: c, label: getCategoryLabel(c) })),
    ],
    [],
  );

  const categoryFormOptions = useMemo(
    () => [
      { value: '', label: tp('selectCategory') },
      ...CATEGORIES.map((c) => ({ value: c, label: getCategoryLabel(c) })),
    ],
    [],
  );

  const projectFormOptions = useMemo(
    () => [
      { value: '', label: tp('selectProject') },
      ...(projects?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  const uploadMutation = useMutation({
    mutationFn: (data: { projectId: string; title: string; description?: string; category: PhotoCategory }) =>
      portalApi.uploadPhoto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-photos'] });
      toast.success(tp('uploadSuccess'));
      setShowUpload(false);
      resetForm();
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalApi.deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-photos'] });
      toast.success(tp('deleteSuccess'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const resetForm = useCallback(() => {
    setFormProjectId('');
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
  }, []);

  const handleUpload = useCallback(() => {
    if (!formProjectId || !formTitle || !formCategory) return;
    uploadMutation.mutate({
      projectId: formProjectId,
      title: formTitle,
      description: formDescription || undefined,
      category: formCategory as PhotoCategory,
    });
  }, [formProjectId, formTitle, formDescription, formCategory]);

  const isOwnPhoto = useCallback(
    (photo: PortalPhotoReport) => currentUser?.id === photo.uploadedById,
    [currentUser],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={t('portal.photos.subtitle', { count: String(photos.length) })}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: tp('breadcrumb') },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus size={14} className="mr-1" /> {tp('uploadBtn')}
          </Button>
        }
      />

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-8 text-center mb-6">
          <AlertTriangle size={32} className="mx-auto text-danger-500 mb-2" />
          <p className="text-danger-700 dark:text-danger-300 font-medium">{t('common.loadError')}</p>
          <button onClick={() => void refetch()} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
            <RefreshCw size={14} /> {t('common.retry')}
          </button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 animate-pulse">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          ))
        ) : (
          <>
            <MetricCard icon={<Camera size={18} />} label={tp('metricTotal')} value={metrics.total} />
            <MetricCard icon={<CalendarDays size={18} />} label={tp('metricThisWeek')} value={metrics.thisWeek} />
            <MetricCard icon={<FolderKanban size={18} />} label={tp('metricProjects')} value={metrics.projectCount} />
            <MetricCard icon={<Tag size={18} />} label={tp('metricCategories')} value={metrics.categoryCount} />
          </>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select options={projectOptions} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-52" />
        <Select options={categoryFilterOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48" />
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={tp('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-1 ml-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            title={tp('viewGrid')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            title={tp('viewList')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-neutral-400">{t('common.loading')}</div>
      ) : filteredPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
          <Camera size={40} className="mb-2" />
          <p className="text-sm font-medium">{tp('emptyTitle')}</p>
          <p className="text-xs mt-1">{tp('emptyDescription')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {photo.thumbnailUrl || photo.photoUrl ? (
                  <img
                    src={photo.thumbnailUrl || photo.photoUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`flex flex-col items-center justify-center text-neutral-400 ${photo.thumbnailUrl || photo.photoUrl ? 'hidden' : ''}`}>
                  <Camera size={32} />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="bg-white/90 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-white dark:hover:bg-neutral-700 transition-colors">
                    <Eye size={14} /> {tp('viewBtn')}
                  </button>
                  {isOwnPhoto(photo) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(photo.id); }}
                      className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{photo.title}</h3>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${categoryColorMap[photo.category]}`}>
                    {getCategoryLabel(photo.category)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{photo.projectName}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                  <span>{photo.uploadedByName}</span>
                  <span className="tabular-nums">{formatDate(photo.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 w-16">{tp('colThumb')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{tp('colTitle')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 w-32">{tp('colCategory')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 w-44">{tp('colProject')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 w-36">{tp('colUploadedBy')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 w-28">{tp('colDate')}</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPhotos.map((photo) => (
                <tr key={photo.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {photo.thumbnailUrl || photo.photoUrl ? (
                        <img
                          src={photo.thumbnailUrl || photo.photoUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Camera size={16} className="text-neutral-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-neutral-900 dark:text-neutral-100">{photo.title}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColorMap[photo.category]}`}>
                      {getCategoryLabel(photo.category)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400 truncate max-w-[180px]">{photo.projectName}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{photo.uploadedByName}</td>
                  <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400 tabular-nums">{formatDate(photo.createdAt)}</td>
                  <td className="px-4 py-2">
                    {isOwnPhoto(photo) && (
                      <button
                        onClick={() => deleteMutation.mutate(photo.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Photo Modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); resetForm(); }} title={tp('uploadModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldProject')} required>
            <Select
              options={projectFormOptions}
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
            />
          </FormField>
          <FormField label={tp('fieldTitle')} required>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={tp('titlePlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldDescription')}>
            <Textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={tp('descriptionPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldCategory')} required>
            <Select
              options={categoryFormOptions}
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as PhotoCategory | '')}
            />
          </FormField>

          {/* File drop zone */}
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
            <Upload size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{tp('dropzoneText')}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{tp('dropzoneHint')}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowUpload(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button
              onClick={handleUpload}
              disabled={!formProjectId || !formTitle || !formCategory}
              loading={uploadMutation.isPending}
            >
              {tp('uploadSubmit')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalPhotoReportsPage;
