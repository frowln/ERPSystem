import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Calendar, Users } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { bidManagementApi, type BidPackage } from '@/api/bidManagement';
import { bidPackageStatusColorMap, bidPackageStatusLabels } from '@/design-system/components/StatusBadge/statusConfig';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

type StatusFilter = 'ALL' | BidPackage['status'];

const STATUS_TABS: StatusFilter[] = ['ALL', 'DRAFT', 'OPEN', 'EVALUATION', 'AWARDED', 'CLOSED'];

const BidPackageListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? undefined;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', projectId: projectId ?? '', bidDueDate: '', scopeOfWork: '' });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['bid-packages', projectId],
    queryFn: () => bidManagementApi.getPackages(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<BidPackage>) => bidManagementApi.createPackage(data),
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      setModalOpen(false);
      toast.success(t('common.created'));
      navigate(`/bid-packages/${pkg.id}`);
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bidManagementApi.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      toast.success(t('common.deleted'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const filtered = statusFilter === 'ALL' ? packages : packages.filter(p => p.status === statusFilter);

  const handleCreate = () => {
    if (!form.name.trim() || !form.projectId.trim()) return;
    createMutation.mutate({
      name: form.name,
      description: form.description,
      projectId: form.projectId,
      bidDueDate: form.bidDueDate || undefined,
      scopeOfWork: form.scopeOfWork || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('bidManagement.title')}
        actions={
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('bidManagement.createPackage')}
          </Button>
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              statusFilter === tab
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            {tab === 'ALL' ? t('common.all') : (bidPackageStatusLabels[tab] || tab)}
          </button>
        ))}
      </div>

      {/* Packages list */}
      {isLoading ? (
        <div className="text-center py-12 text-neutral-500">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {t('bidManagement.noPackages')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => navigate(`/bid-packages/${pkg.id}`)}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                  {pkg.name}
                </h3>
                <StatusBadge
                  status={pkg.status}
                  colorMap={bidPackageStatusColorMap}
                  label={bidPackageStatusLabels[pkg.status] || pkg.status}
                />
              </div>
              {pkg.description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">
                  {pkg.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                {pkg.bidDueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(pkg.bidDueDate).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {pkg.invitationCount} {t('bidManagement.invitations').toLowerCase()}
                </span>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (confirm(t('bidManagement.deleteConfirm'))) {
                      deleteMutation.mutate(pkg.id);
                    }
                  }}
                  className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('bidManagement.createPackage')}>
        <div className="space-y-4">
          <FormField label={t('bidManagement.packageName')} required>
            <Input
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('bidManagement.packageName')}
            />
          </FormField>
          {!projectId && (
            <FormField label="Project ID" required>
              <Input
                value={form.projectId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, projectId: e.target.value }))}
                placeholder="UUID"
              />
            </FormField>
          )}
          <FormField label={t('bidManagement.description')}>
            <Textarea
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormField>
          <FormField label={t('bidManagement.bidDueDate')}>
            <Input
              type="datetime-local"
              value={form.bidDueDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, bidDueDate: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.scopeOfWork')}>
            <Textarea
              value={form.scopeOfWork}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, scopeOfWork: e.target.value }))}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.saving') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BidPackageListPage;
