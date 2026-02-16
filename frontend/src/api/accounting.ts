import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type AccountType = 'ACTIVE' | 'PASSIVE' | 'ACTIVE_PASSIVE';
export type PeriodStatus = 'OPEN' | 'CLOSED';
export type JournalType = 'BANK' | 'CASH' | 'SALES' | 'PURCHASE' | 'GENERAL';
export type FixedAssetStatus = 'DRAFT' | 'ACTIVE' | 'DISPOSED';
export type DepreciationMethod = 'LINEAR' | 'REDUCING_BALANCE' | 'SUM_OF_YEARS';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  typeDisplayName: string;
  parentId?: string;
  analytical: boolean;
  description?: string;
  createdAt: string;
  balance: number;
  children?: Account[];
}

export interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  statusDisplayName?: string;
  closedById?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  number: string;
  journalId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  entryDate: string;
  description: string;
  documentType?: string;
  documentId?: string;
  periodId: string;
  createdAt: string;
  createdBy?: string;

  // Compatibility fields for existing UI.
  date: string;
  debitAccount: string;
  debitSubaccount: string;
  creditAccount: string;
  creditSubaccount: string;
  document: string;
  author: string;
  projectId?: string;
  projectName: string;
}

export interface FinancialJournal {
  id: string;
  code: string;
  name: string;
  journalType: JournalType;
  journalTypeDisplayName?: string;
  active: boolean;
  createdAt: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  inventoryNumber: string;
  name: string;
  accountId?: string;
  purchaseDate: string;
  purchaseAmount: number;
  usefulLifeMonths: number;
  depreciationMethod: DepreciationMethod;
  depreciationMethodDisplayName?: string;
  currentValue: number;
  status: FixedAssetStatus;
  statusDisplayName?: string;
  monthlyDepreciation: number;
  createdAt: string;
  createdBy?: string;

  // Compatibility fields for existing UI.
  acquisitionDate: string;
  originalCost: number;
  accumulatedDepreciation: number;
  residualValue: number;
  usefulLife: number;
  location: string;
  responsible: string;
  category: string;
}

export interface AccountingDashboard {
  totalAccounts: number;
  activeAccounts: number;
  passiveAccounts: number;
  activePassiveAccounts: number;
  entriesCount: number;
  entriesTotalAmount: number;
  fixedAssetsCount: number;
  fixedAssetsCurrentValue: number;
  openPeriodsCount: number;
  recentEntries: JournalEntry[];
}

interface BackendAccountResponse {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  accountTypeDisplayName?: string;
  parentId?: string | null;
  analytical: boolean;
  description?: string | null;
  createdAt: string;
}

