// PTO Module Types

export type PtoDocumentType = 'AKT_OV' | 'PROTOCOL' | 'JOURNAL' | 'PPPR' | 'SCHEME' | 'INSTRUCTION' | 'CERTIFICATE';

export type PtoDocumentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface PtoDocument {
  id: string;
  number: string;
  title: string;
  type: PtoDocumentType;
  status: PtoDocumentStatus;
  projectId?: string;
  projectName: string;
  author: string;
  createdDate: string;
  approvedDate: string | null;
  section: string;
  description?: string;
  attachments?: string[];
}

export type WorkPermitType = 'GENERAL' | 'HOT_WORK' | 'HEIGHT_WORK' | 'CONFINED_SPACE' | 'ELECTRICAL' | 'EXCAVATION' | 'CRANE';

export type WorkPermitStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CLOSED' | 'SUSPENDED';

export interface WorkPermit {
  id: string;
  number: string;
  type: WorkPermitType;
  status: WorkPermitStatus;
  location: string;
  projectId?: string;
  projectName: string;
  issuer: string;
  contractor: string;
  startDate: string;
  endDate: string;
  description: string;
  safetyRequirements?: string[];
}

export type LabTestType = 'COMPRESSION' | 'TENSILE' | 'DENSITY' | 'MOISTURE' | 'GRANULOMETRY' | 'CHEMICAL' | 'weld';

export type LabTestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type LabTestResult = 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'PENDING';

export interface LabTest {
  id: string;
  number: string;
  testType: LabTestType;
  material: string;
  status: LabTestStatus;
  result: LabTestResult;
  projectId?: string;
  projectName: string;
  laboratory: string;
  sampleDate: string;
  resultDate: string | null;
  batchNumber: string;
  standard: string;
  notes?: string;
}
