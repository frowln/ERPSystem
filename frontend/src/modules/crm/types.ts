export type LeadStatus = 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadPriority = 'LOW' | 'NORMAL' | 'HIGH';

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
  description?: string;
  lostReason?: string;
  projectId?: string;
  expectedCloseDate?: string;
  wonDate?: string;
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
  isWon: boolean;
  leadCount: number;
  totalRevenue: number;
}

export interface CrmTeam {
  id: string;
  name: string;
  leadName: string;
  memberCount: number;
  activeLeads: number;
  wonLeads: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: string;
}

export interface CrmActivity {
  id: string;
  leadId: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'presentation';
  title: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  assignedToName: string;
  isDone: boolean;
  createdAt: string;
}
