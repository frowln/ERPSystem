import React, { lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, ChevronDown, AlertTriangle, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge, projectStatusLabels } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { projectsApi } from '@/api/projects';
import { financeApi } from '@/api/finance';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useProjectFinancials } from './hooks/useProjectFinancials';
import { ProjectOverviewTab } from './ProjectOverviewTab';
import { ProjectFinanceTab } from './ProjectFinanceTab/ProjectFinanceTab';
import { ProjectTeamTab } from './ProjectTeamTab';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import type { ProjectStatus } from '@/types';
import toast from 'react-hot-toast';

const EngineeringSurveysPanel = lazy(() => import('./components/EngineeringSurveysPanel'));
const PermitsPanel = lazy(() => import('./components/PermitsPanel'));
const ConstructionPlansPanel = lazy(() => import('./components/ConstructionPlansPanel'));
const PreConstructionSafetyPanel = lazy(() => import('./components/PreConstructionSafetyPanel'));

type DetailTab = 'overview' | 'team' | 'documents' | 'FINANCE' | 'preConstruction';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['PROJECT', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  });

  const { data: financials, isLoading: financialsLoading } = useQuery({
    queryKey: ['project-financials', id],
    queryFn: () => projectsApi.getProjectFinancials(id!),
    enabled: !!id,
  });

  const { data: members } = useQuery({
    queryKey: ['project-members', id],
    queryFn: () => projectsApi.getProjectMembers(id!),
    enabled: !!id && activeTab === 'team',
  });

  // Fetch budget items to aggregate planned budget when backend doesn't compute it
  const { data: budgetsData } = useQuery({
    queryKey: ['project-budgets-overview', id],
    queryFn: () => financeApi.getBudgets({ projectId: id!, page: 0, size: 10 }),
    enabled: !!id,
  });
  const firstBudgetId = budgetsData?.content?.[0]?.id;
  const { data: budgetItemsData } = useQuery({
    queryKey: ['project-budget-items-overview', firstBudgetId],
    queryFn: () => financeApi.getBudgetItems(firstBudgetId!),
    enabled: !!firstBudgetId,
  });

  const rawComputed = useProjectFinancials(project, financials);
  // Override with budget items aggregation if backend returns 0
  const computed = React.useMemo(() => {
    if (rawComputed.plannedBudget > 0 || !budgetItemsData?.length) return rawComputed;
    const items = Array.isArray(budgetItemsData) ? budgetItemsData : [];
    // Use plannedAmount (total) or fall back to per-unit * quantity
    const estimateTotal = items.reduce((s: number, i: any) => {
      const qty = i.quantity ?? 1;
      return s + (i.plannedAmount ?? (i.estimatePrice ?? 0) * qty);
    }, 0);
    const costTotal = items.reduce((s: number, i: any) => {
      const qty = i.quantity ?? 1;
      return s + ((i.costPrice ?? 0) * qty);
    }, 0);
    const customerTotal = items.reduce((s: number, i: any) => {
      const qty = i.quantity ?? 1;
      return s + ((i.customerPrice ?? 0) * qty);
    }, 0);
    const margin = customerTotal - costTotal;
    const profitabilityPct = customerTotal > 0 ? (margin / customerTotal) * 100 : 0;
    return {
      ...rawComputed,
      plannedBudget: estimateTotal || customerTotal,
      estimateTotal,
      margin,
      profitabilityPct,
      contractAmount: rawComputed.contractAmount || customerTotal,
    };
  }, [rawComputed, budgetItemsData]);
  const statuses: ProjectStatus[] = ['DRAFT', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

  const changeStatusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => projectsApi.changeStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['PROJECT', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('projects.statusUpdated'));
      setStatusModalOpen(false);
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message)
          : t('errors.unexpectedError');
      toast.error(message);
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={project?.name ?? ''}
        subtitle={`${project?.code ?? ''} / ${project?.type ?? ''}`}
        backTo="/projects"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('nav.projects'), href: '/projects' },
          { label: project?.name ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={project?.status ?? ''} size="md" />
            <Button variant="secondary" size="sm" iconRight={<ChevronDown size={14} />} onClick={() => setStatusModalOpen(true)}>
              {t('projects.status')}
            </Button>
            <Button variant="secondary" size="sm" iconLeft={<Edit3 size={14} />} onClick={() => navigate(`/projects/${id}/edit`)}>
              {t('common.edit')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'overview', label: t('analytics.overview') },
          { id: 'team', label: t('projects.team'), count: project?.membersCount },
          { id: 'documents', label: t('nav.documents') },
          { id: 'FINANCE', label: t('nav.finance') },
          { id: 'preConstruction', label: t('projects.preConstruction.tabTitle') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'overview' && (
        <ProjectOverviewTab project={project} financials={computed} financialsLoading={financialsLoading} />
      )}
      {activeTab === 'team' && (
        <ProjectTeamTab members={members ?? []} projectId={id!} />
      )}
      {activeTab === 'documents' && (
        <ProjectDocumentsTab project={project} />
      )}
      {activeTab === 'FINANCE' && (
        <ProjectFinanceTab project={project} financials={financials} computed={computed} financialsLoading={financialsLoading} />
      )}

      {activeTab === 'preConstruction' && id && (
        <div className="space-y-6">
          {/* Action Buttons — link to full pages */}
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${id}/risks`)}>
              <AlertTriangle size={14} className="mr-1.5" /> {t('projects.risks.title')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${id}/meeting`)}>
              <ClipboardList size={14} className="mr-1.5" /> {t('projects.meeting.title')}
            </Button>
          </div>

          {/* 2x2 Panel Grid */}
          <Suspense fallback={<div className="text-neutral-400 text-sm p-4">{t('common.loading')}</div>}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EngineeringSurveysPanel projectId={id} />
              <PermitsPanel projectId={id} />
              <ConstructionPlansPanel projectId={id} />
              <PreConstructionSafetyPanel projectId={id} />
            </div>
          </Suspense>
        </div>
      )}

      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={t('projects.status')}
        description={projectStatusLabels[project?.status ?? ''] ?? project?.status ?? ''}
        size="sm"
      >
        <div className="space-y-2">
          {statuses.map((status) => (
            <button
              key={status}
              disabled={status === project?.status || changeStatusMutation.isPending}
              onClick={() => changeStatusMutation.mutate(status)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                status === project?.status
                  ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 cursor-default'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:bg-neutral-800 border border-transparent',
              )}
            >
              <StatusBadge status={status} />
              {status === project?.status && (
                <span className="ml-auto text-xs text-primary-600 font-medium">{t('status.active')}</span>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
