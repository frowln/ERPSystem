import React from 'react';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export const InfoRow: React.FC<InfoRowProps> = React.memo(({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 break-words">{value}</p>
    </div>
  </div>
));

InfoRow.displayName = 'InfoRow';
