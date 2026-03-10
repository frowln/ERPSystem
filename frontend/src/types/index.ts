export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  position?: string;
  role: UserRole;
  roles: string[];
  avatarUrl?: string;
  enabled?: boolean;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
}

// Must match backend role codes used in `@PreAuthorize` + DB seeds.
// Keep both "legacy" and "new" codes during RBAC reconciliation.
export type UserRole =
  | 'ADMIN'
  | 'VIEWER'
  | 'PROJECT_MANAGER'
  | 'MANAGER'
  | 'ENGINEER'
  | 'FOREMAN'
  | 'ACCOUNTANT'
  | 'SUPPLY_MANAGER'
  | 'PROCUREMENT_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'ESTIMATOR'
  | 'FINANCE_MANAGER'
  | 'FINANCIAL_CONTROLLER'
  | 'COST_MANAGER'
  | 'QUALITY_MANAGER'
  | 'QUALITY_INSPECTOR'
  | 'SAFETY_MANAGER'
  | 'SAFETY_OFFICER'
  | 'HR_MANAGER'
  | 'BID_MANAGER'
  | 'CONTRACT_MANAGER'
  | 'DOCUMENT_MANAGER'
  | 'DOCUMENT_CONTROLLER'
  | 'DESIGNER'
  | 'INSPECTOR'
  | 'LAWYER'
  | 'LOGISTICS_MANAGER'
  | 'MAINTENANCE_MANAGER'
  | 'FLEET_MANAGER'
  | 'OPERATOR'
  | 'PLANNER'
  | 'SCHEDULER'
  | 'RECRUITER'
  | 'REGULATORY_MANAGER'
  | 'SALES_MANAGER'
  | 'SUPPORT_MANAGER'
  | 'SYSTEM'
  | 'SYSTEM_INTEGRATOR'
  | 'PORTAL_CUSTOMER'
  | 'PORTAL_CONTRACTOR'
  | 'PORTAL_SUBCONTRACTOR'
  | 'PORTAL_SUPPLIER';

