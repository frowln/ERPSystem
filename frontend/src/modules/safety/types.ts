export type IncidentStatus = 'REPORTED' | 'UNDER_INVESTIGATION' | 'CORRECTIVE_ACTION' | 'RESOLVED' | 'CLOSED';
export type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL' | 'FATAL';
export type IncidentType = 'FALL' | 'STRUCK_BY' | 'CAUGHT_IN' | 'ELECTROCUTION' | 'COLLAPSE' | 'FIRE' | 'CHEMICAL' | 'EQUIPMENT' | 'OTHER';

export type InspectionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type InspectionType = 'ROUTINE' | 'UNSCHEDULED' | 'FOLLOW_UP' | 'PRE_WORK' | 'REGULATORY';
export type InspectionRating = 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY' | 'CRITICAL';

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ViolationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OVERDUE' | 'CLOSED';

export interface SafetyIncident {
  id: string;
  number: string;
  incidentDate: string;
  incidentTime?: string;
  projectId: string;
  projectName: string;
  location: string;
  severity: IncidentSeverity;
  incidentType: IncidentType;
  status: IncidentStatus;
  description: string;
  reportedById: string;
  reportedByName: string;
  investigatorId?: string;
  investigatorName?: string;
  injuredPersons: number;
  workDaysLost: number;
  rootCause?: string;
  correctiveActions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyInspection {
  id: string;
  number: string;
  inspectionDate: string;
  projectId: string;
  projectName: string;
  inspectorId: string;
  inspectorName: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  rating?: InspectionRating;
  score: number;
  findingsCount: number;
  violationCount: number;
  location: string;
  notes?: string;
  correctiveActions?: string;
  nextInspectionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyViolation {
  id: string;
  number: string;
  description: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  projectId: string;
  projectName: string;
  inspectionId?: string;
  location: string;
  responsibleId: string;
  responsibleName: string;
  detectedById: string;
  detectedByName: string;
  detectedAt: string;
  deadline: string;
  resolvedAt?: string;
  correctiveAction?: string;
  createdAt: string;
}

export interface CreateIncidentRequest {
  incidentDate: string;
  incidentTime?: string;
  projectId: string;
  location: string;
  severity: IncidentSeverity;
  incidentType: IncidentType;
  description: string;
  injuredPersons: number;
}

export type TrainingStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TrainingType = 'INITIAL' | 'PRIMARY' | 'PERIODIC' | 'UNSCHEDULED' | 'SPECIAL';

export interface SafetyTraining {
  id: string;
  title: string;
  trainingType: TrainingType;
  trainingTypeDisplayName: string;
  status: TrainingStatus;
  projectId?: string;
  projectName?: string;
  date: string;
  instructorId?: string;
  instructorName?: string;
  participants?: string;
  participantCount: number;
  topics?: string;
  duration?: number;
  notes?: string;
  gostNumber?: string;
  completedAt?: string;
  nextScheduledDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
