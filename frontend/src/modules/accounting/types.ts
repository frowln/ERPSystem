// Accounting Module Types

export type AccountType = 'ACTIVE' | 'PASSIVE' | 'ACTIVE_PASSIVE';

export interface Account {
  code: string;
  name: string;
  type: AccountType | string;
  balance: number;
  children?: Account[];
  description?: string;
  isSubaccount?: boolean;
}

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';

export interface JournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  debitAccount: string;
  debitSubaccount: string;
  creditAccount: string;
  creditSubaccount: string;
  amount: number;
  document: string;
  author: string;
  projectId?: string;
  projectName: string;
  status?: JournalEntryStatus;
}

export type FixedAssetCategory = 'BUILDINGS' | 'MACHINERY' | 'VEHICLES' | 'COMPUTERS' | 'TOOLS' | 'FURNITURE' | 'OTHER';

export type FixedAssetStatus = 'ACTIVE' | 'MAINTENANCE' | 'MOTHBALLED' | 'WRITTEN_OFF' | 'DISPOSED';

export type DepreciationMethod = 'linear' | 'declining_balance' | 'units_of_production';

export interface FixedAsset {
  id: string;
  inventoryNumber: string;
  name: string;
  category: FixedAssetCategory;
  status: FixedAssetStatus;
  acquisitionDate: string;
  originalCost: number;
  accumulatedDepreciation: number;
  residualValue: number;
  usefulLife: number;
  depreciationMethod: DepreciationMethod | string;
  location: string;
  responsible: string;
  projectId?: string;
  disposalDate?: string;
  disposalReason?: string;
}

export interface RecentEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  author: string;
}

export interface AccountBalance {
  code: string;
  name: string;
  openingDebit: number;
  openingCredit: number;
  turnoverDebit: number;
  turnoverCredit: number;
  closingDebit: number;
  closingCredit: number;
}