interface BackendPeriodResponse {
  id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  statusDisplayName?: string;
  closedById?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

interface BackendEntryResponse {
  id: string;
  journalId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number | string;
  entryDate: string;
  description?: string | null;
  documentType?: string | null;
  documentId?: string | null;
  periodId: string;
  createdAt: string;
  createdBy?: string | null;
}

interface BackendFixedAssetResponse {
  id: string;
  code: string;
  name: string;
  inventoryNumber: string;
  accountId?: string | null;
  purchaseDate: string;
  purchaseAmount: number | string;
  usefulLifeMonths: number;
  depreciationMethod: DepreciationMethod;
  depreciationMethodDisplayName?: string | null;
  currentValue: number | string;
  status: FixedAssetStatus;
  statusDisplayName?: string | null;
  monthlyDepreciation: number | string;
  createdAt: string;
  createdBy?: string | null;
}

interface BackendFinancialJournalResponse {
  id: string;
  code: string;
  name: string;
  journalType: JournalType;
  journalTypeDisplayName?: string | null;
  active: boolean;
  createdAt: string;
}

function mapAccount(response: BackendAccountResponse): Account {
  return {
    id: response.id,
    code: response.code,
    name: response.name,
    type: response.accountType,
    typeDisplayName: response.accountTypeDisplayName ?? response.accountType,
    parentId: response.parentId ?? undefined,
    analytical: response.analytical,
    description: response.description ?? undefined,
    createdAt: response.createdAt,
    balance: 0,
  };
}

function mapPeriod(response: BackendPeriodResponse): AccountingPeriod {
  return {
    id: response.id,
    year: response.year,
    month: response.month,
    status: response.status,
    statusDisplayName: response.statusDisplayName ?? undefined,
    closedById: response.closedById ?? undefined,
    closedAt: response.closedAt ?? undefined,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt ?? undefined,
  };
}

function buildEntryNumber(id: string): string {
  return `AE-${id.slice(0, 8).toUpperCase()}`;
}

function mapEntry(response: BackendEntryResponse): JournalEntry {
  return {
    id: response.id,
    number: buildEntryNumber(response.id),
    journalId: response.journalId,
    debitAccountId: response.debitAccountId,
    creditAccountId: response.creditAccountId,
    amount: toNumber(response.amount),
    entryDate: response.entryDate,
    description: response.description?.trim() || 'Без описания',
    documentType: response.documentType ?? undefined,
    documentId: response.documentId ?? undefined,
    periodId: response.periodId,
    createdAt: response.createdAt,
    createdBy: response.createdBy ?? undefined,

    date: response.entryDate,
    debitAccount: response.debitAccountId,
    debitSubaccount: response.debitAccountId,
    creditAccount: response.creditAccountId,
    creditSubaccount: response.creditAccountId,
    document: response.documentType ?? '',
    author: response.createdBy?.trim() || 'Система',
    projectName: 'Без проекта',
  };
}

function mapFixedAsset(response: BackendFixedAssetResponse): FixedAsset {
  const purchaseAmount = toNumber(response.purchaseAmount);
  const currentValue = toNumber(response.currentValue);
  const accumulatedDepreciation = Math.max(0, purchaseAmount - currentValue);

  return {
    id: response.id,
    code: response.code,
    inventoryNumber: response.inventoryNumber,
    name: response.name,
    accountId: response.accountId ?? undefined,
    purchaseDate: response.purchaseDate,
    purchaseAmount,
    usefulLifeMonths: response.usefulLifeMonths,
    depreciationMethod: response.depreciationMethod,
    depreciationMethodDisplayName: response.depreciationMethodDisplayName ?? undefined,
    currentValue,
    status: response.status,
    statusDisplayName: response.statusDisplayName ?? undefined,
    monthlyDepreciation: toNumber(response.monthlyDepreciation),
    createdAt: response.createdAt,
    createdBy: response.createdBy ?? undefined,

    acquisitionDate: response.purchaseDate,
    originalCost: purchaseAmount,
    accumulatedDepreciation,
    residualValue: currentValue,
    usefulLife: response.usefulLifeMonths,
    location: 'Не указано',
    responsible: response.createdBy?.trim() || 'Не указан',
    category: 'OTHER',
  };
}

function mapJournal(response: BackendFinancialJournalResponse): FinancialJournal {
  return {
    id: response.id,
    code: response.code,
    name: response.name,
    journalType: response.journalType,
    journalTypeDisplayName: response.journalTypeDisplayName ?? undefined,
    active: response.active,
    createdAt: response.createdAt,
  };
}

async function mapPage<TBackend, TMapped>(
  request: Promise<{ data: PaginatedResponse<TBackend> }>,
  mapper: (item: TBackend) => TMapped,
): Promise<PaginatedResponse<TMapped>> {
  const response = await request;
  return {
    ...response.data,
    content: response.data.content.map(mapper),
  };
}

function buildAccountTree(accounts: Account[]): Account[] {
  const byId = new Map<string, Account>();

  accounts.forEach((account) => {
    byId.set(account.id, { ...account, children: [] });
  });

  const roots: Account[] = [];

  byId.forEach((account) => {
    if (account.parentId && byId.has(account.parentId)) {
      byId.get(account.parentId)!.children!.push(account);
      return;
    }
    roots.push(account);
  });

  const sortByCode = (left: Account, right: Account) => left.code.localeCompare(right.code, 'ru', { numeric: true });
  const sortRecursive = (nodes: Account[]) => {
    nodes.sort(sortByCode);
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortRecursive(node.children);
      }
    });
  };

  sortRecursive(roots);
  return roots;
}

async function fetchAllAccounts(): Promise<Account[]> {
  const firstPage = await mapPage(
    apiClient.get<PaginatedResponse<BackendAccountResponse>>('/accounting/accounts', {
      params: {
        page: 0,
        size: 500,
        sort: 'code,asc',
      },
    }),
    mapAccount,
  );

  const accounts = [...firstPage.content];

  if (firstPage.totalPages > 1) {
    const requests: Array<Promise<{ data: PaginatedResponse<BackendAccountResponse> }>> = [];
    for (let page = 1; page < firstPage.totalPages; page += 1) {
      requests.push(
        apiClient.get<PaginatedResponse<BackendAccountResponse>>('/accounting/accounts', {
          params: {
            page,
            size: 500,
            sort: 'code,asc',
          },
        }),
      );
    }

    const pages = await Promise.all(requests);
    pages.forEach((page) => {
      accounts.push(...page.data.content.map(mapAccount));
    });
  }

  return accounts;
}

export interface AccountFilters extends PaginationParams {
  type?: AccountType;
  asTree?: boolean;
}

export interface JournalEntryFilters extends PaginationParams {
  periodId?: string;
  journalId?: string;
}

export interface CreateJournalEntryPayload {
  journalId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  entryDate: string;
  description?: string;
  documentType?: string;
  documentId?: string;
  periodId: string;
}

