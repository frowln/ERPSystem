import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Settings, ArrowRight, Plus, Trash2, RefreshCw, Database, Table2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { EmptyState } from '@/design-system/components/EmptyState';
import { dataExchangeApi } from '@/api/dataExchange';
import { t } from '@/i18n';
import type { FieldMapping, ImportEntityType } from './types';

const getEntityTypeLabels = (): Record<string, string> => ({
  PROJECTS: t('dataExchange.entityProjects'),
  CONTRACTS: t('dataExchange.entityContracts'),
  MATERIALS: t('dataExchange.entityMaterials'),
  EMPLOYEES: t('dataExchange.entityEmployees'),
  DOCUMENTS: t('dataExchange.entityDocuments'),
  WBS: t('dataExchange.entityWbs'),
  BUDGET_ITEMS: t('dataExchange.entityBudgetItems'),
  INVOICES: t('dataExchange.entityInvoices'),
});

const getFallbackMappingsByEntity = (): Record<ImportEntityType, FieldMapping[]> => ({
  MATERIALS: [
    { sourceColumn: t('dataExchange.mappingSourceName'), targetField: 'name', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceProductCode'), targetField: 'code', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceCategory'), targetField: 'category', isRequired: true, transformation: 'LOOKUP' },
    { sourceColumn: t('dataExchange.mappingSourceUnit'), targetField: 'unitOfMeasure', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourcePrice'), targetField: 'currentPrice', isRequired: false, transformation: 'PARSE_NUMBER' },
  ],
  EMPLOYEES: [
    { sourceColumn: t('dataExchange.mappingSourceFullName'), targetField: 'fullName', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceTabNumber'), targetField: 'employeeNumber', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourcePosition'), targetField: 'position', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceDepartment'), targetField: 'departmentName', isRequired: false },
    { sourceColumn: t('dataExchange.mappingSourceHireDate'), targetField: 'hireDate', isRequired: true, transformation: 'PARSE_DATE' },
    { sourceColumn: t('dataExchange.mappingSourcePhone'), targetField: 'phone', isRequired: false },
    { sourceColumn: 'Email', targetField: 'EMAIL', isRequired: false },
  ],
  CONTRACTS: [
    { sourceColumn: t('dataExchange.mappingSourceContractNumber'), targetField: 'number', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceName'), targetField: 'name', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceContractor'), targetField: 'partnerName', isRequired: true },
    { sourceColumn: t('dataExchange.mappingSourceAmount'), targetField: 'amount', isRequired: true, transformation: 'PARSE_NUMBER' },
    { sourceColumn: t('dataExchange.mappingSourceContractDate'), targetField: 'contractDate', isRequired: true, transformation: 'PARSE_DATE' },
  ],
  PROJECTS: [],
  DOCUMENTS: [],
  WBS: [],
  BUDGET_ITEMS: [],
  INVOICES: [],
});

const getTransformationLabels = (): Record<string, string> => ({
  PARSE_DATE: t('dataExchange.transformationParseDate'),
  PARSE_NUMBER: t('dataExchange.transformationParseNumber'),
  LOOKUP: t('dataExchange.transformationLookup'),
  UPPERCASE: t('dataExchange.transformationUppercase'),
  TRIM: t('dataExchange.transformationTrim'),
});

