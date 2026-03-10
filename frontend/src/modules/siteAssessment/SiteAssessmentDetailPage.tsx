import React, { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { siteAssessmentsApi, type SiteAssessment } from '@/api/siteAssessments';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import { Edit3, ArrowLeft, MapPin, CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';

const FileAttachmentPanel = lazy(() => import('@/design-system/components/FileAttachmentPanel'));

const CRITERIA_KEYS = [
  'accessRoads',
  'powerSupplyAvailable',
  'waterSupplyAvailable',
  'sewageAvailable',
  'groundConditionsOk',
  'noEnvironmentalRestrictions',
  'cranePlacementPossible',
  'materialStorageArea',
  'workersCampArea',
  'neighboringBuildingsSafe',
  'zoningCompliant',
  'geodeticMarksPresent',
] as const;

const recColorMap: Record<string, string> = {
  GO: 'green',
  CONDITIONAL: 'yellow',
  NO_GO: 'red',
};

const SiteAssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading } = useQuery<SiteAssessment>({
    queryKey: ['site-assessment', id],
    queryFn: () => siteAssessmentsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading || !assessment) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const a = assessment;
  const recLabel =
    a.recommendation === 'GO' ? t('siteAssessment.recGo') :
    a.recommendation === 'CONDITIONAL' ? t('siteAssessment.recConditional') :
    t('siteAssessment.recNoGo');

  const statusLabel =
    a.status === 'DRAFT' ? t('siteAssessment.statusDraft') :
    a.status === 'COMPLETED' ? t('siteAssessment.statusCompleted') :
    t('siteAssessment.statusApproved');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('siteAssessment.detailTitle')}
        subtitle={a.siteAddress}
        backTo="/site-assessments"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('siteAssessment.breadcrumbPreConstruction') },
          { label: t('siteAssessment.breadcrumbList'), href: '/site-assessments' },
          { label: t('siteAssessment.breadcrumbDetail') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={a.status}
              colorMap={{ DRAFT: 'gray', COMPLETED: 'blue', APPROVED: 'green' }}
              label={statusLabel}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/site-assessments/${id}/edit`)}
            >
              {t('siteAssessment.edit')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('siteAssessment.basicInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
              <InfoItem label={t('siteAssessment.siteAddress')} value={a.siteAddress} />
              <InfoItem label={t('siteAssessment.assessorName')} value={a.assessorName} />
              <InfoItem label={t('siteAssessment.assessmentDate')} value={formatDate(a.assessmentDate)} />
              {a.projectId && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('siteAssessment.projectLink')}</p>
                  <button
                    onClick={() => navigate(`/projects/${a.projectId}`)}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    {a.projectName || t('siteAssessment.goToProject')}
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scoring criteria */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('siteAssessment.scoringCriteria')}
            </h3>
            <div className="space-y-3">
              {CRITERIA_KEYS.map((key) => {
                const isMet = (a as any)[key] as boolean ?? false;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {t(`siteAssessment.criteria.${key}`)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t(`siteAssessment.criteria.${key}Hint`)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      isMet ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isMet}
                        disabled
                        className="w-4 h-4 rounded cursor-not-allowed"
                      />
                      <span className={`text-xs font-medium ${
                        isMet ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {isMet ? t('siteAssessment.scoreMet') : t('siteAssessment.scoreNotMet')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geotechnical Section */}
          {(a.soilTypeDetail || a.groundwaterDepthM != null || a.bearingCapacityKpa != null || a.seismicZone) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('siteAssessment.geo.title')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                {a.soilTypeDetail && <InfoItem label={t('siteAssessment.geo.soilType')} value={a.soilTypeDetail} />}
                {a.groundwaterDepthM != null && <InfoItem label={t('siteAssessment.geo.groundwater')} value={String(a.groundwaterDepthM)} />}
                {a.bearingCapacityKpa != null && <InfoItem label={t('siteAssessment.geo.bearingCapacity')} value={String(a.bearingCapacityKpa)} />}
                {a.seismicZone && <InfoItem label={t('siteAssessment.geo.seismicZone')} value={a.seismicZone} />}
              </div>
            </div>
          )}

          {/* Environmental Section */}
          {(a.phase1Status || a.phase2Status || a.contaminationNotes) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('siteAssessment.env.title')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                {a.phase1Status && (
                  <InfoItem
                    label={t('siteAssessment.env.phase1')}
                    value={t(`siteAssessment.env.statuses.${a.phase1Status}` as any) || a.phase1Status}
                  />
                )}
                {a.phase2Status && (
                  <InfoItem
                    label={t('siteAssessment.env.phase2')}
                    value={t(`siteAssessment.env.statuses.${a.phase2Status}` as any) || a.phase2Status}
                  />
                )}
                {a.contaminationNotes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('siteAssessment.env.contamination')}</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{a.contaminationNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Utilities Section */}
          {(a.powerCapacityKw != null || a.waterPressureBar != null || a.gasAvailable || a.telecomAvailable || a.sewerAvailable) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('siteAssessment.util.title')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                {a.powerCapacityKw != null && <InfoItem label={t('siteAssessment.util.power')} value={String(a.powerCapacityKw)} />}
                {a.waterPressureBar != null && <InfoItem label={t('siteAssessment.util.waterPressure')} value={String(a.waterPressureBar)} />}
                <InfoItem label={t('siteAssessment.util.gas')} value={a.gasAvailable ? t('siteAssessment.util.available') : t('siteAssessment.util.notAvailable')} />
                <InfoItem label={t('siteAssessment.util.telecom')} value={a.telecomAvailable ? t('siteAssessment.util.available') : t('siteAssessment.util.notAvailable')} />
                <InfoItem label={t('siteAssessment.util.sewer')} value={a.sewerAvailable ? t('siteAssessment.util.available') : t('siteAssessment.util.notAvailable')} />
              </div>
            </div>
          )}

          {/* Notes */}
          {a.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                {t('siteAssessment.notes')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{a.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {id && (
            <Suspense fallback={<div className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
              <FileAttachmentPanel entityType="SITE_ASSESSMENT" entityId={id} />
            </Suspense>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score summary */}
          <div className={`rounded-xl border p-6 ${
            (a.score ?? 0) > 10 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            (a.score ?? 0) >= 7 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('siteAssessment.totalScore')}</p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{a.score ?? 0}/12</p>
            <div className="mt-4 pt-4 border-t border-current/10">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('siteAssessment.recommendation')}</p>
              <div className="flex items-center gap-2">
                {a.recommendation === 'GO' && <CheckCircle size={18} className="text-green-600" />}
                {a.recommendation === 'CONDITIONAL' && <AlertTriangle size={18} className="text-yellow-600" />}
                {a.recommendation === 'NO_GO' && <XCircle size={18} className="text-red-600" />}
                <span className={`text-sm font-bold ${
                  a.recommendation === 'GO' ? 'text-green-700 dark:text-green-400' :
                  a.recommendation === 'CONDITIONAL' ? 'text-yellow-700 dark:text-yellow-400' :
                  'text-red-700 dark:text-red-400'
                }`}>
                  {recLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                iconLeft={<Edit3 size={14} />}
                onClick={() => navigate(`/site-assessments/${id}/edit`)}
              >
                {t('siteAssessment.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                iconLeft={<ArrowLeft size={14} />}
                onClick={() => navigate('/site-assessments')}
              >
                {t('siteAssessment.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
  </div>
);

export default SiteAssessmentDetailPage;
