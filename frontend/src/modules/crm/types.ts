export type LeadStatus = 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CrmLead {
  id: string;
  number: string;
  name: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  status: LeadStatus;
  priority: LeadPriority;
  stageId: string;
  stageName: string;
  teamId?: string;
  teamName?: string;
  assignedToId?: string;
  assignedToName?: string;
  expectedRevenue?: number;
  probability?: number;
  source?: string;
  description?: string;
  lostReason?: string;
  expectedCloseDate?: string;
  activityCount: number;
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
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
