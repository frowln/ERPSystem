import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { siteAssessmentsApi } from '@/api/siteAssessments';
import { projectsApi } from '@/api/projects';
import { Save, ArrowLeft, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

/* ---- Criteria management ---- */
interface Criterion {
  id: string;
  label: string;
  hint: string;
  backendKey?: string; // maps to backend column if it's a standard criterion
}

const CRITERIA_STORAGE_KEY = 'privod-site-criteria';

const DEFAULT_CRITERIA: Criterion[] = [
  { id: 'accessRoads', label: 'Подъездные пути', hint: 'Наличие подъездных путей к площадке', backendKey: 'accessRoads' },
  { id: 'powerSupplyAvailable', label: 'Электроснабжение', hint: 'Возможность подключения электроснабжения', backendKey: 'powerSupplyAvailable' },
  { id: 'waterSupplyAvailable', label: 'Водоснабжение', hint: 'Наличие водоснабжения на площадке', backendKey: 'waterSupplyAvailable' },
  { id: 'sewageAvailable', label: 'Канализация', hint: 'Наличие канализационных систем', backendKey: 'sewageAvailable' },
  { id: 'groundConditionsOk', label: 'Состояние грунта', hint: 'Грунт пригоден для строительства', backendKey: 'groundConditionsOk' },
  { id: 'noEnvironmentalRestrictions', label: 'Экологические ограничения', hint: 'Отсутствие экологических ограничений', backendKey: 'noEnvironmentalRestrictions' },
  { id: 'cranePlacementPossible', label: 'Размещение крана', hint: 'Возможность установки грузоподъёмных механизмов', backendKey: 'cranePlacementPossible' },
  { id: 'materialStorageArea', label: 'Склад материалов', hint: 'Площадка для хранения материалов', backendKey: 'materialStorageArea' },
  { id: 'workersCampArea', label: 'Бытовой городок', hint: 'Место для размещения бытовых помещений', backendKey: 'workersCampArea' },
  { id: 'neighboringBuildingsSafe', label: 'Соседние строения', hint: 'Безопасность прилегающих зданий и сооружений', backendKey: 'neighboringBuildingsSafe' },
  { id: 'zoningCompliant', label: 'Зонирование', hint: 'Соответствие территориального зонирования', backendKey: 'zoningCompliant' },
  { id: 'geodeticMarksPresent', label: 'Геодезические метки', hint: 'Наличие геодезических реперов и отметок', backendKey: 'geodeticMarksPresent' },
];

function loadCriteria(): Criterion[] {
  try {
    const stored = localStorage.getItem(CRITERIA_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [...DEFAULT_CRITERIA];
}

function saveCriteria(criteria: Criterion[]) {
  try {
    localStorage.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(criteria));
  } catch { /* ignore */ }
}

/* ---- Component ---- */
const SiteAssessmentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const resp = await projectsApi.getProjects({ page: 0, size: 100 });
      return resp.content ?? [];
    },
  });

  // Criteria state
  const [criteria, setCriteria] = useState<Criterion[]>(loadCriteria);
  const [scores, setScores] = useState<Record<string, boolean>>({});
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editHint, setEditHint] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHint, setNewHint] = useState('');

  // Basic form fields
  const [projectId, setProjectId] = useState(searchParams.get('projectId') ?? '');
  const [siteAddress, setSiteAddress] = useState('');
  const [assessorName, setAssessorName] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Geotechnical fields
  const [soilTypeDetail, setSoilTypeDetail] = useState('');
  const [groundwaterDepthM, setGroundwaterDepthM] = useState('');
  const [bearingCapacityKpa, setBearingCapacityKpa] = useState('');
  const [seismicZone, setSeismicZone] = useState('');
  // Environmental fields
  const [phase1Status, setPhase1Status] = useState('');
  const [phase2Status, setPhase2Status] = useState('');
  const [contaminationNotes, setContaminationNotes] = useState('');
  // Utilities fields
  const [powerCapacityKw, setPowerCapacityKw] = useState('');
  const [waterPressureBar, setWaterPressureBar] = useState('');
  const [gasAvailable, setGasAvailable] = useState(false);
  const [telecomAvailable, setTelecomAvailable] = useState(false);
  const [sewerAvailable, setSewerAvailable] = useState(false);

  // Collapsible section state
  const [geoOpen, setGeoOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [utilOpen, setUtilOpen] = useState(false);

  // Initialize scores for all criteria
  useEffect(() => {
    setScores(prev => {
      const next = { ...prev };
      for (const c of criteria) {
        if (!(c.id in next)) next[c.id] = false;
      }
      return next;
    });
  }, [criteria]);

  // Save criteria when they change
  useEffect(() => {
    saveCriteria(criteria);
  }, [criteria]);

  // Auto-fill address from linked project (#33)
  useEffect(() => {
    if (!projectId || !projects) return;
    const selected = (projects as any[]).find((p: any) => String(p.id) === String(projectId));
    if (selected?.address && !siteAddress) {
      setSiteAddress(selected.address);
    }
  }, [projectId, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalScore = criteria.reduce((sum, c) => sum + (scores[c.id] ? 1 : 0), 0);
  const totalCriteria = criteria.length;
  const getRecommendation = () => {
    if (totalScore === 0) return { label: t('siteAssessment.assessmentNotStarted'), value: 'NOT_STARTED' };
    // Fixed-point thresholds matching backend (SiteAssessment.calculateScore)
    if (totalScore >= 10) return { label: t('siteAssessment.recommendationGo'), value: 'GO' };
    if (totalScore >= 7) return { label: t('siteAssessment.recommendationConditional'), value: 'CONDITIONAL' };
    return { label: t('siteAssessment.recommendationNoGo'), value: 'NO_GO' };
  };
  const recommendation = getRecommendation();

  // Criteria management
  const handleDeleteCriterion = (criterionId: string) => {
    setCriteria(prev => prev.filter(c => c.id !== criterionId));
    setScores(prev => {
      const next = { ...prev };
      delete next[criterionId];
      return next;
    });
  };

  const handleStartEdit = (c: Criterion) => {
    setEditingCriterion(c.id);
    setEditLabel(c.label);
    setEditHint(c.hint);
  };

  const handleSaveEdit = () => {
    if (!editingCriterion || !editLabel.trim()) return;
    setCriteria(prev => prev.map(c =>
      c.id === editingCriterion ? { ...c, label: editLabel.trim(), hint: editHint.trim() } : c
    ));
    setEditingCriterion(null);
  };

  const handleAddCriterion = () => {
    if (!newLabel.trim()) return;
    const newCriterion: Criterion = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      hint: newHint.trim(),
    };
    setCriteria(prev => [...prev, newCriterion]);
    setScores(prev => ({ ...prev, [newCriterion.id]: false }));
    setNewLabel('');
    setNewHint('');
    setAddingNew(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!siteAddress.trim()) errs.siteAddress = t('siteAssessment.validationAddress');
    if (!assessorName.trim()) errs.assessorName = t('siteAssessment.validationAssessor');
    if (!assessmentDate) errs.assessmentDate = t('siteAssessment.validationDate');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build payload with backend column mappings
      const payload: Record<string, any> = {
        projectId,
        siteAddress,
        assessorName,
        assessmentDate,
      };
      // Map criteria with backendKey to backend columns
      for (const c of criteria) {
        if (c.backendKey) {
          payload[c.backendKey] = scores[c.id] ?? false;
        }
      }
      // Geotechnical expansion
      if (soilTypeDetail) payload.soilTypeDetail = soilTypeDetail;
      if (groundwaterDepthM) payload.groundwaterDepthM = parseFloat(groundwaterDepthM);
      if (bearingCapacityKpa) payload.bearingCapacityKpa = parseFloat(bearingCapacityKpa);
      if (seismicZone) payload.seismicZone = seismicZone;
      // Environmental
      if (phase1Status) payload.phase1Status = phase1Status;
      if (phase2Status) payload.phase2Status = phase2Status;
      if (contaminationNotes) payload.contaminationNotes = contaminationNotes;
      // Utilities
      if (powerCapacityKw) payload.powerCapacityKw = parseFloat(powerCapacityKw);
      if (waterPressureBar) payload.waterPressureBar = parseFloat(waterPressureBar);
      payload.gasAvailable = gasAvailable;
      payload.telecomAvailable = telecomAvailable;
      payload.sewerAvailable = sewerAvailable;
      if (isNew) {
        return siteAssessmentsApi.create(payload as any);
      }
      return siteAssessmentsApi.update(id!, payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-assessments'] });
      toast.success(isNew ? t('siteAssessment.toastSaved') : t('siteAssessment.toastUpdated'));
      if (projectId) {
        navigate(`/projects/${projectId}?tab=preConstruction`);
      } else {
        navigate('/site-assessments');
      }
    },
    onError: () => {
      toast.error(t('siteAssessment.toastError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    saveMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? t('siteAssessment.newTitle') : t('siteAssessment.editTitle')}
        subtitle={t('siteAssessment.subtitle')}
        backTo="/site-assessments"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('siteAssessment.breadcrumbPreConstruction') },
          { label: t('siteAssessment.breadcrumbList'), href: '/site-assessments' },
          { label: isNew ? t('siteAssessment.breadcrumbNew') : t('siteAssessment.breadcrumbEdit') },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('siteAssessment.basicInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('siteAssessment.project')}
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
              >
                <option value="">{t('siteAssessment.projectPlaceholder')}</option>
                {(projects ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('siteAssessment.assessmentDate')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={e => setAssessmentDate(e.target.value)}
                className={`w-full rounded-lg border ${errors.assessmentDate ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'} bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100`}
              />
              {errors.assessmentDate && <p className="text-xs text-red-500 mt-1">{errors.assessmentDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('siteAssessment.siteAddress')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={siteAddress}
                onChange={e => setSiteAddress(e.target.value)}
                placeholder={t('siteAssessment.siteAddressPlaceholder')}
                className={`w-full rounded-lg border ${errors.siteAddress ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'} bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100`}
              />
              {errors.siteAddress && <p className="text-xs text-red-500 mt-1">{errors.siteAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('siteAssessment.assessorName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assessorName}
                onChange={e => setAssessorName(e.target.value)}
                placeholder={t('siteAssessment.assessorNamePlaceholder')}
                className={`w-full rounded-lg border ${errors.assessorName ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'} bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100`}
              />
              {errors.assessorName && <p className="text-xs text-red-500 mt-1">{errors.assessorName}</p>}
            </div>
          </div>
        </div>

        {/* Scoring Criteria */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('siteAssessment.scoringCriteria')}
            </h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingNew(true)}>
              <Plus size={14} className="mr-1" /> {t('common.add')}
            </Button>
          </div>

          <div className="space-y-1">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="flex items-center gap-2 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 group">
                {editingCriterion === criterion.id ? (
                  // Edit mode
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100"
                      placeholder={t('siteAssessment.criterionName')}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editHint}
                      onChange={e => setEditHint(e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100"
                      placeholder={t('siteAssessment.criterionHint')}
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={handleSaveEdit} className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600">
                        <Check size={16} />
                      </button>
                      <button type="button" onClick={() => setEditingCriterion(null)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <>
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scores[criterion.id] ?? false}
                        onChange={e => setScores(prev => ({ ...prev, [criterion.id]: e.target.checked }))}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{criterion.label}</p>
                        {criterion.hint && <p className="text-xs text-neutral-500 dark:text-neutral-400">{criterion.hint}</p>}
                      </div>
                    </label>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(criterion)}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                        aria-label={t('common.edit')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCriterion(criterion.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add new criterion inline */}
            {addingNew && (
              <div className="flex flex-col sm:flex-row gap-2 py-3 border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-3">
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder={t('siteAssessment.criterionName')}
                  autoFocus
                />
                <input
                  type="text"
                  value={newHint}
                  onChange={e => setNewHint(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder={t('siteAssessment.criterionHint')}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleAddCriterion} disabled={!newLabel.trim()}>
                    <Check size={14} className="mr-1" /> {t('common.save')}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingNew(false); setNewLabel(''); setNewHint(''); }}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Score Summary */}
        <div className={`rounded-xl border p-6 ${
          recommendation.value === 'NOT_STARTED' ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700' :
          recommendation.value === 'GO' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          recommendation.value === 'CONDITIONAL' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('siteAssessment.totalScore')}</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{totalScore}/{totalCriteria}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('siteAssessment.recommendation')}</p>
              <p className={`text-lg font-bold ${
                recommendation.value === 'NOT_STARTED' ? 'text-neutral-500 dark:text-neutral-400' :
                recommendation.value === 'GO' ? 'text-green-700 dark:text-green-400' :
                recommendation.value === 'CONDITIONAL' ? 'text-yellow-700 dark:text-yellow-400' :
                'text-red-700 dark:text-red-400'
              }`}>
                {recommendation.label}
              </p>
            </div>
          </div>
        </div>

        {/* Geotechnical Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setGeoOpen(!geoOpen)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('siteAssessment.geo.title')}
            </h3>
            {geoOpen ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
          </button>
          {geoOpen && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.geo.soilType')}
                </label>
                <input
                  type="text"
                  value={soilTypeDetail}
                  onChange={e => setSoilTypeDetail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.geo.groundwater')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={groundwaterDepthM}
                  onChange={e => setGroundwaterDepthM(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.geo.bearingCapacity')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bearingCapacityKpa}
                  onChange={e => setBearingCapacityKpa(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.geo.seismicZone')}
                </label>
                <input
                  type="text"
                  value={seismicZone}
                  onChange={e => setSeismicZone(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Environmental Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setEnvOpen(!envOpen)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('siteAssessment.env.title')}
            </h3>
            {envOpen ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
          </button>
          {envOpen && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.env.phase1')}
                </label>
                <select
                  value={phase1Status}
                  onChange={e => setPhase1Status(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">&mdash;</option>
                  <option value="NOT_STARTED">{t('siteAssessment.env.statuses.NOT_STARTED')}</option>
                  <option value="IN_PROGRESS">{t('siteAssessment.env.statuses.IN_PROGRESS')}</option>
                  <option value="COMPLETED">{t('siteAssessment.env.statuses.COMPLETED')}</option>
                  <option value="NOT_REQUIRED">{t('siteAssessment.env.statuses.NOT_REQUIRED')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.env.phase2')}
                </label>
                <select
                  value={phase2Status}
                  onChange={e => setPhase2Status(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">&mdash;</option>
                  <option value="NOT_STARTED">{t('siteAssessment.env.statuses.NOT_STARTED')}</option>
                  <option value="IN_PROGRESS">{t('siteAssessment.env.statuses.IN_PROGRESS')}</option>
                  <option value="COMPLETED">{t('siteAssessment.env.statuses.COMPLETED')}</option>
                  <option value="NOT_REQUIRED">{t('siteAssessment.env.statuses.NOT_REQUIRED')}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.env.contamination')}
                </label>
                <textarea
                  value={contaminationNotes}
                  onChange={e => setContaminationNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 resize-y"
                />
              </div>
            </div>
          )}
        </div>

        {/* Utilities Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setUtilOpen(!utilOpen)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('siteAssessment.util.title')}
            </h3>
            {utilOpen ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
          </button>
          {utilOpen && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.util.power')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={powerCapacityKw}
                  onChange={e => setPowerCapacityKw(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('siteAssessment.util.waterPressure')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={waterPressureBar}
                  onChange={e => setWaterPressureBar(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={gasAvailable}
                  onChange={e => setGasAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 cursor-pointer"
                />
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('siteAssessment.util.gas')}
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={telecomAvailable}
                  onChange={e => setTelecomAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 cursor-pointer"
                />
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('siteAssessment.util.telecom')}
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={sewerAvailable}
                  onChange={e => setSewerAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 cursor-pointer"
                />
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('siteAssessment.util.sewer')}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('siteAssessment.notes')}
          </h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder={t('siteAssessment.notesPlaceholder')}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            iconLeft={<Save size={16} />}
            loading={saveMutation.isPending}
          >
            {t('siteAssessment.save')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            iconLeft={<ArrowLeft size={16} />}
            onClick={() => navigate('/site-assessments')}
          >
            {t('siteAssessment.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SiteAssessmentFormPage;
