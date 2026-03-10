import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Camera,
  Mic,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useEmployeeOptions } from '@/hooks/useSelectOptions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DefectOnPlanSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
type DefectOnPlanStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
type DefectCategory = 'CONCRETE' | 'STEELWORK' | 'MEP' | 'FINISHING' | 'OTHER';

interface DefectOnPlan {
  id: string;
  number: number;
  title: string;
  description?: string;
  severity: DefectOnPlanSeverity;
  category: DefectCategory;
  status: DefectOnPlanStatus;
  assigneeName?: string;
  dueDate?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  createdAt: string;
}

interface Drawing {
  id: string;
  name: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<DefectOnPlanSeverity, { bg: string; border: string; text: string; badge: string }> = {
  MINOR: {
    bg: 'bg-amber-400',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  MAJOR: {
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    text: 'text-orange-700 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  CRITICAL: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const STATUS_COLORS: Record<DefectOnPlanStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DRAWINGS: Drawing[] = [
  { id: 'b7e8f1a0-0001-4000-8000-000000000001', name: 'Plan 1-go etazha', code: 'AR-001' },
  { id: 'b7e8f1a0-0001-4000-8000-000000000002', name: 'Plan 2-go etazha', code: 'AR-002' },
  { id: 'b7e8f1a0-0001-4000-8000-000000000003', name: 'Plan podvala', code: 'AR-003' },
];

const MOCK_DEFECTS: DefectOnPlan[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001', number: 1, title: 'Treschina v stene komnaty 101',
    description: 'Gorizontalnaya treschina dlinnoy ~30 sm na shtukaturke',
    severity: 'MAJOR', category: 'CONCRETE', status: 'OPEN',
    assigneeName: 'Ivanov A.S.', dueDate: '2026-03-15',
    x: 18, y: 25, createdAt: '2026-03-01',
  },
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000002', number: 2, title: 'Protechka potolka v konferents-zale',
    description: 'Pyatna vlagi na potolke posle dozhdia',
    severity: 'CRITICAL', category: 'MEP', status: 'IN_PROGRESS',
    assigneeName: 'Petrov V.M.', dueDate: '2026-03-05',
    x: 50, y: 18, createdAt: '2026-02-28',
  },
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000003', number: 3, title: 'Neverno razmeschena rozetka v lab. 103',
    severity: 'MINOR', category: 'MEP', status: 'OPEN',
    assigneeName: 'Sidorova E.K.', dueDate: '2026-03-20',
    x: 82, y: 22, createdAt: '2026-03-02',
  },
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000004', number: 4, title: 'Skolotaya plitka u vkhoda v masterskuyu',
    severity: 'MINOR', category: 'FINISHING', status: 'RESOLVED',
    assigneeName: 'Kozlov D.A.',
    x: 22, y: 52, createdAt: '2026-02-20',
  },
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000005', number: 5, title: 'Otsutstvuet datchik pozharnoy signalizatsii 105',
    severity: 'CRITICAL', category: 'MEP', status: 'OPEN',
    assigneeName: 'Petrov V.M.', dueDate: '2026-03-10',
    x: 75, y: 65, createdAt: '2026-03-03',
  },
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000006', number: 6, title: 'Nesovpadenie ventkanala nad koridorom',
    severity: 'MAJOR', category: 'STEELWORK', status: 'IN_PROGRESS',
    assigneeName: 'Ivanov A.S.', dueDate: '2026-03-18',
    x: 50, y: 48, createdAt: '2026-03-04',
  },
];

// ---------------------------------------------------------------------------
// Inline SVG floor plan
// ---------------------------------------------------------------------------

function floorPlanDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="#f9fafb"/>
  <rect width="1200" height="800" fill="url(#grid)"/>
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="#374151" stroke-width="4"/>
  <rect x="60" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="240" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">101</text>
  <text x="240" y="255" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Office</text>
  <rect x="420" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="600" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">102</text>
  <text x="600" y="255" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Conference</text>
  <rect x="780" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="960" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">103</text>
  <text x="960" y="255" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Lab</text>
  <rect x="60" y="400" width="540" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="330" y="570" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">104</text>
  <text x="330" y="595" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Workshop</text>
  <rect x="600" y="400" width="540" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="870" y="570" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">105</text>
  <text x="870" y="595" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Storage</text>
  <line x1="200" y1="400" x2="280" y2="400" stroke="#f9fafb" stroke-width="5"/>
  <path d="M 200 400 A 80 80 0 0 1 280 400" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4"/>
  <line x1="540" y1="230" x2="540" y2="310" stroke="#f9fafb" stroke-width="5"/>
  <line x1="780" y1="180" x2="780" y2="260" stroke="#f9fafb" stroke-width="5"/>
  <line x1="720" y1="400" x2="720" y2="480" stroke="#f9fafb" stroke-width="5"/>
  <text x="600" y="395" text-anchor="middle" font-size="11" fill="#9ca3af" font-family="sans-serif">CORRIDOR</text>
  <circle cx="1100" cy="720" r="20" fill="none" stroke="#d1d5db" stroke-width="1"/>
  <text x="1100" y="707" text-anchor="middle" font-size="10" fill="#6b7280" font-family="sans-serif" font-weight="bold">N</text>
  <line x1="1100" y1="715" x2="1100" y2="735" stroke="#9ca3af" stroke-width="1.5"/>
  <polygon points="1100,700 1096,710 1104,710" fill="#6b7280"/>
  <line x1="80" y1="760" x2="280" y2="760" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="80" y1="755" x2="80" y2="765" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="280" y1="755" x2="280" y2="765" stroke="#9ca3af" stroke-width="1.5"/>
  <text x="180" y="775" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="sans-serif">10 m</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

function getSeverityLabel(s: DefectOnPlanSeverity): string {
  const map: Record<DefectOnPlanSeverity, string> = {
    MINOR: t('defects.onPlan.severityMinor'),
    MAJOR: t('defects.onPlan.severityMajor'),
    CRITICAL: t('defects.onPlan.severityCritical'),
  };
  return map[s];
}

function getCategoryLabel(c: DefectCategory): string {
  const map: Record<DefectCategory, string> = {
    CONCRETE: t('defects.onPlan.categoryConcreteWork'),
    STEELWORK: t('defects.onPlan.categorySteelwork'),
    MEP: t('defects.onPlan.categoryMep'),
    FINISHING: t('defects.onPlan.categoryFinishing'),
    OTHER: t('defects.onPlan.categoryOther'),
  };
  return map[c];
}

function getStatusLabel(s: DefectOnPlanStatus): string {
  const map: Record<DefectOnPlanStatus, string> = {
    OPEN: t('defects.statusOpen'),
    IN_PROGRESS: t('defects.statusInProgress'),
    RESOLVED: t('defects.onPlan.statsResolved'),
  };
  return map[s];
}

// ---------------------------------------------------------------------------
// Statistics bar
// ---------------------------------------------------------------------------

const StatsBar: React.FC<{ defects: DefectOnPlan[] }> = ({ defects }) => {
  const total = defects.length;
  const minor = defects.filter((d) => d.severity === 'MINOR').length;
  const major = defects.filter((d) => d.severity === 'MAJOR').length;
  const critical = defects.filter((d) => d.severity === 'CRITICAL').length;
  const open = defects.filter((d) => d.status !== 'RESOLVED').length;
  const resolved = defects.filter((d) => d.status === 'RESOLVED').length;

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium overflow-x-auto">
      <StatChip icon={<MapPin size={13} />} label={t('defects.onPlan.statsTotal')} value={total} />
      <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 shrink-0" />
      <StatChip color="text-amber-600 dark:text-amber-400" label={t('defects.onPlan.severityMinor')} value={minor} />
      <StatChip color="text-orange-600 dark:text-orange-400" label={t('defects.onPlan.severityMajor')} value={major} />
      <StatChip color="text-red-600 dark:text-red-400" label={t('defects.onPlan.severityCritical')} value={critical} />
      <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 shrink-0" />
      <StatChip icon={<Clock size={13} />} color="text-amber-600 dark:text-amber-400" label={t('defects.onPlan.statsOpen')} value={open} />
      <StatChip icon={<CheckCircle size={13} />} color="text-emerald-600 dark:text-emerald-400" label={t('defects.onPlan.statsResolved')} value={resolved} />
    </div>
  );
};

