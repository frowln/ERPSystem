import React from 'react';
import { cn } from '@/lib/cn';
import { AssigneeAvatar } from './AssigneeAvatar';
import type { ChannelMember } from '@/api/messaging';

interface MentionPopupProps {
  members: ChannelMember[];
  query: string;
  selectedIndex: number;
  onSelect: (member: ChannelMember) => void;
  className?: string;
}

export const MentionPopup: React.FC<MentionPopupProps> = ({
  members,
  query,
  selectedIndex,
  onSelect,
  className,
}) => {
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto',
        'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
        'rounded-lg shadow-lg z-40',
        className,
      )}
    >
      {filtered.map((member, idx) => (
        <button
          key={member.id}
          onClick={() => onSelect(member)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
            idx === selectedIndex
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700',
          )}
        >
          <AssigneeAvatar name={member.name} size="xs" />
          <span className="truncate">{member.name}</span>
        </button>
      ))}
    </div>
  );
};
