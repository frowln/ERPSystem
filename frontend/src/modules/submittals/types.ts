export type SubmittalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISED';
export type SubmittalType = 'SHOP_DRAWING' | 'PRODUCT_DATA' | 'SAMPLE' | 'MOCK_UP' | 'TEST_REPORT' | 'CERTIFICATE' | 'CALCULATION' | 'DESIGN_MIX' | 'OTHER';

export interface Submittal {
  id: string;
  number: string;
  code?: string;
  title: string;
  description?: string;
  submittalType: SubmittalType;
  submittalTypeDisplayName?: string;
  status: SubmittalStatus;
  statusDisplayName?: string;
  projectId: string;
  projectName?: string;
  specSection?: string;
  ballInCourt?: string;
  submittedById?: string;
  submittedByName?: string;
  reviewedById?: string;
  reviewerName?: string;
  dueDate?: string;
  submitDate?: string;
  responseDate?: string;
  requiredDate?: string;
  leadTimeDays?: number;
  linkedDrawingIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmittalReview {
  id: string;
  submittalId: string;
  reviewerName: string;
  status: string;
  comment?: string;
  reviewDate: string;
}

export interface CreateSubmittalRequest {
  title: string;
  description?: string;
  submittalType: SubmittalType;
  specSection?: string;
  dueDate?: string;
  requiredDate?: string;
  submittedById?: string;
  projectId: string;
}
