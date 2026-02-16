import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Settings, AlertTriangle, CheckCircle, Clock, Users, TrendingUp, Calendar } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  maintenanceRequestStatusColorMap,
  maintenanceRequestStatusLabels,
  maintenancePriorityColorMap,
  maintenancePriorityLabels,
} from '@/design-system/components/StatusBadge';
import { maintenanceApi } from '@/api/maintenance';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import type { MaintenanceRequest, MaintenanceTeam, PreventiveSchedule } from './types';

const MaintenanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: requestsData } = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: () => maintenanceApi.getRequests(),
  });

  const { data: teams } = useQuery({
    queryKey: ['maintenance-teams'],
    queryFn: () => maintenanceApi.getTeams(),
  });

  const { data: schedules } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: () => maintenanceApi.getSchedules(),
  });

  const requests = requestsData?.content ?? [];
  const teamList = teams ?? [];
  const scheduleList = schedules ?? [];

  const metrics = useMemo(() => {
    const activeRequests = requests.filter((r) => r.status === 'NEW' || r.status === 'IN_PROGRESS').length;
    const urgentRequests = requests.filter((r) => r.priority === 'URGENT' || r.priority === 'HIGH').length;
    const totalCost = requests.reduce((s, r) => s + (r.cost ?? 0), 0);
    const totalTeamMembers = teamList.reduce((s, t) => s + t.memberCount, 0);
    return { activeRequests, urgentRequests, totalCost, totalTeamMembers };
  }, [requests, teamList]);

  const upcomingSchedules = useMemo(() => {
    return [...scheduleList]
      .filter((s) => s.isActive)
      .sort((a, b) => a.nextScheduledDate.localeCompare(b.nextScheduledDate))
      .slice(0, 5);
  }, [scheduleList]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Обслуживание - Dashboard"
        subtitle="Обзор технического обслуживания"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обслуживание' },
          { label: 'Dashboard' },
        ]}
        actions={
          <Button iconLeft={<Wrench size={16} />} onClick={() => navigate('/maintenance/requests/new')}>
            Новая заявка
          </Button>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Wrench size={18} />} label="Активные заявки" value={metrics.activeRequests} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Срочные" value={metrics.urgentRequests} />
        <MetricCard icon={<TrendingUp size={18} />} label="Затраты (тек.)" value={formatMoneyCompact(metrics.totalCost)} />
        <MetricCard icon={<Users size={18} />} label="Специалистов" value={metrics.totalTeamMembers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Активные заявки</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/maintenance/requests')}>
                Все заявки
              </Button>
            </div>
            <div className="space-y-3">
              {requests.filter((r) => r.status === 'NEW' || r.status === 'IN_PROGRESS').map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                  onClick={() => navigate(`/maintenance/requests/${request.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{request.number}</span>
                      <StatusBadge
                        status={request.status}
                        colorMap={maintenanceRequestStatusColorMap}
                        label={maintenanceRequestStatusLabels[request.status] ?? request.status}
                      />
                      <StatusBadge
                        status={request.priority}
                        colorMap={maintenancePriorityColorMap}
                        label={maintenancePriorityLabels[request.priority] ?? request.priority}
                      />
                    </div>
                    {request.cost && (
                      <span className="tabular-nums text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {formatMoneyCompact(request.cost)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{request.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {request.equipmentName} | {request.assignedToName ?? 'Не назначено'} | {formatDate(request.scheduledDate)}
                  </p>
                </div>
              ))}
              {requests.filter((r) => r.status === 'NEW' || r.status === 'IN_PROGRESS').length === 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">Нет активных заявок</p>
              )}
            </div>
          </div>

          {/* Upcoming preventive maintenance */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Calendar size={16} className="text-primary-500" />
                Плановое ТО
              </h3>
            </div>
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{schedule.equipmentName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {schedule.name} | {schedule.teamName ?? '---'} | {schedule.estimatedDuration} ч.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(schedule.nextScheduledDate)}</p>
                    <p className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">{formatMoneyCompact(schedule.estimatedCost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Teams */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Users size={16} className="text-primary-500" />
              Бригады
            </h3>
            <div className="space-y-4">
              {teamList.map((team) => (
                <div key={team.id} className="p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{team.name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${team.isActive ? 'bg-success-50 text-success-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${team.isActive ? 'bg-success-500' : 'bg-neutral-400'}`} />
                      {team.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Руководитель: {team.leadName}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-neutral-600"><Users size={12} className="inline mr-1" />{team.memberCount} чел.</span>
                    <span className="text-warning-600"><Clock size={12} className="inline mr-1" />{team.activeRequests} акт.</span>
                    <span className="text-success-600"><CheckCircle size={12} className="inline mr-1" />{team.completedRequests} вып.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Settings size={16} className="text-primary-500" />
              Быстрые действия
            </h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/maintenance/requests')}>
                Все заявки
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/maintenance/equipment')}>
                Оборудование
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/maintenance/requests/new')}>
                Создать заявку
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboardPage;
