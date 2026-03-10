import React from 'react';
import {
  MousePointer2,
  Type,
  MoveRight,
  Square,
  Circle,
  Cloud,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export type MarkupTool = 'SELECT' | 'TEXT' | 'ARROW' | 'RECTANGLE' | 'CIRCLE' | 'CLOUD' | 'FREEHAND';

const PRESET_COLORS = ['#FF0000', '#2563EB', '#16A34A', '#EAB308', '#000000'] as const;
const STROKE_WIDTHS = [1, 2, 3, 5] as const;

interface MarkupToolbarProps {
  activeTool: MarkupTool;
  onToolChange: (tool: MarkupTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  activeStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

const tools: { id: MarkupTool; icon: React.ElementType; labelKey: string }[] = [
  { id: 'SELECT', icon: MousePointer2, labelKey: 'drawings.markup.select' },
  { id: 'TEXT', icon: Type, labelKey: 'drawings.markup.text' },
  { id: 'ARROW', icon: MoveRight, labelKey: 'drawings.markup.arrow' },
  { id: 'RECTANGLE', icon: Square, labelKey: 'drawings.markup.rectangle' },
  { id: 'CIRCLE', icon: Circle, labelKey: 'drawings.markup.circle' },
  { id: 'CLOUD', icon: Cloud, labelKey: 'drawings.markup.cloud' },
  { id: 'FREEHAND', icon: Pencil, labelKey: 'drawings.markup.freehand' },
];

const MarkupToolbar: React.FC<MarkupToolbarProps> = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  activeStrokeWidth,
  onStrokeWidthChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 shadow-sm">
      <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {t('drawings.markup.toolbar')}
      </p>

      {tools.map(({ id, icon: Icon, labelKey }) => (
        <button
          key={id}
          type="button"
          title={t(labelKey)}
          onClick={() => onToolChange(id)}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
            activeTool === id
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
          )}
        >
          <Icon size={18} />
        </button>
      ))}

      <div className="w-full h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

      {/* Color picker */}
      <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        {t('drawings.markup.color')}
      </p>
      <div className="flex flex-col gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            className={cn(
              'w-6 h-6 rounded-full border-2 mx-auto transition-transform',
              activeColor === color
                ? 'border-primary-500 scale-110'
                : 'border-transparent hover:scale-105',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="w-full h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

      {/* Stroke width */}
      <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        {t('drawings.markup.strokeWidth')}
      </p>
      <div className="flex flex-col gap-1">
        {STROKE_WIDTHS.map((width) => (
          <button
            key={width}
            type="button"
            onClick={() => onStrokeWidthChange(width)}
            className={cn(
              'flex items-center justify-center w-8 h-6 rounded transition-colors',
              activeStrokeWidth === width
                ? 'bg-primary-100 dark:bg-primary-900/40'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            )}
          >
            <div
              className="rounded-full bg-neutral-800 dark:bg-neutral-200"
              style={{ width: 16, height: width }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MarkupToolbar;
