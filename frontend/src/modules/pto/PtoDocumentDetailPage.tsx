import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  User,
  Calendar,
  Clock,
  Hash,
  CheckCircle2,
  Edit,
  Trash2,
  Link2,
  PenTool,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  russianDocStatusColorMap,
  russianDocStatusLabels,
  russianDocTypeColorMap,
  russianDocTypeLabels,
} from '@/design-system/components/StatusBadge';
import { formatDateLong, formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';
import { ptoApi } from '@/api/pto';

interface Signature {
  id: string;
  signerName: string;
  role: string;
  signedAt: string | null;
  status: string;
}

interface ApprovalEntry {
  id: string;
  action: string;
  userName: string;
  comment: string;
  date: string;
}

interface PtoDocument {
  id: string;
  number: string;
  type: string;
  status: string;
  title: string;
  content: string;
  projectName: string;
  objectName: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}


const statusActions: Record<string, { label: string; target: string }[]> = {
  draft: [{ label: 'На проверку', target: 'IN_REVIEW' }],
  in_review: [
    { label: 'На подписание', target: 'ON_SIGNING' },
    { label: 'Отклонить', target: 'REJECTED' },
  ],
  on_signing: [{ label: 'Подписан', target: 'SIGNED' }],
  rejected: [{ label: 'На доработку', target: 'DRAFT' }],
};

const signatureStatusLabels: Record<string, string> = {
  signed: 'Подписано',
  pending: 'Ожидает подписи',
  rejected: 'Отклонено',
};

const PtoDocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: rawDoc, isLoading: docLoading } = useQuery({
    queryKey: ['pto-document', id],
    queryFn: () => ptoApi.getDocument(id!),
    enabled: !!id,
  });

  if (docLoading || !rawDoc) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  }

  const d: PtoDocument = {
    id: rawDoc.id,
    number: rawDoc.number,
    type: (rawDoc as any).type ?? '',
    status: (rawDoc as any).status ?? '',
    title: rawDoc.title,
    content: (rawDoc as any).content ?? '',
    projectName: rawDoc.projectName,
    objectName: (rawDoc as any).objectName ?? (rawDoc as any).section ?? '',
    createdByName: rawDoc.author,
    createdAt: rawDoc.createdDate,
    updatedAt: rawDoc.approvedDate ?? rawDoc.createdDate,
  };

  const signatures: Signature[] = (rawDoc as any).signatures ?? [];
  const approvalHistory: ApprovalEntry[] = (rawDoc as any).approvalHistory ?? [];
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? d.status;
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);

  const handleStatusChange = (targetStatus: string) => {
    setStatusOverride(targetStatus);
    toast.success(`Статус документа: ${russianDocStatusLabels[targetStatus] ?? targetStatus}`);
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Удалить документ ПТО?',
      description: 'Операция необратима. Документ будет удален.',
      confirmLabel: 'Удалить документ',
      cancelLabel: 'Отмена',
      items: [d.number],
    });
    if (!isConfirmed) {
      return;
    }
    toast.success('Документ удален');
    navigate('/pto/documents');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={d.number}
        subtitle={`${d.projectName} / ${russianDocTypeLabels[d.type] ?? d.type}`}
        backTo="/pto/documents"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Документы ПТО', href: '/pto/documents' },
          { label: d.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={russianDocStatusColorMap} label={russianDocStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            <StatusBadge status={d.type} colorMap={russianDocTypeColorMap} label={russianDocTypeLabels[d.type] ?? d.type} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant="secondary" size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast('Редактирование доступно в списке документов ПТО');
                navigate('/pto/documents');
              }}
            >
              Редактировать
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={handleDelete}>Удалить</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {d.title}
            </h3>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Содержание</h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
              {d.content}
            </div>
          </div>

          {/* Signatures */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <PenTool size={16} className="text-primary-500" />
              Подписи ({signatures.length})
            </h3>
            <div className="space-y-3">
              {signatures.map((sig) => (
                <div key={sig.id} className={`flex items-center justify-between p-4 rounded-lg border ${sig.status === 'SIGNED' ? 'bg-success-50 border-success-200' : sig.status === 'PENDING' ? 'bg-warning-50 border-warning-200' : 'bg-danger-50 border-danger-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
                      {sig.signerName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{sig.signerName}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{sig.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${sig.status === 'SIGNED' ? 'text-success-700' : sig.status === 'PENDING' ? 'text-warning-700' : 'text-danger-700'}`}>
                      {signatureStatusLabels[sig.status]}
                    </p>
                    {sig.signedAt && <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDateTime(sig.signedAt)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval history */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">История согласования</h3>
            <div className="space-y-3">
              {approvalHistory.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-semibold text-primary-700">
                    {entry.userName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.action}</p>
                    {entry.comment && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{entry.comment}</p>}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatDateTime(entry.date)}</span>
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
              <InfoItem icon={<Hash size={15} />} label="Номер" value={d.number} />
              <InfoItem icon={<FileText size={15} />} label="Объект" value={d.objectName} />
              <InfoItem icon={<User size={15} />} label="Создал" value={d.createdByName} />
              <InfoItem icon={<Calendar size={15} />} label="Создан" value={formatDateLong(d.createdAt)} />
              <InfoItem icon={<Clock size={15} />} label="Обновлён" value={formatDateLong(d.updatedAt)} />
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

export default PtoDocumentDetailPage;
