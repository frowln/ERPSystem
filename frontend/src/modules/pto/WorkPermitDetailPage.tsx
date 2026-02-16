import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  User,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  FileText,
  Link2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { formatDateLong, formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';
import { ptoApi } from '@/api/pto';

const permitStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  submitted: 'blue',
  approved: 'cyan',
  active: 'green',
  expired: 'red',
  closed: 'purple',
  rejected: 'red',
};

const permitStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Подан',
  approved: 'Одобрен',
  active: 'Действует',
  expired: 'Истёк',
  closed: 'Закрыт',
  rejected: 'Отклонён',
};

const workPermitTypeLabels: Record<string, string> = {
  hot_work: 'Огневые работы',
  confined_space: 'Работа в замкнутых пространствах',
  height_work: 'Работа на высоте',
  excavation: 'Земляные работы',
  electrical: 'Электромонтажные работы',
  crane: 'Работа с грузоподъёмным оборудованием',
  demolition: 'Демонтажные работы',
};

interface WorkPermit {
  id: string;
  number: string;
  type: string;
  status: string;
  location: string;
  projectName: string;
  description: string;
  conditions: string[];
  startDate: string;
  endDate: string;
  responsibleId: string;
  responsibleName: string;
  issuedByName: string;
  safetyOfficerName: string;
  workersCount: number;
  createdAt: string;
  updatedAt: string;
}

const statusActions: Record<string, { label: string; target: string }[]> = {
  draft: [{ label: 'Подать на согласование', target: 'SUBMITTED' }],
  submitted: [
    { label: 'Одобрить', target: 'APPROVED' },
    { label: 'Отклонить', target: 'REJECTED' },
  ],
  approved: [{ label: 'Активировать', target: 'ACTIVE' }],
  active: [{ label: 'Закрыть', target: 'CLOSED' }],
  rejected: [{ label: 'На доработку', target: 'DRAFT' }],
};

const WorkPermitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: rawPermit, isLoading: wpLoading } = useQuery({
    queryKey: ['work-permit', id],
    queryFn: () => ptoApi.getWorkPermit(id!),
    enabled: !!id,
  });

  if (wpLoading || !rawPermit) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  }

  const wp: WorkPermit = {
    id: rawPermit.id,
    number: rawPermit.number,
    type: rawPermit.type,
    status: rawPermit.status,
    location: rawPermit.location,
    projectName: rawPermit.projectName,
    description: rawPermit.description,
    conditions: (rawPermit as any).conditions ?? [],
    startDate: rawPermit.startDate,
    endDate: rawPermit.endDate,
    responsibleId: (rawPermit as any).responsibleId ?? '',
    responsibleName: (rawPermit as any).responsibleName ?? rawPermit.issuer,
    issuedByName: rawPermit.issuer,
    safetyOfficerName: (rawPermit as any).safetyOfficerName ?? '',
    workersCount: (rawPermit as any).workersCount ?? 0,
    createdAt: (rawPermit as any).createdAt ?? rawPermit.startDate,
    updatedAt: (rawPermit as any).updatedAt ?? rawPermit.startDate,
  };
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? wp.status;
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);

  const handleStatusChange = (targetStatus: string) => {
    setStatusOverride(targetStatus);
    toast.success(`Статус наряда: ${permitStatusLabels[targetStatus] ?? targetStatus}`);
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Удалить наряд-допуск?',
      description: 'Операция необратима. Наряд-допуск будет удален.',
      confirmLabel: 'Удалить наряд',
      cancelLabel: 'Отмена',
      items: [wp.number],
    });
    if (!isConfirmed) return;

    toast.success('Наряд-допуск удален');
    navigate('/pto/work-permits');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={wp.number}
        subtitle={`${wp.projectName} / ${workPermitTypeLabels[wp.type] ?? wp.type}`}
        backTo="/pto/work-permits"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Наряды-допуски', href: '/pto/work-permits' },
          { label: wp.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={permitStatusColorMap} label={permitStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant={a.target === 'APPROVED' || a.target === 'ACTIVE' ? 'success' : a.target === 'REJECTED' ? 'danger' : 'secondary'} size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast('Редактирование доступно в реестре нарядов-допусков');
                navigate('/pto/work-permits');
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
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-primary-500" />
              Описание работ
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{wp.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Тип работ</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{workPermitTypeLabels[wp.type] ?? wp.type}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Количество работников</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{wp.workersCount} чел.</p>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-warning-50 rounded-xl border border-warning-200 p-6">
            <h3 className="text-sm font-semibold text-warning-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-600" />
              Условия проведения работ ({wp.conditions.length})
            </h3>
            <div className="space-y-2">
              {wp.conditions.map((condition, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-warning-200">
                  <span className="text-xs font-bold text-warning-600 mt-0.5 flex-shrink-0">{idx + 1}.</span>
                  <p className="text-sm text-warning-900">{condition}</p>
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
              <InfoItem icon={<MapPin size={15} />} label="Место проведения" value={wp.location} />
              <InfoItem icon={<Calendar size={15} />} label="Начало" value={formatDateLong(wp.startDate)} />
              <InfoItem icon={<Calendar size={15} />} label="Окончание" value={formatDateLong(wp.endDate)} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Ответственные</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label="Ответственный за работы" value={wp.responsibleName} />
              <InfoItem icon={<User size={15} />} label="Выдал наряд" value={wp.issuedByName} />
              <InfoItem icon={<Shield size={15} />} label="Инженер по ОТ" value={wp.safetyOfficerName} />
            </div>
          </div>

          {/* Status validity */}
          <div className={`rounded-xl border p-6 ${wp.status === 'ACTIVE' ? 'bg-success-50 border-success-200' : wp.status === 'EXPIRED' ? 'bg-danger-50 border-danger-200' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'}`}>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
              {wp.status === 'ACTIVE' ? <CheckCircle2 size={15} className="text-success-600" /> : <Clock size={15} />}
              Статус действия
            </h3>
            <p className={`text-lg font-bold ${wp.status === 'ACTIVE' ? 'text-success-700' : wp.status === 'EXPIRED' ? 'text-danger-700' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {permitStatusLabels[wp.status]}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Создано: {formatDateLong(wp.createdAt)}
            </p>
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

export default WorkPermitDetailPage;
