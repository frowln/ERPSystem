import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  FileText,
  User,
  Calendar,
  Clock,
  HardDrive,
  Edit,
  Trash2,
  AlertTriangle,
  Upload,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { bimApi } from '@/api/bim';
import { formatDateLong, formatFileSize, formatNumber } from '@/lib/format';
import toast from 'react-hot-toast';

const modelStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  in_progress: 'blue',
  review: 'yellow',
  approved: 'green',
  published: 'purple',
  archived: 'gray',
};

const modelStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  in_progress: 'В работе',
  review: 'На проверке',
  approved: 'Утверждена',
  published: 'Опубликована',
  archived: 'В архиве',
};

interface LinkedDesignPackage {
  id: string;
  name: string;
  discipline: string;
  status: string;
}

interface ClashSummary {
  total: number;
  critical: number;
  major: number;
  minor: number;
  resolved: number;
}

interface BimModelDetail {
  id: string;
  name: string;
  code: string;
  status: string;
  discipline: string;
  version: string;
  projectName: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  elementsCount: number;
  authorName: string;
  lastModifiedByName: string;
  softwareUsed: string;
  lodLevel: string;
  coordinateSystem: string;
  createdAt: string;
  updatedAt: string;
}

const BimModelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const { data: model } = useQuery({
    queryKey: ['bim-model', id],
    queryFn: async () => {
      const data = await bimApi.getModel(id!);
      return data as unknown as BimModelDetail;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => bimApi.deleteModel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-models'] });
      toast.success('BIM-модель удалена');
      navigate('/bim/models');
    },
  });

  const defaultModel: BimModelDetail = {
    id: id ?? '',
    name: '',
    code: '',
    status: 'REVIEW',
    discipline: '',
    version: '',
    projectName: '',
    fileName: '',
    fileSize: 0,
    fileFormat: '',
    elementsCount: 0,
    authorName: '',
    lastModifiedByName: '',
    softwareUsed: '',
    lodLevel: '',
    coordinateSystem: '',
    createdAt: '',
    updatedAt: '',
  };

  const m = model ?? defaultModel;
  const clashSummary: ClashSummary = { total: 0, critical: 0, major: 0, minor: 0, resolved: 0 };
  const linkedPackages: LinkedDesignPackage[] = [];

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Удалить BIM-модель?',
      description: 'Операция необратима. Модель будет удалена из системы.',
      confirmLabel: 'Удалить модель',
      cancelLabel: 'Отмена',
      items: [m.code],
    });
    if (!isConfirmed) return;

    deleteMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={m.name}
        subtitle={`${m.code} / ${m.projectName}`}
        backTo="/bim/models"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'BIM модели', href: '/bim/models' },
          { label: m.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={m.status} colorMap={modelStatusColorMap} label={modelStatusLabels[m.status] ?? m.status} size="md" />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Upload size={14} />}
              onClick={() => {
                toast('Загрузка новой версии доступна в реестре BIM-моделей');
                navigate('/bim/models');
              }}
            >
              Новая версия
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast('Редактирование доступно в реестре BIM-моделей');
                navigate('/bim/models');
              }}
            >
              Редактировать
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              Удалить
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Model info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Box size={16} className="text-primary-500" />
              Информация о модели
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Раздел</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.discipline}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Версия</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">v{m.version}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Уровень проработки</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.lodLevel}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Кол-во элементов</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatNumber(m.elementsCount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Координатная система</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.coordinateSystem}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">ПО</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.softwareUsed}</p>
              </div>
            </div>
          </div>

          {/* File details */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <HardDrive size={16} className="text-primary-500" />
              Файл
            </h3>
            <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.fileName}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{m.fileFormat} -- {formatFileSize(m.fileSize)}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.success(`Скачивание файла ${m.fileName} запущено`)}
              >
                Скачать
              </Button>
            </div>
          </div>

          {/* Clash summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              Сводка по коллизиям
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Всего</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{clashSummary.total}</p>
              </div>
              <div className="p-3 bg-danger-50 rounded-lg border border-danger-200 text-center">
                <p className="text-xs text-danger-600 mb-1">Критические</p>
                <p className="text-xl font-bold text-danger-700">{clashSummary.critical}</p>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg border border-warning-200 text-center">
                <p className="text-xs text-warning-600 mb-1">Значительные</p>
                <p className="text-xl font-bold text-warning-700">{clashSummary.major}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-blue-600 mb-1">Незначительные</p>
                <p className="text-xl font-bold text-blue-700">{clashSummary.minor}</p>
              </div>
              <div className="p-3 bg-success-50 rounded-lg border border-success-200 text-center">
                <p className="text-xs text-success-600 mb-1">Устранено</p>
                <p className="text-xl font-bold text-success-700">{clashSummary.resolved}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={() => navigate('/bim/clash-detection')}>Перейти к коллизиям</Button>
            </div>
          </div>

          {/* Linked design packages */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-primary-500" />
              Связанные комплекты ({linkedPackages.length})
            </h3>
            <div className="space-y-2">
              {linkedPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/bim/design-packages`)}>
                  <div>
                    <p className="text-sm font-medium text-primary-600">{pkg.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{pkg.discipline}</p>
                  </div>
                  <StatusBadge status={pkg.status} colorMap={modelStatusColorMap} label={modelStatusLabels[pkg.status] ?? pkg.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детали</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label="Автор" value={m.authorName} />
              <InfoItem icon={<User size={15} />} label="Последнее изменение" value={m.lastModifiedByName} />
              <InfoItem icon={<Calendar size={15} />} label="Создана" value={formatDateLong(m.createdAt)} />
              <InfoItem icon={<Clock size={15} />} label="Обновлена" value={formatDateLong(m.updatedAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default BimModelDetailPage;
