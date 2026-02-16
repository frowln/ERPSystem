export type RussianDocumentType =
  | 'KS2'
  | 'KS3'
  | 'M29'
  | 'EXECUTIVE_SCHEME'
  | 'HIDDEN_WORKS_ACT'
  | 'GENERAL_JOURNAL'
  | 'COMMISSIONING_ACT'
  | 'PASSPORT'
  | 'PROTOCOL';

export type RussianDocumentStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'ON_SIGNING'
  | 'SIGNED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface RussianDocument {
  id: string;
  number: string;
  name: string;
  documentType: RussianDocumentType;
  status: RussianDocumentStatus;
  projectId: string;
  projectName?: string;
  contractId?: string;
  contractName?: string;
  documentDate: string;
  periodFrom?: string;
  periodTo?: string;
  totalAmount: number;
  vatAmount: number;
  totalWithVat: number;
  customerName: string;
  contractorName: string;
  signatoryCustomer?: string;
  signatoryContractor?: string;
  lineCount: number;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ks2Line {
  id: string;
  documentId: string;
  sequence: number;
  workName: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  notes?: string;
}

export interface Ks3Period {
  id: string;
  documentId: string;
  periodLabel: string;
  worksFromStart: number;
  worksThisPeriod: number;
  materialsFromStart?: number;
  materialsThisPeriod?: number;
}

export interface M29Line {
  id: string;
  documentId: string;
  materialName: string;
  unitOfMeasure: string;
  normQuantity: number;
  actualQuantity: number;
  deviation: number;
  deviationPercent: number;
}

export interface CreateRussianDocumentRequest {
  name: string;
  documentType: RussianDocumentType;
  projectId: string;
  contractId?: string;
  documentDate: string;
  periodFrom?: string;
  periodTo?: string;
  customerName: string;
  contractorName: string;
  notes?: string;
}

export interface CreateKs2Request {
  name: string;
  projectId: string;
  contractId: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  customerName: string;
  contractorName: string;
  lines: Omit<Ks2Line, 'id' | 'documentId'>[];
}

export interface CreateKs3Request {
  name: string;
  projectId: string;
  contractId: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  customerName: string;
  contractorName: string;
  ks2DocumentIds: string[];
}

// SBIS Integration

export type SbisDocumentStatus = 'DRAFT' | 'SENT' | 'DELIVERED' | 'SIGNED' | 'REJECTED' | 'CANCELLED';
export type SbisDocumentType = 'INVOICE' | 'ACT' | 'WAYBILL' | 'POWER_OF_ATTORNEY' | 'CONTRACT' | 'OTHER';

export interface SbisDocument {
  id: string;
  number: string;
  name: string;
  documentType: SbisDocumentType;
  status: SbisDocumentStatus;
  counterpartyName: string;
  counterpartyInn: string;
  totalAmount: number;
  vatAmount: number;
  documentDate: string;
  sentAt?: string;
  deliveredAt?: string;
  signedAt?: string;
  sbisId?: string;
  errorMessage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SbisConfig {
  id: string;
  organizationName: string;
  organizationInn: string;
  apiKey: string;
  isActive: boolean;
  autoSend: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

// EDO (Electronic Document Workflow)

export type EdoDocumentStatus = 'CREATED' | 'SIGNING' | 'SIGNED' | 'SENT' | 'DELIVERED' | 'REJECTED' | 'EXPIRED';
export type EdoProvider = 'DIADOC' | 'SBIS' | 'TAXCOM' | 'KALUGA_ASTRAL' | 'OTHER';

export interface EdoDocument {
  id: string;
  number: string;
  name: string;
  documentType: string;
  status: EdoDocumentStatus;
  provider: EdoProvider;
  senderName: string;
  senderInn: string;
  recipientName: string;
  recipientInn: string;
  totalAmount?: number;
  documentDate: string;
  sentAt?: string;
  deliveredAt?: string;
  signatureCount: number;
  requiredSignatures: number;
  externalId?: string;
  errorMessage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EdoSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerPosition: string;
  signerInn: string;
  certificateSerial: string;
  signedAt: string;
  isValid: boolean;
  signatureType: 'QUALIFIED' | 'UNQUALIFIED' | 'SIMPLE';
}