const StatChip: React.FC<{ label: string; value: number; color?: string; icon?: React.ReactNode }> = ({
  label,
  value,
  color,
  icon,
}) => (
  <div className={cn('flex items-center gap-1.5 shrink-0', color ?? 'text-neutral-600 dark:text-neutral-300')}>
    {icon}
    <span>{label}:</span>
    <span className="font-bold tabular-nums">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Defect Creation Form (right drawer)
// ---------------------------------------------------------------------------

interface CreateDefectFormProps {
  clickPos: { x: number; y: number };
  onSave: (data: Omit<DefectOnPlan, 'id' | 'number' | 'createdAt' | 'x' | 'y' | 'status'>) => void;
  onCancel: () => void;
}

const CreateDefectForm: React.FC<CreateDefectFormProps> = ({ clickPos, onSave, onCancel }) => {
  const { options: employeeOptions } = useEmployeeOptions();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DefectOnPlanSeverity>('MAJOR');
  const [category, setCategory] = useState<DefectCategory>('OTHER');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
      category,
      assigneeName: assignee || undefined,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />

      {/* Slide-in drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 shadow-2xl border-l border-neutral-200 dark:border-neutral-700 flex flex-col animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('defects.onPlan.formTitle')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('defects.onPlan.clickToPlace')} ({clickPos.x.toFixed(1)}%, {clickPos.y.toFixed(1)}%)
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder={t('defects.form.placeholderTitle')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formDescription')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t('defects.form.placeholderDescription')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t('defects.onPlan.formSeverity')}
              </label>
              <div className="flex gap-2">
                {(['MINOR', 'MAJOR', 'CRITICAL'] as DefectOnPlanSeverity[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={cn(
                      'flex-1 px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all',
                      severity === s
                        ? cn(SEVERITY_COLORS[s].badge, 'border-current ring-1 ring-current/20')
                        : 'border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-500',
                    )}
                  >
                    {getSeverityLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formCategory')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DefectCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {(['CONCRETE', 'STEELWORK', 'MEP', 'FINISHING', 'OTHER'] as DefectCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {getCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formAssignee')}
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">{t('defects.form.placeholderAssignee')}</option>
                {employeeOptions.map((opt) => (
                  <option key={opt.value} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formDueDate')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {/* Photo upload placeholder */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formPhoto')}
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700/50">
                <Camera size={20} className="text-neutral-400" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('defects.onPlan.formPhoto')}
                </span>
              </div>
            </div>

            {/* Voice note placeholder */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('defects.onPlan.formVoiceNote')}
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700/50">
                <Mic size={20} className="text-neutral-400" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('defects.onPlan.formVoiceNote')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              {t('defects.onPlan.btnCancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {t('defects.onPlan.btnCreate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Defect Detail Drawer
// ---------------------------------------------------------------------------

const DefectDetailDrawer: React.FC<{ defect: DefectOnPlan; onClose: () => void }> = ({ defect, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end">
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-sm bg-white dark:bg-neutral-800 shadow-2xl border-l border-neutral-200 dark:border-neutral-700 flex flex-col animate-slide-in-right overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
            SEVERITY_COLORS[defect.severity].bg,
          )}>
            {defect.number}
          </span>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            #{defect.number}
          </h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <X size={18} className="text-neutral-400" />
        </button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{defect.title}</h4>
        {defect.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{defect.description}</p>
        )}

        <div className="space-y-3">
          <DetailRow icon={AlertTriangle} label={t('defects.onPlan.formSeverity')}>
            <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', SEVERITY_COLORS[defect.severity].badge)}>
              {getSeverityLabel(defect.severity)}
            </span>
          </DetailRow>
          <DetailRow icon={Filter} label={t('defects.onPlan.formCategory')}>
            <span className="text-sm text-neutral-800 dark:text-neutral-200">{getCategoryLabel(defect.category)}</span>
          </DetailRow>
          <DetailRow icon={CheckCircle} label={t('defects.fieldStatus')}>
            <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[defect.status])}>
              {getStatusLabel(defect.status)}
            </span>
          </DetailRow>
          {defect.assigneeName && (
            <DetailRow icon={User} label={t('defects.onPlan.formAssignee')}>
              <span className="text-sm text-neutral-800 dark:text-neutral-200">{defect.assigneeName}</span>
            </DetailRow>
          )}
          {defect.dueDate && (
            <DetailRow icon={Calendar} label={t('defects.onPlan.formDueDate')}>
              <span className="text-sm text-neutral-800 dark:text-neutral-200">{defect.dueDate}</span>
            </DetailRow>
          )}
          <DetailRow icon={Clock} label={t('defects.fieldCreated')}>
            <span className="text-sm text-neutral-800 dark:text-neutral-200">{defect.createdAt}</span>
          </DetailRow>
        </div>
      </div>
    </div>
  </div>
);

