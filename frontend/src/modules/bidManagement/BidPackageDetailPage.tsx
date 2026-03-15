import React, { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trash2, Edit2, Send, ClipboardCheck, Award, Lock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import {
  bidPackageStatusColorMap, bidPackageStatusLabels,
  bidInvitationStatusColorMap, bidInvitationStatusLabels,
} from '@/design-system/components/StatusBadge/statusConfig';
import { bidManagementApi, type BidPackage, type BidInvitation } from '@/api/bidManagement';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';

const BidLevelingMatrix = lazy(() => import('./BidLevelingMatrix'));
const BidRecommendationReport = lazy(() => import('./BidRecommendationReport'));

type Tab = 'scope' | 'invitations' | 'leveling' | 'recommendation';

const STATUS_ACTIONS: Record<string, { nextStatus: string; labelKey: string; icon: React.ElementType }> = {
  DRAFT: { nextStatus: 'OPEN', labelKey: 'bidManagement.openForBids', icon: Send },
  OPEN: { nextStatus: 'EVALUATION', labelKey: 'bidManagement.moveToEvaluation', icon: ClipboardCheck },
  EVALUATION: { nextStatus: 'AWARDED', labelKey: 'bidManagement.awardBid', icon: Award },
  AWARDED: { nextStatus: 'CLOSED', labelKey: 'bidManagement.closeBid', icon: Lock },
};

const BidPackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('scope');
  const [editScopeOpen, setEditScopeOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [editInvId, setEditInvId] = useState<string | null>(null);
  const [scopeForm, setScopeForm] = useState({ scopeOfWork: '', specSections: '', bidDueDate: '' });
  const [vendorForm, setVendorForm] = useState({ vendorName: '', vendorEmail: '', bidAmount: '', bidNotes: '' });

  const { data: pkg, isLoading } = useQuery<BidPackage>({
    queryKey: ['bid-package', id],
    queryFn: () => bidManagementApi.getPackage(id!),
    enabled: !!id,
  });

  const { data: invitations = [] } = useQuery<BidInvitation[]>({
    queryKey: ['bid-invitations', id],
    queryFn: () => bidManagementApi.getInvitations(id!),
    enabled: !!id,
  });

  const updatePkgMutation = useMutation({
    mutationFn: (payload: Partial<BidPackage>) => bidManagementApi.updatePackage(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-package', id] });
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const createInvMutation = useMutation({
    mutationFn: (payload: Partial<BidInvitation>) => bidManagementApi.createInvitation(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-invitations', id] });
      queryClient.invalidateQueries({ queryKey: ['bid-package', id] });
      setAddVendorOpen(false);
      setVendorForm({ vendorName: '', vendorEmail: '', bidAmount: '', bidNotes: '' });
      toast.success(t('common.created'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateInvMutation = useMutation({
    mutationFn: ({ invId, payload }: { invId: string; payload: Partial<BidInvitation> }) =>
      bidManagementApi.updateInvitation(id!, invId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-invitations', id] });
      setEditInvId(null);
      setVendorForm({ vendorName: '', vendorEmail: '', bidAmount: '', bidNotes: '' });
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteInvMutation = useMutation({
    mutationFn: (invId: string) => bidManagementApi.deleteInvitation(id!, invId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-invitations', id] });
      queryClient.invalidateQueries({ queryKey: ['bid-package', id] });
      toast.success(t('common.deleted'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (isLoading || !pkg) {
    return <div className="text-center py-12 text-neutral-500">{t('common.loading')}</div>;
  }

  const statusAction = STATUS_ACTIONS[pkg.status];
  const ActionIcon = statusAction?.icon;

  const handleStatusChange = () => {
    if (!statusAction) return;
    updatePkgMutation.mutate({ status: statusAction.nextStatus as BidPackage['status'] });
  };

  const handleScopeSave = () => {
    updatePkgMutation.mutate({
      scopeOfWork: scopeForm.scopeOfWork,
      specSections: scopeForm.specSections,
      bidDueDate: scopeForm.bidDueDate || undefined,
    });
    setEditScopeOpen(false);
  };

  const handleAddVendor = () => {
    if (!vendorForm.vendorName.trim()) return;
    createInvMutation.mutate({
      vendorName: vendorForm.vendorName,
      vendorEmail: vendorForm.vendorEmail || undefined,
      bidAmount: vendorForm.bidAmount ? Number(vendorForm.bidAmount) : undefined,
      bidNotes: vendorForm.bidNotes || undefined,
    });
  };

  const handleEditVendor = () => {
    if (!editInvId || !vendorForm.vendorName.trim()) return;
    updateInvMutation.mutate({
      invId: editInvId,
      payload: {
        vendorName: vendorForm.vendorName,
        vendorEmail: vendorForm.vendorEmail || undefined,
        bidAmount: vendorForm.bidAmount ? Number(vendorForm.bidAmount) : undefined,
        bidNotes: vendorForm.bidNotes || undefined,
      },
    });
  };

  const openEditInv = (inv: BidInvitation) => {
    setEditInvId(inv.id);
    setVendorForm({
      vendorName: inv.vendorName,
      vendorEmail: inv.vendorEmail ?? '',
      bidAmount: inv.bidAmount != null ? String(inv.bidAmount) : '',
      bidNotes: inv.bidNotes ?? '',
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'scope', label: t('bidManagement.scopeOfWork') },
    { key: 'invitations', label: t('bidManagement.invitations') },
    { key: 'leveling', label: t('bidManagement.leveling') },
    { key: 'recommendation', label: t('bidManagement.recommendation') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pkg.name}
        breadcrumbs={[
          { label: t('bidManagement.packages'), href: '/bid-packages' },
          { label: pkg.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bid-packages')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('common.back')}
            </Button>
            <StatusBadge
              status={pkg.status}
              colorMap={bidPackageStatusColorMap}
              label={bidPackageStatusLabels[pkg.status] || pkg.status}
            />
            {statusAction && (
              <Button size="sm" onClick={handleStatusChange} disabled={updatePkgMutation.isPending}>
                {ActionIcon && <ActionIcon className="w-4 h-4 mr-1" />}
                {t(statusAction.labelKey)}
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-1 pb-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'scope' && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('bidManagement.scopeOfWork')}
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setScopeForm({
                  scopeOfWork: pkg.scopeOfWork ?? '',
                  specSections: pkg.specSections ?? '',
                  bidDueDate: pkg.bidDueDate ?? '',
                });
                setEditScopeOpen(true);
              }}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              {t('common.edit')}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {t('bidManagement.bidDueDate')}
              </label>
              <p className="mt-1 text-neutral-900 dark:text-neutral-100">
                {formatDateTime(pkg.bidDueDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {t('bidManagement.status')}
              </label>
              <p className="mt-1">
                <StatusBadge
                  status={pkg.status}
                  colorMap={bidPackageStatusColorMap}
                  label={bidPackageStatusLabels[pkg.status] || pkg.status}
                />
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('bidManagement.scopeOfWork')}
            </label>
            <p className="mt-1 text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
              {pkg.scopeOfWork || '\u2014'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('bidManagement.specSections')}
            </label>
            <p className="mt-1 text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
              {pkg.specSections || '\u2014'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('bidManagement.invitations')} ({invitations.length})
            </h3>
            <Button size="sm" onClick={() => {
              setVendorForm({ vendorName: '', vendorEmail: '', bidAmount: '', bidNotes: '' });
              setAddVendorOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-1" />
              {t('bidManagement.addVendor')}
            </Button>
          </div>

          {invitations.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              {t('bidManagement.noInvitations')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 text-left">
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">{t('bidManagement.vendorName')}</th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">{t('bidManagement.vendorEmail')}</th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">{t('bidManagement.status')}</th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">{t('bidManagement.bidAmount')}</th>
                    <th className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300">{t('bidManagement.bidNotes')}</th>
                    <th className="px-3 py-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100 font-medium">{inv.vendorName}</td>
                      <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{inv.vendorEmail || '\u2014'}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={inv.status}
                          colorMap={bidInvitationStatusColorMap}
                          label={bidInvitationStatusLabels[inv.status] || inv.status}
                        />
                      </td>
                      <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                        {inv.bidAmount != null ? `${Number(inv.bidAmount).toLocaleString('ru-RU')} \u20BD` : '\u2014'}
                      </td>
                      <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate">
                        {inv.bidNotes || '\u2014'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditInv(inv)}
                            className="p-1 text-neutral-400 hover:text-primary-500 transition-colors"
                            aria-label={t('common.edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t('common.deleteConfirm'))) {
                                deleteInvMutation.mutate(inv.id);
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leveling' && (
        <Suspense fallback={<div className="text-center py-8 text-neutral-500">{t('common.loading')}</div>}>
          <BidLevelingMatrix packageId={id!} />
        </Suspense>
      )}

      {activeTab === 'recommendation' && (
        <Suspense fallback={<div className="text-center py-8 text-neutral-500">{t('common.loading')}</div>}>
          <BidRecommendationReport packageId={id!} />
        </Suspense>
      )}

      {/* Edit Scope Modal */}
      <Modal open={editScopeOpen} onClose={() => setEditScopeOpen(false)} title={t('bidManagement.editPackage')}>
        <div className="space-y-4">
          <FormField label={t('bidManagement.bidDueDate')}>
            <Input
              type="datetime-local"
              value={scopeForm.bidDueDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScopeForm(prev => ({ ...prev, bidDueDate: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.scopeOfWork')}>
            <Textarea
              value={scopeForm.scopeOfWork}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScopeForm(prev => ({ ...prev, scopeOfWork: e.target.value }))}
              rows={5}
            />
          </FormField>
          <FormField label={t('bidManagement.specSections')}>
            <Textarea
              value={scopeForm.specSections}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScopeForm(prev => ({ ...prev, specSections: e.target.value }))}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditScopeOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleScopeSave}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        open={addVendorOpen}
        onClose={() => setAddVendorOpen(false)}
        title={t('bidManagement.addVendor')}
      >
        <div className="space-y-4">
          <FormField label={t('bidManagement.vendorName')} required>
            <Input
              value={vendorForm.vendorName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorForm(prev => ({ ...prev, vendorName: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.vendorEmail')}>
            <Input
              type="email"
              value={vendorForm.vendorEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorForm(prev => ({ ...prev, vendorEmail: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.bidAmount')}>
            <Input
              type="number"
              value={vendorForm.bidAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorForm(prev => ({ ...prev, bidAmount: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.bidNotes')}>
            <Textarea
              value={vendorForm.bidNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVendorForm(prev => ({ ...prev, bidNotes: e.target.value }))}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddVendorOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddVendor} disabled={createInvMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Invitation Modal */}
      <Modal
        open={!!editInvId}
        onClose={() => setEditInvId(null)}
        title={t('common.edit')}
      >
        <div className="space-y-4">
          <FormField label={t('bidManagement.vendorName')} required>
            <Input
              value={vendorForm.vendorName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorForm(prev => ({ ...prev, vendorName: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.vendorEmail')}>
            <Input
              type="email"
              value={vendorForm.vendorEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorForm(prev => ({ ...prev, vendorEmail: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.bidAmount')}>
            <Input
              type="number"
              value={vendorForm.bidAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorForm(prev => ({ ...prev, bidAmount: e.target.value }))}
            />
          </FormField>
          <FormField label={t('bidManagement.bidNotes')}>
            <Textarea
              value={vendorForm.bidNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVendorForm(prev => ({ ...prev, bidNotes: e.target.value }))}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditInvId(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleEditVendor} disabled={updateInvMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BidPackageDetailPage;
