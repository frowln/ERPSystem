import { useCallback, useEffect, useRef, useState } from 'react';

interface DraftEntry<T> {
  value: T;
  savedAt: string; // ISO timestamp
}

interface UseFormDraftReturn<T> {
  draft: T | null;
  saveDraft: (value: T) => void;
  clearDraft: () => void;
  draftAge: string | null; // human-readable age, e.g. "2 minutes ago"
}

function formatDraftAge(savedAt: string): string {
  const diffMs = Date.now() - new Date(savedAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'only now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1 hour ago';
  return `${diffHr} hours ago`;
}

export function useFormDraft<T>(
  key: string,
  initialValue: T,
  debounceMs = 2000,
): UseFormDraftReturn<T> {
  const storageKey = `form-draft:${key}`;

  // Load draft once on mount
  const [draft, setDraft] = useState<T | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const entry: DraftEntry<T> = JSON.parse(raw);
      return entry.value ?? null;
    } catch {
      return null;
    }
  });

  const [savedAt, setSavedAt] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const entry: DraftEntry<T> = JSON.parse(raw);
      return entry.savedAt ?? null;
    } catch {
      return null;
    }
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(
    (value: T) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        try {
          const now = new Date().toISOString();
          const entry: DraftEntry<T> = { value, savedAt: now };
          localStorage.setItem(storageKey, JSON.stringify(entry));
          setSavedAt(now);
        } catch {
          // localStorage unavailable (private mode, quota exceeded, etc.)
        }
      }, debounceMs);
    },
    [storageKey, debounceMs],
  );

  const clearDraft = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setDraft(null);
    setSavedAt(null);
  }, [storageKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const draftAge = savedAt ? formatDraftAge(savedAt) : null;

  return { draft, saveDraft, clearDraft, draftAge };
}
