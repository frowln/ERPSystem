import React from 'react';
import { X } from 'lucide-react';
import { t } from '@/i18n';

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: t('shortcuts.general'),
    shortcuts: [
      { keys: ['⌘', 'K'], description: t('shortcuts.commandPalette') },
      { keys: ['?'], description: t('shortcuts.keyboardShortcuts') },
    ],
  },
  {
    title: t('shortcuts.navigation'),
    shortcuts: [
      { keys: ['g', 'h'], description: t('nav.dashboard') },
      { keys: ['g', 'p'], description: t('nav.projects') },
      { keys: ['g', 't'], description: t('nav.tasks') },
      { keys: ['g', 'd'], description: t('nav.documents') },
      { keys: ['g', 'f'], description: t('nav.finance') },
      { keys: ['g', 'm'], description: t('messaging.channels') },
      { keys: ['g', 'a'], description: t('nav.analytics') },
      { keys: ['g', 's'], description: t('nav.settings') },
    ],
  },
];

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-lg animate-slide-up">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('shortcuts.title')}
            </h2>
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1.5">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-xs text-neutral-300 mx-0.5">+</span>}
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
