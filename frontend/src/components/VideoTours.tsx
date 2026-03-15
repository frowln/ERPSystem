import React, { useState } from 'react';
import { X, Play, Clock, Video, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tutorial {
  id: string;
  titleKey: string;
  descriptionKey: string;
  videoUrl: string;
  duration: string;
}

interface VideoToursProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Tutorial Data
// ---------------------------------------------------------------------------

const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    titleKey: 'videoTours.topics.gettingStarted',
    descriptionKey: 'videoTours.topics.gettingStartedDesc',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '5:30',
  },
  {
    id: 'creating-project',
    titleKey: 'videoTours.topics.creatingProject',
    descriptionKey: 'videoTours.topics.creatingProjectDesc',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '8:15',
  },
  {
    id: 'uploading-estimates',
    titleKey: 'videoTours.topics.uploadingEstimates',
    descriptionKey: 'videoTours.topics.uploadingEstimatesDesc',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '6:45',
  },
  {
    id: 'managing-tasks',
    titleKey: 'videoTours.topics.managingTasks',
    descriptionKey: 'videoTours.topics.managingTasksDesc',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '7:20',
  },
  {
    id: 'print-documents',
    titleKey: 'videoTours.topics.printDocuments',
    descriptionKey: 'videoTours.topics.printDocumentsDesc',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '4:50',
  },
  {
    id: 'safety-module',
    titleKey: 'videoTours.topics.safetyModule',
    descriptionKey: 'videoTours.topics.safetyModuleDesc',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '9:10',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VideoTours: React.FC<VideoToursProps> = ({ isOpen, onClose }) => {
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-overlay transition-opacity"
        onClick={() => {
          if (activeVideo) {
            setActiveVideo(null);
          } else {
            onClose();
          }
        }}
      />

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t(activeVideo.titleKey as any)}
              </h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={activeVideo.videoUrl}
                title={t(activeVideo.titleKey as any)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[480px] max-w-[90vw] z-modal',
          'bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-700',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                {t('videoTours.title')}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('videoTours.description')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tutorial List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {TUTORIALS.map((tutorial) => (
            <button
              key={tutorial.id}
              onClick={() => setActiveVideo(tutorial)}
              className={cn(
                'w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-700',
                'bg-white dark:bg-neutral-800/50 p-4',
                'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm',
                'transition-all group',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail placeholder */}
                <div className="w-20 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20">
                  <Play className="w-6 h-6 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {t(tutorial.titleKey as any)}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                    {t(tutorial.descriptionKey as any)}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                      <Clock className="w-3 h-3" />
                      {tutorial.duration}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-primary-600 dark:text-primary-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('videoTours.watch')}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default VideoTours;
