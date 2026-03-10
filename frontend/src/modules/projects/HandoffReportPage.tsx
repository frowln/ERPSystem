import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  ChevronDown,
  ChevronRight,
  FileText,
  MapPin,
  Shield,
  Wallet,
  AlertTriangle,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { projectsApi } from '@/api/projects';
import { financeApi } from '@/api/finance';
import { permitsApi } from '@/api/permits';
import { risksApi } from '@/api/risks';
import { surveysApi } from '@/api/surveys';
import { meetingsApi } from '@/api/meetings';
import { safetyChecklistApi } from '@/api/safetyChecklist';
import { formatDate, formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PermitStatus, RiskStatus } from '@/types';

/* ---------- Print-friendly styles ---------- */
const printStyles = `
@media print {
  .no-print { display: none !important; }
  .print-expand { max-height: none !important; overflow: visible !important; }
  .print-break { page-break-inside: avoid; }
  body { font-size: 12px; }
  .print-full-width { width: 100% !important; max-width: 100% !important; }
}
`;

/* ---------- Collapsible Section ---------- */
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 print-break print-expand">
      <button
        onClick={() => setOpen(!open)}
        className="no-print w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors rounded-t-xl"
      >
        <span className="text-neutral-500 dark:text-neutral-400">{icon}</span>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex-1">{title}</h2>
        {open ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
      </button>
      {/* Print header (always visible in print) */}
      <div className="hidden print:flex items-center gap-3 px-6 py-4">
        <span className="text-neutral-500">{icon}</span>
        <h2 className="text-base font-semibold text-neutral-900 flex-1">{title}</h2>
      </div>
      {open && <div className="px-6 pb-6 print-expand">{children}</div>}
      {/* Print content (always visible) */}
      {!open && <div className="hidden print:block px-6 pb-6">{children}</div>}
    </div>
  );
};

/* ---------- Color maps ---------- */
const permitStatusColors: Record<string, string> = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  SUBMITTED: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  EXPIRED: 'orange',
};

const riskStatusColors: Record<string, string> = {
  IDENTIFIED: 'amber',
  MITIGATING: 'blue',
  ACCEPTED: 'green',
  CLOSED: 'gray',
};

/* ---------- Severity helpers ---------- */
function riskSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

