import type { OAITool } from './types';

// ---------------------------------------------------------------------------
// OpenAI tool definitions — actions the AI can execute
// Grouped by module. ~65 tools total.
// We use static English descriptions (not i18n) because OpenAI reads these
// at inference time. The TOOL_LABELS below are shown to the end-user.
// ---------------------------------------------------------------------------

export const TOOLS: OAITool[] = [
  // =========================================================================
  // TASKS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task. Optionally assign to a user and/or project.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Detailed task description' },
          projectId: { type: 'string', description: 'Project UUID' },
          assigneeId: { type: 'string', description: 'Assignee user UUID' },
          plannedEndDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
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
      description: 'Change task status (e.g. move to IN_PROGRESS, DONE, etc.)',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task UUID' },
          status: { type: 'string', enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] },
        },
        required: ['taskId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List tasks with optional filters by project, assignee, status, or search.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Filter by project UUID' },
          assigneeId: { type: 'string', description: 'Filter by assignee UUID' },
          status: { type: 'string', description: 'Filter by status' },
          search: { type: 'string', description: 'Search in title' },
        },
      },
    },
  },

  // =========================================================================
  // PROJECTS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'search_projects',
      description: 'Search projects by name/code. Returns matching projects.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search query' },
        },
        required: ['search'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project_status',
      description: 'Change project status (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project UUID' },
          status: { type: 'string', enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
        },
        required: ['projectId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: 'Get project analytics: financials (budget vs actual), schedule summary.',
      parameters: {
        type: 'object',
        properties: { projectId: { type: 'string', description: 'Project UUID' } },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_analytics',
      description: 'Get detailed project analytics including financials and tasks.',
      parameters: {
        type: 'object',
        properties: { projectId: { type: 'string', description: 'Project UUID' } },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_portfolio_summary',
      description: 'Get multi-project dashboard: all projects with financial and status overview.',
      parameters: { type: 'object', properties: {} },
    },
  },

  // =========================================================================
  // HR & EMPLOYEES
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description: 'Search employees by name or position.',
      parameters: {
        type: 'object',
        properties: { search: { type: 'string', description: 'Search query' } },
        required: ['search'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_employees',
      description: 'List all employees with optional filters.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by name' },
          status: { type: 'string', description: 'Filter by status' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_detail',
      description: 'Get full details of a specific employee by ID.',
      parameters: {
        type: 'object',
        properties: { employeeId: { type: 'string', description: 'Employee UUID' } },
        required: ['employeeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_employee',
      description: 'Create a new employee record.',
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string' }, lastName: { type: 'string' },
          middleName: { type: 'string' }, position: { type: 'string' },
          phone: { type: 'string' }, email: { type: 'string' },
          hireDate: { type: 'string', description: 'YYYY-MM-DD' },
          monthlyRate: { type: 'number' },
        },
        required: ['firstName', 'lastName', 'hireDate'],
      },
    },
  },

  // =========================================================================
  // CONTRACTS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_contract',
      description: 'Create a new contract.',
      parameters: {
        type: 'object',
        properties: {
          number: { type: 'string' }, name: { type: 'string' },
          projectId: { type: 'string' },
          contractType: { type: 'string', enum: ['GENERAL_CONTRACTOR', 'SUBCONTRACT', 'SUPPLY', 'SERVICE'] },
          amount: { type: 'number' },
          startDate: { type: 'string' }, endDate: { type: 'string' }, notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_contract_status',
      description: 'Change contract status.',
      parameters: {
        type: 'object',
        properties: {
          contractId: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'ON_APPROVAL', 'APPROVED', 'SIGNED', 'ACTIVE', 'CLOSED', 'CANCELLED'] },
        },
        required: ['contractId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_contracts',
      description: 'List contracts with optional filters.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    },
  },

  // =========================================================================
  // FINANCE
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create a new invoice (incoming or outgoing).',
      parameters: {
        type: 'object',
        properties: {
          invoiceDate: { type: 'string' }, dueDate: { type: 'string' },
          projectId: { type: 'string' }, contractId: { type: 'string' },
          invoiceType: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
          subtotal: { type: 'number' }, vatRate: { type: 'number' },
          totalAmount: { type: 'number' }, notes: { type: 'string' },
        },
        required: ['invoiceDate', 'invoiceType', 'subtotal', 'totalAmount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List invoices with filters.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, contractId: { type: 'string' }, status: { type: 'string' }, invoiceType: { type: 'string', enum: ['INCOMING', 'OUTGOING'] } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_payment',
      description: 'Register a payment.',
      parameters: {
        type: 'object',
        properties: {
          paymentDate: { type: 'string' }, paymentType: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
          amount: { type: 'number' }, projectId: { type: 'string' }, contractId: { type: 'string' },
          invoiceId: { type: 'string' }, purpose: { type: 'string' }, notes: { type: 'string' },
        },
        required: ['paymentDate', 'paymentType', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_budget',
      description: 'Create a new budget / financial model.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }, projectId: { type: 'string' }, contractId: { type: 'string' },
          plannedRevenue: { type: 'number' }, plannedCost: { type: 'number' }, notes: { type: 'string' },
        },
        required: ['name', 'plannedRevenue', 'plannedCost'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_budget_item',
      description: 'Add a line item to a budget.',
      parameters: {
        type: 'object',
        properties: {
          budgetId: { type: 'string' },
          category: { type: 'string', enum: ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER'] },
          name: { type: 'string' }, plannedAmount: { type: 'number' }, notes: { type: 'string' },
        },
        required: ['budgetId', 'category', 'name', 'plannedAmount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_budgets',
      description: 'List budgets / financial models.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string' } } },
    },
  },

  // =========================================================================
  // PROCUREMENT
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_purchase_request',
      description: 'Create a purchase request.',
      parameters: {
        type: 'object',
        properties: {
          requestDate: { type: 'string' }, projectId: { type: 'string' }, contractId: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] },
          notes: { type: 'string' },
        },
        required: ['requestDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_purchase_requests',
      description: 'List purchase requests.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    },
  },

  // =========================================================================
  // WAREHOUSE & DISPATCH
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_warehouse_movement',
      description: 'Create a warehouse stock movement (receipt, issue, transfer, write-off).',
      parameters: {
        type: 'object',
        properties: {
          movementType: { type: 'string', enum: ['RECEIPT', 'ISSUE', 'TRANSFER', 'WRITE_OFF'] },
          materialName: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' },
          projectId: { type: 'string' }, notes: { type: 'string' },
        },
        required: ['movementType', 'materialName', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_warehouse_stock',
      description: 'List current warehouse stock levels.',
      parameters: { type: 'object', properties: { search: { type: 'string' }, projectId: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_dispatch_order',
      description: 'Create a dispatch/delivery order for materials.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' }, loadingPoint: { type: 'string' }, unloadingPoint: { type: 'string' },
          materialName: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' },
          scheduledDate: { type: 'string' }, notes: { type: 'string' },
        },
        required: ['scheduledDate'],
      },
    },
  },

  // =========================================================================
  // ESTIMATES & SPECIFICATIONS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_estimates',
      description: 'List estimates for a project or all estimates.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_estimate_detail',
      description: 'Get estimate details including items and financial summary.',
      parameters: { type: 'object', properties: { estimateId: { type: 'string' } }, required: ['estimateId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_specifications',
      description: 'List specifications for a project or all.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'push_spec_to_fm',
      description: 'Push specification items to the financial model (budget).',
      parameters: { type: 'object', properties: { specificationId: { type: 'string' }, budgetId: { type: 'string' } }, required: ['specificationId', 'budgetId'] },
    },
  },

  // =========================================================================
  // CRM
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_crm_leads',
      description: 'List CRM leads (potential projects/clients).',
      parameters: { type: 'object', properties: { status: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_crm_lead',
      description: 'Create a new CRM lead.',
      parameters: {
        type: 'object',
        properties: {
          companyName: { type: 'string' }, contactPerson: { type: 'string' },
          contactEmail: { type: 'string' }, contactPhone: { type: 'string' },
          estimatedValue: { type: 'number' }, source: { type: 'string' }, notes: { type: 'string' },
        },
        required: ['companyName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_crm_lead',
      description: 'Update CRM lead fields.',
      parameters: {
        type: 'object',
        properties: {
          leadId: { type: 'string' }, companyName: { type: 'string' }, contactPerson: { type: 'string' },
          contactEmail: { type: 'string' }, contactPhone: { type: 'string' },
          estimatedValue: { type: 'number' }, status: { type: 'string' }, notes: { type: 'string' },
        },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'convert_lead_to_project',
      description: 'Convert a CRM lead into a project.',
      parameters: {
        type: 'object',
        properties: { leadId: { type: 'string' }, projectName: { type: 'string' }, projectCode: { type: 'string' } },
        required: ['leadId', 'projectName', 'projectCode'],
      },
    },
  },

  // =========================================================================
  // QUALITY (Defects)
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_defects',
      description: 'List quality defects with filters.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED', 'REJECTED'] },
          search: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_defect',
      description: 'Create a quality defect.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
          location: { type: 'string' }, severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          assignedToId: { type: 'string' }, fixDeadline: { type: 'string' },
        },
        required: ['projectId', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_defect_status',
      description: 'Change defect status.',
      parameters: {
        type: 'object',
        properties: {
          defectId: { type: 'string' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED', 'REJECTED'] },
          fixDescription: { type: 'string' },
        },
        required: ['defectId', 'status'],
      },
    },
  },

  // =========================================================================
  // SAFETY
  // =========================================================================
  { type: 'function', function: { name: 'get_safety_dashboard', description: 'Get safety dashboard stats.', parameters: { type: 'object', properties: {} } } },

  // =========================================================================
  // SUBMITTALS / PTO
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_submittals',
      description: 'List submittals with filters.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_submittal',
      description: 'Create a new submittal.',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' }, projectId: { type: 'string' }, description: { type: 'string' }, submittalType: { type: 'string' } },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_submittal_status',
      description: 'Update submittal status.',
      parameters: { type: 'object', properties: { submittalId: { type: 'string' }, status: { type: 'string' } }, required: ['submittalId', 'status'] },
    },
  },

  // =========================================================================
  // CLOSING DOCUMENTS (KS-2)
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_ks2_documents',
      description: 'List KS-2 acts (completion certificates).',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, contractId: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ks2_detail',
      description: 'Get KS-2 act detail with line items.',
      parameters: { type: 'object', properties: { ks2Id: { type: 'string' } }, required: ['ks2Id'] },
    },
  },

  // =========================================================================
  // SITE ASSESSMENT
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_site_assessments',
      description: 'List site assessments.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_site_assessment',
      description: 'Create a new site assessment.',
      parameters: {
        type: 'object',
        properties: { projectId: { type: 'string' }, siteAddress: { type: 'string' }, assessorName: { type: 'string' }, assessmentDate: { type: 'string' }, notes: { type: 'string' } },
        required: ['siteAddress', 'assessorName', 'assessmentDate'],
      },
    },
  },

  // =========================================================================
  // PREQUALIFICATION
  // =========================================================================
  { type: 'function', function: { name: 'list_prequalifications', description: 'List contractor prequalification records.', parameters: { type: 'object', properties: {} } } },
  {
    type: 'function',
    function: {
      name: 'create_prequalification',
      description: 'Create a prequalification questionnaire for a contractor.',
      parameters: {
        type: 'object',
        properties: { companyName: { type: 'string' }, inn: { type: 'string' }, workType: { type: 'string' }, contactPerson: { type: 'string' }, contactPhone: { type: 'string' }, contactEmail: { type: 'string' }, notes: { type: 'string' } },
        required: ['companyName'],
      },
    },
  },

  // =========================================================================
  // COMMERCIAL PROPOSALS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_commercial_proposals',
      description: 'List commercial proposals.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_commercial_proposal',
      description: 'Create a new commercial proposal linked to a budget.',
      parameters: {
        type: 'object',
        properties: { budgetId: { type: 'string' }, name: { type: 'string' }, specificationId: { type: 'string' }, notes: { type: 'string' } },
        required: ['budgetId', 'name'],
      },
    },
  },

  // =========================================================================
  // FLEET
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_fleet_vehicles',
      description: 'List fleet vehicles/equipment.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['EXCAVATOR', 'CRANE', 'TRUCK', 'LOADER', 'BULLDOZER', 'CONCRETE_MIXER', 'GENERATOR', 'COMPRESSOR', 'OTHER'] },
          status: { type: 'string', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'DECOMMISSIONED'] },
          search: { type: 'string' },
        },
      },
    },
  },

  // =========================================================================
  // DOCUMENTS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_documents',
      description: 'List project documents.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' }, category: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upload_document_metadata',
      description: 'Create a document record (metadata only).',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' }, documentNumber: { type: 'string' }, category: { type: 'string' }, projectId: { type: 'string' }, description: { type: 'string' } },
        required: ['title'],
      },
    },
  },

  // =========================================================================
  // MESSAGING
  // =========================================================================
  { type: 'function', function: { name: 'list_channels', description: 'List messaging channels.', parameters: { type: 'object', properties: {} } } },
  {
    type: 'function',
    function: {
      name: 'create_channel',
      description: 'Create a new messaging channel.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' }, channelType: { type: 'string', enum: ['public', 'private'] }, description: { type: 'string' } },
        required: ['name', 'channelType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message',
      description: 'Send a message to a messaging channel.',
      parameters: {
        type: 'object',
        properties: { channelId: { type: 'string' }, content: { type: 'string' } },
        required: ['channelId', 'content'],
      },
    },
  },

  // =========================================================================
  // RISKS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_risks',
      description: 'List project risk register entries.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_risk',
      description: 'Create a risk register entry.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
          probability: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          impact: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          mitigationPlan: { type: 'string' },
        },
        required: ['projectId', 'title'],
      },
    },
  },

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_notifications',
      description: 'Get user notifications.',
      parameters: { type: 'object', properties: { isRead: { type: 'boolean' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_notification_read',
      description: 'Mark a notification as read.',
      parameters: { type: 'object', properties: { notificationId: { type: 'string' } }, required: ['notificationId'] },
    },
  },

  // =========================================================================
  // SUPPORT
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_support_tickets',
      description: 'List support tickets.',
      parameters: { type: 'object', properties: { status: { type: 'string' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_support_ticket',
      description: 'Create a support ticket.',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string' }, description: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }, category: { type: 'string' },
        },
        required: ['subject', 'description'],
      },
    },
  },

  // =========================================================================
  // PERMITS, MILESTONES, NAVIGATION
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'list_permits',
      description: 'List construction permits for a project.',
      parameters: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] },
    },
  },
  { type: 'function', function: { name: 'list_milestones', description: 'List project milestones.', parameters: { type: 'object', properties: {} } } },
  {
    type: 'function',
    function: {
      name: 'navigate_to_page',
      description: 'Navigate the user to a page. Use when user asks to go to a module.',
      parameters: { type: 'object', properties: { path: { type: 'string', description: 'URL path e.g. /projects, /budgets, /tasks' } }, required: ['path'] },
    },
  },
];

