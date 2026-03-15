import React from 'react';
import { Play, BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Video URL config — all null until actual videos are recorded
// ---------------------------------------------------------------------------

const videoUrls: Record<string, string | null> = {
  projects: null,
  tasks: null,
  budgets: null,
  estimates: null,
  safety: null,
  quality: null,
  warehouse: null,
  contracts: null,
  counterparties: null,
  hr: null,
  fleet: null,
  planning: null,
  closing: null,
  specifications: null,
  procurement: null,
  documents: null,
  finance: null,
  analytics: null,
  integrations: null,
  admin: null,
};

// Knowledge-base article paths by module
const kbArticles: Record<string, string> = {
  projects: '/help/kb/projects',
  tasks: '/help/kb/tasks',
  budgets: '/help/kb/finance',
  estimates: '/help/kb/estimates',
  safety: '/help/kb/safety',
  quality: '/help/kb/quality',
  warehouse: '/help/kb/warehouse',
  contracts: '/help/kb/contracts',
  counterparties: '/help/kb/counterparties',
  hr: '/help/kb/hr',
  fleet: '/help/kb/fleet',
  planning: '/help/kb/planning',
  closing: '/help/kb/closing',
  specifications: '/help/kb/specifications',
  procurement: '/help/kb/procurement',
  documents: '/help/kb/documents',
  finance: '/help/kb/finance',
  analytics: '/help/kb/analytics',
  integrations: '/help/kb/integrations',
  admin: '/help/kb/admin',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoTourProps {
  moduleId: string;
  title: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VideoTour: React.FC<VideoTourProps> = ({
  moduleId,
  title,
  className,
}) => {
  const videoUrl = videoUrls[moduleId] ?? null;
  const kbPath = kbArticles[moduleId];

  // If there's a real video URL — show the embedded player
  if (videoUrl) {
    return (
      <div
        className={cn(
          'rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700',
          className,
        )}
      >
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={videoUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="px-4 py-3 bg-white dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {title}
          </p>
        </div>
      </div>
    );
  }

  // Placeholder card
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 dark:border-neutral-700',
        'bg-white dark:bg-neutral-900 overflow-hidden',
        className,
      )}
    >
      {/* Video placeholder area */}
      <div className="relative flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 h-44">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            <Play
              size={28}
              className="text-neutral-400 dark:text-neutral-500 ml-1"
            />
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center px-4">
            Видеоинструкция будет доступна в ближайшее время
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
          {title}
        </p>
        {kbPath && (
          <a
            href={kbPath}
            className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            <BookOpen size={14} />
            Читать в базе знаний
          </a>
        )}
      </div>
    </div>
  );
};

export default VideoTour;
