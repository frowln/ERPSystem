import React, { useCallback, useMemo, useState } from 'react';
import { PageHeader } from '@/design-system/components';
import DrawingPinViewer, { type DrawingPin } from './DrawingPinViewer';
import { t } from '@/i18n';
import type { TaskStatus, TaskPriority } from '@/types';
import { X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock drawings
// ---------------------------------------------------------------------------

interface Drawing {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
}

const MOCK_DRAWINGS: Drawing[] = [
  { id: 'c3d4e5f6-0001-4000-8000-000000000001', name: 'Plan 1-go etazha', code: 'AR-001', imageUrl: '' },
  { id: 'c3d4e5f6-0001-4000-8000-000000000002', name: 'Plan 2-go etazha', code: 'AR-002', imageUrl: '' },
  { id: 'c3d4e5f6-0001-4000-8000-000000000003', name: 'Plan podvala', code: 'AR-003', imageUrl: '' },
];

// ---------------------------------------------------------------------------
// SVG floor plan inline (placeholder)
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
  <!-- Outer walls -->
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="#374151" stroke-width="4"/>
  <!-- Room 1 -->
  <rect x="60" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="240" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">101</text>
  <text x="240" y="255" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Office</text>
  <!-- Room 2 -->
  <rect x="420" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="600" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">102</text>
  <text x="600" y="255" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Conference</text>
  <!-- Room 3 -->
  <rect x="780" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="960" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">103</text>
  <text x="960" y="255" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Lab</text>
  <!-- Room 4 -->
  <rect x="60" y="400" width="540" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="330" y="570" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">104</text>
  <text x="330" y="595" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Workshop</text>
  <!-- Room 5 -->
  <rect x="600" y="400" width="540" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="870" y="570" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">105</text>
  <text x="870" y="595" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">Storage</text>
  <!-- Doors -->
  <line x1="200" y1="400" x2="280" y2="400" stroke="#f9fafb" stroke-width="5"/>
  <path d="M 200 400 A 80 80 0 0 1 280 400" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4"/>
  <line x1="540" y1="230" x2="540" y2="310" stroke="#f9fafb" stroke-width="5"/>
  <line x1="780" y1="180" x2="780" y2="260" stroke="#f9fafb" stroke-width="5"/>
  <line x1="720" y1="400" x2="720" y2="480" stroke="#f9fafb" stroke-width="5"/>
  <!-- Corridor label -->
  <text x="600" y="395" text-anchor="middle" font-size="11" fill="#9ca3af" font-family="sans-serif">CORRIDOR</text>
  <!-- Compass -->
  <circle cx="1100" cy="720" r="20" fill="none" stroke="#d1d5db" stroke-width="1"/>
  <text x="1100" y="707" text-anchor="middle" font-size="10" fill="#6b7280" font-family="sans-serif" font-weight="bold">N</text>
  <line x1="1100" y1="715" x2="1100" y2="735" stroke="#9ca3af" stroke-width="1.5"/>
  <polygon points="1100,700 1096,710 1104,710" fill="#6b7280"/>
  <!-- Scale -->
  <line x1="80" y1="760" x2="280" y2="760" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="80" y1="755" x2="80" y2="765" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="280" y1="755" x2="280" y2="765" stroke="#9ca3af" stroke-width="1.5"/>
  <text x="180" y="775" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="sans-serif">10 m</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Mock pins
// ---------------------------------------------------------------------------

const MOCK_PINS: DrawingPin[] = [
  {
    id: 'd5e6f7a8-0001-4000-8000-000000000001',
    taskId: 'd5e6f7a8-1001-4000-8000-000000000001',
    taskCode: 'DEF-001',
    taskTitle: 'Crack in wall partition Room 101',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeName: 'Ivanov A.S.',
    dueDate: '2026-03-15',
    x: 20,
    y: 28,
    isOverdue: false,
    createdAt: '2026-03-01',
  },
  {
    id: 'd5e6f7a8-0001-4000-8000-000000000002',
    taskId: 'd5e6f7a8-1001-4000-8000-000000000002',
    taskCode: 'DEF-002',
    taskTitle: 'Water damage on ceiling - Conference Room',
    status: 'TODO',
    priority: 'URGENT',
    assigneeName: 'Petrov V.M.',
    dueDate: '2026-03-05',
    x: 50,
    y: 20,
    isOverdue: true,
    createdAt: '2026-02-28',
  },
  {
    id: 'd5e6f7a8-0001-4000-8000-000000000003',
    taskId: 'd5e6f7a8-1001-4000-8000-000000000003',
    taskCode: 'DEF-003',
    taskTitle: 'Incorrect outlet placement Lab 103',
    status: 'IN_REVIEW',
    priority: 'NORMAL',
    assigneeName: 'Sidorova E.K.',
    dueDate: '2026-03-20',
    x: 82,
    y: 25,
    isOverdue: false,
    createdAt: '2026-03-02',
  },
  {
    id: 'd5e6f7a8-0001-4000-8000-000000000004',
    taskId: 'd5e6f7a8-1001-4000-8000-000000000004',
    taskCode: 'DEF-004',
    taskTitle: 'Floor tile chipping - Workshop entrance',
    status: 'DONE',
    priority: 'LOW',
    assigneeName: 'Kozlov D.A.',
    x: 22,
    y: 55,
    isOverdue: false,
    createdAt: '2026-02-20',
  },
  {
    id: 'd5e6f7a8-0001-4000-8000-000000000005',
    taskId: 'd5e6f7a8-1001-4000-8000-000000000005',
    taskCode: 'DEF-005',
    taskTitle: 'Fire alarm sensor missing - Storage 105',
    status: 'BACKLOG',
    priority: 'CRITICAL',
    assigneeName: 'Morozov R.P.',
    dueDate: '2026-03-10',
    x: 75,
    y: 68,
    isOverdue: true,
    createdAt: '2026-03-03',
  },
  {
    id: 'd5e6f7a8-0001-4000-8000-000000000006',
    taskId: 'd5e6f7a8-1001-4000-8000-000000000006',
    taskCode: 'DEF-006',
    taskTitle: 'HVAC duct misalignment above corridor',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeName: 'Volkova N.I.',
    dueDate: '2026-03-18',
    x: 50,
    y: 48,
    isOverdue: false,
    createdAt: '2026-03-04',
  },
];

// ---------------------------------------------------------------------------
// Create Pin Modal
// ---------------------------------------------------------------------------

interface CreatePinModalProps {
  x: number;
  y: number;
  onSave: (data: { title: string; assignee: string; priority: TaskPriority }) => void;
  onCancel: () => void;
}

const CreatePinModal: React.FC<CreatePinModalProps> = ({ x, y, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), assignee: assignee.trim(), priority });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t('drawingPins.createPinTitle')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('drawingPins.pinModeHint')} &mdash; ({x.toFixed(1)}%, {y.toFixed(1)}%)
          </p>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('drawingPins.createPinFieldTitle')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder={t('drawingPins.createPinFieldDescription')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('drawingPins.createPinFieldAssignee')}
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder={t('drawingPins.createPinFieldAssignee')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('drawingPins.createPinFieldPriority')}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {t('drawingPins.createPinSave')}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const DrawingPinsPage: React.FC = () => {
  const [selectedDrawing, setSelectedDrawing] = useState(MOCK_DRAWINGS[0]);
  const [pins, setPins] = useState<DrawingPin[]>(MOCK_PINS);
  const [createModal, setCreateModal] = useState<{ x: number; y: number } | null>(null);

  const imageUrl = useMemo(() => floorPlanDataUrl(), []);

  const handlePinCreate = useCallback((x: number, y: number) => {
    setCreateModal({ x, y });
  }, []);

  const handlePinSave = useCallback(
    (data: { title: string; assignee: string; priority: TaskPriority }) => {
      if (!createModal) return;
      const newPin: DrawingPin = {
        id: `p-${Date.now()}`,
        taskId: `t-${Date.now()}`,
        taskCode: `DEF-${String(pins.length + 1).padStart(3, '0')}`,
        taskTitle: data.title,
        status: 'TODO',
        priority: data.priority,
        assigneeName: data.assignee || undefined,
        x: createModal.x,
        y: createModal.y,
        isOverdue: false,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setPins((prev) => [...prev, newPin]);
      setCreateModal(null);
    },
    [createModal, pins.length],
  );

  const handlePinDelete = useCallback((pinId: string) => {
    setPins((prev) => prev.filter((p) => p.id !== pinId));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('drawingPins.title')}
        subtitle={t('drawingPins.subtitle')}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('drawingPins.title') },
        ]}
        actions={
          <select
            value={selectedDrawing.id}
            onChange={(e) => {
              const d = MOCK_DRAWINGS.find((d) => d.id === e.target.value);
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
        }
      />

      <div className="flex-1 min-h-0 px-4 pb-4 lg:px-6 lg:pb-6">
        <DrawingPinViewer
          imageUrl={imageUrl}
          pins={pins}
          onPinCreate={handlePinCreate}
          onPinClick={() => {}}
          onPinDelete={handlePinDelete}
          className="h-full"
        />
      </div>

      {/* Create pin modal */}
      {createModal && (
        <CreatePinModal
          x={createModal.x}
          y={createModal.y}
          onSave={handlePinSave}
          onCancel={() => setCreateModal(null)}
        />
      )}
    </div>
  );
};

export default DrawingPinsPage;
