import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Check, X, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RecordField {
  label: string;
  value: React.ReactNode;
  editable?: boolean;
  onEdit?: (newValue: string) => void;
}

export interface RecordTab {
  key: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export interface RecordAssociation {
  title: string;
  count?: number;
  items: {
    id: string;
    label: string;
    subtitle?: string;
    href?: string;
    status?: React.ReactNode;
  }[];
  onViewAll?: () => void;
}

export interface RecordLayoutProps {
  /** Left sidebar: key fields displayed as label/value pairs */
  keyFields: RecordField[];
  /** Additional sidebar content rendered below key fields (links, tags, etc.) */
  sidebarExtra?: React.ReactNode;

  /** Center: tabbed content area */
  tabs: RecordTab[];
  activeTab: string;
  onTabChange: (key: string) => void;

  /** Right sidebar: association sections (documents, team, linked records) */
  associations?: RecordAssociation[];

  /** Header */
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  /** StagePath component rendered between header and 3-panel body */
  stagePath?: React.ReactNode;
  /** Back navigation URL */
  backTo?: string;

  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Inline-editable field                                              */
/* ------------------------------------------------------------------ */

const EditableField: React.FC<{ field: RecordField }> = ({ field }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    if (!field.editable || !field.onEdit) return;
    setDraft(typeof field.value === 'string' ? field.value : '');
    setEditing(true);
  }, [field]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = useCallback(() => {
    field.onEdit?.(draft);
    setEditing(false);
  }, [field, draft]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') cancel();
    },
    [save, cancel],
  );

  return (
    <div className="py-2.5 group/field">
      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {field.label}
      </p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 text-sm bg-white dark:bg-neutral-800 border border-primary-300 dark:border-primary-600 rounded px-2 py-1 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <button
            onClick={save}
            className="p-1 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 rounded transition-colors"
            aria-label={t('common.save')}
          >
            <Check size={14} />
          </button>
          <button
            onClick={cancel}
            className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            aria-label={t('common.cancel')}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center gap-1.5 min-h-[24px]',
            field.editable && 'cursor-pointer',
          )}
          onClick={field.editable ? startEdit : undefined}
          role={field.editable ? 'button' : undefined}
          tabIndex={field.editable ? 0 : undefined}
          onKeyDown={field.editable ? (e) => e.key === 'Enter' && startEdit() : undefined}
          title={field.editable ? t('common.clickToEdit') : undefined}
        >
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
            {field.value || <span className="text-neutral-400 dark:text-neutral-500 italic">--</span>}
          </span>
          {field.editable && (
            <Pencil
              size={12}
              className="flex-shrink-0 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover/field:opacity-100 transition-opacity"
            />
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Association section                                                */
/* ------------------------------------------------------------------ */

const AssociationSection: React.FC<{ association: RecordAssociation }> = ({ association }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const displayCount = association.count ?? association.items.length;

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight size={14} className="text-neutral-400" />
          ) : (
            <ChevronDown size={14} className="text-neutral-400" />
          )}
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            {association.title}
          </span>
        </div>
        {displayCount > 0 && (
          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5 tabular-nums">
            {displayCount}
          </span>
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3">
          {association.items.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 italic py-1">
              {t('recordLayout.noItems')}
            </p>
          ) : (
            <ul className="space-y-1">
              {association.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => item.href && navigate(item.href)}
                    className={cn(
                      'w-full text-left rounded-lg px-2.5 py-2 transition-colors',
                      item.href
                        ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer'
                        : 'cursor-default',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                        {item.label}
                      </span>
                      {item.status}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {association.onViewAll && association.items.length > 0 && (
            <button
              onClick={association.onViewAll}
              className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {t('recordLayout.viewAll')} &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main RecordLayout component                                        */
/* ------------------------------------------------------------------ */

export const RecordLayout: React.FC<RecordLayoutProps> = ({
  keyFields,
  sidebarExtra,
  tabs,
  activeTab,
  onTabChange,
  associations,
  title,
  subtitle,
  status,
  actions,
  stagePath,
  backTo,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('animate-fade-in', className)}>
      {/* ---- Header ---- */}
      <div className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {backTo && (
              <button
                onClick={() => navigate(backTo)}
                aria-label={t('common.back')}
                className="mt-1.5 p-1 -ml-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                  {title}
                </h1>
                {status}
              </div>
              {subtitle && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap flex-shrink-0">{actions}</div>}
        </div>
      </div>

      {/* ---- StagePath (between header and body) ---- */}
      {stagePath && <div className="mb-4">{stagePath}</div>}

      {/* ---- 3-Panel Body ---- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Sidebar ── */}
        <aside className="w-full lg:w-[240px] flex-shrink-0">
          <div className="lg:sticky lg:top-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800">
            <div className="px-4 pt-3 pb-1">
              {keyFields.map((field, idx) => (
                <EditableField key={idx} field={field} />
              ))}
            </div>
            {sidebarExtra && (
              <div className="px-4 py-3">{sidebarExtra}</div>
            )}
          </div>
        </aside>

        {/* ── Center (tabs + content) ── */}
        <main className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="-mb-px flex gap-0 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                  'hover:text-neutral-700 dark:hover:text-neutral-300',
                  activeTab === tab.key
                    ? 'text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:rounded-t'
                    : 'text-neutral-500 dark:text-neutral-400',
                )}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={cn(
                      'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full',
                      activeTab === tab.key
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          <div className="pt-6">
            {tabs.find((tab) => tab.key === activeTab)?.content}
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        {associations && associations.length > 0 && (
          <aside className="w-full lg:w-[280px] flex-shrink-0">
            <div className="lg:sticky lg:top-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              {associations.map((assoc, idx) => (
                <AssociationSection key={idx} association={assoc} />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
