import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { KpiAchievement, BonusCalculation, BonusStatus } from '@/modules/analytics/types';

export interface KpiAchievementFilters extends PaginationParams {
  employeeId?: string;
  period?: string;
  category?: string;
  search?: string;
}

export interface BonusCalculationFilters extends PaginationParams {
  status?: BonusStatus;
  period?: string;
  search?: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_ACHIEVEMENTS = 'privod_kpi_achievements';
const STORAGE_BONUSES = 'privod_bonus_calculations';

function readStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// Default seed data — auto-populates when both API and localStorage are empty
// ---------------------------------------------------------------------------
function seedDefaultAchievements(): KpiAchievement[] {
  const now = new Date().toISOString();
  const items: KpiAchievement[] = [
    { id: 'kpi-ach-1', kpiId: 'kpi-1', kpiName: 'Выполнение графика', employeeId: 'emp-1', employeeName: 'Касимов Д.А.', period: '2026-Q1', targetValue: 100, actualValue: 95, achievementPercent: 95, weight: 0.25, category: 'SCHEDULE', unit: '%', projectName: 'ЖК «Солнечный»', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-2', kpiId: 'kpi-2', kpiName: 'Экономия бюджета', employeeId: 'emp-1', employeeName: 'Касимов Д.А.', period: '2026-Q1', targetValue: 5, actualValue: 7.2, achievementPercent: 144, weight: 0.20, category: 'COST', unit: '%', projectName: 'ЖК «Солнечный»', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-3', kpiId: 'kpi-3', kpiName: 'Показатель качества', employeeId: 'emp-2', employeeName: 'Петров И.В.', period: '2026-Q1', targetValue: 95, actualValue: 91, achievementPercent: 95.8, weight: 0.20, category: 'QUALITY', unit: '%', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-4', kpiId: 'kpi-4', kpiName: 'Безопасность труда', employeeId: 'emp-2', employeeName: 'Петров И.В.', period: '2026-Q1', targetValue: 0, actualValue: 0, achievementPercent: 100, weight: 0.15, category: 'SAFETY', unit: 'инцидентов', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-5', kpiId: 'kpi-5', kpiName: 'Производительность бригады', employeeId: 'emp-3', employeeName: 'Сидорова Е.Н.', period: '2026-Q1', targetValue: 100, actualValue: 108, achievementPercent: 108, weight: 0.20, category: 'PRODUCTIVITY', unit: '%', projectName: 'ТЦ «Центральный»', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-6', kpiId: 'kpi-1', kpiName: 'Выполнение графика', employeeId: 'emp-4', employeeName: 'Козлов А.М.', period: '2026-Q1', targetValue: 100, actualValue: 87, achievementPercent: 87, weight: 0.25, category: 'SCHEDULE', unit: '%', projectName: 'Мост через р. Вятка', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-7', kpiId: 'kpi-2', kpiName: 'Экономия бюджета', employeeId: 'emp-4', employeeName: 'Козлов А.М.', period: '2026-Q1', targetValue: 5, actualValue: -3.5, achievementPercent: 0, weight: 0.20, category: 'COST', unit: '%', projectName: 'Мост через р. Вятка', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-8', kpiId: 'kpi-3', kpiName: 'Показатель качества', employeeId: 'emp-5', employeeName: 'Иванова О.П.', period: '2026-Q1', targetValue: 95, actualValue: 97, achievementPercent: 102.1, weight: 0.20, category: 'QUALITY', unit: '%', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-9', kpiId: 'kpi-4', kpiName: 'Безопасность труда', employeeId: 'emp-5', employeeName: 'Иванова О.П.', period: '2026-Q1', targetValue: 0, actualValue: 1, achievementPercent: 70, weight: 0.15, category: 'SAFETY', unit: 'инцидентов', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-10', kpiId: 'kpi-5', kpiName: 'Производительность бригады', employeeId: 'emp-3', employeeName: 'Сидорова Е.Н.', period: '2025-Q4', targetValue: 100, actualValue: 112, achievementPercent: 112, weight: 0.20, category: 'PRODUCTIVITY', unit: '%', projectName: 'ТЦ «Центральный»', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-11', kpiId: 'kpi-1', kpiName: 'Выполнение графика', employeeId: 'emp-6', employeeName: 'Николаев С.Д.', period: '2026-Q1', targetValue: 100, actualValue: 100, achievementPercent: 100, weight: 0.25, category: 'SCHEDULE', unit: '%', projectName: 'ЖК «Новые Горизонты»', createdAt: now, updatedAt: now },
    { id: 'kpi-ach-12', kpiId: 'kpi-5', kpiName: 'Производительность бригады', employeeId: 'emp-6', employeeName: 'Николаев С.Д.', period: '2026-Q1', targetValue: 100, actualValue: 93, achievementPercent: 93, weight: 0.35, category: 'PRODUCTIVITY', unit: '%', projectName: 'ЖК «Новые Горизонты»', createdAt: now, updatedAt: now },
  ];
  writeStore(STORAGE_ACHIEVEMENTS, items);
  return items;
}

function seedDefaultBonuses(): BonusCalculation[] {
  const now = new Date().toISOString();
  const items: BonusCalculation[] = [
    { id: 'bonus-1', number: 'BON-2026-001', employeeId: 'emp-1', employeeName: 'Касимов Д.А.', employeePosition: 'Руководитель проекта', period: '2026-Q1', baseSalary: 250000, bonusPercent: 25, bonusAmount: 62500, totalAchievement: 107.5, kpiCount: 4, status: 'APPROVED', approvedByName: 'Директор', approvedAt: now, createdAt: now, updatedAt: now },
    { id: 'bonus-2', number: 'BON-2026-002', employeeId: 'emp-2', employeeName: 'Петров И.В.', employeePosition: 'Главный инженер', period: '2026-Q1', baseSalary: 200000, bonusPercent: 20, bonusAmount: 40000, totalAchievement: 96.8, kpiCount: 3, status: 'CALCULATED', createdAt: now, updatedAt: now },
    { id: 'bonus-3', number: 'BON-2026-003', employeeId: 'emp-3', employeeName: 'Сидорова Е.Н.', employeePosition: 'Начальник участка', period: '2026-Q1', baseSalary: 150000, bonusPercent: 15, bonusAmount: 22500, totalAchievement: 110.0, kpiCount: 2, status: 'PAID', approvedByName: 'Директор', approvedAt: now, paidAt: now, createdAt: now, updatedAt: now },
    { id: 'bonus-4', number: 'BON-2026-004', employeeId: 'emp-4', employeeName: 'Козлов А.М.', employeePosition: 'Прораб', period: '2026-Q1', baseSalary: 120000, bonusPercent: 10, bonusAmount: 12000, totalAchievement: 43.5, kpiCount: 3, status: 'DRAFT', createdAt: now, updatedAt: now },
    { id: 'bonus-5', number: 'BON-2026-005', employeeId: 'emp-5', employeeName: 'Иванова О.П.', employeePosition: 'Инженер по качеству', period: '2026-Q1', baseSalary: 130000, bonusPercent: 15, bonusAmount: 19500, totalAchievement: 88.4, kpiCount: 3, status: 'CALCULATED', createdAt: now, updatedAt: now },
    { id: 'bonus-6', number: 'BON-2026-006', employeeId: 'emp-6', employeeName: 'Николаев С.Д.', employeePosition: 'Инженер ПТО', period: '2026-Q1', baseSalary: 110000, bonusPercent: 12, bonusAmount: 13200, totalAchievement: 96.5, kpiCount: 2, status: 'APPROVED', approvedByName: 'Главный инженер', approvedAt: now, createdAt: now, updatedAt: now },
    { id: 'bonus-7', number: 'BON-2025-047', employeeId: 'emp-3', employeeName: 'Сидорова Е.Н.', employeePosition: 'Начальник участка', period: '2025-Q4', baseSalary: 145000, bonusPercent: 15, bonusAmount: 21750, totalAchievement: 112.0, kpiCount: 2, status: 'PAID', approvedByName: 'Директор', approvedAt: now, paidAt: now, createdAt: now, updatedAt: now },
    { id: 'bonus-8', number: 'BON-2025-048', employeeId: 'emp-7', employeeName: 'Фёдоров В.К.', employeePosition: 'Начальник отдела снабжения', period: '2025-Q4', baseSalary: 160000, bonusPercent: 18, bonusAmount: 28800, totalAchievement: 91.2, kpiCount: 4, status: 'PAID', approvedByName: 'Директор', approvedAt: now, paidAt: now, createdAt: now, updatedAt: now },
    { id: 'bonus-9', number: 'BON-2026-007', employeeId: 'emp-8', employeeName: 'Морозова А.С.', employeePosition: 'Инженер по ОТ и ТБ', period: '2026-Q1', baseSalary: 95000, bonusPercent: 12, bonusAmount: 11400, totalAchievement: 100.0, kpiCount: 2, status: 'DRAFT', createdAt: now, updatedAt: now },
    { id: 'bonus-10', number: 'BON-2026-008', employeeId: 'emp-9', employeeName: 'Лебедев П.Г.', employeePosition: 'Сметчик', period: '2026-Q1', baseSalary: 80000, bonusPercent: 10, bonusAmount: 8000, totalAchievement: 102.3, kpiCount: 3, status: 'CALCULATED', createdAt: now, updatedAt: now },
  ];
  writeStore(STORAGE_BONUSES, items);
  return items;
}

function ensureSeeded<T>(key: string, seedFn: () => T[]): T[] {
  const existing = readStore<T>(key);
  if (existing.length > 0) return existing;
  return seedFn();
}

// ---------------------------------------------------------------------------
// API with localStorage fallbacks
// ---------------------------------------------------------------------------
export const kpiBonusesApi = {
  getAchievements: async (params?: KpiAchievementFilters): Promise<PaginatedResponse<KpiAchievement>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<KpiAchievement>>('/analytics/kpi-achievements', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = ensureSeeded<KpiAchievement>(STORAGE_ACHIEVEMENTS, seedDefaultAchievements);
      if (params?.employeeId) stored = stored.filter((a) => a.employeeId === params.employeeId);
      if (params?.period) stored = stored.filter((a) => a.period === params.period);
      if (params?.category) stored = stored.filter((a) => a.category === params.category);
      if (params?.search) {
        const q = params.search.toLowerCase();
        stored = stored.filter((a) => a.kpiName.toLowerCase().includes(q) || a.employeeName.toLowerCase().includes(q));
      }
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  getAchievement: async (id: string): Promise<KpiAchievement> => {
    try {
      const response = await apiClient.get<KpiAchievement>(`/analytics/kpi-achievements/${id}`, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = ensureSeeded<KpiAchievement>(STORAGE_ACHIEVEMENTS, seedDefaultAchievements);
      const found = stored.find((a) => a.id === id);
      if (found) return found;
      throw new Error(`KpiAchievement ${id} not found`);
    }
  },

  getBonusCalculations: async (params?: BonusCalculationFilters): Promise<PaginatedResponse<BonusCalculation>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<BonusCalculation>>('/analytics/bonus-calculations', {
        params,
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      let stored = ensureSeeded<BonusCalculation>(STORAGE_BONUSES, seedDefaultBonuses);
      if (params?.status) stored = stored.filter((b) => b.status === params.status);
      if (params?.period) stored = stored.filter((b) => b.period === params.period);
      if (params?.search) {
        const q = params.search.toLowerCase();
        stored = stored.filter((b) => b.employeeName.toLowerCase().includes(q) || b.number.toLowerCase().includes(q));
      }
      return { content: stored, totalElements: stored.length, totalPages: 1, page: params?.page ?? 0, size: params?.size ?? 20 };
    }
  },

  getBonusCalculation: async (id: string): Promise<BonusCalculation> => {
    try {
      const response = await apiClient.get<BonusCalculation>(`/analytics/bonus-calculations/${id}`, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = ensureSeeded<BonusCalculation>(STORAGE_BONUSES, seedDefaultBonuses);
      const found = stored.find((b) => b.id === id);
      if (found) return found;
      throw new Error(`BonusCalculation ${id} not found`);
    }
  },

  approveBonusCalculation: async (id: string): Promise<BonusCalculation> => {
    try {
      const response = await apiClient.patch<BonusCalculation>(`/analytics/bonus-calculations/${id}/approve`, null, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<BonusCalculation>(STORAGE_BONUSES);
      const idx = stored.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error(`BonusCalculation ${id} not found`);
      stored[idx] = { ...stored[idx], status: 'APPROVED', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      writeStore(STORAGE_BONUSES, stored);
      return stored[idx];
    }
  },

  recalculateBonus: async (id: string): Promise<BonusCalculation> => {
    try {
      const response = await apiClient.post<BonusCalculation>(`/analytics/bonus-calculations/${id}/recalculate`, null, {
        _silentErrors: true,
      } as any);
      return response.data;
    } catch {
      const stored = readStore<BonusCalculation>(STORAGE_BONUSES);
      const idx = stored.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error(`BonusCalculation ${id} not found`);
      stored[idx] = { ...stored[idx], status: 'CALCULATED', updatedAt: new Date().toISOString() };
      writeStore(STORAGE_BONUSES, stored);
      return stored[idx];
    }
  },
};
