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

// ---------------------------------------------------------------------------
// Safety Metrics (LTIR/TRIR Dashboard)
// ---------------------------------------------------------------------------

export type MetricsPeriod = 'month' | 'quarter' | 'year';

export interface SafetyMetricTarget {
  ltir: number;
  trir: number;
  dartRate: number;
  severityRate: number;
}

export interface SafetyMetrics {
  ltir: number;
  trir: number;
  dartRate: number;
  severityRate: number;
  nearMissFreq: number;
  totalWorkHours: number;
  ltiCases: number;
  recordableIncidents: number;
  targets: SafetyMetricTarget;
  monthlyTrend: { month: string; ltir: number; trir: number; targetLtir: number; targetTrir: number }[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    ltir: number;
    trir: number;
    incidents: number;
    workHours: number;
  }[];
}

// ---------------------------------------------------------------------------
// Training Journal
// ---------------------------------------------------------------------------

export type TrainingRecordType = 'initial' | 'primary' | 'repeat' | 'unscheduled' | 'targeted';
export type TrainingResult = 'pass' | 'fail';

export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  trainingType: TrainingRecordType;
  date: string;
  instructor: string;
  result: TrainingResult;
  nextDate: string;
  projectId: string;
  projectName: string;
}

export interface CreateTrainingRecordRequest {
  employeeId: string;
  employeeName: string;
  trainingType: TrainingRecordType;
  date: string;
  instructor: string;
  result: TrainingResult;
  nextDate: string;
  projectId: string;
  projectName: string;
}

// ---------------------------------------------------------------------------
// PPE Management (СИЗ)
// ---------------------------------------------------------------------------

export type PpeCategory = 'head' | 'body' | 'hands' | 'feet' | 'eyes' | 'respiratory';
export type PpeCondition = 'new' | 'good' | 'worn' | 'damaged';
export type PpeIssueStatus = 'issued' | 'returned' | 'written_off';

export interface PpeItem {
  id: string;
  name: string;
  category: PpeCategory;
  size?: string;
  quantity: number;
  minQuantity: number;
  condition: PpeCondition;
  expirationDate?: string;
}

export interface PpeIssue {
  id: string;
  ppeItemId: string;
  ppeItemName: string;
  size?: string;
  employeeId: string;
  employeeName: string;
  issuedDate: string;
  returnDate?: string;
  writeOffDate?: string;
  condition?: PpeCondition;
  status: PpeIssueStatus;
}

export interface IssuePpeRequest {
  ppeItemId: string;
  employeeId: string;
  employeeName: string;
  size?: string;
  quantity?: number;
}

export interface ReturnPpeRequest {
  status: 'returned' | 'written_off';
}

// ---------------------------------------------------------------------------
// SOUT Cards (Спецоценка условий труда)
// ---------------------------------------------------------------------------

export type SoutHazardClass = 1 | 2 | 3 | 4;
export type SoutSubclass = '3.1' | '3.2' | '3.3' | '3.4';
export type SoutStatus = 'valid' | 'expiring' | 'expired';

export interface SoutFactor {
  name: string;
  measured: number;
  limit: number;
  unit: string;
}

export interface SoutCard {
  id: string;
  workplaceId: string;
  position: string;
  department: string;
  hazardClass: SoutHazardClass;
  hazardSubclass?: SoutSubclass;
  certificateNumber?: string;
  factors: SoutFactor[];
  assessmentDate: string;
  nextAssessmentDate?: string;
  expiryDate: string;
  status: SoutStatus;
}

// ---------------------------------------------------------------------------
// Accident Investigation Act N-1
// ---------------------------------------------------------------------------

export type AccidentActStatus = 'draft' | 'investigation' | 'completed';

export interface AccidentActN1 {
  id: string;
  incidentId: string;
  incidentNumber: string;
  victimName: string;
  victimPosition: string;
  circumstances: string;
  causes: string;
  witnesses: string;
  responsiblePersons: string;
  correctiveMeasures: string;
  createdAt: string;
  status: AccidentActStatus;
}

export interface CreateAccidentActRequest {
  incidentId: string;
  victimName: string;
  victimPosition: string;
  circumstances: string;
  causes: string;
  witnesses?: string;
  responsiblePersons: string;
  correctiveMeasures: string;
}
