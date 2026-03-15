import { cn } from '@/lib/cn';
import { formatDateShort } from '@/lib/format';
import {
  Activity,
  FileText,
  ShieldAlert,
  DollarSign,
  User,
  Settings,
  ExternalLink,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: 'task' | 'document' | 'safety' | 'finance' | 'user' | 'system';
  action: string;
  actorName: string;
  entityName?: string;
  entityUrl?: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<ActivityItem['type'], typeof Activity> = {
  task: Activity,
  document: FileText,
  safety: ShieldAlert,
  finance: DollarSign,
  user: User,
  system: Settings,
};

const COLOR_MAP: Record<ActivityItem['type'], string> = {
  task: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  document: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  safety: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  finance: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  user: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs) || diffMs < 0) return isoString;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'только что';
  if (minutes < 60) {
    const word = pluralize(minutes, 'минуту', 'минуты', 'минут');
    return `${minutes} ${word} назад`;
  }
  if (hours < 24) {
    const word = pluralize(hours, 'час', 'часа', 'часов');
    return `${hours} ${word} назад`;
  }
  if (days === 1) return 'вчера';
  if (days < 7) {
    const word = pluralize(days, 'день', 'дня', 'дней');
    return `${days} ${word} назад`;
  }
  return days > 365
    ? formatDateShort(isoString) + ' ' + new Date(isoString).getFullYear()
    : formatDateShort(isoString);
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ActivityFeed({ items, maxItems = 20, className }: ActivityFeedProps) {
  const visibleItems = items.slice(0, maxItems);

  if (visibleItems.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-gray-400 dark:text-gray-500', className)}>
        Нет активности
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {visibleItems.map((item) => {
        const Icon = ICON_MAP[item.type] || Settings;
        const colorClass = COLOR_MAP[item.type] || COLOR_MAP.system;

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            {/* Icon */}
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                colorClass,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">{item.actorName}</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{item.action}</span>
                {item.entityName && (
                  <>
                    {' '}
                    {item.entityUrl ? (
                      <a
                        href={item.entityUrl}
                        className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {item.entityName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-medium">{item.entityName}</span>
                    )}
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeTime(item.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ActivityFeed;
