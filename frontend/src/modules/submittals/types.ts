export type SubmittalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'APPROVED_AS_NOTED' | 'REVISE_RESUBMIT' | 'REJECTED' | 'CLOSED';
export type SubmittalType = 'SHOP_DRAWING' | 'PRODUCT_DATA' | 'SAMPLE' | 'DESIGN_DATA' | 'TEST_REPORT' | 'CERTIFICATE' | 'OTHER';

export interface Submittal {
  id: string;
  number: string;
  title: string;
  description?: string;
  type: SubmittalType;
  status: SubmittalStatus;
  projectId: string;
  projectName?: string;
  specSection?: string;
  ballInCourt?: string;
  submittedById: string;
  submittedByName: string;
  reviewerId?: string;
  reviewerName?: string;
  dueDate?: string;
  submitDate?: string;
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
  status: SubmittalStatus;
  comment?: string;
  reviewDate: string;
}

export interface CreateSubmittalRequest {
  title: string;
  description?: string;
  type: SubmittalType;
  specSection?: string;
  dueDate?: string;
  requiredDate?: string;
  reviewerId?: string;
  projectId: string;
}
