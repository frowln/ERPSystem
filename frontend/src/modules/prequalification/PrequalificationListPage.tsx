import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { apiClient } from '@/api/client';
import { Shield, Plus, CheckCircle, AlertTriangle, XCircle, Users } from 'lucide-react';

interface Prequalification {
  id: string;
  companyName: string;
  inn: string;
  workType: string;
  totalScore: number;
  financialScore: number;
  experienceScore: number;
  safetyScore: number;
  qualificationResult: string;
  status: string;
  createdAt: string;
}

const resultConfig: Record<string, { color: string; label: string }> = {
  QUALIFIED: { color: 'green', label: 'Квалифицирован' },
  CONDITIONALLY_QUALIFIED: { color: 'yellow', label: 'Условно квалифицирован' },
  NOT_QUALIFIED: { color: 'red', label: 'Не квалифицирован' },
  PENDING: { color: 'gray', label: 'На рассмотрении' },
};

const PrequalificationListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['prequalifications'],
    queryFn: async () => {
      const resp = await apiClient.get<any>('/prequalifications');
      const d = resp.data;
      return Array.isArray(d) ? d : d?.content ?? [];
    },
  });

  const items: Prequalification[] = data ?? [];
  const qualified = items.filter(i => i.qualificationResult === 'QUALIFIED').length;
  const conditional = items.filter(i => i.qualificationResult === 'CONDITIONALLY_QUALIFIED').length;
  const notQualified = items.filter(i => i.qualificationResult === 'NOT_QUALIFIED').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Преквалификация подрядчиков"
        subtitle="Оценка финансовой устойчивости, опыта и безопасности подрядчиков перед допуском к тендеру"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Экономика проекта' },
          { label: 'Преквалификация' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/prequalifications/new')}>
            Новая анкета
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label="Всего анкет" value={items.length} />
        <MetricCard icon={<CheckCircle size={18} />} label="Квалифицированы" value={qualified} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Условно" value={conditional} />
        <MetricCard icon={<XCircle size={18} />} label="Отклонены" value={notQualified} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Shield size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Нет анкет преквалификации
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            Преквалификация оценивает подрядчиков по 20+ критериям: финансовая устойчивость,
            опыт аналогичных проектов, членство в СРО, безопасность, страхование.
            Допускайте к тендеру только проверенных подрядчиков.
          </p>
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/prequalifications/new')}>
            Оценить подрядчика
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
              <tr className="text-left text-sm text-neutral-500 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">Компания</th>
                <th className="px-4 py-3 font-medium">ИНН</th>
                <th className="px-4 py-3 font-medium">Вид работ</th>
                <th className="px-4 py-3 font-medium text-center">Финансы</th>
                <th className="px-4 py-3 font-medium text-center">Опыт</th>
                <th className="px-4 py-3 font-medium text-center">Безопасность</th>
                <th className="px-4 py-3 font-medium text-center">Итого</th>
                <th className="px-4 py-3 font-medium">Результат</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const res = resultConfig[item.qualificationResult] ?? resultConfig.PENDING;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/prequalifications/${item.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {item.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-neutral-500">{item.inn || '—'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{item.workType || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCircle value={item.financialScore ?? 0} max={8} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCircle value={item.experienceScore ?? 0} max={6} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCircle value={item.safetyScore ?? 0} max={8} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        (item.totalScore ?? 0) >= 16 ? 'bg-success-100 text-success-700' :
                        (item.totalScore ?? 0) >= 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.totalScore ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={item.qualificationResult}
                        colorMap={{ QUALIFIED: 'green', CONDITIONALLY_QUALIFIED: 'yellow', NOT_QUALIFIED: 'red', PENDING: 'gray' }}
                        label={res.label}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ScoreCircle: React.FC<{ value: number; max: number }> = ({ value, max }) => (
  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
    value >= max * 0.75 ? 'bg-success-50 text-success-600' :
    value >= max * 0.4 ? 'bg-yellow-50 text-yellow-600' :
    'bg-red-50 text-red-600'
  }`}>
    {value}
  </span>
);

export default PrequalificationListPage;
