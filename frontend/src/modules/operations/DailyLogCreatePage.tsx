import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const getWeatherOptions = () => [
  { value: 'CLEAR', label: t('operations.dailyLogCreate.weatherClear') },
  { value: 'CLOUDY', label: t('operations.dailyLogCreate.weatherCloudy') },
  { value: 'RAIN', label: t('operations.dailyLogCreate.weatherRain') },
  { value: 'SNOW', label: t('operations.dailyLogCreate.weatherSnow') },
  { value: 'WIND', label: t('operations.dailyLogCreate.weatherWind') },
  { value: 'FROST', label: t('operations.dailyLogCreate.weatherFrost') },
  { value: 'FOG', label: t('operations.dailyLogCreate.weatherFog') },
];

interface EntryForm {
  workArea: string;
  workDescription: string;
  workersCount: string;
  hoursWorked: string;
  equipmentUsed: string;
  percentComplete: string;
}

const emptyEntry: EntryForm = {
  workArea: '', workDescription: '', workersCount: '', hoursWorked: '',
  equipmentUsed: '', percentComplete: '',
};

const DailyLogCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('CLEAR');
  const [temperatureMin, setTemperatureMin] = useState('');
  const [temperatureMax, setTemperatureMax] = useState('');
  const [workersOnSite, setWorkersOnSite] = useState('');
  const [equipmentOnSite, setEquipmentOnSite] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [issuesNotes, setIssuesNotes] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [entries, setEntries] = useState<EntryForm[]>([{ ...emptyEntry }]);

  const addEntry = () => setEntries([...entries, { ...emptyEntry }]);

  const removeEntry = (index: number) => {
    if (entries.length > 1) setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof EntryForm, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('operations.dailyLogCreate.createSuccess'));
    navigate('/operations/daily-logs');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('operations.dailyLogCreate.title')}
        subtitle={t('operations.dailyLogCreate.subtitle')}
        breadcrumbs={[
          { label: t('operations.dailyLogCreate.breadcrumbHome'), href: '/' },
          { label: t('operations.dailyLogCreate.breadcrumbOperations'), href: '/operations' },
          { label: t('operations.dailyLogCreate.breadcrumbDailyLogs'), href: '/operations/daily-logs' },
          { label: t('operations.dailyLogCreate.breadcrumbNew') },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/operations/daily-logs')}>
            {t('operations.dailyLogCreate.back')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* General info */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6 mb-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('operations.dailyLogCreate.generalInfo')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('operations.dailyLogCreate.project')} required>
              <Select options={projectOptions} value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder={t('operations.dailyLogCreate.selectProject')} />
            </FormField>
            <FormField label={t('operations.dailyLogCreate.date')} required>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </FormField>
          </div>

          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 pt-2">{t('operations.dailyLogCreate.weatherConditions')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={t('operations.dailyLogCreate.weather')} required>
              <Select options={getWeatherOptions()} value={weather} onChange={(e) => setWeather(e.target.value)} />
            </FormField>
            <FormField label={t('operations.dailyLogCreate.tempMin')} required>
              <Input type="number" placeholder="-10" value={temperatureMin} onChange={(e) => setTemperatureMin(e.target.value)} />
            </FormField>
            <FormField label={t('operations.dailyLogCreate.tempMax')} required>
              <Input type="number" placeholder="5" value={temperatureMax} onChange={(e) => setTemperatureMax(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('operations.dailyLogCreate.workersOnSite')} required>
              <Input type="number" placeholder="0" value={workersOnSite} onChange={(e) => setWorkersOnSite(e.target.value)} />
            </FormField>
            <FormField label={t('operations.dailyLogCreate.equipmentUnits')} required>
              <Input type="number" placeholder="0" value={equipmentOnSite} onChange={(e) => setEquipmentOnSite(e.target.value)} />
            </FormField>
          </div>

          <FormField label={t('operations.dailyLogCreate.workDescriptionLabel')} required>
            <Textarea placeholder={t('operations.dailyLogCreate.workDescriptionPlaceholder')} value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} rows={3} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('operations.dailyLogCreate.issuesLabel')}>
              <Textarea placeholder={t('operations.dailyLogCreate.issuesPlaceholder')} value={issuesNotes} onChange={(e) => setIssuesNotes(e.target.value)} rows={2} />
            </FormField>
            <FormField label={t('operations.dailyLogCreate.safetyLabel')}>
              <Textarea placeholder={t('operations.dailyLogCreate.safetyPlaceholder')} value={safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} rows={2} />
            </FormField>
          </div>
        </div>

        {/* Work entries */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('operations.dailyLogCreate.workDetailByArea')}</h3>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addEntry}>
              {t('operations.dailyLogCreate.addArea')}
            </Button>
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('operations.dailyLogCreate.areaNumber', { number: index + 1 })}</span>
                  {entries.length > 1 && (
                    <button type="button" onClick={() => removeEntry(index)} className="p-1 text-neutral-400 hover:text-danger-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={t('operations.dailyLogCreate.workAreaLabel')}>
                    <Input placeholder={t('operations.dailyLogCreate.workAreaPlaceholder')} value={entry.workArea} onChange={(e) => updateEntry(index, 'workArea', e.target.value)} />
                  </FormField>
                  <FormField label={t('operations.dailyLogCreate.equipmentLabel')}>
                    <Input placeholder={t('operations.dailyLogCreate.equipmentPlaceholder')} value={entry.equipmentUsed} onChange={(e) => updateEntry(index, 'equipmentUsed', e.target.value)} />
                  </FormField>
                </div>
                <FormField label={t('operations.dailyLogCreate.workDescriptionEntryLabel')}>
                  <Input placeholder={t('operations.dailyLogCreate.workDescriptionEntryPlaceholder')} value={entry.workDescription} onChange={(e) => updateEntry(index, 'workDescription', e.target.value)} />
                </FormField>
                <div className="grid grid-cols-3 gap-3">
                  <FormField label={t('operations.dailyLogCreate.workersLabel')}>
                    <Input type="number" placeholder="0" value={entry.workersCount} onChange={(e) => updateEntry(index, 'workersCount', e.target.value)} />
                  </FormField>
                  <FormField label={t('operations.dailyLogCreate.hoursLabel')}>
                    <Input type="number" placeholder="8" value={entry.hoursWorked} onChange={(e) => updateEntry(index, 'hoursWorked', e.target.value)} />
                  </FormField>
                  <FormField label={t('operations.dailyLogCreate.completionPercent')}>
                    <Input type="number" placeholder="0" value={entry.percentComplete} onChange={(e) => updateEntry(index, 'percentComplete', e.target.value)} />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/operations/daily-logs')}>{t('operations.dailyLogCreate.cancel')}</Button>
          <Button type="submit" iconLeft={<Save size={16} />} disabled={!projectId || !workDescription}>
            {t('operations.dailyLogCreate.save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DailyLogCreatePage;
