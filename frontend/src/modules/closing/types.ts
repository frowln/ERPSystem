// Closing documents module types
// KS-2, KS-3, and related closing document types

export type ClosingDocStatus = 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'CLOSED';

export interface Ks2Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  projectId: string;
  projectName?: string;
  contractId: string;
  contractName?: string;
  status: ClosingDocStatus;
  totalAmount: number;
  totalQuantity: number;
  lineCount: number;
  createdById?: string;
  createdByName?: string;
  signedById?: string;
  signedByName?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ks2LineItem {
  id: string;
  ks2DocumentId: string;
  sequence: number;
  workName: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  costCode?: string;
}

export interface Ks3Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  projectName?: string;
  contractId: string;
  contractName?: string;
  status: ClosingDocStatus;
  totalAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  netAmount: number;
  ks2Count: number;
  ks2DocumentIds?: string[];
  createdById?: string;
  createdByName?: string;
  signedById?: string;
  signedByName?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKs2Request {
  name: string;
  documentDate: string;
  projectId: string;
  contractId: string;
  lineItems: Omit<Ks2LineItem, 'id' | 'ks2DocumentId'>[];
}

export interface CreateKs3Request {
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  contractId: string;
  ks2DocumentIds: string[];
  retentionPercent: number;
}
