export type KepCertificateStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export interface KepCertificate {
  id: string;
  serialNumber: string;
  ownerName: string;
  ownerInn: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  status: KepCertificateStatus;
  thumbprint: string;
  organizationId?: string;
  organizationName?: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

export type KepSigningStatus = 'PENDING' | 'SIGNED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type KepPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface KepSignature {
  id: string;
  signingRequestId: string;
  certificateId: string;
  certificateOwner: string;
  signedAt: string;
  signatureData: string;
  isValid: boolean;
}

export interface KepSigningRequest {
  id: string;
  number: string;
  documentName: string;
  documentId: string;
  status: KepSigningStatus;
  priority: KepPriority;
  requestedById: string;
  requestedByName: string;
  signerId: string;
  signerName: string;
  certificateId?: string;
  certificateSerial?: string;
  dueDate?: string;
  signedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KepConfig {
  id: string;
  cryptoProVersion: string;
  defaultCertificateId?: string;
  autoRenewEnabled: boolean;
  renewalDaysBeforeExpiry: number;
  trustedIssuers: string[];
  updatedAt: string;
}

export interface CreateKepSigningRequest {
  documentName: string;
  documentId: string;
  priority: KepPriority;
  signerId: string;
  certificateId?: string;
  dueDate?: string;
  projectId?: string;
}

// OCSP validation
export type OcspStatus = 'GOOD' | 'REVOKED' | 'UNKNOWN' | 'ERROR';

export interface OcspValidationResult {
  status: OcspStatus;
  message?: string;
  checkedAt: string;
  responderUrl?: string;
}

// Machine-readable power of attorney (MChD)
export type MchDStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export interface MchDDocument {
  id: string;
  number: string;
  principalInn: string;
  principalName: string;
  representativeInn: string;
  representativeName: string;
  scope: string;
  status: MchDStatus;
  validFrom: string;
  validTo: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMchDRequest {
  number: string;
  principalInn: string;
  principalName: string;
  representativeInn: string;
  representativeName: string;
  scope: string;
  validFrom: string;
  validTo: string;
  notes?: string;
}
