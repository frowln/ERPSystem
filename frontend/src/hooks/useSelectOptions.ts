/**
 * Shared React Query hooks for populating select/dropdown options.
 * These replace all hardcoded mock option arrays throughout the application.
 *
 * Usage:
 *   const { options: projectOptions, isLoading } = useProjectOptions();
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { projectsApi } from '@/api/projects';
import { contractsApi } from '@/api/contracts';
import { hrApi } from '@/api/hr';
import { warehouseApi } from '@/api/warehouse';
import { fleetApi } from '@/api/fleet';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { WarehouseLocation } from '@/modules/warehouse/types';

export interface SelectOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function useProjectOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'projects'],
    queryFn: () => projectsApi.getProjects({ size: 200, page: 0 } as Parameters<typeof projectsApi.getProjects>[0]),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((p) => ({
        value: p.id,
        label: `${p.code} — ${p.name}`,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Contracts (optionally filtered by project)
// ---------------------------------------------------------------------------

export function useContractOptions(projectId?: string): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'contracts', projectId ?? 'all'],
    queryFn: () =>
      contractsApi.getContracts({
        size: 200,
        page: 0,
        ...(projectId ? { projectId } : {}),
      }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((c) => ({
        value: c.id,
        label: `${c.number} — ${c.name}`,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export function useEmployeeOptions(status?: string): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'employees', status ?? 'all'],
    queryFn: () => hrApi.getEmployees({ size: 200, page: 0, ...(status ? { status } : {}) }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((e) => ({
        value: e.id,
        label: e.fullName,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Counterparties / Partners / Vendors
// ---------------------------------------------------------------------------

export interface Counterparty {
  id: string;
  name: string;
  inn?: string;
  type?: string;
}

async function fetchCounterparties(params?: PaginationParams): Promise<PaginatedResponse<Counterparty>> {
  const response = await apiClient.get<PaginatedResponse<Counterparty>>('/counterparties', { params });
  return response.data;
}

export function usePartnerOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'counterparties'],
    queryFn: () => fetchCounterparties({ size: 200, page: 0 }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Warehouse Locations
// ---------------------------------------------------------------------------

async function fetchWarehouseLocations(): Promise<PaginatedResponse<WarehouseLocation>> {
  const response = await apiClient.get<PaginatedResponse<WarehouseLocation>>('/warehouse/locations', {
    params: { size: 200, page: 0 },
  });
  return response.data;
}

export function useWarehouseLocationOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'warehouse-locations'],
    queryFn: fetchWarehouseLocations,
    staleTime: 10 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((loc) => ({
        value: loc.id,
        label: loc.name,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  name: string;
  code?: string;
}

async function fetchDepartments(): Promise<Department[]> {
  const response = await apiClient.get<Department[]>('/departments');
  return response.data;
}

export function useDepartmentOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'departments'],
    queryFn: fetchDepartments,
    staleTime: 10 * 60 * 1000,
    select: (res) =>
      (res ?? []).map((d) => ({
        value: d.id,
        label: d.name,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export function useMaterialOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'materials'],
    queryFn: () => warehouseApi.getMaterials({ size: 300, page: 0 }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((m) => ({
        value: m.id,
        label: `${m.code} — ${m.name}`,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Fleet Vehicles
// ---------------------------------------------------------------------------

export function useVehicleOptions(status?: string): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'vehicles', status ?? 'all'],
    queryFn: () => fleetApi.getVehicles({ size: 200, page: 0, ...(status ? { status } : {}) } as Parameters<typeof fleetApi.getVehicles>[0]),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((v) => ({
        value: v.id,
        label: `${v.code} — ${v.brand} ${v.model} (${v.licensePlate ?? '—'})`,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Drivers (employees filtered by jobTitle)
// ---------------------------------------------------------------------------

export function useDriverOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'drivers'],
    queryFn: () => hrApi.getEmployees({ size: 200, page: 0, jobTitle: 'DRIVER' }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.content ?? []).map((e) => ({
        value: e.id,
        label: e.fullName,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Contract Types
// ---------------------------------------------------------------------------

export function useContractTypeOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'contract-types'],
    queryFn: async () => {
      const response = await apiClient.get<{ id: string; name: string; code?: string }[]>('/contracts/types');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    select: (res) =>
      (res ?? []).map((ct) => ({
        value: ct.id,
        label: ct.name,
      })),
  });
  return { options: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Budget items (positions, not sections) — filtered by projectId
// ---------------------------------------------------------------------------

export function useBudgetItemOptions(projectId?: string): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['select-options', 'budget-items', projectId],
    queryFn: async () => {
      const budgetsResp = await apiClient.get<{ content: { id: string; projectId: string; name: string }[] }>(
        '/budgets',
        { params: { projectId, size: 50, page: 0 } },
      );
      const budgets = budgetsResp.data.content ?? [];
      if (budgets.length === 0) return [];

      const results = await Promise.all(budgets.map(async (budget) => {
        const itemsResp = await apiClient.get<{
          id: string;
          name: string;
          section: boolean;
          parentId?: string;
        }[]>(
          `/budgets/${budget.id}/items`,
          { params: { size: 1000 } },
        );

        const items = Array.isArray(itemsResp.data)
          ? itemsResp.data
          : (itemsResp.data as unknown as { content?: typeof itemsResp.data }).content ?? [];

        const byId = new Map(items.map((item) => [item.id, item]));
        const buildPath = (item: { id: string; name: string; parentId?: string }) => {
          const parts = [item.name];
          let parentId = item.parentId;
          while (parentId) {
            const parent = byId.get(parentId);
            if (!parent) break;
            parts.unshift(parent.name);
            parentId = parent.parentId;
          }
          return parts.join(' / ');
        };

        return items
          .filter((item) => !item.section)
          .map((item) => ({
            value: item.id,
            label: `${budget.name} / ${buildPath(item)}`,
          }));
      }));

      return results.flat();
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
  return { options: data ?? [], isLoading };
}
