import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, AlertTriangle, XCircle, Plus } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { siteAssessmentsApi, type SiteAssessment } from '@/api/siteAssessments';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';

const recIcons: Record<string, React.ReactNode> = {
  GO: <CheckCircle size={14} className="text-green-500" />,
  CONDITIONAL: <AlertTriangle size={14} className="text-yellow-500" />,
  NO_GO: <XCircle size={14} className="text-red-500" />,
};

const recColors: Record<string, string> = {
  GO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONDITIONAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  NO_GO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const SiteAssessmentPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const navigate = useNavigate();

  const { data: assessments = [], isLoading } = useQuery<SiteAssessment[]>({
    queryKey: ['site-assessments', projectId],
    queryFn: () => siteAssessmentsApi.getByProject(projectId),
  });

  const getRecLabel = (rec: string): string => {
    if (rec === 'GO') return t('siteAssessment.recGo');
    if (rec === 'CONDITIONAL') return t('siteAssessment.recConditional');
    return t('siteAssessment.recNoGo');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('siteAssessment.panelTitle')}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/site-assessments/new?projectId=${projectId}`)}>
          <Plus size={14} className="mr-1" /> {t('common.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))
        ) : assessments.length === 0 ? (
          <div className="text-center py-6">
            <MapPin size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t('siteAssessment.panelEmpty')}</p>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/site-assessments/new?projectId=${projectId}`)}>
              {t('siteAssessment.panelCreate')}
            </Button>
          </div>
        ) : (
          assessments.map((sa) => (
            <div
              key={sa.id}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/site-assessments/${sa.id}`)}
            >
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 dark:text-neutral-400"><MapPin size={16} /></span>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {sa.siteAddress || formatDate(sa.assessmentDate)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDate(sa.assessmentDate)} · {sa.score}/12
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${recColors[sa.recommendation] ?? recColors.CONDITIONAL}`}>
                {recIcons[sa.recommendation]}
                {getRecLabel(sa.recommendation)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SiteAssessmentPanel;
