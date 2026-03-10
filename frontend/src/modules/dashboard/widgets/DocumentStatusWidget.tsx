import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, FileCheck2, FileClock, FileX } from 'lucide-react';
import { documentsApi } from '@/api/documents';
import { t } from '@/i18n';

const DocumentStatusWidget: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['documents', 'all'],
    queryFn: () => documentsApi.getDocuments({ page: 0, size: 10000 }),
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const docs = data?.content ?? [];
    const draft = docs.filter((d) => d.status === 'DRAFT').length;
    const review = docs.filter((d) => d.status === 'UNDER_REVIEW').length;
    const approved = docs.filter((d) => d.status === 'APPROVED' || d.status === 'ACTIVE').length;
    const rejected = docs.filter((d) => d.status === 'CANCELLED' || d.status === 'ARCHIVED').length;

    return [
      { label: t('dashboard.wid.docDraft'), count: draft, icon: FileText, color: 'text-neutral-400' },
      { label: t('dashboard.wid.docReview'), count: review, icon: FileClock, color: 'text-warning-500' },
      { label: t('dashboard.wid.docApproved'), count: approved, icon: FileCheck2, color: 'text-success-500' },
      { label: t('dashboard.wid.docRejected'), count: rejected, icon: FileX, color: 'text-danger-500' },
    ];
  }, [data]);

  const total = stats.reduce((s, item) => s + item.count, 0);

  return (
    <div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tabular-nums">{total}</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{t('dashboard.wid.docTotal')}</p>

      <div className="space-y-2.5">
        {stats.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <item.icon size={14} className={item.color} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentStatusWidget;
