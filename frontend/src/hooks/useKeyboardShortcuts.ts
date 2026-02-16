import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';

type ShortcutHandler = () => void;

interface ShortcutDefinition {
  key: string;
  description: string;
  handler: ShortcutHandler;
  /** If true, requires a "g" prefix (two-key chord: g then key) */
  chord?: boolean;
}

/**
 * Returns keyboard shortcut definitions for the app.
 * Chord shortcuts use "g" as prefix (press g, then the key within 500ms).
 */
export function useKeyboardShortcuts(
  onOpenCommandPalette: () => void,
  onOpenShortcutsHelp: () => void,
) {
  const navigate = useNavigate();
  const chordPending = useRef(false);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shortcuts: ShortcutDefinition[] = [
    // Direct shortcuts
    { key: '?', description: t('shortcuts.showHelp'), handler: onOpenShortcutsHelp },
    // Chord shortcuts (g + key)
    { key: 'h', description: t('shortcuts.goHome'), handler: () => navigate('/'), chord: true },
    { key: 'p', description: t('shortcuts.goProjects'), handler: () => navigate('/projects'), chord: true },
    { key: 't', description: t('shortcuts.goTasks'), handler: () => navigate('/tasks'), chord: true },
    { key: 'd', description: t('shortcuts.goDocuments'), handler: () => navigate('/documents'), chord: true },
    { key: 'f', description: t('shortcuts.goFinance'), handler: () => navigate('/budgets'), chord: true },
    { key: 's', description: t('shortcuts.goSettings'), handler: () => navigate('/settings'), chord: true },
    { key: 'm', description: t('shortcuts.goMessenger'), handler: () => navigate('/messaging'), chord: true },
    { key: 'a', description: t('shortcuts.goAnalytics'), handler: () => navigate('/analytics'), chord: true },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // Handle chord initiation (press "g")
      if (key === 'g' && !chordPending.current) {
        chordPending.current = true;
        if (chordTimer.current) clearTimeout(chordTimer.current);
        chordTimer.current = setTimeout(() => {
          chordPending.current = false;
        }, 500);
        return;
      }

      // Handle chord completion
      if (chordPending.current) {
        chordPending.current = false;
        if (chordTimer.current) clearTimeout(chordTimer.current);
        const match = shortcuts.find((s) => s.chord && s.key === key);
        if (match) {
          e.preventDefault();
          match.handler();
        }
        return;
      }

      // Direct shortcuts
      const direct = shortcuts.find((s) => !s.chord && s.key === key);
      if (direct) {
        e.preventDefault();
        direct.handler();
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (chordTimer.current) clearTimeout(chordTimer.current);
    };
  }, [handleKeyDown]);

  return shortcuts;
}