const MappingConfigPage: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<ImportEntityType>('MATERIALS');
  const [editedMappings, setEditedMappings] = useState<FieldMapping[] | null>(null);

  const { data: mappings } = useQuery({
    queryKey: ['field-mappings', selectedEntity],
    queryFn: () => dataExchangeApi.getFieldMappings(selectedEntity),
  });

  const currentMappings = editedMappings ?? mappings ?? getFallbackMappingsByEntity()[selectedEntity] ?? [];

  const stats = useMemo(() => ({
    total: currentMappings.length,
    required: currentMappings.filter((m) => m.isRequired).length,
    withTransformation: currentMappings.filter((m) => m.transformation).length,
  }), [currentMappings]);

  const handleEntityChange = (entity: ImportEntityType) => {
    setSelectedEntity(entity);
    setEditedMappings(null);
  };

  const handleUpdateMapping = (index: number, field: keyof FieldMapping, value: string | boolean) => {
    const updated = [...currentMappings];
    updated[index] = { ...updated[index], [field]: value };
    setEditedMappings(updated);
  };

  const handleAddMapping = () => {
    setEditedMappings([...currentMappings, { sourceColumn: '', targetField: '', isRequired: false }]);
  };

  const handleRemoveMapping = (index: number) => {
    const updated = currentMappings.filter((_, i) => i !== index);
    setEditedMappings(updated);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dataExchange.mappingTitle')}
        subtitle={t('dataExchange.mappingSubtitle')}
        breadcrumbs={[
          { label: t('dataExchange.breadcrumbHome'), href: '/' },
          { label: t('dataExchange.breadcrumbDataExchange'), href: '/data-exchange' },
          { label: t('dataExchange.breadcrumbMapping') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" iconLeft={<RefreshCw size={16} />} onClick={() => setEditedMappings(null)}>
              {t('dataExchange.resetButton')}
            </Button>
            <Button iconLeft={<Save size={16} />}>
              {t('dataExchange.saveButton')}
            </Button>
          </div>
        }
      />

      {/* Entity selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Table2 size={18} />} label={t('dataExchange.metricMappingFields')} value={stats.total} />
        <MetricCard icon={<Database size={18} />} label={t('dataExchange.metricRequired')} value={stats.required} />
        <MetricCard icon={<Settings size={18} />} label={t('dataExchange.metricWithTransformation')} value={stats.withTransformation} />
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">{t('dataExchange.entityTypeLabel')}</label>
          <Select
            options={Object.entries(getEntityTypeLabels()).map(([value, label]) => ({ value, label }))}
            value={selectedEntity}
            onChange={(e) => handleEntityChange(e.target.value as ImportEntityType)}
          />
        </div>
      </div>

      {/* Mapping table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t('dataExchange.mappingTableTitle', { entity: getEntityTypeLabels()[selectedEntity] })}
          </h3>
          <Button variant="outline" size="sm" iconLeft={<Plus size={14} />} onClick={handleAddMapping}>
            {t('dataExchange.addFieldButton')}
          </Button>
        </div>

        {currentMappings.length === 0 ? (
          <EmptyState
            title={t('dataExchange.emptyMappingTitle')}
            description={t('dataExchange.emptyMappingDescription', { entity: getEntityTypeLabels()[selectedEntity] })}
          />
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              <div className="col-span-3">{t('dataExchange.headerSourceColumn')}</div>
              <div className="col-span-1 flex justify-center"><ArrowRight size={14} /></div>
              <div className="col-span-3">{t('dataExchange.headerTargetField')}</div>
              <div className="col-span-2">{t('dataExchange.headerTransformation')}</div>
              <div className="col-span-2">{t('dataExchange.headerRequired')}</div>
              <div className="col-span-1"></div>
            </div>

            {currentMappings.map((mapping, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
              >
                <div className="col-span-3">
                  <Input
                    value={mapping.sourceColumn}
                    onChange={(e) => handleUpdateMapping(index, 'sourceColumn', e.target.value)}
                    placeholder={t('dataExchange.placeholderSourceColumn')}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <ArrowRight size={16} className="text-neutral-400" />
                </div>
                <div className="col-span-3">
                  <Input
                    value={mapping.targetField}
                    onChange={(e) => handleUpdateMapping(index, 'targetField', e.target.value)}
                    placeholder={t('dataExchange.placeholderTargetField')}
                    className="text-sm font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    options={[
                      { value: '', label: t('dataExchange.transformationNone') },
                      ...Object.entries(getTransformationLabels()).map(([value, label]) => ({ value, label })),
                    ]}
                    value={mapping.transformation ?? ''}
                    onChange={(e) => handleUpdateMapping(index, 'transformation', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mapping.isRequired}
                    onChange={(e) => handleUpdateMapping(index, 'isRequired', e.target.checked)}
                    className="rounded border-neutral-300 dark:border-neutral-600"
                  />
                  <span className="text-sm text-neutral-600">
                    {mapping.isRequired ? t('dataExchange.requiredYes') : t('dataExchange.requiredNo')}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleRemoveMapping(index)}
                  >
                    <Trash2 size={14} className="text-neutral-400 hover:text-danger-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help text */}
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-1">{t('dataExchange.helpTitle')}</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>{t('dataExchange.helpSourceColumn')}</li>
            <li>{t('dataExchange.helpTargetField')}</li>
            <li>{t('dataExchange.helpTransformations')}</li>
            <li>{t('dataExchange.helpRequired')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MappingConfigPage;