export interface Organization {
  id: string;
  name: string;
  inn: string;
  logoUrl?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  type: ProjectType;
  priority: ProjectPriority;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget: number;
  budgetAmount?: number;
  contractAmount?: number;
  spentAmount: number;
  managerId: string;
  managerName: string;
  customerName: string;
  customerId?: string;
  category?: string;
  constructionKind?: string;
  address?: string;
  city?: string;
  region?: string;
  progress: number;
  membersCount: number;
  computedFinancials?: ComputedFinancials;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProjectType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'INFRASTRUCTURE'
  | 'RENOVATION';

export type ProjectPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

export interface ProjectFinancialSummary {
  projectId: string;
  contractAmount: number;
  invoicedToCustomer: number;
  receivedPayments: number;
  accountsReceivable: number;
  plannedBudget: number;
  estimateTotal: number;
  committed: number;
  subcontractAmount: number;
  supplyAmount: number;
  serviceAmount: number;
  invoicedFromSuppliers: number;
  paidToSuppliers: number;
  accountsPayable: number;
  actualCost: number;
  margin: number;
  profitabilityPercent: number;
  budgetUtilizationPercent: number;
  cashFlow: number;
  completionPercent: number;
  preliminaryBudget: number;
  preliminaryContractAmount: number;
}

export interface ComputedFinancials {
  contractAmount: number;
  plannedBudget: number;
  actualCost: number;
  margin: number;
  profitabilityPercent: number;
  invoicedToCustomer: number;
  receivedPayments: number;
  paidToSuppliers: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashFlow: number;
  committed: number;
  budgetUtilizationPercent: number;
  completionPercent: number;
  estimateTotal: number;
}

export interface DashboardSummary {
  activeProjects: number;
  totalBudget: number;
  totalContractAmount: number;
  onWatch: number;
  overdue: number;
  projectsByStatus: { status: string; count: number }[];
  budgetVsActual: { month: string; budget: number; actual: number }[];
  recentProjects: Project[];
  computedTotalContractAmount: number;
  computedTotalPlannedBudget: number;
  computedTotalActualCost: number;
  computedTotalCashFlow: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  projectId?: string;
}

export interface ProjectFilters extends PaginationParams {
  status?: ProjectStatus;
  type?: ProjectType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  type?: ProjectType;
  priority?: ProjectPriority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  budgetAmount?: number;
  contractAmount?: number;
  customerId?: string;
  managerId?: string;
  category?: string;
  constructionKind?: string;
  address?: string;
  city?: string;
  region?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
  actualStartDate?: string;
  actualEndDate?: string;
}

// Contract types
export type ContractStatus = 'DRAFT' | 'ON_APPROVAL' | 'LAWYER_APPROVED' | 'MANAGEMENT_APPROVED' | 'FINANCE_APPROVED' | 'APPROVED' | 'SIGNED' | 'ACTIVE' | 'CLOSED' | 'REJECTED' | 'CANCELLED';

export interface ContractType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Contract {
  id: string;
  name: string;
  number: string;
  contractDate: string;
  partnerId: string;
  partnerName: string;
  projectId: string;
  projectName?: string;
  typeId: string;
  typeName?: string;
  contractDirection?: 'CLIENT' | 'CONTRACTOR';
  direction?: 'CLIENT' | 'CONTRACTOR';
  status: ContractStatus;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  paymentTerms?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  responsibleId?: string;
  responsibleName?: string;
  retentionPercent: number;
  prepaymentPercent?: number;
  paymentDelayDays?: number;
  guaranteePeriodMonths?: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  procurementLaw?: '44-FZ' | '223-FZ' | 'COMMERCIAL';
  procurementMethod?: string;
  tenderNumber?: string;
  tenderJustification?: string;
  insuranceType?: 'CMR' | 'BUILDERS_RISK' | 'PROFESSIONAL_LIABILITY' | 'COMBINED';
  insurancePolicyNumber?: string;
  insuranceAmount?: number;
  insuranceExpiryDate?: string;
  performanceBondNumber?: string;
  performanceBondAmount?: number;
  paymentBondNumber?: string;
  paymentBondAmount?: number;
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractApproval {
  id: string;
  contractId: string;
  stage: string;
  approverId: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  comment?: string;
}

// Specification types
export type SpecificationStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE';
export type SpecItemType = 'MATERIAL' | 'EQUIPMENT' | 'WORK';

export interface Specification {
  id: string;
  /** Auto-generated code, e.g. SPEC-00031 */
  name: string;
  /** User-provided display title */
  title?: string;
  projectId: string;
  projectName?: string;
  contractId?: string;
  version: number;
  isCurrent: boolean;
  status: SpecificationStatus;
  itemCount: number;
  totalAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  parentVersionId?: string;
}

export interface SpecItem {
  id: string;
  specificationId: string;
  sequence: number;
  position?: string;        // Позиция из таблицы ПД (1, 1.1, А1)
  sectionName?: string;     // Раздел в спецификации (СИСТЕМА ОТОПЛЕНИЯ (ОВ))
  itemType: SpecItemType;
  name: string;
  brand?: string;           // Тип/Марка
  productCode?: string;     // Код оборудования
  manufacturer?: string;    // Завод-изготовитель
  quantity: number;
  unitOfMeasure: string;
  weight?: number;          // Вес, кг
  plannedAmount: number;
  procurementStatus: string;
  estimateStatus: string;
  isCustomerProvided: boolean;
  supplyStatus?: 'FULLY_COVERED' | 'PARTIALLY_COVERED' | 'NOT_COVERED';
  coveredQuantity?: number;
  bestPrice?: number;
  bestVendorName?: string;
  budgetItemId?: string;
  longLead?: boolean;
  leadTimeDays?: number;
  earlyProcurementRequired?: boolean;
  notes?: string;
}

// Engineering Surveys
export type SurveyType = 'GEODETIC' | 'GEOLOGICAL' | 'HYDRO' | 'ECOLOGICAL' | 'OTHER';
export type SurveyStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
export interface EngineeringSurvey {
  id: string;
  projectId: string;
  type: SurveyType;
  status: SurveyStatus;
  contractor?: string;
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  resultSummary?: string;
  documents?: string[];
}

// Construction Permits
export type PermitType = 'GPZU' | 'EXPERTISE_PD' | 'BUILDING_PERMIT' | 'ENVIRONMENTAL' | 'FIRE_SAFETY' | 'OTHER';
export type PermitStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export interface ConstructionPermit {
  id: string;
  projectId: string;
  permitType: PermitType;
  status: PermitStatus;
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  notes?: string;
  documents?: string[];
}

// Construction Plans (ПОС/ППР)
export type ConstructionPlanType = 'POS' | 'PPR' | 'SITE_PLAN';
export type ConstructionPlanStatus = 'NOT_STARTED' | 'DRAFT' | 'REVIEW' | 'APPROVED';
export interface ConstructionPlan {
  id: string;
  projectId: string;
  planType: ConstructionPlanType;
  status: ConstructionPlanStatus;
  version: number;
  author?: string;
  approvedBy?: string;
  approvedDate?: string;
  documentId?: string;
  notes?: string;
}

// Risk Register
export type RiskCategory = 'FINANCIAL' | 'TECHNICAL' | 'LEGAL' | 'ENVIRONMENTAL' | 'SCHEDULE' | 'SAFETY' | 'OTHER';
export type RiskStatus = 'IDENTIFIED' | 'MITIGATING' | 'ACCEPTED' | 'CLOSED';
export interface ProjectRisk {
  id: string;
  projectId: string;
  category: RiskCategory;
  description: string;
  probability: number;
  impact: number;
  score: number;
  mitigation?: string;
  owner?: string;
  status: RiskStatus;
  dueDate?: string;
  createdAt: string;
}

// Value Engineering
export type VeStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
export type QualityImpact = 'NONE' | 'MINOR' | 'SIGNIFICANT';
export interface ValueEngineeringItem {
  id: string;
  projectId: string;
  budgetItemId?: string;
  budgetItemName?: string;
  originalSolution: string;
  proposedSolution: string;
  costSaving: number;
  qualityImpact: QualityImpact;
  status: VeStatus;
  author?: string;
  approvedBy?: string;
  createdAt: string;
}

// Vendor Prequalification
export type PrequalificationStatus = 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED' | 'EXPIRED';
export interface VendorPrequalification {
  id: string;
  vendorId: string;
  vendorName: string;
  financialScore: number;
  safetyScore: number;
  experienceScore: number;
  insuranceValid: boolean;
  bondCapacity: number;
  overallScore: number;
  status: PrequalificationStatus;
  validUntil?: string;
  notes?: string;
  createdAt: string;
}

// Safety Checklist
export type SafetyChecklistCategory = 'PPE' | 'SITE_SECURITY' | 'EMERGENCY' | 'TRAINING' | 'HAZARD_ASSESSMENT' | 'FIRE_PROTECTION';
export interface SafetyChecklistItem {
  id: string;
  projectId: string;
  category: SafetyChecklistCategory;
  description: string;
  required: boolean;
  completed: boolean;
  responsiblePerson?: string;
  dueDate?: string;
}

// Pre-Construction Meeting
export interface MeetingDecision {
  id: string;
  text: string;
  completed: boolean;
}
export interface MeetingActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate?: string;
  completed: boolean;
}
export interface PreConstructionMeeting {
  id: string;
  projectId: string;
  date: string;
  location?: string;
  attendees: string[];
  agenda: string[];
  minutes?: string;
  decisions: MeetingDecision[];
  actionItems: MeetingActionItem[];
  createdAt: string;
}

// Estimate types
export type EstimateStatus = 'DRAFT' | 'IN_WORK' | 'APPROVED' | 'ACTIVE';

export interface Estimate {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  specificationId: string;
  specificationName?: string;
  contractId?: string;
  notes?: string;
  status: EstimateStatus;
  totalAmount: number;
  orderedAmount: number;
  invoicedAmount: number;
  totalSpent: number;
  balance: number;
  variancePercent: number;
  createdAt: string;
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  specItemId?: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  unitPriceCustomer?: number;
  amount: number;
  amountCustomer?: number;
  orderedAmount: number;
  invoicedAmount: number;
  deliveredAmount: number;
}

// Local estimate (normative-based)
export type LocalEstimateStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'ARCHIVED';

export interface LocalEstimate {
  id: string;
  name: string;
  projectId?: string;
  contractId?: string;
  objectName?: string;
  calculationMethod: string;
  region?: string;
  baseYear?: string;
  priceLevelQuarter?: string;
  status: LocalEstimateStatus;
  totalDirectCost: number;
  totalOverhead: number;
  totalEstimatedProfit: number;
  totalWithVat: number;
  vatRate: number;
  calculatedAt?: string;
  lineCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalEstimateLine {
  id: string;
  estimateId: string;
  lineNumber: number;
  rateId?: string;
  justification?: string;
  name: string;
  unit?: string;
  quantity: number;
  baseLaborCost: number;
  baseMaterialCost: number;
  baseEquipmentCost: number;
  baseOverheadCost: number;
  baseTotal: number;
  currentLaborCost: number;
  currentMaterialCost: number;
  currentEquipmentCost: number;
  currentOverheadCost: number;
  currentTotal: number;
  laborIndex: number;
  materialIndex: number;
  equipmentIndex: number;
  notes?: string;
  normativeSource?: 'GESN' | 'FER' | 'TER' | 'MANUAL';
  normativeCode?: string;
  normHours?: number;
  basePrice2001?: number;
  priceIndex?: number;
  currentPrice?: number;
  directCosts?: number;
  overheadCosts?: number;
  estimatedProfit?: number;
  budgetItemId?: string;
  // Extended fields used by LsrTreeTable (full ЛСР hierarchy)
  parentLineId?: string;
  lineType?: LsrLineType;
  positionType?: LsrPositionType;
  resourceType?: LsrResourceType;
  sectionName?: string;
  quantityPerUnit?: number;
  quantityCoeff?: number;
  coefficients?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FmReconciliationItem {
  section: string;
  estimateTotal: number;
  fmTotal: number;
  delta: number;
  deltaPercent: number;
}

// Closing document types
export type ClosingDocStatus = 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'CLOSED';
export type OneCPostingStatus = 'NOT_SENT' | 'SENT' | 'POSTED' | 'ERROR';

export interface Ks2Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  projectId: string;
  projectName?: string;
  contractId: string;
  contractName?: string;
  status: ClosingDocStatus;
  totalAmount: number;
  totalQuantity: number;
  lineCount: number;
  totalVatAmount?: number;
  totalWithVat?: number;
  oneCPostingStatus?: OneCPostingStatus;
  oneCPostingStatusDisplayName?: string;
  createdByName?: string;
  createdAt?: string;
  notes?: string;
}

export interface Ks2Line {
  id: string;
  sequence: number;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  notes?: string;
}

export interface Ks3Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  projectName?: string;
  contractId: string;
  contractName?: string;
  status: ClosingDocStatus;
  totalAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  netAmount: number;
  ks2Count: number;
  ks2DocumentIds?: string[];
  oneCPostingStatus?: OneCPostingStatus;
  oneCPostingStatusDisplayName?: string;
  notes?: string;
}

// Purchase Request types
export type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED' | 'IN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'ORDERED' | 'DELIVERED' | 'CLOSED' | 'CANCELLED';

export interface PurchaseRequestItem {
  id: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  amount: number;
}

export interface PurchaseRequest {
  id: string;
  name: string;
  requestDate: string;
  projectId: string;
  contractId?: string;
  specificationId?: string;
  projectName?: string;
  status: PurchaseRequestStatus;
  statusDisplayName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityDisplayName?: string;
  requestedById?: string;
  requestedByName: string;
  approvedById?: string;
  assignedToId?: string;
  assignedToName?: string;
  totalAmount: number;
  itemCount: number;
  rejectionReason?: string;
  notes?: string;
  items?: PurchaseRequestItem[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

// Budget
export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'FROZEN' | 'CLOSED';
export interface Budget {
  id: string; name: string; projectId: string; projectName?: string; status: BudgetStatus;
  plannedRevenue: number; plannedCost: number; plannedMargin: number;
  actualRevenue: number; actualCost: number; actualMargin: number;
  revenueVariancePercent: number; costVariancePercent: number;
  period?: string;
  createdAt: string;
}
export type BudgetCategory = 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACT' | 'OVERHEAD' | 'OTHER';
export type BudgetItemDocStatus = 'PLANNED' | 'TENDERED' | 'CONTRACTED' | 'ACT_SIGNED' | 'INVOICED' | 'PAID';
export type BudgetItemPriceSource = 'MANUAL' | 'WORKS_TENDER' | 'MATERIALS_TENDER' | 'ESTIMATE' | 'INVOICE';
export type BudgetItemType = 'WORKS' | 'MATERIALS' | 'EQUIPMENT' | 'OVERHEAD' | 'OTHER';

export interface BudgetItem {
  id: string;
  budgetId: string;
  category: BudgetCategory;
  name: string;
  plannedAmount: number;
  actualAmount: number;
  committedAmount: number;
  remainingAmount: number;
  section?: boolean;
  parentId?: string;
  itemType?: BudgetItemType;
  unit?: string;
  quantity?: number;
  costPrice?: number;
  estimatePrice?: number;
  customerPrice?: number;
  salePrice?: number;
  coefficient?: number;
  vatRate?: number;
  vatAmount?: number;
  totalWithVat?: number;
  docStatus?: BudgetItemDocStatus;
  priceSourceType?: BudgetItemPriceSource;
  priceSourceId?: string;
  disciplineMark?: string;
  contractedAmount?: number;
  actSignedAmount?: number;
  paidAmount?: number;
  invoicedAmount?: number;
  marginAmount?: number;
  marginPercent?: number;
  sectionId?: string;
  overheadRate?: number;
  profitRate?: number;
  contingencyRate?: number;
  notes?: string;
  // Long-lead items
  isLongLead?: boolean;
  orderDeadline?: string;
  orderStatus?: string;
  leadTimeDays?: number;
}

export interface BudgetSnapshot {
  id: string;
  budgetId: string;
  snapshotName: string;
  snapshotType: 'BASELINE' | 'REFORECAST' | 'SNAPSHOT';
  sourceSnapshotId?: string;
  snapshotDate: string;
  createdById?: string;
  totalCost: number;
  totalCustomer: number;
  totalMargin: number;
  marginPercent: number;
  notes?: string;
  createdAt: string;
}

export interface SnapshotComparison {
  snapshotId: string;
  snapshotName: string;
  snapshotDate: string;
  snapshotTotalCost: number;
  snapshotTotalCustomer: number;
  snapshotTotalMargin: number;
  currentTotalCost: number;
  currentTotalCustomer: number;
  currentTotalMargin: number;
  deltaCost: number;
  deltaCustomer: number;
  deltaMargin: number;
  items: SnapshotItemDelta[];
  targetSnapshotId?: string;
  targetSnapshotName?: string;
  targetSnapshotType?: 'BASELINE' | 'REFORECAST' | 'SNAPSHOT';
  targetSnapshotDate?: string;
  comparedWithCurrent?: boolean;
}

export interface SnapshotItemDelta {
  itemId: string;
  name: string;
  snapshotCostPrice?: number;
  currentCostPrice?: number;
  deltaCostPrice?: number;
  snapshotCustomerPrice?: number;
  currentCustomerPrice?: number;
  deltaCustomerPrice?: number;
  snapshotQuantity?: number;
  currentQuantity?: number;
  deltaQuantity?: number;
  snapshotMarginAmount?: number;
  currentMarginAmount?: number;
  deltaMarginAmount?: number;
  changeType: 'ADDED' | 'REMOVED' | 'CHANGED';
}

export interface FinanceExpenseItem {
  id: string;
  budgetId?: string;
  name: string;
  section?: boolean;
  itemType?: string;
  disciplineMark?: string;
  docStatus?: BudgetItemDocStatus;
  costPrice?: number;
  estimatePrice?: number;
  salePrice?: number;
  plannedAmount: number;
  contractedAmount: number;
  actSignedAmount: number;
  invoicedAmount?: number;
  paidAmount: number;
  contractId?: string;
  contractNumber?: string;
  contractPartnerName?: string;
  budgetName?: string;
  projectId?: string;
  projectName?: string;
  quantity?: number;
  unit?: string;
}

export type ContractDirection = 'CLIENT' | 'CONTRACTOR';

export interface ContractBudgetItem {
  id: string;
  contractId: string;
  budgetItemId: string;
  budgetItemName: string;
  budgetItemUnit?: string;
  disciplineMark?: string;
  allocatedQuantity?: number;
  allocatedAmount?: number;
  coveragePercent?: number;
  totalQuantity?: number;
  notes?: string;
  createdAt?: string;
}

export type CompetitiveListStatus = 'DRAFT' | 'COLLECTING' | 'EVALUATING' | 'DECIDED' | 'APPROVED';

export interface CompetitiveList {
  id: string;
  specificationId: string;
  specItemId?: string;
  name?: string;
  title: string;
  status: CompetitiveListStatus;
  entries: CompetitiveListEntry[];
  winnerId?: string;
  winnerJustification?: string;
  minProposalsRequired?: number;
  budgetItemId?: string;
  bestPrice?: number;
  bestVendorName?: string;
  projectId?: string;
  projectName?: string;
  positionCount?: number;
  entryCount?: number;
  vendorCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompetitiveListEntry {
  id: string;
  competitiveListId: string;
  specItemId?: string;
  supplierName: string;
  vendorName?: string;
  unitPrice: number;
  quantity?: number;
  totalPrice: number;
  deliveryDays?: number;
  paymentTerms?: string;
  prepaymentPercent?: number;
  paymentDelayDays?: number;
  warrantyMonths?: number;
  score?: number;
  rankPosition?: number;
  selectionReason?: string;
  notes?: string;
  isWinner?: boolean;
  contractorName?: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId?: string;
  name: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
  amount?: number;
  unitOfMeasure?: string;
  poNumber?: string;
  poUnitPrice?: number;
  grReceived?: boolean;
  grDate?: string;
  variancePercent?: number;
  notes?: string;
  isSelectedForCp?: boolean;
  cpItemId?: string;
}

export interface ProjectSection {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  custom?: boolean;
  sequence?: number;
}

// Payment
export type PaymentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type PaymentType = 'INCOMING' | 'OUTGOING';
export interface Payment {
  id: string; number: string; paymentDate: string; projectId: string; projectName?: string;
  contractId?: string; partnerName?: string; paymentType: PaymentType; status: PaymentStatus;
  amount: number; vatAmount: number; totalAmount: number; purpose: string; createdAt: string;
}

// Invoice
export type InvoiceStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'LINKED_TO_POSITION'
  | 'ON_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'CLOSED'
  | 'REJECTED'
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';
export type InvoiceType = 'ISSUED' | 'RECEIVED';
export type InvoiceMatchingStatus = 'UNMATCHED' | 'PARTIALLY_MATCHED' | 'FULLY_MATCHED';
export interface Invoice {
  id: string; number: string; invoiceDate: string; dueDate?: string;
  projectId: string; projectName?: string; partnerName: string;
  contractId?: string;
  partnerId?: string;
  statusDisplayName?: string;
  invoiceTypeDisplayName?: string;
  disciplineMark?: string;
  invoiceType: InvoiceType; status: InvoiceStatus;
  matchingStatus?: InvoiceMatchingStatus;
  matchingConfidence?: number;
  matchedPoId?: string;
  matchedReceiptId?: string;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  notes?: string;
  createdBy?: string;
  totalAmount: number; paidAmount: number; remainingAmount: number; createdAt: string;
}

// Invoice Matching
export interface InvoiceMatchCandidate {
  invoiceLineId: string;
  invoiceLineName: string;
  budgetItemId: string;
  budgetItemName: string;
  confidence: number;
  matchDescription: string;
}

export interface ThreeWayMatchDiscrepancy {
  type: string;
  description: string;
  expected?: number | null;
  actual?: number | null;
  difference?: number | null;
}

export interface ThreeWayMatchResult {
  invoiceId: string;
  overallConfidence: number;
  hasPurchaseOrder: boolean;
  hasReceipt: boolean;
  linesMatchTotal: boolean;
  discrepancies: ThreeWayMatchDiscrepancy[];
}

// Warehouse
export type MaterialCategory = 'CONCRETE' | 'METAL' | 'WOOD' | 'INSULATION' | 'PIPES' | 'ELECTRICAL' | 'FINISHING' | 'FASTENERS' | 'TOOLS' | 'OTHER';
export interface Material { id: string; name: string; code: string; category: MaterialCategory; unitOfMeasure: string; currentPrice: number; }
export interface StockEntry { id: string; materialId: string; materialName: string; locationName: string; quantity: number; reservedQuantity: number; availableQuantity: number; totalValue: number; }
export type StockMovementType = 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN' | 'WRITE_OFF';
export type StockMovementStatus = 'DRAFT' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
export interface StockMovement { id: string; number: string; movementDate: string; movementType: StockMovementType; status: StockMovementStatus; projectName?: string; sourceLocation?: string; destinationLocation?: string; lineCount: number; }

// Employee
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
export interface Employee { id: string; employeeNumber: string; fullName: string; position: string; departmentName?: string; status: EmployeeStatus; hireDate: string; phone?: string; email?: string; certificateCount: number; }
export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export interface Timesheet { id: string; employeeName: string; projectName: string; workDate: string; hoursWorked: number; overtimeHours: number; status: TimesheetStatus; }

// Safety
export type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL' | 'FATAL';
export type IncidentStatus = 'REPORTED' | 'UNDER_INVESTIGATION' | 'CORRECTIVE_ACTION' | 'RESOLVED' | 'CLOSED';
export interface SafetyIncident { id: string; number: string; incidentDate: string; projectName: string; severity: IncidentSeverity; incidentType: string; status: IncidentStatus; description: string; reportedByName: string; workDaysLost: number; }

// Tasks
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export interface ProjectTask { id: string; code: string; title: string; projectId?: string; projectName?: string; status: TaskStatus; priority: TaskPriority; assigneeId?: string; assigneeName?: string; plannedStartDate?: string; plannedEndDate?: string; progress: number; wbsCode?: string; subtaskCount: number; }

// Documents
export type DocumentCategory = 'CONTRACT' | 'ESTIMATE' | 'SPECIFICATION' | 'DRAWING' | 'PERMIT' | 'ACT' | 'INVOICE' | 'PROTOCOL' | 'CORRESPONDENCE' | 'PHOTO' | 'REPORT' | 'OTHER';
export type DocumentStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED' | 'CANCELLED';
export interface Document {
  id: string;
  title: string;
  documentNumber?: string;
  category: DocumentCategory;
  status: DocumentStatus;
  projectId?: string;
  projectName?: string;
  contractId?: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  storagePath?: string;
  authorName: string;
  docVersion: number;
  tags?: string | string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  expiryDate?: string;
}

// Commercial Proposal
export type ProposalStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE';
export type CpItemStatus =
  | 'UNPROCESSED'
  | 'INVOICES_COLLECTED'
  | 'COMPETITIVE_LIST_FILLED'
  | 'PRICE_SELECTED'
  | 'ON_APPROVAL'
  | 'APPROVED'
  | 'IN_FINANCIAL_MODEL'
  | 'PENDING'
  | 'INVOICE_SELECTED'
  | 'APPROVED_SUPPLY'
  | 'APPROVED_PROJECT'
  | 'CONFIRMED';

export interface CommercialProposal {
  id: string;
  name: string;
  budgetId: string;
  specificationId?: string;
  projectId?: string;
  projectName?: string;
  status: ProposalStatus;
  totalCostPrice: number;
  totalCustomerPrice?: number;
  totalMargin?: number;
  marginPercent?: number;
  notes?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  docVersion?: number;
  companyName?: string;
  companyInn?: string;
  companyKpp?: string;
  companyAddress?: string;
  signatoryName?: string;
  signatoryPosition?: string;
}

export interface CommercialProposalItem {
  id: string;
  proposalId: string;
  budgetItemId: string;
  budgetItemName?: string;
  budgetItemUnit?: string;
  itemType: 'MATERIAL' | 'WORK';
  disciplineMark?: string;
  quantity: number;
  costPrice: number;
  tradingCoefficient: number;
  estimateItemId?: string;
  estimateId?: string;
  selectedInvoiceLineId?: string;
  invoiceId?: string;
  competitiveListEntryId?: string;
  competitiveListId?: string;
  specItemId?: string;
  unitPrice?: number;
  unit?: string;
  vendorName?: string;
  status: CpItemStatus;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Expertise (Экспертиза проектной документации)
// ---------------------------------------------------------------------------

export type ExpertiseType = 'STATE' | 'NON_STATE' | 'ENVIRONMENTAL' | 'FIRE_SAFETY' | 'INDUSTRIAL_SAFETY';
export type ExpertiseStatus = 'NOT_STARTED' | 'DOCUMENTS_PREP' | 'SUBMITTED' | 'IN_REVIEW' | 'REMARKS_RECEIVED' | 'REMARKS_RESOLVED' | 'POSITIVE' | 'NEGATIVE' | 'CONDITIONAL';

export interface ExpertiseReview {
  id: string;
  projectId: string;
  type: ExpertiseType;
  status: ExpertiseStatus;
  expertiseOrganization?: string;
  applicationNumber?: string;
  submissionDate?: string;
  plannedCompletionDate?: string;
  conclusionNumber?: string;
  cost?: number;
  remarksCount: number;
  resolvedRemarksCount: number;
  approvalChainId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpertiseRemarkStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface ExpertiseRemark {
  id: string;
  expertiseId: string;
  number: number;
  description: string;
  status: ExpertiseRemarkStatus;
  responsible?: string;
  dueDate?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// GPZU (Градостроительный план земельного участка)
// ---------------------------------------------------------------------------

export type GpzuStatus = 'NOT_STARTED' | 'REQUESTED' | 'IN_REVIEW' | 'ISSUED' | 'EXPIRED';

export interface GpzuDocument {
  id: string;
  projectId: string;
  status: GpzuStatus;
  number?: string;
  cadastralNumber?: string;
  issuingAuthority?: string;
  requestDate?: string;
  issueDate?: string;
  landArea?: number;
  buildingArea?: number;
  maxFloors?: number;
  maxHeight?: number;
  landUseType?: string;
  encumbrances?: string;
  approvalChainId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Mobilization (Мобилизация на площадке)
// ---------------------------------------------------------------------------

export type MobilizationItemType = 'TEMP_BUILDINGS' | 'FENCING' | 'ACCESS_ROADS' | 'UTILITIES' | 'EQUIPMENT' | 'LABOR' | 'MATERIALS_STAGING' | 'SIGNAGE' | 'FIRE_SAFETY' | 'COMMUNICATION' | 'OTHER';
export type MobilizationItemStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface MobilizationItem {
  id: string;
  projectId: string;
  type: MobilizationItemType;
  name: string;
  status: MobilizationItemStatus;
  responsible?: string;
  contractor?: string;
  plannedDate?: string;
  actualDate?: string;
  cost?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Project Design (Проектная документация — разделы ПП87)
// ---------------------------------------------------------------------------

export type ProjectDesignStatus = 'DRAFT' | 'IN_PROGRESS' | 'INTERNAL_REVIEW' | 'SENT_TO_EXPERTISE' | 'APPROVED' | 'ARCHIVED';
export type DesignSectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERNAL_REVIEW' | 'REVISION' | 'APPROVED' | 'SENT_TO_EXPERTISE';
export type DesignSectionCode = 'PZ' | 'SPZU' | 'AR' | 'KR' | 'IOS_VS' | 'IOS_OV' | 'IOS_EO' | 'IOS_SS' | 'IOS_GS' | 'IOS_ST' | 'POS' | 'PODB' | 'IDEV' | 'MOOP' | 'EE' | 'SM' | string;

export interface ProjectDesignSection {
  id: string;
  designId: string;
  code: DesignSectionCode;
  name: string;
  status: DesignSectionStatus;
  version: number;
  completionPercent: number;
  designerName?: string;
  designerOrg?: string;
  reviewComments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDesign {
  id: string;
  projectId: string;
  name: string;
  status: ProjectDesignStatus;
  sections: ProjectDesignSection[];
  overallCompletion: number;
  designOrganization?: string;
  chiefDesigner?: string;
  approvalChainId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Technical Conditions (Технические условия на подключение)
// ---------------------------------------------------------------------------

export type TechnicalConditionType = 'WATER' | 'SEWER' | 'ELECTRICITY' | 'GAS' | 'HEAT' | 'TELECOM' | 'STORMWATER' | 'OTHER';
export type TechnicalConditionStatus = 'NOT_STARTED' | 'REQUESTED' | 'IN_REVIEW' | 'ISSUED' | 'CONNECTED' | 'EXPIRED';

export interface TechnicalCondition {
  id: string;
  projectId: string;
  type: TechnicalConditionType;
  status: TechnicalConditionStatus;
  provider?: string;
  requestNumber?: string;
  requestDate?: string;
  issueDate?: string;
  validUntil?: string;
  maxLoad?: string;
  connectionPoint?: string;
  connectionFee?: number;
  approvalChainId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// LSR Types (ЛСР — Локальный Сметный Расчёт)
// ---------------------------------------------------------------------------

export type LsrLineType = 'SECTION' | 'POSITION' | 'RESOURCE';
export type LsrPositionType = 'GESN' | 'GESNr' | 'FSBC' | 'TC' | 'FER' | 'TER' | 'MANUAL';
export type LsrResourceType = 'OT' | 'EM' | 'ZT' | 'M' | 'NR' | 'SP';

// ---------------------------------------------------------------------------
// Local Estimate Summary (итоги ЛСР)
// ---------------------------------------------------------------------------

export interface LocalEstimateSummary {
  directCostTotal: number;
  directCostsTotal?: number;
  overheadTotal: number;
  estimatedProfitTotal: number;
  profitTotal?: number;
  subtotal: number;
  winterSurcharge?: number;
  winterSurchargeRate?: number;
  tempStructures?: number;
  tempStructuresRate?: number;
  contingency?: number;
  contingencyRate?: number;
  unforeseen?: number;
  indexAdjustment?: number;
  vatAmount?: number;
  vatRate?: number;
  grandTotal: number;
}

// ---------------------------------------------------------------------------
// Pre-construction Pipeline
// ---------------------------------------------------------------------------

export type PreconStageKey =
  | 'LEAD'
  | 'FEASIBILITY'
  | 'SITE_ASSESSMENT'
  | 'SURVEYS'
  | 'GPZU'
  | 'TECHNICAL_CONDITIONS'
  | 'ENGINEERING_SURVEYS'
  | 'PROJECT_DESIGN'
  | 'DESIGN_PD'
  | 'EXPERTISE'
  | 'PERMITS'
  | 'CONSTRUCTION_PERMITS'
  | 'TENDERS'
  | 'CONTRACTS'
  | 'MOBILIZATION';

// ---------------------------------------------------------------------------
// Dependency Type (task dependencies)
// ---------------------------------------------------------------------------

export type DependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';

export interface TaskDependencyDto {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTaskCode?: string;
  dependsOnTaskTitle?: string;
  type?: DependencyType;
  dependencyType?: DependencyType;
  lagDays?: number;
  predecessorTaskTitle?: string;
  successorTaskTitle?: string;
}
