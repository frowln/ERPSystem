import { t } from '@/i18n';
import type { OAITool } from './types';

// ---------------------------------------------------------------------------
// OpenAI tool definitions — actions the AI can execute
// ---------------------------------------------------------------------------

export const TOOLS: OAITool[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: t('aiChat.tools.createTask.description'),
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: t('aiChat.tools.createTask.paramTitle') },
          description: { type: 'string', description: t('aiChat.tools.createTask.paramDescription') },
          projectId: { type: 'string', description: t('aiChat.tools.createTask.paramProjectId') },
          assigneeId: { type: 'string', description: t('aiChat.tools.createTask.paramAssigneeId') },
          plannedEndDate: { type: 'string', description: t('aiChat.tools.createTask.paramPlannedEndDate') },
          priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task_status',
      description: t('aiChat.tools.updateTaskStatus.description'),
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: t('aiChat.tools.updateTaskStatus.paramTaskId') },
          status: { type: 'string', enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] },
        },
        required: ['taskId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description: t('aiChat.tools.searchEmployees.description'),
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: t('aiChat.tools.searchEmployees.paramSearch') },
        },
        required: ['search'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_projects',
      description: t('aiChat.tools.searchProjects.description'),
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: t('aiChat.tools.searchProjects.paramSearch') },
        },
        required: ['search'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: t('aiChat.tools.listTasks.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: t('aiChat.tools.listTasks.paramProjectId') },
          assigneeId: { type: 'string', description: t('aiChat.tools.listTasks.paramAssigneeId') },
          status: { type: 'string', description: t('aiChat.tools.listTasks.paramStatus') },
          search: { type: 'string', description: t('aiChat.tools.listTasks.paramSearch') },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project_status',
      description: t('aiChat.tools.updateProjectStatus.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: t('aiChat.tools.updateProjectStatus.paramProjectId') },
          status: { type: 'string', enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
        },
        required: ['projectId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_contract_status',
      description: t('aiChat.tools.updateContractStatus.description'),
      parameters: {
        type: 'object',
        properties: {
          contractId: { type: 'string', description: t('aiChat.tools.updateContractStatus.paramContractId') },
          status: { type: 'string', enum: ['DRAFT', 'ON_APPROVAL', 'APPROVED', 'SIGNED', 'ACTIVE', 'CLOSED', 'CANCELLED'] },
        },
        required: ['contractId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: t('aiChat.tools.createInvoice.description'),
      parameters: {
        type: 'object',
        properties: {
          invoiceDate: { type: 'string', description: t('aiChat.tools.createInvoice.paramInvoiceDate') },
          dueDate: { type: 'string', description: t('aiChat.tools.createInvoice.paramDueDate') },
          projectId: { type: 'string', description: t('aiChat.tools.createInvoice.paramProjectId') },
          contractId: { type: 'string', description: t('aiChat.tools.createInvoice.paramContractId') },
          invoiceType: { type: 'string', enum: ['INCOMING', 'OUTGOING'], description: t('aiChat.tools.createInvoice.paramInvoiceType') },
          subtotal: { type: 'number', description: t('aiChat.tools.createInvoice.paramSubtotal') },
          vatRate: { type: 'number', description: t('aiChat.tools.createInvoice.paramVatRate') },
          totalAmount: { type: 'number', description: t('aiChat.tools.createInvoice.paramTotalAmount') },
          notes: { type: 'string' },
        },
        required: ['invoiceDate', 'invoiceType', 'subtotal', 'totalAmount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_payment',
      description: t('aiChat.tools.createPayment.description'),
      parameters: {
        type: 'object',
        properties: {
          paymentDate: { type: 'string', description: t('aiChat.tools.createPayment.paramPaymentDate') },
          paymentType: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
          amount: { type: 'number', description: t('aiChat.tools.createPayment.paramAmount') },
          projectId: { type: 'string', description: t('aiChat.tools.createPayment.paramProjectId') },
          contractId: { type: 'string', description: t('aiChat.tools.createPayment.paramContractId') },
          invoiceId: { type: 'string', description: t('aiChat.tools.createPayment.paramInvoiceId') },
          purpose: { type: 'string', description: t('aiChat.tools.createPayment.paramPurpose') },
          notes: { type: 'string' },
        },
        required: ['paymentDate', 'paymentType', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_budget',
      description: t('aiChat.tools.createBudget.description'),
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: t('aiChat.tools.createBudget.paramName') },
          projectId: { type: 'string', description: t('aiChat.tools.createBudget.paramProjectId') },
          contractId: { type: 'string', description: t('aiChat.tools.createBudget.paramContractId') },
          plannedRevenue: { type: 'number', description: t('aiChat.tools.createBudget.paramPlannedRevenue') },
          plannedCost: { type: 'number', description: t('aiChat.tools.createBudget.paramPlannedCost') },
          notes: { type: 'string' },
        },
        required: ['name', 'plannedRevenue', 'plannedCost'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_budget_item',
      description: t('aiChat.tools.addBudgetItem.description'),
      parameters: {
        type: 'object',
        properties: {
          budgetId: { type: 'string', description: t('aiChat.tools.addBudgetItem.paramBudgetId') },
          category: { type: 'string', enum: ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER'], description: t('aiChat.tools.addBudgetItem.paramCategory') },
          name: { type: 'string', description: t('aiChat.tools.addBudgetItem.paramName') },
          plannedAmount: { type: 'number', description: t('aiChat.tools.addBudgetItem.paramPlannedAmount') },
          notes: { type: 'string' },
        },
        required: ['budgetId', 'category', 'name', 'plannedAmount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_purchase_request',
      description: t('aiChat.tools.createPurchaseRequest.description'),
      parameters: {
        type: 'object',
        properties: {
          requestDate: { type: 'string', description: t('aiChat.tools.createPurchaseRequest.paramRequestDate') },
          projectId: { type: 'string', description: t('aiChat.tools.createPurchaseRequest.paramProjectId') },
          contractId: { type: 'string', description: t('aiChat.tools.createPurchaseRequest.paramContractId') },
          priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] },
          notes: { type: 'string', description: t('aiChat.tools.createPurchaseRequest.paramNotes') },
        },
        required: ['requestDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contract',
      description: t('aiChat.tools.createContract.description'),
      parameters: {
        type: 'object',
        properties: {
          number: { type: 'string', description: t('aiChat.tools.createContract.paramNumber') },
          name: { type: 'string', description: t('aiChat.tools.createContract.paramName') },
          projectId: { type: 'string', description: t('aiChat.tools.createContract.paramProjectId') },
          contractType: { type: 'string', enum: ['GENERAL_CONTRACTOR', 'SUBCONTRACT', 'SUPPLY', 'SERVICE'], description: t('aiChat.tools.createContract.paramContractType') },
          amount: { type: 'number', description: t('aiChat.tools.createContract.paramAmount') },
          startDate: { type: 'string', description: t('aiChat.tools.createContract.paramStartDate') },
          endDate: { type: 'string', description: t('aiChat.tools.createContract.paramEndDate') },
          notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_employee',
      description: t('aiChat.tools.createEmployee.description'),
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: t('aiChat.tools.createEmployee.paramFirstName') },
          lastName: { type: 'string', description: t('aiChat.tools.createEmployee.paramLastName') },
          middleName: { type: 'string', description: t('aiChat.tools.createEmployee.paramMiddleName') },
          position: { type: 'string', description: t('aiChat.tools.createEmployee.paramPosition') },
          phone: { type: 'string', description: t('aiChat.tools.createEmployee.paramPhone') },
          email: { type: 'string', description: t('aiChat.tools.createEmployee.paramEmail') },
          hireDate: { type: 'string', description: t('aiChat.tools.createEmployee.paramHireDate') },
          monthlyRate: { type: 'number', description: t('aiChat.tools.createEmployee.paramMonthlyRate') },
        },
        required: ['firstName', 'lastName', 'hireDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_dispatch_order',
      description: t('aiChat.tools.createDispatchOrder.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: t('aiChat.tools.createDispatchOrder.paramProjectId') },
          loadingPoint: { type: 'string', description: t('aiChat.tools.createDispatchOrder.paramLoadingPoint') },
          unloadingPoint: { type: 'string', description: t('aiChat.tools.createDispatchOrder.paramUnloadingPoint') },
          materialName: { type: 'string', description: t('aiChat.tools.createDispatchOrder.paramMaterialName') },
          quantity: { type: 'number', description: t('aiChat.tools.createDispatchOrder.paramQuantity') },
          unit: { type: 'string', description: t('aiChat.tools.createDispatchOrder.paramUnit') },
          scheduledDate: { type: 'string', description: t('aiChat.tools.createDispatchOrder.paramScheduledDate') },
          notes: { type: 'string' },
        },
        required: ['scheduledDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_warehouse_movement',
      description: t('aiChat.tools.createWarehouseMovement.description'),
      parameters: {
        type: 'object',
        properties: {
          movementType: { type: 'string', enum: ['RECEIPT', 'ISSUE', 'TRANSFER', 'WRITE_OFF'], description: t('aiChat.tools.createWarehouseMovement.paramMovementType') },
          materialName: { type: 'string', description: t('aiChat.tools.createWarehouseMovement.paramMaterialName') },
          quantity: { type: 'number', description: t('aiChat.tools.createWarehouseMovement.paramQuantity') },
          unit: { type: 'string', description: t('aiChat.tools.createWarehouseMovement.paramUnit') },
          projectId: { type: 'string', description: t('aiChat.tools.createWarehouseMovement.paramProjectId') },
          notes: { type: 'string', description: t('aiChat.tools.createWarehouseMovement.paramNotes') },
        },
        required: ['movementType', 'materialName', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: t('aiChat.tools.listInvoices.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          contractId: { type: 'string' },
          status: { type: 'string', description: t('aiChat.tools.listInvoices.paramStatus') },
          invoiceType: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_contracts',
      description: t('aiChat.tools.listContracts.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          status: { type: 'string' },
          search: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: t('aiChat.tools.getAnalytics.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: t('aiChat.tools.getAnalytics.paramProjectId') },
        },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_budgets',
      description: t('aiChat.tools.listBudgets.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_purchase_requests',
      description: t('aiChat.tools.listPurchaseRequests.description'),
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          status: { type: 'string' },
          search: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_warehouse_stock',
      description: t('aiChat.tools.listWarehouseStock.description'),
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: t('aiChat.tools.listWarehouseStock.paramSearch') },
          projectId: { type: 'string' },
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Human-readable names for tool execution messages
// ---------------------------------------------------------------------------

export const TOOL_LABELS: Record<string, string> = {
  create_task: t('aiChat.tools.createTask.label'),
  update_task_status: t('aiChat.tools.updateTaskStatus.label'),
  search_employees: t('aiChat.tools.searchEmployees.label'),
  search_projects: t('aiChat.tools.searchProjects.label'),
  list_tasks: t('aiChat.tools.listTasks.label'),
  update_project_status: t('aiChat.tools.updateProjectStatus.label'),
  update_contract_status: t('aiChat.tools.updateContractStatus.label'),
  create_invoice: t('aiChat.tools.createInvoice.label'),
  create_payment: t('aiChat.tools.createPayment.label'),
  create_budget: t('aiChat.tools.createBudget.label'),
  add_budget_item: t('aiChat.tools.addBudgetItem.label'),
  create_purchase_request: t('aiChat.tools.createPurchaseRequest.label'),
  create_contract: t('aiChat.tools.createContract.label'),
  create_employee: t('aiChat.tools.createEmployee.label'),
  create_dispatch_order: t('aiChat.tools.createDispatchOrder.label'),
  create_warehouse_movement: t('aiChat.tools.createWarehouseMovement.label'),
  list_invoices: t('aiChat.tools.listInvoices.label'),
  list_contracts: t('aiChat.tools.listContracts.label'),
  get_analytics: t('aiChat.tools.getAnalytics.label'),
  list_budgets: t('aiChat.tools.listBudgets.label'),
  list_purchase_requests: t('aiChat.tools.listPurchaseRequests.label'),
  list_warehouse_stock: t('aiChat.tools.listWarehouseStock.label'),
};
