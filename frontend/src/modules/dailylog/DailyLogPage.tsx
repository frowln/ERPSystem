import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer,
  Plus, Send, CheckCircle2, Camera, HardHat, Package, Truck, AlertTriangle, StickyNote,
  ChevronLeft, ChevronRight, Image, Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import toast from 'react-hot-toast';
import { dailyLogApi } from '@/api/dailylog';
import type { DailyLog, DailyLogEntry, WeatherInfo } from '@/api/dailylog';
const logStatusColorMap: Record<string, 'gray' | 'yellow' | 'green' | 'red'> = { draft: 'gray', submitted: 'yellow', approved: 'green', rejected: 'red' };
const logStatusLabels: Record<string, string> = { draft: 'Черновик', submitted: 'Отправлен', approved: 'Утверждён', rejected: 'Отклонён' };

const entryTypeIcons: Record<string, React.ElementType> = {
  work: HardHat,
  material: Package,
  equipment: Truck,
  personnel: HardHat,
  incident: AlertTriangle,
  note: StickyNote,
};
const entryTypeLabels: Record<string, string> = {
  work: 'Работы',
  material: 'Материалы',
  equipment: 'Техника',
  personnel: 'Персонал',
  incident: 'Инцидент',
  note: 'Примечание',
};
const entryTypeColors: Record<string, string> = {
  work: 'bg-primary-50 text-primary-600',
  material: 'bg-success-50 text-success-600',
  equipment: 'bg-orange-50 text-orange-600',
  personnel: 'bg-purple-50 text-purple-600',
  incident: 'bg-danger-50 text-danger-600',
  note: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
};

const weatherIcons: Record<string, React.ElementType> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  fog: Cloud,
  wind: Wind,
};
const weatherLabels: Record<string, string> = {
  clear: 'Ясно',
  cloudy: 'Облачно',
  rain: 'Дождь',
  snow: 'Снег',
  fog: 'Туман',
  wind: 'Ветрено',
};


const WeatherCard: React.FC<{ weather: WeatherInfo }> = ({ weather }) => {
  const WIcon = weatherIcons[weather.condition] ?? Cloud;
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Погода</p>
      <div className="flex items-center gap-4">
        <WIcon size={32} className="text-primary-400" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Thermometer size={14} className="text-neutral-400" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{weather.temperature}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Wind size={14} className="text-neutral-400" />
            <span className="text-neutral-700 dark:text-neutral-300">{weather.windSpeed} м/с</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Cloud size={14} className="text-neutral-400" />
            <span className="text-neutral-700 dark:text-neutral-300">{weatherLabels[weather.condition]}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Droplets size={14} className="text-neutral-400" />
            <span className="text-neutral-700 dark:text-neutral-300">{weather.humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DailyLogPage: React.FC = () => {
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedProject, setSelectedProject] = useState('1');

  const { data: log } = useQuery({
    queryKey: ['daily-log', selectedDate, selectedProject],
    queryFn: async () => {
      const result = await dailyLogApi.getDailyLogByDate(selectedDate, selectedProject);
      return result ?? undefined;
    },
  });

  if (!log) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Журнал работ (КС-6)"
          subtitle="Загрузка..."
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Журнал работ' },
          ]}
        />
        <div className="flex items-center justify-center h-64 text-neutral-400">Загрузка данных...</div>
      </div>
    );
  }

  const deleteDailyLogMutation = useMutation({
    mutationFn: (id: string) => dailyLogApi.deleteDailyLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      toast.success('Журнал работ удалён');
    },
    onError: () => {
      toast.error('Ошибка при удалении');
    },
  });

  const handleDeleteLog = async () => {
    const isConfirmed = await confirm({
      title: 'Удалить журнал работ?',
      description: 'Операция необратима. Текущий журнал будет удален.',
      confirmLabel: 'Удалить журнал',
      cancelLabel: 'Отмена',
      items: [formatDate(log.date)],
    });
    if (!isConfirmed) return;

    deleteDailyLogMutation.mutate(log.id);
  };

  const entryGroups = log.entries.reduce<Record<string, DailyLogEntry[]>>((acc, entry) => {
    if (!acc[entry.type]) acc[entry.type] = [];
    acc[entry.type].push(entry);
    return acc;
  }, {});

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Журнал работ (КС-6)"
        subtitle={`${log.projectName} | ${formatDate(selectedDate)}`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Журнал работ' },
        ]}
        actions={
          <div className="flex gap-2">
            {log.status === 'DRAFT' && (
              <>
                <Button variant="secondary" iconLeft={<Plus size={16} />}>Добавить запись</Button>
                <Button variant="success" iconLeft={<Send size={16} />}>Отправить</Button>
              </>
            )}
            {log.status === 'SUBMITTED' && (
              <Button variant="success" iconLeft={<CheckCircle2 size={16} />}>Утвердить</Button>
            )}
            <Button variant="danger" iconLeft={<Trash2 size={16} />} onClick={handleDeleteLog}>
              Удалить
            </Button>
          </div>
        }
      />

      {/* Date picker + project filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-1">
          <button onClick={() => changeDate(-1)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-3">
            <Calendar size={14} className="text-neutral-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-transparent border-none outline-none cursor-pointer"
            />
          </div>
          <button onClick={() => changeDate(1)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded">
            <ChevronRight size={16} />
          </button>
        </div>

        <Select
          options={[
            { value: '1', label: 'ЖК "Солнечный"' },
            { value: '3', label: 'Мост через р. Вятка' },
            { value: '6', label: 'ТЦ "Центральный"' },
          ]}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-56"
        />

        <StatusBadge status={log.status} colorMap={logStatusColorMap} label={logStatusLabels[log.status]} size="md" />

        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">Автор: {log.authorName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — entries */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(entryGroups).map(([type, entries]) => {
            const Icon = entryTypeIcons[type] ?? StickyNote;
            return (
              <div key={type} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', entryTypeColors[type])}>
                    <Icon size={14} />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{entryTypeLabels[type]}</h3>
                  <span className="text-xs text-neutral-400 ml-1">{entries.length}</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {entries.map((entry) => (
                    <div key={entry.id} className="px-4 py-3 hover:bg-neutral-25 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-neutral-400 mt-0.5 w-10 flex-shrink-0">{entry.time}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-900 dark:text-neutral-100">{entry.description}</p>
                          <div className="flex gap-4 mt-1">
                            {entry.quantity != null && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Объём: <span className="font-medium">{entry.quantity} {entry.unit}</span>
                              </span>
                            )}
                            {entry.workerCount != null && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Рабочих: <span className="font-medium">{entry.workerCount}</span>
                              </span>
                            )}
                            {entry.responsibleName && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Ответственный: <span className="font-medium">{entry.responsibleName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar — weather + photos */}
        <div className="space-y-4">
          <WeatherCard weather={log.weather} />

          {/* Photo gallery */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Фотоотчёт</p>
              <Button size="xs" variant="ghost" iconLeft={<Camera size={13} />}>Добавить</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {log.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                    <Image size={24} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2 text-center">{log.photos.length} фото</p>
          </div>

          {/* Notes */}
          {log.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Примечания</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{log.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLogPage;