export interface FixedAssetFilters extends PaginationParams {
  status?: FixedAssetStatus;
}

export interface CreateFixedAssetPayload {
  code: string;
  name: string;
  inventoryNumber: string;
  accountId?: string;
  purchaseDate: string;
  purchaseAmount: number;
  usefulLifeMonths: number;
  depreciationMethod?: DepreciationMethod;
}

export interface FinancialJournalFilters extends PaginationParams {
  active?: boolean;
}

export interface CreateFinancialJournalPayload {
  code: string;
  name: string;
  journalType: JournalType;
}

export const accountingApi = {
  getAccounts: async (params?: AccountFilters): Promise<PaginatedResponse<Account>> => {
    const response = await mapPage(
      apiClient.get<PaginatedResponse<BackendAccountResponse>>('/accounting/accounts', {
        params: {
          page: params?.page,
          size: params?.size,
          sort: params?.sort,
          type: params?.type,
        },
      }),
      mapAccount,
    );

    if (!params?.asTree) {
      return response;
    }

    return {
      ...response,
      content: buildAccountTree(response.content),
    };
  },

  getAllAccounts: async (params?: Pick<AccountFilters, 'type' | 'asTree'>): Promise<Account[]> => {
    const accounts = await fetchAllAccounts();
    const filtered = params?.type ? accounts.filter((account) => account.type === params.type) : accounts;
    return params?.asTree ? buildAccountTree(filtered) : filtered;
  },

  getAccount: async (id: string): Promise<Account> => {
    const response = await apiClient.get<BackendAccountResponse>(`/accounting/accounts/${id}`);
    return mapAccount(response.data);
  },

  getPeriods: async (params?: PaginationParams): Promise<PaginatedResponse<AccountingPeriod>> =>
    mapPage(
      apiClient.get<PaginatedResponse<BackendPeriodResponse>>('/accounting/periods', { params }),
      mapPeriod,
    ),

  getOpenPeriods: async (): Promise<AccountingPeriod[]> => {
    const response = await accountingApi.getPeriods({ page: 0, size: 120, sort: 'year,desc' });
    return response.content.filter((period) => period.status === 'OPEN');
  },

  openPeriod: async (year: number, month: number): Promise<void> => {
    await apiClient.post('/accounting/periods', null, { params: { year, month } });
  },

  closePeriod: async (id: string): Promise<void> => {
    await apiClient.post(`/accounting/periods/${id}/close`);
  },

  getJournalEntries: async (params?: JournalEntryFilters): Promise<PaginatedResponse<JournalEntry>> =>
    mapPage(
      apiClient.get<PaginatedResponse<BackendEntryResponse>>('/accounting/entries', {
        params: {
          page: params?.page,
          size: params?.size,
          sort: params?.sort,
          periodId: isUuid(params?.periodId) ? params?.periodId : undefined,
          journalId: isUuid(params?.journalId) ? params?.journalId : undefined,
        },
      }),
      mapEntry,
    ),

  getJournalEntry: async (id: string): Promise<JournalEntry> => {
    const response = await apiClient.get<BackendEntryResponse>(`/accounting/entries/${id}`);
    return mapEntry(response.data);
  },

  createJournalEntry: async (data: CreateJournalEntryPayload): Promise<JournalEntry> => {
    const payload = {
      journalId: data.journalId,
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
      amount: data.amount,
      entryDate: data.entryDate,
      description: data.description,
      documentType: data.documentType,
      documentId: isUuid(data.documentId) ? data.documentId : undefined,
      periodId: data.periodId,
    };

    const response = await apiClient.post<BackendEntryResponse>('/accounting/entries', payload);
    return mapEntry(response.data);
  },

  updateJournalEntry: async (id: string, data: CreateJournalEntryPayload): Promise<JournalEntry> => {
    const payload = {
      journalId: data.journalId,
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
      amount: data.amount,
      entryDate: data.entryDate,
      description: data.description,
      documentType: data.documentType,
      documentId: isUuid(data.documentId) ? data.documentId : undefined,
      periodId: data.periodId,
    };

    const response = await apiClient.put<BackendEntryResponse>(`/accounting/entries/${id}`, payload);
    return mapEntry(response.data);
  },

  deleteJournalEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounting/entries/${id}`);
  },

  deleteJournalEntriesBulk: async (entryIds: string[]): Promise<void> => {
    await apiClient.post('/accounting/entries/bulk-delete', { entryIds });
  },

  getFinancialJournals: async (params?: FinancialJournalFilters): Promise<PaginatedResponse<FinancialJournal>> => {
    const response = await mapPage(
      apiClient.get<PaginatedResponse<BackendFinancialJournalResponse>>('/accounting/journals', {
        params: {
          page: params?.page,
          size: params?.size,
          sort: params?.sort,
        },
      }),
      mapJournal,
    );

    if (params?.active == null) {
      return response;
    }

    return {
      ...response,
      content: response.content.filter((journal) => journal.active === params.active),
    };
  },

  createFinancialJournal: async (payload: CreateFinancialJournalPayload): Promise<FinancialJournal> => {
    const response = await apiClient.post<BackendFinancialJournalResponse>('/accounting/journals', payload);
    return mapJournal(response.data);
  },

  activateFinancialJournal: async (id: string): Promise<FinancialJournal> => {
    const response = await apiClient.post<BackendFinancialJournalResponse>(`/accounting/journals/${id}/activate`);
    return mapJournal(response.data);
  },

  deactivateFinancialJournal: async (id: string): Promise<FinancialJournal> => {
    const response = await apiClient.post<BackendFinancialJournalResponse>(`/accounting/journals/${id}/deactivate`);
    return mapJournal(response.data);
  },

  getFixedAssets: async (params?: FixedAssetFilters): Promise<PaginatedResponse<FixedAsset>> =>
    mapPage(
      apiClient.get<PaginatedResponse<BackendFixedAssetResponse>>('/fixed-assets', {
        params: {
          page: params?.page,
          size: params?.size,
          sort: params?.sort,
          status: params?.status,
        },
      }),
      mapFixedAsset,
    ),

  getFixedAsset: async (id: string): Promise<FixedAsset> => {
    const response = await apiClient.get<BackendFixedAssetResponse>(`/fixed-assets/${id}`);
    return mapFixedAsset(response.data);
  },

  createFixedAsset: async (data: CreateFixedAssetPayload): Promise<FixedAsset> => {
    const response = await apiClient.post<BackendFixedAssetResponse>('/fixed-assets', {
      code: data.code,
      name: data.name,
      inventoryNumber: data.inventoryNumber,
      accountId: isUuid(data.accountId) ? data.accountId : undefined,
      purchaseDate: data.purchaseDate,
      purchaseAmount: data.purchaseAmount,
      usefulLifeMonths: data.usefulLifeMonths,
      depreciationMethod: data.depreciationMethod,
    });
    return mapFixedAsset(response.data);
  },

  updateFixedAsset: async (id: string, data: CreateFixedAssetPayload): Promise<FixedAsset> => {
    const response = await apiClient.put<BackendFixedAssetResponse>(`/fixed-assets/${id}`, {
      code: data.code,
      name: data.name,
      inventoryNumber: data.inventoryNumber,
      accountId: isUuid(data.accountId) ? data.accountId : undefined,
      purchaseDate: data.purchaseDate,
      purchaseAmount: data.purchaseAmount,
      usefulLifeMonths: data.usefulLifeMonths,
      depreciationMethod: data.depreciationMethod,
    });
    return mapFixedAsset(response.data);
  },

  activateFixedAsset: async (id: string): Promise<FixedAsset> => {
    const response = await apiClient.post<BackendFixedAssetResponse>(`/fixed-assets/${id}/activate`);
    return mapFixedAsset(response.data);
  },

  disposeFixedAsset: async (id: string): Promise<FixedAsset> => {
    const response = await apiClient.post<BackendFixedAssetResponse>(`/fixed-assets/${id}/dispose`);
    return mapFixedAsset(response.data);
  },

  deleteFixedAsset: async (id: string): Promise<void> => {
    await apiClient.delete(`/fixed-assets/${id}`);
  },

  getDashboard: async (): Promise<AccountingDashboard> => {
    const [accounts, entries, assets, periods] = await Promise.all([
      accountingApi.getAccounts({ page: 0, size: 500, sort: 'code,asc' }),
      accountingApi.getJournalEntries({ page: 0, size: 20, sort: 'createdAt,desc' }),
      accountingApi.getFixedAssets({ page: 0, size: 200, sort: 'createdAt,desc' }),
      accountingApi.getPeriods({ page: 0, size: 120, sort: 'year,desc' }),
    ]);

    return {
      totalAccounts: accounts.totalElements,
      activeAccounts: accounts.content.filter((account) => account.type === 'ACTIVE').length,
      passiveAccounts: accounts.content.filter((account) => account.type === 'PASSIVE').length,
      activePassiveAccounts: accounts.content.filter((account) => account.type === 'ACTIVE_PASSIVE').length,
      entriesCount: entries.totalElements,
      entriesTotalAmount: entries.content.reduce((sum, entry) => sum + entry.amount, 0),
      fixedAssetsCount: assets.totalElements,
      fixedAssetsCurrentValue: assets.content.reduce((sum, asset) => sum + asset.currentValue, 0),
      openPeriodsCount: periods.content.filter((period) => period.status === 'OPEN').length,
      recentEntries: entries.content,
    };
  },
};