const DetailRow: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({
  icon: Icon,
  label,
  children,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  title: string;
  active?: boolean;
  accent?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, onClick, title, active, accent }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
      active && accent
        ? 'bg-primary-500 text-white'
        : active
          ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-100'
          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700',
    )}
    title={title}
  >
    <Icon size={15} />
  </button>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const DefectOnPlanPage: React.FC = () => {
  // Drawing selection
  const [selectedDrawing, setSelectedDrawing] = useState(MOCK_DRAWINGS[0]);

  // Defects state
  const [defects, setDefects] = useState<DefectOnPlan[]>(MOCK_DEFECTS);

  // Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Modes & UI
  const [addMode, setAddMode] = useState(false);
  const [pinsVisible, setPinsVisible] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Create form
  const [createPos, setCreatePos] = useState<{ x: number; y: number } | null>(null);

  // Detail drawer
  const [detailDefect, setDetailDefect] = useState<DefectOnPlan | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<DefectOnPlanSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DefectOnPlanStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<DefectCategory | 'ALL'>('ALL');

  // Hover / highlight
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageUrl = useMemo(() => floorPlanDataUrl(), []);

  // -- Filtered defects --
  const filteredDefects = useMemo(() => {
    return defects.filter((d) => {
      if (severityFilter !== 'ALL' && d.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      return true;
    });
  }, [defects, severityFilter, statusFilter, categoryFilter]);

  // -- Zoom --
  const clampZoom = useCallback((z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)), []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((prev) => clampZoom(prev + delta));
    },
    [clampZoom],
  );

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), [clampZoom]);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), [clampZoom]);
  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // -- Pan --
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (addMode) return;
      if (e.button !== 0) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [addMode, pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // -- Pin placement --
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (!addMode || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setCreatePos({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
        setAddMode(false);
      }
    },
    [addMode],
  );

  // -- Create defect --
  const handleCreate = useCallback(
    (data: Omit<DefectOnPlan, 'id' | 'number' | 'createdAt' | 'x' | 'y' | 'status'>) => {
      if (!createPos) return;
      const newDefect: DefectOnPlan = {
        id: `def-${Date.now()}`,
        number: defects.length + 1,
        ...data,
        status: 'OPEN',
        x: createPos.x,
        y: createPos.y,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setDefects((prev) => [...prev, newDefect]);
      setCreatePos(null);
    },
    [createPos, defects.length],
  );

  // -- Pan to pin --
  const panToPin = useCallback(
    (defect: DefectOnPlan) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetX = -(defect.x / 100) * rect.width * zoom + rect.width / 2;
      const targetY = -(defect.y / 100) * rect.height * zoom + rect.height / 2;
      setPan({ x: targetX, y: targetY });
      setHighlightedPinId(defect.id);
      setTimeout(() => setHighlightedPinId(null), 2000);
    },
    [zoom],
  );

  // -- Escape key --
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addMode) setAddMode(false);
        if (createPos) setCreatePos(null);
        if (detailDefect) setDetailDefect(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addMode, createPos, detailDefect]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('defects.onPlan.title')}
        subtitle={t('defects.onPlan.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('defects.breadcrumb'), href: '/defects' },
          { label: t('defects.onPlan.breadcrumb') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Drawing selector */}
            <select
              value={selectedDrawing.id}
              onChange={(e) => {
                const d = MOCK_DRAWINGS.find((dr) => dr.id === e.target.value);
                if (d) setSelectedDrawing(d);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {MOCK_DRAWINGS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} &mdash; {d.name}
                </option>
              ))}
            </select>

            {/* Add defect toggle */}
            <button
              onClick={() => setAddMode(!addMode)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                addMode
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600',
              )}
            >
              <Plus size={16} />
              {addMode ? t('defects.onPlan.exitAddMode') : t('defects.onPlan.addDefectMode')}
            </button>
          </div>
        }
      />

      {/* Stats bar */}
      <StatsBar defects={defects} />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ====== Plan viewport ====== */}
        <div className="relative flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          {/* Toolbar */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 shadow-sm">
            <ToolbarButton icon={ZoomIn} onClick={zoomIn} title="Zoom in" />
            <ToolbarButton icon={ZoomOut} onClick={zoomOut} title="Zoom out" />
            <ToolbarButton icon={Maximize2} onClick={fitToScreen} title="Fit" />
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
            <ToolbarButton
              icon={pinsVisible ? Eye : EyeOff}
              onClick={() => setPinsVisible(!pinsVisible)}
              title="Toggle pins"
              active={pinsVisible}
            />
            <ToolbarButton
              icon={MapPin}
              onClick={() => setAddMode(!addMode)}
              title={t('defects.onPlan.addDefectMode')}
              active={addMode}
              accent
            />
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums min-w-[40px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Pin mode banner */}
          {addMode && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 px-4 py-2 shadow-sm">
              <MapPin size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                {t('defects.onPlan.clickToPlace')}
              </span>
              <button
                onClick={() => setAddMode(false)}
                className="ml-2 p-0.5 rounded hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
              >
                <X size={14} className="text-primary-500" />
              </button>
            </div>
          )}

          {/* Filter bar */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 shadow-sm">
            <Filter size={13} className="text-neutral-500 dark:text-neutral-400 mr-1" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as DefectOnPlanSeverity | 'ALL')}
              className="px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="ALL">{t('defects.onPlan.filterBySeverity')}</option>
              <option value="MINOR">{t('defects.onPlan.severityMinor')}</option>
              <option value="MAJOR">{t('defects.onPlan.severityMajor')}</option>
              <option value="CRITICAL">{t('defects.onPlan.severityCritical')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DefectOnPlanStatus | 'ALL')}
              className="px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="ALL">{t('defects.onPlan.filterByStatus')}</option>
              <option value="OPEN">{t('defects.statusOpen')}</option>
              <option value="IN_PROGRESS">{t('defects.statusInProgress')}</option>
              <option value="RESOLVED">{t('defects.onPlan.statsResolved')}</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as DefectCategory | 'ALL')}
              className="px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="ALL">{t('defects.onPlan.filterAll')}</option>
              {(['CONCRETE', 'STEELWORK', 'MEP', 'FINISHING', 'OTHER'] as DefectCategory[]).map((c) => (
                <option key={c} value={c}>{getCategoryLabel(c)}</option>
              ))}
            </select>
          </div>

          {/* Viewport */}
          <div
            ref={containerRef}
            className={cn(
              'w-full h-full overflow-hidden select-none',
              addMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="relative origin-top-left transition-transform duration-75"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Floor plan"
                className="block max-w-none pointer-events-auto"
                draggable={false}
                onClick={handleImageClick}
              />

              {/* Defect pin markers */}
              {pinsVisible &&
                filteredDefects.map((defect) => {
                  const isHovered = hoveredPinId === defect.id;
                  const isHighlighted = highlightedPinId === defect.id;
                  const colors = SEVERITY_COLORS[defect.severity];

                  return (
                    <div
                      key={defect.id}
                      className="absolute pointer-events-auto"
                      style={{
                        left: `${defect.x}%`,
                        top: `${defect.y}%`,
                        transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                        zIndex: isHovered || isHighlighted ? 30 : 10,
                      }}
                    >
                      {/* Pin circle */}
                      <button
                        className={cn(
                          'w-7 h-7 rounded-full border-2 shadow-md transition-all duration-200 flex items-center justify-center text-white text-[10px] font-bold',
                          colors.bg,
                          colors.border,
                          defect.severity === 'CRITICAL' && defect.status !== 'RESOLVED' && 'animate-pulse',
                          isHighlighted && 'ring-2 ring-white ring-offset-2 ring-offset-primary-500 scale-125',
                          isHovered && !isHighlighted && 'scale-110',
                        )}
                        onMouseEnter={() => setHoveredPinId(defect.id)}
                        onMouseLeave={() => setHoveredPinId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailDefect(defect);
                        }}
                        aria-label={`#${defect.number}: ${defect.title}`}
                      >
                        {defect.number}
                      </button>

                      {/* Hover tooltip */}
                      {isHovered && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium px-2.5 py-1 shadow-lg pointer-events-none max-w-[200px] truncate">
                          <span className={cn('font-bold', colors.text)}>#{defect.number}</span>
                          {' '}{defect.title}
                          <span className="ml-1 opacity-70">({getSeverityLabel(defect.severity)})</span>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* ====== Defect list sidebar ====== */}
        {sidebarOpen && (
          <aside className="w-80 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('defects.onPlan.sidebarTitle')}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {filteredDefects.length} / {defects.length}
              </p>
            </div>

            {/* Sidebar search */}
            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>

            {/* Defect list */}
            <div className="flex-1 overflow-y-auto">
              {filteredDefects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MapPin size={24} className="text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('defects.onPlan.sidebarEmpty')}
                  </p>
                </div>
              ) : (
                filteredDefects.map((defect) => {
                  const colors = SEVERITY_COLORS[defect.severity];
                  return (
                    <button
                      key={defect.id}
                      onClick={() => {
                        panToPin(defect);
                        setDetailDefect(defect);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-neutral-50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors',
                        highlightedPinId === defect.id && 'bg-primary-50 dark:bg-primary-900/20',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0',
                          colors.bg,
                        )}>
                          {defect.number}
                        </span>
                        <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold', colors.badge)}>
                          {getSeverityLabel(defect.severity)}
                        </span>
                        <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold', STATUS_COLORS[defect.status])}>
                          {getStatusLabel(defect.status)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 line-clamp-1">
                        {defect.title}
                      </p>
                      {defect.assigneeName && (
                        <div className="flex items-center gap-1 mt-1">
                          <User size={11} className="text-neutral-400" />
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">{defect.assigneeName}</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Create defect drawer */}
      {createPos && (
        <CreateDefectForm
          clickPos={createPos}
          onSave={handleCreate}
          onCancel={() => setCreatePos(null)}
        />
      )}

      {/* Detail drawer */}
      {detailDefect && (
        <DefectDetailDrawer defect={detailDefect} onClose={() => setDetailDefect(null)} />
      )}
    </div>
  );
};

export default DefectOnPlanPage;
