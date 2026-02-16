export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'ORDERED'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELLED';

export type PurchaseRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PurchaseRequest {
  id: string;
  name: string;
  requestDate: string;
  projectId: string;
  projectName?: string;
  status: PurchaseRequestStatus;
  priority: PurchaseRequestPriority;
  requestedById?: string;
  requestedByName: string;
  assignedToId?: string;
  assignedToName?: string;
  totalAmount: number;
  itemCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestItem {
  id: string;
  purchaseRequestId: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  amount: number;
  specItemId?: string;
  notes?: string;
}

export interface ApprovalItem {
  number: string;
  title: string;
  requestor: string;
  department: string;
  date: string;
  total: number;
  items: ApprovalLineItem[];
  budgetRemaining: number;
}

export interface ApprovalLineItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

export type ApprovalDecision = 'APPROVE' | 'REJECT' | 'RETURN';

export interface TenderVendor {
  id: string;
  name: string;
  inn?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface TenderOffer {
  id: string;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  deliveryDays: number;
  paymentTerms?: string;
  isRecommended: boolean;
  notes?: string;
}

export interface PriceRequest {
  id: string;
  purchaseRequestId: string;
  vendorId: string;
  vendorName: string;
  sentAt: string;
  respondedAt?: string;
  status: 'SENT' | 'RESPONDED' | 'EXPIRED';
  responseAmount?: number;
}

export interface CreatePurchaseRequestRequest {
  name: string;
  projectId: string;
  priority: PurchaseRequestPriority;
  items: Omit<PurchaseRequestItem, 'id' | 'purchaseRequestId'>[];
  notes?: string;
}
