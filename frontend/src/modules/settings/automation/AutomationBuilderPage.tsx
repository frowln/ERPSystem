// =============================================================================
// No-Code Automation Builder — Main Page
// Inspired by Monday.com recipes and Salesforce Flow Builder
// =============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Zap,
  Activity,
  LayoutTemplate,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Copy,
  Trash2,
  Play,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { AutomationRuleEditor } from './AutomationRuleEditor';
import {
  type AutomationRule,
  TRIGGER_OPTIONS,
  ACTION_OPTIONS,
  ENTITY_OPTIONS,
  PRESET_TEMPLATES,
  createEmptyRule,
  generateId,
} from './automationTypes';

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'privod-automations';

function loadRules(): AutomationRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AutomationRule[]) : [];
  } catch {
    return [];
  }
}

function saveRules(rules: AutomationRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTriggerLabel(type: string): string {
  return TRIGGER_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function getActionLabel(type: string): string {
  return ACTION_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function getEntityLabel(type: string): string {
  return ENTITY_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Rule row component
// ---------------------------------------------------------------------------

interface RuleRowProps {
  rule: AutomationRule;
  onToggle: (id: string) => void;
  onEdit: (rule: AutomationRule) => void;
  onDuplicate: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
}

const RuleRow: React.FC<RuleRowProps> = ({ rule, onToggle, onEdit, onDuplicate, onDelete }) => {
  const triggerDesc = `${getEntityLabel(rule.trigger.entityType)} — ${getTriggerLabel(rule.trigger.type)}`;
  const actionDesc = rule.actions.map((a) => getActionLabel(a.type)).join(', ');

  return (
    <div
      className={cn(
        'group flex items-center gap-4 px-4 py-3 rounded-xl border transition-all',
        rule.enabled
          ? 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:shadow-sm'
          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 opacity-60',
      )}
    >
      {/* Toggle */}
      <button
        onClick={() => onToggle(rule.id)}
        className="flex-shrink-0 text-neutral-400 hover:text-primary-500 transition-colors"
        title={rule.enabled ? t('automation.disable') : t('automation.enable')}
      >
        {rule.enabled ? (
          <ToggleRight size={22} className="text-primary-500" />
        ) : (
          <ToggleLeft size={22} />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {rule.name}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
          <span className="text-primary-600 dark:text-primary-400">{triggerDesc}</span>
          {' → '}
          <span className="text-success-600 dark:text-success-400">{actionDesc}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-neutral-400">
          <Play size={12} />
          <span>{rule.executionCount}</span>
        </div>
        {rule.lastRunAt && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Clock size={12} />
            <span>{formatDate(rule.lastRunAt)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(rule)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={t('common.edit')}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDuplicate(rule)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={t('common.duplicate')}
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-danger-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: (typeof PRESET_TEMPLATES)[number];
  onUse: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse }) => {
  const Icon = template.icon;
  return (
    <button
      onClick={onUse}
      className="flex flex-col items-start gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all text-left group"
    >
      <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {template.name}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const AutomationBuilderPage: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>(loadRules);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Persist on every change
  const updateRules = useCallback((updater: (prev: AutomationRule[]) => AutomationRule[]) => {
    setRules((prev) => {
      const next = updater(prev);
      saveRules(next);
      return next;
    });
  }, []);

  // ------- Rule CRUD -------
  const handleSaveRule = useCallback(
    (rule: AutomationRule) => {
      updateRules((prev) => {
        const idx = prev.findIndex((r) => r.id === rule.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = rule;
          return copy;
        }
        return [...prev, rule];
      });
      setEditorOpen(false);
      setEditingRule(null);
    },
    [updateRules],
  );

  const handleToggle = useCallback(
    (id: string) => {
      updateRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      );
    },
    [updateRules],
  );

  const handleDelete = useCallback(
    (id: string) => {
      updateRules((prev) => prev.filter((r) => r.id !== id));
    },
    [updateRules],
  );

  const handleDuplicate = useCallback(
    (rule: AutomationRule) => {
      const dup: AutomationRule = {
        ...rule,
        id: generateId(),
        name: `${rule.name} (${t('common.duplicate').toLowerCase()})`,
        createdAt: new Date().toISOString(),
        executionCount: 0,
        lastRunAt: undefined,
      };
      updateRules((prev) => [...prev, dup]);
    },
    [updateRules],
  );

  const handleEdit = useCallback((rule: AutomationRule) => {
    setEditingRule(rule);
    setEditorOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingRule(null);
    setEditorOpen(true);
  }, []);

  const handleUseTemplate = useCallback(
    (template: (typeof PRESET_TEMPLATES)[number]) => {
      const rule: AutomationRule = {
        id: generateId(),
        ...template.rule,
        name: template.name,
        description: template.description,
        enabled: true,
        createdAt: new Date().toISOString(),
        executionCount: 0,
      };
      setEditingRule(rule);
      setEditorOpen(true);
    },
    [],
  );

  // ------- Stats -------
  const stats = useMemo(() => {
    const active = rules.filter((r) => r.enabled).length;
    const totalExec = rules.reduce((sum, r) => sum + r.executionCount, 0);
    return { active, totalExec, templates: PRESET_TEMPLATES.length };
  }, [rules]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title={t('automation.title')}
        subtitle={t('automation.subtitle')}
        breadcrumbs={[
          { label: t('common.settings'), href: '/settings' },
          { label: t('automation.title') },
        ]}
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Plus size={16} />
            {t('automation.createRule')}
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Zap size={16} />}
          label={t('automation.stats.activeRules')}
          value={stats.active}
          compact
        />
        <MetricCard
          icon={<Activity size={16} />}
          label={t('automation.stats.totalExecutions')}
          value={stats.totalExec}
          compact
        />
        <MetricCard
          icon={<LayoutTemplate size={16} />}
          label={t('automation.stats.templates')}
          value={stats.templates}
          compact
        />
      </div>

      {/* Rules list */}
      <div className="space-y-2 mb-8">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
          {t('automation.rulesList')}
        </h2>
        {rules.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
            <Zap size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('automation.noRules')}
            </p>
            <button
              onClick={handleCreate}
              className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              {t('automation.createFirstRule')}
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Templates section */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
          {t('automation.templatesTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onUse={() => handleUseTemplate(tpl)}
            />
          ))}
        </div>
      </div>

      {/* Editor modal */}
      {editorOpen && (
        <AutomationRuleEditor
          rule={editingRule}
          onSave={handleSaveRule}
          onClose={() => {
            setEditorOpen(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
};

export default AutomationBuilderPage;
