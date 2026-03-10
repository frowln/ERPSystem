export type LeadStatus = 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type CrmActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'PROPOSAL' | 'SITE_VISIT';

export interface CrmLead {
  id: string;
  number?: string;
  name: string;
  partnerName?: string;
  contactName?: string;
  email?: string;
  contactEmail?: string;
  phone?: string;
  contactPhone?: string;
  companyName?: string;
  status: LeadStatus;
  statusDisplayName?: string;
  priority: LeadPriority;
  priorityDisplayName?: string;
  stageId?: string;
  stageName?: string;
  teamId?: string;
  teamName?: string;
  assignedToId?: string;
  assignedToName?: string;
  expectedRevenue?: number;
  probability?: number;
  weightedRevenue?: number;
  source?: string;
  medium?: string;
  description?: string;
  lostReason?: string;
  projectId?: string;
  expectedCloseDate?: string;
  wonDate?: string;
  nextActivityDate?: string;
  open?: boolean;
  activityCount?: number;
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CrmStage {
  id: string;
  name: string;
  sequence: number;
  probability: number;
  closed: boolean;
  won: boolean;
  requirements?: string;
  // Computed aliases from backend
  isWon?: boolean;
  isClosed?: boolean;
  leadCount?: number;
  totalRevenue?: number;
}

export interface CrmTeam {
  id: string;
  name: string;
  leaderId?: string;
  memberIds?: string;
  targetRevenue?: number;
  color?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CrmActivity {
  id: string;
  leadId: string;
  activityType: CrmActivityType;
  activityTypeDisplayName?: string;
  userId: string;
  summary?: string;
  notes?: string;
  scheduledAt?: string;
  completedAt?: string;
  result?: string;
  completed: boolean;
  overdue: boolean;
  createdAt: string;
  // Aliases provided by backend
  type: string;
  title: string;
  description?: string;
  assignedToName: string;
  isDone: boolean;
}

export interface CrmPipeline {
  totalLeads: number;
  statusCounts: Record<string, number>;
  stageCounts: Record<string, number>;
  pipelineRevenue: number;
  weightedPipelineRevenue: number;
  wonRevenue: number;
  openLeads: number;
  wonLeads: number;
  lostLeads: number;
}
