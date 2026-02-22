import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { hiddenWorkActApi, type CreateHiddenWorkActRequest } from '@/api/hiddenWorkActs';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const tp = (k: string) => t(`aosr.${k}`);

interface MaterialRow {
  name: string;
  quantity: string;
  certificate: string;
}

interface GeodeticRow {
  point: string;
  x: string;
  y: string;
  z: string;
}

const emptyMaterial: MaterialRow = { name: '', quantity: '', certificate: '' };
const emptyGeodetic: GeodeticRow = { point: '', x: '', y: '', z: '' };

export default function HiddenWorkActFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [projectId, setProjectId] = useState('');
  const [actNumber, setActNumber] = useState('');
  const [date, setDate] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [location, setLocation] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [drawingReference, setDrawingReference] = useState('');
  const [sniPReference, setSniPReference] = useState('');
  const [constructionMethod, setConstructionMethod] = useState('');
  const [nextWorkPermitted, setNextWorkPermitted] = useState('');
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [geodetics, setGeodetics] = useState<GeodeticRow[]>([]);

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const { data: existing } = useQuery({
    queryKey: ['hidden-work-act', id],
    queryFn: () => hiddenWorkActApi.getById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setProjectId(existing.projectId);
      setActNumber(existing.actNumber || '');
      setDate(existing.date);
      setWorkDescription(existing.workDescription);
      setLocation(existing.location || '');
      setInspectionDate(existing.inspectionDate || '');
      setDrawingReference(existing.drawingReference || '');
      setSniPReference(existing.sniPReference || '');
      setConstructionMethod(existing.constructionMethod || '');
      setNextWorkPermitted(existing.nextWorkPermitted || '');
      setNotes(existing.notes || '');
      try {
        if (existing.materialsUsed) setMaterials(JSON.parse(existing.materialsUsed));
      } catch { /* ignore */ }
      try {
        if (existing.geodeticData) setGeodetics(JSON.parse(existing.geodeticData));
      } catch { /* ignore */ }
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (data: CreateHiddenWorkActRequest) => hiddenWorkActApi.create(data),
    onSuccess: (act) => {
      queryClient.invalidateQueries({ queryKey: ['hidden-work-acts'] });
      toast.success(tp('createSuccess'));
      navigate(`/pto/hidden-work-acts/${act.id}`);
    },
    onError: () => toast.error(tp('createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateHiddenWorkActRequest) => hiddenWorkActApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-work-act', id] });
      toast.success(tp('updateSuccess'));
      navigate(`/pto/hidden-work-acts/${id}`);
    },
    onError: () => toast.error(tp('updateError')),
  });

  const handleSubmit = useCallback(() => {
    const filteredMaterials = materials.filter((m) => m.name.trim());
    const filteredGeodetics = geodetics.filter((g) => g.point.trim());

    const data: CreateHiddenWorkActRequest = {
      projectId,
      actNumber: actNumber || undefined,
      date,
      workDescription,
      location: location || undefined,
      inspectionDate: inspectionDate || undefined,
      drawingReference: drawingReference || undefined,
      sniPReference: sniPReference || undefined,
      constructionMethod: constructionMethod || undefined,
      nextWorkPermitted: nextWorkPermitted || undefined,
      notes: notes || undefined,
      materialsUsed: filteredMaterials.length > 0 ? JSON.stringify(filteredMaterials) : undefined,
      geodeticData: filteredGeodetics.length > 0 ? JSON.stringify(filteredGeodetics) : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }, [projectId, actNumber, date, workDescription, location, inspectionDate, drawingReference, sniPReference, constructionMethod, nextWorkPermitted, notes, materials, geodetics, isEdit]);

  const addMaterial = () => setMaterials((prev) => [...prev, { ...emptyMaterial }]);
  const removeMaterial = (i: number) => setMaterials((prev) => prev.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, field: keyof MaterialRow, value: string) => {
    setMaterials((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const addGeodetic = () => setGeodetics((prev) => [...prev, { ...emptyGeodetic }]);
  const removeGeodetic = (i: number) => setGeodetics((prev) => prev.filter((_, idx) => idx !== i));
  const updateGeodetic = (i: number, field: keyof GeodeticRow, value: string) => {
    setGeodetics((prev) => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  };

  const canSave = projectId && date && workDescription.trim();
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? tp('editTitle') : tp('createTitle')}
        subtitle={isEdit ? tp('editSubtitle') : tp('createSubtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.pto-docs'), href: '/pto/documents' },
          { label: tp('breadcrumb'), href: '/pto/hidden-work-acts' },
          { label: isEdit ? tp('edit') : tp('new') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} className="mr-1" /> {t('common.back')}
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSave} loading={saving}>
              <Save size={14} className="mr-1" /> {t('common.save')}
            </Button>
          </div>
        }
      />

      {/* General */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">{tp('sectionGeneral')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label={tp('fieldProject')} required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={tp('projectPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldNumber')}>
            <Input value={actNumber} onChange={(e) => setActNumber(e.target.value)} placeholder="AOSR-001" />
          </FormField>
          <FormField label={tp('fieldDate')} required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label={tp('fieldInspectionDate')}>
            <Input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
          </FormField>
          <FormField label={tp('fieldLocation')}>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={tp('locationPlaceholder')} />
          </FormField>
          <div />
          <div className="md:col-span-2">
            <FormField label={tp('fieldWorkDescription')} required>
              <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={4}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder={tp('workDescPlaceholder')}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Technical details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">{tp('sectionTechnical')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label={tp('fieldDrawingRef')}>
            <Input value={drawingReference} onChange={(e) => setDrawingReference(e.target.value)} placeholder={tp('drawingRefPlaceholder')} />
          </FormField>
          <FormField label={tp('fieldSniPRef')}>
            <Input value={sniPReference} onChange={(e) => setSniPReference(e.target.value)} placeholder={tp('sniPRefPlaceholder')} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label={tp('fieldConstructionMethod')}>
              <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={3}
                value={constructionMethod}
                onChange={(e) => setConstructionMethod(e.target.value)}
                placeholder={tp('methodPlaceholder')}
              />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label={tp('fieldNextWorkPermitted')}>
              <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={2}
                value={nextWorkPermitted}
                onChange={(e) => setNextWorkPermitted(e.target.value)}
                placeholder={tp('nextWorkPlaceholder')}
              />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label={tp('fieldNotes')}>
              <textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Materials used */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{tp('sectionMaterials')}</h3>
          <Button size="sm" variant="outline" onClick={addMaterial}>
            <Plus size={14} className="mr-1" /> {tp('addMaterial')}
          </Button>
        </div>
        {materials.length === 0 ? (
          <p className="text-sm text-gray-500">{tp('noMaterialsYet')}</p>
        ) : (
          <div className="space-y-3">
            {materials.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <FormField label={i === 0 ? tp('materialName') : ''}>
                  <Input value={m.name} onChange={(e) => updateMaterial(i, 'name', e.target.value)} placeholder={tp('materialNamePh')} />
                </FormField>
                <FormField label={i === 0 ? tp('materialQuantity') : ''}>
                  <Input value={m.quantity} onChange={(e) => updateMaterial(i, 'quantity', e.target.value)} placeholder="10 m3" />
                </FormField>
                <FormField label={i === 0 ? tp('materialCertificate') : ''}>
                  <Input value={m.certificate} onChange={(e) => updateMaterial(i, 'certificate', e.target.value)} placeholder={tp('certPlaceholder')} />
                </FormField>
                <Button size="sm" variant="ghost" onClick={() => removeMaterial(i)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geodetic data */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{tp('sectionGeodetic')}</h3>
          <Button size="sm" variant="outline" onClick={addGeodetic}>
            <Plus size={14} className="mr-1" /> {tp('addPoint')}
          </Button>
        </div>
        {geodetics.length === 0 ? (
          <p className="text-sm text-gray-500">{tp('noGeodeticYet')}</p>
        ) : (
          <div className="space-y-3">
            {geodetics.map((g, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end">
                <FormField label={i === 0 ? tp('geodeticPoint') : ''}>
                  <Input value={g.point} onChange={(e) => updateGeodetic(i, 'point', e.target.value)} placeholder="T1" />
                </FormField>
                <FormField label={i === 0 ? 'X' : ''}>
                  <Input value={g.x} onChange={(e) => updateGeodetic(i, 'x', e.target.value)} placeholder="0.000" />
                </FormField>
                <FormField label={i === 0 ? 'Y' : ''}>
                  <Input value={g.y} onChange={(e) => updateGeodetic(i, 'y', e.target.value)} placeholder="0.000" />
                </FormField>
                <FormField label={i === 0 ? 'Z' : ''}>
                  <Input value={g.z} onChange={(e) => updateGeodetic(i, 'z', e.target.value)} placeholder="0.000" />
                </FormField>
                <Button size="sm" variant="ghost" onClick={() => removeGeodetic(i)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