// ---------------------------------------------------------------------------
// Human-readable labels for tool execution messages (shown to user)
// ---------------------------------------------------------------------------

export const TOOL_LABELS: Record<string, string> = {
  create_task: 'Создание задачи',
  update_task_status: 'Изменение статуса задачи',
  list_tasks: 'Список задач',
  search_projects: 'Поиск проектов',
  update_project_status: 'Изменение статуса проекта',
  get_analytics: 'Аналитика проекта',
  get_project_analytics: 'Аналитика проекта',
  get_portfolio_summary: 'Обзор портфеля',
  search_employees: 'Поиск сотрудников',
  list_employees: 'Список сотрудников',
  get_employee_detail: 'Карточка сотрудника',
  create_employee: 'Создание сотрудника',
  create_contract: 'Создание договора',
  update_contract_status: 'Изменение статуса договора',
  list_contracts: 'Список договоров',
  create_invoice: 'Создание счёта',
  list_invoices: 'Список счетов',
  create_payment: 'Регистрация платежа',
  create_budget: 'Создание бюджета',
  add_budget_item: 'Добавление позиции бюджета',
  list_budgets: 'Список бюджетов',
  create_purchase_request: 'Заявка на закупку',
  list_purchase_requests: 'Список заявок',
  create_warehouse_movement: 'Складское движение',
  list_warehouse_stock: 'Остатки на складе',
  create_dispatch_order: 'Заявка на доставку',
  list_estimates: 'Список смет',
  get_estimate_detail: 'Детали сметы',
  list_specifications: 'Список спецификаций',
  push_spec_to_fm: 'Передача в ФМ',
  list_crm_leads: 'Список лидов CRM',
  create_crm_lead: 'Создание лида',
  update_crm_lead: 'Обновление лида',
  convert_lead_to_project: 'Конвертация в проект',
  list_defects: 'Список дефектов',
  create_defect: 'Создание дефекта',
  update_defect_status: 'Статус дефекта',
  get_safety_dashboard: 'Панель безопасности',
  list_submittals: 'Список сабмиталов',
  create_submittal: 'Создание сабмитала',
  update_submittal_status: 'Статус сабмитала',
  list_ks2_documents: 'Список КС-2',
  get_ks2_detail: 'Детали КС-2',
  list_site_assessments: 'Обследования площадки',
  create_site_assessment: 'Создание обследования',
  list_prequalifications: 'Преквалификации',
  create_prequalification: 'Создание преквалификации',
  list_commercial_proposals: 'Список КП',
  create_commercial_proposal: 'Создание КП',
  list_fleet_vehicles: 'Список техники',
  list_documents: 'Список документов',
  upload_document_metadata: 'Создание документа',
  list_channels: 'Список каналов',
  create_channel: 'Создание канала',
  send_message: 'Отправка сообщения',
  list_risks: 'Список рисков',
  create_risk: 'Создание риска',
  list_notifications: 'Уведомления',
  mark_notification_read: 'Прочитано',
  list_support_tickets: 'Список обращений',
  create_support_ticket: 'Создание обращения',
  list_permits: 'Список разрешений',
  list_milestones: 'Список вех',
  navigate_to_page: 'Навигация',
};