/* ---------- Main Component ---------- */
const HandoffReportPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  // --- Data fetching ---
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['PROJECT', projectId],
    queryFn: () => projectsApi.getProject(projectId!),
    enabled: !!projectId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.getProjectMembers(projectId!),
    enabled: !!projectId,
  });

  const { data: financials } = useQuery({
    queryKey: ['project-financials', projectId],
    queryFn: () => projectsApi.getProjectFinancials(projectId!),
    enabled: !!projectId,
  });

  const { data: budgetsData } = useQuery({
    queryKey: ['handoff-budgets', projectId],
    queryFn: () => financeApi.getBudgets({ projectId: projectId!, page: 0, size: 10 }),
    enabled: !!projectId,
  });
  const firstBudgetId = budgetsData?.content?.[0]?.id;
  const { data: budgetItems = [] } = useQuery({
    queryKey: ['handoff-budget-items', firstBudgetId],
    queryFn: () => financeApi.getBudgetItems(firstBudgetId!),
    enabled: !!firstBudgetId,
  });

  const { data: permits = [] } = useQuery({
    queryKey: ['permits', projectId],
    queryFn: () => permitsApi.getPermits(projectId!),
    enabled: !!projectId,
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () => risksApi.getRisks(projectId!),
    enabled: !!projectId,
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys', projectId],
    queryFn: () => surveysApi.getSurveys(projectId!),
    enabled: !!projectId,
  });

  const { data: meeting } = useQuery({
    queryKey: ['meeting', projectId],
    queryFn: () => meetingsApi.getMeeting(projectId!),
    enabled: !!projectId,
  });

  const { data: safetyChecklist = [] } = useQuery({
    queryKey: ['safety-checklist', projectId],
    queryFn: () => safetyChecklistApi.getChecklist(projectId!),
    enabled: !!projectId,
  });

  // --- Site assessment (inline fetch, matches ProjectDetailPage pattern) ---
  const { data: siteAssessments = [] } = useQuery({
    queryKey: ['site-assessments', projectId],
    queryFn: async () => {
      const { siteAssessmentsApi } = await import('@/api/siteAssessments');
      return siteAssessmentsApi.getByProject(projectId!);
    },
    enabled: !!projectId,
  });

  // --- Computed data ---
  const budgetSummary = useMemo(() => {
    const items = Array.isArray(budgetItems) ? budgetItems : [];
    const totalPlanned = items.reduce((s, i) => {
      const qty = i.quantity ?? 1;
      return s + (i.plannedAmount ?? (i.estimatePrice ?? 0) * qty);
    }, 0);
    const totalCost = items.reduce((s, i) => {
      const qty = i.quantity ?? 1;
      return s + ((i.costPrice ?? 0) * qty);
    }, 0);
    const totalCustomer = items.reduce((s, i) => {
      const qty = i.quantity ?? 1;
      return s + ((i.customerPrice ?? 0) * qty);
    }, 0);
    const margin = totalCustomer - totalCost;
    const marginPct = totalCustomer > 0 ? (margin / totalCustomer) * 100 : 0;
    return { totalPlanned, totalCost, totalCustomer, margin, marginPct };
  }, [budgetItems]);

  const permitsSummary = useMemo(() => {
    const approved = permits.filter((p) => p.status === 'APPROVED').length;
    const pending = permits.filter((p) => p.status !== 'APPROVED' && p.status !== 'REJECTED').length;
    return { approved, pending, total: permits.length };
  }, [permits]);

  const risksBySeverity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    risks.forEach((r) => {
      const sev = riskSeverity(r.score);
      counts[sev]++;
    });
    return counts;
  }, [risks]);

  const topRisks = useMemo(
    () => [...risks].sort((a, b) => b.score - a.score).slice(0, 5),
    [risks],
  );

  const checklistCompletion = useMemo(() => {
    const total = safetyChecklist.length;
    const completed = safetyChecklist.filter((c) => c.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  }, [safetyChecklist]);

  const outstandingItems = useMemo(() => {
    const items: { type: string; description: string }[] = [];
    permits
      .filter((p) => p.status !== 'APPROVED')
      .forEach((p) => items.push({ type: t('handoffReport.permitsStatus'), description: `${p.permitType} - ${p.status}` }));
    risks
      .filter((r) => r.status === 'IDENTIFIED' || r.status === 'MITIGATING')
      .forEach((r) => items.push({ type: t('handoffReport.riskRegister'), description: r.description }));
    safetyChecklist
      .filter((c) => !c.completed && c.required)
      .forEach((c) => items.push({ type: t('handoffReport.checklistStatus'), description: c.description }));
    if (meeting) {
      meeting.actionItems
        .filter((a) => !a.completed)
        .forEach((a) => items.push({ type: t('handoffReport.meetingMinutes'), description: a.description }));
    }
    return items;
  }, [permits, risks, safetyChecklist, meeting]);

  const isLoading = projectLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-pulse" />
        ))}
      </div>
    );
  }

  const latestSiteAssessment = siteAssessments.length > 0 ? (siteAssessments[siteAssessments.length - 1] as unknown as Record<string, unknown>) : null;

  return (
    <>
      <style>{printStyles}</style>
      <div className="animate-fade-in space-y-6 print-full-width">
        <PageHeader
          title={t('handoffReport.title')}
          backTo={`/projects/${projectId}`}
          breadcrumbs={[
            { label: t('nav.projects'), href: '/projects' },
            { label: project?.name ?? '', href: `/projects/${projectId}` },
            { label: t('handoffReport.title') },
          ]}
          actions={
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Printer size={14} />}
              onClick={() => window.print()}
              className="no-print"
            >
              {t('handoffReport.printReport')}
            </Button>
          }
        />

        {/* ---- Executive Summary ---- */}
        <Section title={t('handoffReport.executiveSummary')} icon={<Building2 size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
            <InfoRow label={t('projects.projectInfo')} value={project?.name ?? t('common.notSpecified')} />
            <InfoRow label={t('projects.customer')} value={project?.customerName || t('common.notSpecified')} />
            <InfoRow label={t('projects.manager')} value={project?.managerName || t('common.notAssigned')} />
            <InfoRow label={t('common.status')} value={<StatusBadge status={project?.status ?? ''} />} />
            <InfoRow label={t('projects.siteAddress') ?? 'Address'} value={project?.address || t('common.notSpecified')} />
            <InfoRow label={t('projects.plannedStart')} value={formatDate(project?.plannedStartDate ?? '')} />
            <InfoRow label={t('projects.plannedEnd')} value={formatDate(project?.plannedEndDate ?? '')} />
            <InfoRow label={t('dashboard.plannedBudget')} value={formatMoney(budgetSummary.totalPlanned || financials?.plannedBudget || project?.budget || 0)} />
            <InfoRow label={t('projects.members')} value={String(members.length)} />
          </div>
        </Section>

        {/* ---- Site Assessment Summary ---- */}
        <Section title={t('handoffReport.siteAssessment')} icon={<MapPin size={18} />}>
          {latestSiteAssessment ? (
            <div className="space-y-3">
              <InfoRow label={t('common.status')} value={latestSiteAssessment.status ? t(`statusLabels.siteAssessmentStatus.${latestSiteAssessment.status}` as never) || String(latestSiteAssessment.status) : t('common.notSpecified')} />
              <InfoRow label={t('handoffReport.overallCondition')} value={String(latestSiteAssessment.overallCondition ?? latestSiteAssessment.condition ?? t('common.notSpecified'))} />
              <InfoRow label={t('handoffReport.accessAssessment')} value={String(latestSiteAssessment.accessAssessment ?? latestSiteAssessment.access ?? t('common.notSpecified'))} />
              {latestSiteAssessment.findings ? (
                <InfoRow label={t('handoffReport.keyFindings')} value={String(latestSiteAssessment.findings)} />
              ) : null}
              {latestSiteAssessment.notes ? (
                <InfoRow label={t('common.notes')} value={String(latestSiteAssessment.notes)} />
              ) : null}
            </div>
          ) : (
            <EmptyState />
          )}
        </Section>

        {/* ---- Permits Status ---- */}
        <Section title={t('handoffReport.permitsStatus')} icon={<FileText size={18} />}>
          {permits.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  {t('handoffReport.approved')}: {permitsSummary.approved}
                </span>
                <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                  {t('handoffReport.pending')}: {permitsSummary.pending}
                </span>
                <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {t('handoffReport.total')}: {permitsSummary.total}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('projects.type')}</th>
                      <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('common.status')}</th>
                      <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('handoffReport.authority')}</th>
                      <th className="text-left py-2 font-medium text-neutral-500 dark:text-neutral-400">{t('handoffReport.issueDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-4 text-neutral-800 dark:text-neutral-200">{p.permitType}</td>
                        <td className="py-2 pr-4">
                          <StatusBadge
                            status={p.status}
                            colorMap={permitStatusColors}
                            label={t(`statusLabels.permitStatus.${p.status}` as never) || p.status}
                          />
                        </td>
                        <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-400">{p.issuingAuthority || t('common.notSpecified')}</td>
                        <td className="py-2 text-neutral-600 dark:text-neutral-400">{p.issueDate ? formatDate(p.issueDate) : t('common.notSpecified')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </Section>

        {/* ---- Budget Summary ---- */}
        <Section title={t('handoffReport.budgetSummary')} icon={<Wallet size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricBox label={t('dashboard.plannedBudget')} value={formatMoney(budgetSummary.totalPlanned || financials?.plannedBudget || 0)} />
            <MetricBox label={t('handoffReport.totalRevenue')} value={formatMoney(budgetSummary.totalCustomer || financials?.contractAmount || 0)} />
            <MetricBox label={t('handoffReport.marginPercent')} value={formatPercent(budgetSummary.marginPct)} />
            <MetricBox label={t('handoffReport.budgetStatus')} value={budgetsData?.content?.[0]?.status ? t(`statusLabels.budgetStatus.${budgetsData.content[0].status}` as never) || budgetsData.content[0].status : t('common.notSpecified')} />
          </div>
          {budgetItems.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('common.name')}</th>
                    <th className="text-right py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('handoffReport.plannedAmount')}</th>
                    <th className="text-right py-2 font-medium text-neutral-500 dark:text-neutral-400">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetItems.filter((i) => i.section).slice(0, 10).map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-4 font-medium text-neutral-800 dark:text-neutral-200">{item.name}</td>
                      <td className="py-2 pr-4 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">{formatMoney(item.plannedAmount)}</td>
                      <td className="py-2 text-right text-neutral-600 dark:text-neutral-400">{item.docStatus ? t(`statusLabels.closingDocStatus.${item.docStatus}` as never) || item.docStatus : t('common.notSpecified')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ---- Risk Register Summary ---- */}
        <Section title={t('handoffReport.riskRegister')} icon={<AlertTriangle size={18} />}>
          {risks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <span key={sev} className={cn('px-3 py-1 rounded-full text-xs font-medium', severityColors[sev])}>
                    {t(`handoffReport.severity_${sev}`)}: {risksBySeverity[sev]}
                  </span>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('handoffReport.topRisks')}
                </h3>
                {topRisks.map((risk) => (
                  <div key={risk.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-start gap-2">
                      <span className={cn('mt-0.5 inline-block px-2 py-0.5 rounded text-xs font-medium', severityColors[riskSeverity(risk.score)])}>
                        {t(`handoffReport.severity_${riskSeverity(risk.score)}`)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800 dark:text-neutral-200">{risk.description}</p>
                        {risk.mitigation && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {t('handoffReport.mitigation')}: {risk.mitigation}
                          </p>
                        )}
                        <div className="flex gap-4 mt-1 text-xs text-neutral-400">
                          <span>{t('handoffReport.riskScore')}: {risk.score}</span>
                          <StatusBadge
                            status={risk.status}
                            colorMap={riskStatusColors}
                            label={t(`statusLabels.riskStatus.${risk.status}` as never) || risk.status}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </Section>

        {/* ---- Team Roster ---- */}
        <Section title={t('handoffReport.teamRoster')} icon={<Users size={18} />}>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('common.name')}</th>
                    <th className="text-left py-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">{t('common.role')}</th>
                    <th className="text-left py-2 font-medium text-neutral-500 dark:text-neutral-400">{t('handoffReport.email')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-4 text-neutral-800 dark:text-neutral-200">{m.userName}</td>
                      <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-400">{m.role}</td>
                      <td className="py-2 text-neutral-600 dark:text-neutral-400">{m.userEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </Section>

        {/* ---- Meeting Minutes ---- */}
        <Section title={t('handoffReport.meetingMinutes')} icon={<ClipboardList size={18} />}>
          {meeting ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label={t('handoffReport.meetingDate')} value={formatDate(meeting.date)} />
                <InfoRow label={t('handoffReport.meetingLocation')} value={meeting.location || t('common.notSpecified')} />
              </div>
              {meeting.attendees.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">{t('handoffReport.attendees')}</p>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200">{meeting.attendees.join(', ')}</p>
                </div>
              )}
              {meeting.decisions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">{t('handoffReport.decisions')}</p>
                  <ul className="space-y-1">
                    {meeting.decisions.map((d) => (
                      <li key={d.id} className="flex items-center gap-2 text-sm">
                        {d.completed ? (
                          <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                        )}
                        <span className={cn('text-neutral-800 dark:text-neutral-200', d.completed && 'line-through opacity-60')}>{d.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {meeting.actionItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">{t('handoffReport.actionItems')}</p>
                  <ul className="space-y-1">
                    {meeting.actionItems.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm">
                        {a.completed ? (
                          <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                        )}
                        <span className={cn('text-neutral-800 dark:text-neutral-200', a.completed && 'line-through opacity-60')}>
                          {a.description} {a.owner && `(${a.owner})`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </Section>

        {/* ---- Checklist Status ---- */}
        <Section title={t('handoffReport.checklistStatus')} icon={<Shield size={18} />}>
          {safetyChecklist.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      checklistCompletion.pct === 100 ? 'bg-green-500' : checklistCompletion.pct >= 50 ? 'bg-blue-500' : 'bg-amber-400',
                    )}
                    style={{ width: `${checklistCompletion.pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                  {checklistCompletion.total === 0
                    ? t('common.notStarted')
                    : `${checklistCompletion.completed}/${checklistCompletion.total} (${checklistCompletion.pct}%)`}
                </span>
              </div>
              {checklistCompletion.pct === 100 ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">{t('handoffReport.readyForConstruction')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{t('handoffReport.notReady')}</span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </Section>

        {/* ---- Readiness Verdict (#92) ---- */}
        <Section title={t('handoffReport.readinessVerdict')} icon={<Shield size={18} />} defaultOpen={true}>
          {(() => {
            const criteria = [
              { label: t('handoffReport.siteAssessment'), done: siteAssessments.length > 0 },
              { label: t('handoffReport.permitsStatus'), done: permits.length > 0 && permits.every((p) => p.status === 'APPROVED') },
              { label: t('handoffReport.budgetSummary'), done: !!budgetsData?.content?.[0] },
              { label: t('handoffReport.riskRegister'), done: risks.length > 0 },
              { label: t('handoffReport.teamRoster'), done: members.length > 0 },
              { label: t('handoffReport.meetingMinutes'), done: !!meeting },
              { label: t('handoffReport.checklistStatus'), done: checklistCompletion.pct === 100 },
            ];
            const doneCount = criteria.filter((c) => c.done).length;
            const totalCount = criteria.length;
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
            const verdictColor = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';
            const verdictLabel = pct >= 80 ? t('handoffReport.readyForConstruction') : pct >= 50 ? t('handoffReport.conditionallyReady') : t('handoffReport.notReady');
            return (
              <div className="space-y-4">
                <div className={cn(
                  'p-4 rounded-lg border-2 text-center',
                  verdictColor === 'green' ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' :
                  verdictColor === 'amber' ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20' :
                  'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
                )}>
                  <p className={cn(
                    'text-lg font-bold',
                    verdictColor === 'green' ? 'text-green-700 dark:text-green-400' :
                    verdictColor === 'amber' ? 'text-amber-700 dark:text-amber-400' :
                    'text-red-700 dark:text-red-400',
                  )}>
                    {verdictLabel}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {doneCount}/{totalCount} ({pct}%)
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {c.done ? (
                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                      )}
                      <span className={c.done ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Section>

        {/* ---- Outstanding Items (grouped by category — #91) ---- */}
        <Section title={t('handoffReport.outstandingItems')} icon={<AlertCircle size={18} />}>
          {outstandingItems.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const grouped = new Map<string, typeof outstandingItems>();
                for (const item of outstandingItems) {
                  if (!grouped.has(item.type)) grouped.set(item.type, []);
                  grouped.get(item.type)!.push(item);
                }
                return Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{category}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-full px-2 py-0.5">{items.length}</span>
                    </div>
                    <div className="space-y-1.5 ml-5">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10">
                          <p className="text-sm text-neutral-800 dark:text-neutral-200">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">{t('handoffReport.noOutstandingItems')}</span>
            </div>
          )}
        </Section>

        {/* ---- Footer (print only) ---- */}
        <div className="hidden print:block text-center text-xs text-neutral-400 mt-8 pt-4 border-t border-neutral-200">
          {t('handoffReport.generatedAt')}: {new Date().toLocaleString('ru-RU')}
        </div>
      </div>
    </>
  );
};

/* ---------- Shared sub-components ---------- */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
    <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{typeof value === 'string' ? value : value}</div>
  </div>
);

const MetricBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
    <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{value}</p>
  </div>
);

const EmptyState: React.FC = () => (
  <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">{t('handoffReport.noData')}</p>
);

export default HandoffReportPage;
