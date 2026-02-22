import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Plus, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { navigation, type NavItem } from '@/config/navigation';

interface CommandItem {
  id: string;
  label: string;
  section: string;
  href: string;
  icon: React.ElementType;
  keywords?: string;
}

// Flatten navigation into searchable command items
function buildCommandItems(): CommandItem[] {
  const items: CommandItem[] = [];
  for (const group of navigation) {
    for (const item of group.items) {
      items.push({
        id: item.id,
        label: item.label,
        section: group.title,
        href: item.href,
        icon: item.icon,
        keywords: `${group.title} ${item.label}`.toLowerCase(),
      });
    }
  }
  return items;
}

const quickActions: CommandItem[] = [
  {
    id: 'qa-create-project',
    label: t('commandPalette.createProject'),
    section: t('commandPalette.actions'),
    href: '/projects/new',
    icon: Plus,
    keywords: 'создать проект новый create project',
  },
  {
    id: 'qa-create-task',
    label: t('commandPalette.createTask'),
    section: t('commandPalette.actions'),
    href: '/tasks',
    icon: Plus,
    keywords: 'создать задачу новая create task',
  },
  {
    id: 'qa-create-contract',
    label: t('commandPalette.createContract'),
    section: t('commandPalette.actions'),
    href: '/contracts/new',
    icon: Plus,
    keywords: 'создать договор контракт create contract',
  },
  {
    id: 'qa-create-document',
    label: t('commandPalette.createDocument'),
    section: t('commandPalette.actions'),
    href: '/documents/new',
    icon: Plus,
    keywords: 'создать документ create document',
  },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => [...quickActions, ...buildCommandItems()], []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show quick actions + first 8 nav items when no query
      return [...quickActions, ...buildCommandItems().slice(0, 8)];
    }
    const lower = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.section.toLowerCase().includes(lower) ||
        (item.keywords && item.keywords.includes(lower)),
    );
  }, [query, allItems]);

  // Group by section
  const groupedItems = useMemo(() => {
    const groups: { section: string; items: CommandItem[] }[] = [];
    const seen = new Map<string, CommandItem[]>();
    for (const item of filteredItems) {
      if (!seen.has(item.section)) {
        const arr: CommandItem[] = [];
        seen.set(item.section, arr);
        groups.push({ section: item.section, items: arr });
      }
      seen.get(item.section)!.push(item);
    }
    return groups;
  }, [filteredItems]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Focus with tiny delay for animation
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      onClose();
      navigate(item.href);
    },
    [navigate, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filteredItems, selectedIndex, handleSelect, onClose],
  );

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-command-palette bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[15vh] z-command-palette mx-auto max-w-xl animate-slide-up">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <Search size={18} className="text-neutral-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('filters.search')}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-neutral-400 dark:text-neutral-100"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {t('empty.noResults')}
              </div>
            ) : (
              groupedItems.map((group) => (
                <div key={group.section}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    {group.section}
                  </div>
                  {group.items.map((item) => {
                    flatIndex++;
                    const isActive = flatIndex === selectedIndex;
                    const Icon = item.icon;
                    const idx = flatIndex; // capture
                    return (
                      <button
                        key={item.id}
                        data-active={isActive}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                        )}
                      >
                        <Icon size={16} className={cn('flex-shrink-0', isActive ? 'text-primary-500' : 'text-neutral-400')} />
                        <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                        {isActive && <CornerDownLeft size={14} className="text-primary-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[10px]">↑↓</kbd>
              {t('common.select')}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[10px]">↵</kbd>
              {t('common.open')}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[10px]">esc</kbd>
              {t('common.close')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
