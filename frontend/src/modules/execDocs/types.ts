// Executive Documentation module types
// AOSR, KS-6, Incoming Control, Welding Journal, Special Journals

export type AosrStatus = 'draft' | 'signed' | 'archived';

export interface AosrRecord {
  id: string;
  number: string;
  workType: string;
  location: string;
  startDate: string;
  endDate: string;
  contractor: string;
  inspector: string;
  designerRepresentative: string;
  clientRepresentative: string;
  nextWorkPermission: string;
  status: AosrStatus;
  projectId: string;
  projectName: string;
  createdAt: string;
}

export interface Ks6Entry {
  id: string;
  date: string;
  workDescription: string;
  unit: string;
  quantity: number;
  contractorName: string;
  weatherConditions: string;
  personnelCount: number;
  equipmentUsed: string;
  notes: string;
  projectId: string;
}

export type IncomingControlResult = 'accepted' | 'rejected' | 'conditional';

export interface IncomingControlEntry {
  id: string;
  date: string;
  materialName: string;
  supplier: string;
  documentNumber: string;
  quantity: number;
  unit: string;
  inspector: string;
  result: IncomingControlResult;
  notes: string;
}

export type WeldingResult = 'pass' | 'fail';

export interface WeldingJournalEntry {
  id: string;
  date: string;
  weldNumber: string;
  welderName: string;
  welderCertificate: string;
  jointType: string;
  material: string;
  electrode: string;
  inspectionMethod: string;
  result: WeldingResult;
  projectId: string;
}

export type SpecialJournalType = 'concrete' | 'installation' | 'pile';

export interface SpecialJournalEntry {
  id: string;
  date: string;
  journalType: SpecialJournalType;
  workDescription: string;
  volume: number;
  unit: string;
  weather: string;
  responsibleName: string;
  notes: string;
  projectId: string;
}

// Request types

export interface CreateAosrRequest {
  workType: string;
  location: string;
  startDate: string;
  endDate: string;
  contractor: string;
  inspector: string;
  designerRepresentative: string;
  clientRepresentative: string;
  nextWorkPermission: string;
  projectId: string;
}

export interface CreateKs6EntryRequest {
  date: string;
  workDescription: string;
  unit: string;
  quantity: number;
  contractorName: string;
  weatherConditions: string;
  personnelCount: number;
  equipmentUsed: string;
  notes: string;
  projectId: string;
}

export interface CreateIncomingControlRequest {
  date: string;
  materialName: string;
  supplier: string;
  documentNumber: string;
  quantity: number;
  unit: string;
  inspector: string;
  result: IncomingControlResult;
  notes: string;
}

export interface CreateWeldingEntryRequest {
  date: string;
  weldNumber: string;
  welderName: string;
  welderCertificate: string;
  jointType: string;
  material: string;
  electrode: string;
  inspectionMethod: string;
  result: WeldingResult;
  projectId: string;
}

export interface CreateSpecialJournalRequest {
  date: string;
  journalType: SpecialJournalType;
  workDescription: string;
  volume: number;
  unit: string;
  weather: string;
  responsibleName: string;
  notes: string;
  projectId: string;
}
