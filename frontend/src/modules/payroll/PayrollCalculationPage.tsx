import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Calculator,
  Wallet,
  TrendingDown,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { payrollApi } from './api';
import { formatMoney, formatPercent } from '@/lib/format';
import type { PayrollCalculation, PayrollDeduction } from './types';

const templateOptions = [
  { value: '', label: 'Выберите шаблон' },
  { value: '1', label: 'ШТ-ИС-01 Инженер-строитель' },
  { value: '2', label: 'ШТ-ЭМ-01 Электромонтажник' },
  { value: '3', label: 'ШТ-БТ-СВ Бетонщик (Крайний Север)' },
  { value: '4', label: 'ШТ-ПР-01 Прораб' },
];

const employeeOptions = [
  { value: '', label: 'Выберите сотрудника' },
  { value: 'e1', label: 'Иванов Алексей Сергеевич' },
  { value: 'e2', label: 'Петров Василий Константинович' },
  { value: 'e3', label: 'Сидоров Максим Николаевич' },
  { value: 'e4', label: 'Козлов Дмитрий Александрович' },
];
const PayrollCalculationPage: React.FC = () => {
  const navigate = useNavigate();

  const [templateId, setTemplateId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [workDays, setWorkDays] = useState('22');
  const [workHours, setWorkHours] = useState('176');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [result, setResult] = useState<PayrollCalculation | null>(null);

  const calculateMutation = useMutation({
    mutationFn: () =>
      payrollApi.calculatePayroll({
        templateId,
        employeeId,
        periodStart,
        periodEnd,
        workDays: Number(workDays),
        workHours: Number(workHours),
        overtimeHours: Number(overtimeHours),
      }),
    onSuccess: (data) => setResult(data),
    onError: () => {
      // Fallback to demo result for demonstration
      setResult(null);
    },
  });

  const canCalculate = templateId && employeeId && periodStart && periodEnd;
  const calc = result;

  const handleCalculate = () => {
    calculateMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Расчёт зарплаты"
        subtitle="Выберите шаблон, сотрудника и период"
        backTo="/payroll"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Зарплата', href: '/payroll' },
          { label: 'Расчёт' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Параметры расчёта</h3>

            <FormField label="Шаблон расчёта" required>
              <Select
                options={templateOptions}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              />
            </FormField>

            <FormField label="Сотрудник" required>
              <Select
                options={employeeOptions}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Начало периода" required>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </FormField>
              <FormField label="Конец периода" required>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Рабочих дней">
                <Input type="text" inputMode="numeric" value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
              </FormField>
              <FormField label="Часов">
                <Input type="text" inputMode="numeric" value={workHours} onChange={(e) => setWorkHours(e.target.value)} />
              </FormField>
              <FormField label="Сверхурочных">
                <Input type="text" inputMode="numeric" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} />
              </FormField>
            </div>

            <Button
              className="w-full"
              iconLeft={<Calculator size={16} />}
              onClick={handleCalculate}
              disabled={!canCalculate}
              loading={calculateMutation.isPending}
            >
              Рассчитать
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {calc ? (
            <>
              {/* Summary metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<Wallet size={18} />} label="Начислено" value={formatMoney(calc.grossAmount)} />
                <MetricCard icon={<TrendingDown size={18} />} label="Удержано" value={formatMoney(calc.totalDeductions)} />
                <MetricCard icon={<CreditCard size={18} />} label="К выплате" value={formatMoney(calc.netAmount)} />
                <MetricCard icon={<Receipt size={18} />} label="Сотрудник" value={calc.employeeName.split(' ').slice(0, 2).join(' ')} />
              </div>

              {/* Deductions breakdown */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Расшифровка удержаний</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Удержание</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Тип</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ставка</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.deductions.map((d: PayrollDeduction, idx: number) => (
                      <tr key={idx} className="border-b border-neutral-100">
                        <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{d.name}</td>
                        <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                          {d.type === 'TAX' ? 'Налог' : d.type === 'PENSION' ? 'Пенсионные' : d.type === 'INSURANCE' ? 'Страховые' : 'Прочие'}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600 tabular-nums text-right">{formatPercent(d.rate)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums text-right">{formatMoney(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
                      <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100" colSpan={3}>Итого удержано</td>
                      <td className="px-4 py-3 text-sm text-danger-600 tabular-nums text-right">{formatMoney(calc.totalDeductions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Summary card */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Итоговая сводка</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Шаблон</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{calc.templateName}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Рабочих дней / часов</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{calc.workDays} дн. / {calc.workHours} ч.</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Сверхурочные часы</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{calc.overtimeHours} ч.</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Начислено (gross)</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(calc.grossAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Удержания</span>
                    <span className="text-sm font-medium text-danger-600 tabular-nums">-{formatMoney(calc.totalDeductions)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 bg-primary-50 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold text-primary-900">К выплате (net)</span>
                    <span className="text-lg font-bold text-primary-700 tabular-nums">{formatMoney(calc.netAmount)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 flex flex-col items-center justify-center text-center">
              <Calculator size={48} className="text-neutral-300 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Выполните расчёт</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                Выберите шаблон расчёта, сотрудника и укажите период. Результат расчёта с детализацией удержаний появится здесь.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollCalculationPage;
