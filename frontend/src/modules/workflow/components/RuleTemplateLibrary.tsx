import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  Bell,
  Users,
  AlertTriangle,
  DollarSign,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { RuleTemplate, RuleTemplateCategory, ConditionConfig } from '../types';

// ---------------------------------------------------------------------------
// Category colour map
// ---------------------------------------------------------------------------

const categoryColorMap: Record<string, 'green' | 'blue' | 'purple' | 'yellow' | 'red'> = {
  APPROVAL: 'green',
  NOTIFICATION: 'blue',
  ASSIGNMENT: 'purple',
  ESCALATION: 'yellow',
  BUDGET: 'red',
};

function getCategoryLabels(): Record<RuleTemplateCategory, string> {
  return {
    APPROVAL: t('workflow.ruleTemplates.categoryApproval'),
    NOTIFICATION: t('workflow.ruleTemplates.categoryNotification'),
    ASSIGNMENT: t('workflow.ruleTemplates.categoryAssignment'),
    ESCALATION: t('workflow.ruleTemplates.categoryEscalation'),
    BUDGET: t('workflow.ruleTemplates.categoryBudget'),
  };
}

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

const iconMap: Record<string, React.ReactNode> = {
  check: <CheckCircle size={24} />,
  bell: <Bell size={24} />,
  users: <Users size={24} />,
  alert: <AlertTriangle size={24} />,
  dollar: <DollarSign size={24} />,
};

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

function getBuiltInTemplates(): RuleTemplate[] {
  const emptyConditions: ConditionConfig = {
    logic: 'AND',
    groups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [{ id: 'c1', field: 'amount', operator: 'less_than', value: '50000' }],
      },
    ],
  };

  return [
    {
      id: 'tpl-auto-approve-po',
      name: t('workflow.ruleTemplates.tplAutoApproveName'),
      description: t('workflow.ruleTemplates.tplAutoApproveDesc'),
      category: 'APPROVAL',
      icon: 'check',
      triggerType: 'CREATION',
      actionType: 'UPDATE_STATUS',
      defaultConditions: emptyConditions,
      defaultActionConfig: { targetStatus: 'APPROVED' },
    },
    {
      id: 'tpl-escalate-overdue',
      name: t('workflow.ruleTemplates.tplEscalateOverdueName'),
      description: t('workflow.ruleTemplates.tplEscalateOverdueDesc'),
      category: 'ESCALATION',
      icon: 'alert',
      triggerType: 'TIME_BASED',
      actionType: 'SEND_NOTIFICATION',
      defaultConditions: {
        logic: 'AND',
        groups: [
          {
            id: 'g1',
            logic: 'AND',
            conditions: [{ id: 'c1', field: 'status', operator: 'equals', value: 'IN_PROGRESS' }],
          },
        ],
      },
      defaultActionConfig: { channel: 'email', escalateTo: 'manager' },
    },
    {
      id: 'tpl-safety-notify',
      name: t('workflow.ruleTemplates.tplSafetyNotifyName'),
      description: t('workflow.ruleTemplates.tplSafetyNotifyDesc'),
      category: 'NOTIFICATION',
      icon: 'bell',
      triggerType: 'CREATION',
      actionType: 'SEND_NOTIFICATION',
      defaultConditions: {
        logic: 'AND',
        groups: [
          {
            id: 'g1',
            logic: 'AND',
            conditions: [{ id: 'c1', field: 'entityType', operator: 'equals', value: 'SAFETY_INCIDENT' }],
          },
        ],
      },
      defaultActionConfig: { channel: 'push', roles: ['MANAGER', 'ADMIN'] },
    },
    {
      id: 'tpl-auto-assign-dept',
      name: t('workflow.ruleTemplates.tplAutoAssignName'),
      description: t('workflow.ruleTemplates.tplAutoAssignDesc'),
      category: 'ASSIGNMENT',
      icon: 'users',
      triggerType: 'CREATION',
      actionType: 'ASSIGN_ROLE',
      defaultConditions: {
        logic: 'AND',
        groups: [
          {
            id: 'g1',
            logic: 'AND',
            conditions: [{ id: 'c1', field: 'department', operator: 'equals', value: '' }],
          },
        ],
      },
      defaultActionConfig: { assignByDepartment: true },
    },
    {
      id: 'tpl-budget-threshold',
      name: t('workflow.ruleTemplates.tplBudgetThresholdName'),
      description: t('workflow.ruleTemplates.tplBudgetThresholdDesc'),
      category: 'BUDGET',
      icon: 'dollar',
      triggerType: 'FIELD_UPDATE',
      actionType: 'SEND_NOTIFICATION',
      defaultConditions: {
        logic: 'AND',
        groups: [
          {
            id: 'g1',
            logic: 'AND',
            conditions: [{ id: 'c1', field: 'amount', operator: 'greater_than', value: '1000000' }],
          },
        ],
      },
      defaultActionConfig: { channel: 'email', roles: ['ACCOUNTANT', 'ADMIN'] },
    },
  ];
}

// ---------------------------------------------------------------------------
// Category filter tabs
// ---------------------------------------------------------------------------

type FilterCategory = 'ALL' | RuleTemplateCategory;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RuleTemplateLibraryProps {
  onSelectTemplate: (template: RuleTemplate) => void;
  className?: string;
}

export const RuleTemplateLibrary: React.FC<RuleTemplateLibraryProps> = ({
  onSelectTemplate,
  className,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

  const templates = useMemo(() => getBuiltInTemplates(), []);
  const categoryLabels = getCategoryLabels();

  const categories: { id: FilterCategory; label: string }[] = useMemo(
    () => [
      { id: 'ALL', label: t('workflow.ruleTemplates.filterAll') },
      ...Object.entries(categoryLabels).map(([id, label]) => ({
        id: id as FilterCategory,
        label,
      })),
    ],
    [categoryLabels],
  );

  const filtered = useMemo(() => {
    let result = templates;
    if (activeCategory !== 'ALL') {
      result = result.filter((tpl) => tpl.category === activeCategory);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(lower) ||
          tpl.description.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [templates, activeCategory, search]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('workflow.ruleTemplates.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          <p className="text-sm">{t('workflow.ruleTemplates.emptySearch')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className={cn(
                'group rounded-lg border p-5 transition-all duration-150 cursor-pointer',
                'border-neutral-200 dark:border-neutral-700',
                'bg-white dark:bg-neutral-900',
                'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm',
              )}
              onClick={() => onSelectTemplate(tpl)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTemplate(tpl); } }}
              aria-label={t('workflow.ruleTemplates.useTemplate') + ': ' + tpl.name}
            >
              {/* Icon + category */}
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg',
                  'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
                )}>
                  {iconMap[tpl.icon] ?? <CheckCircle size={24} />}
                </div>
                <StatusBadge
                  status={tpl.category}
                  colorMap={categoryColorMap}
                  label={categoryLabels[tpl.category]}
                />
              </div>

              {/* Title + description */}
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                {tpl.name}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                {tpl.description}
              </p>

              {/* Use template button */}
              <Button
                variant="ghost"
                size="xs"
                className="w-full justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30"
                iconRight={<ArrowRight size={14} />}
                onClick={(e) => { e.stopPropagation(); onSelectTemplate(tpl); }}
              >
                {t('workflow.ruleTemplates.useTemplate')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
