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
  contractAmount?: number;
  spentAmount: number;
  managerId: string;
  managerName: string;
  customerName: string;
  customerId?: string;
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
  code: string;
  name: string;
  description?: string;
  type: ProjectType;
  priority: ProjectPriority;
  plannedStartDate: string;
  plannedEndDate: string;
  budget: number;
  contractAmount?: number;
  customerName: string;
  customerId?: string;
  managerId?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
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
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
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
  name: string;
  projectId: string;
  projectName?: string;
  contractId?: string;
  version: number;
  isCurrent: boolean;
  status: SpecificationStatus;
  itemCount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface SpecItem {
  id: string;
  specificationId: string;
  sequence: number;
  itemType: SpecItemType;
  name: string;
  productCode?: string;
  quantity: number;
  unitOfMeasure: string;
  plannedAmount: number;
  procurementStatus: string;
  estimateStatus: string;
  isCustomerProvided: boolean;
  notes?: string;
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

// Closing document types
export type ClosingDocStatus = 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'CLOSED';

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
}

export interface Ks3Document {
  id: string;
  number: string;
  name: string;
  documentDate: string;
  periodFrom: string;
  periodTo: string;
  projectId: string;
  contractId: string;
  status: ClosingDocStatus;
  totalAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  netAmount: number;
  ks2Count: number;
}

// Purchase Request types
export type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED' | 'IN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'ORDERED' | 'DELIVERED' | 'CLOSED' | 'CANCELLED';

export interface PurchaseRequest {
  id: string;
  name: string;
  requestDate: string;
  projectId: string;
  projectName?: string;
  status: PurchaseRequestStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requestedByName: string;
  assignedToName?: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

// Budget
export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'FROZEN' | 'CLOSED';
export interface Budget {
  id: string; name: string; projectId: string; projectName?: string; status: BudgetStatus;
  plannedRevenue: number; plannedCost: number; plannedMargin: number;
  actualRevenue: number; actualCost: number; actualMargin: number;
  revenueVariancePercent: number; costVariancePercent: number;
  createdAt: string;
}
export type BudgetCategory = 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACT' | 'OVERHEAD' | 'OTHER';
export interface BudgetItem {
  id: string; budgetId: string; category: BudgetCategory; name: string;
  plannedAmount: number; actualAmount: number; committedAmount: number; remainingAmount: number;
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
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceType = 'ISSUED' | 'RECEIVED';
export interface Invoice {
  id: string; number: string; invoiceDate: string; dueDate?: string;
  projectId: string; projectName?: string; partnerName: string;
  invoiceType: InvoiceType; status: InvoiceStatus;
  totalAmount: number; paidAmount: number; remainingAmount: number; createdAt: string;
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
export interface ProjectTask { id: string; code: string; title: string; projectName?: string; status: TaskStatus; priority: TaskPriority; assigneeName?: string; plannedStartDate?: string; plannedEndDate?: string; progress: number; wbsCode?: string; subtaskCount: number; }

// Documents
export type DocumentCategory = 'CONTRACT' | 'ESTIMATE' | 'SPECIFICATION' | 'DRAWING' | 'PERMIT' | 'ACT' | 'INVOICE' | 'PROTOCOL' | 'CORRESPONDENCE' | 'PHOTO' | 'REPORT' | 'OTHER';
export type DocumentStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED' | 'CANCELLED';
export interface Document { id: string; title: string; documentNumber?: string; category: DocumentCategory; status: DocumentStatus; projectName?: string; fileName: string; fileSize: number; authorName: string; docVersion: number; createdAt: string; expiryDate?: string; }
