import { API_BASE } from './types';
import { t } from '@/i18n';

// Re-export definitions so existing imports from './tools' still work
export { TOOLS, TOOL_LABELS } from './toolDefinitions';

// ---------------------------------------------------------------------------
// Tool executor — dispatches tool calls to the backend API
// ---------------------------------------------------------------------------

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  token: string,
): Promise<string> {
  const headers: HeadersInit = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const get = async (path: string) => {
    const r = await fetch(`${API_BASE}${path}`, { headers });
    return r.json() as Promise<Record<string, unknown>>;
  };

  const post = async (path: string, body: unknown) => {
    const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await r.json() as Record<string, unknown>;
    return { ok: r.ok, data };
  };

  const patch = async (path: string, body: unknown) => {
    const r = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await r.json() as Record<string, unknown>;
    return { ok: r.ok, data };
  };

  const put = async (path: string, body: unknown) => {
    const r = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    const data = await r.json() as Record<string, unknown>;
    return { ok: r.ok, data };
  };

  /** Normalize paginated or array responses into an array */
  const asList = (data: Record<string, unknown>): Record<string, unknown>[] => {
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (Array.isArray(data.content)) return data.content as Record<string, unknown>[];
    return [];
  };

  try {
    switch (name) {
      // =======================================================================
      // TASKS
      // =======================================================================
      case 'create_task': {
        const { ok, data } = await post('/api/tasks', args);
        if (!ok) return JSON.stringify({ error: (data as Record<string, unknown>).message ?? t('aiChat.errors.taskCreationFailed') });
        return JSON.stringify({ success: true, taskId: data.id, title: data.title, code: data.code });
      }
      case 'update_task_status': {
        const { taskId, status } = args as { taskId: string; status: string };
        const { ok, data } = await patch(`/api/tasks/${taskId}/status`, { status });
        return JSON.stringify({ success: ok, task: { id: data.id, title: data.title, status: data.status } });
      }
      case 'list_tasks': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.assigneeId) params.set('assigneeId', String(args.assigneeId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/tasks?${params}`);
        const tasks = asList(data).map((item) => ({
          id: item.id, title: item.title, status: item.status, priority: item.priority,
          assigneeName: item.assigneeName, plannedEndDate: item.plannedEndDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? tasks.length, tasks });
      }

      // =======================================================================
      // PROJECTS
      // =======================================================================
      case 'search_projects': {
        const data = await get(`/api/projects?search=${encodeURIComponent(String(args.search ?? ''))}&size=10`);
        const list = asList(data).slice(0, 8);
        return JSON.stringify({
          projects: list.map((p) => ({ id: p.id, name: p.name, status: p.status })),
        });
      }
      case 'update_project_status': {
        const { projectId, status } = args as { projectId: string; status: string };
        const { ok, data } = await patch(`/api/projects/${projectId}/status`, { status });
        return JSON.stringify({ success: ok, project: { id: data.id, name: data.name, status: data.status } });
      }
      case 'get_analytics': {
        const { projectId } = args as { projectId: string };
        const [project, financials] = await Promise.all([
          get(`/api/projects/${projectId}`),
          get(`/api/projects/${projectId}/financials`),
        ]);
        return JSON.stringify({ project: { id: project.id, name: project.name, status: project.status }, financials });
      }
      case 'get_project_analytics': {
        const { projectId } = args as { projectId: string };
        const [project, financials, tasksData] = await Promise.all([
          get(`/api/projects/${projectId}`),
          get(`/api/projects/${projectId}/financials`),
          get(`/api/tasks?projectId=${projectId}&size=50`),
        ]);
        const taskList = asList(tasksData);
        const taskStats = {
          total: taskList.length,
          done: taskList.filter((tk) => tk.status === 'DONE').length,
          inProgress: taskList.filter((tk) => tk.status === 'IN_PROGRESS').length,
        };
        return JSON.stringify({
          project: { id: project.id, name: project.name, status: project.status },
          financials,
          taskStats,
        });
      }
      case 'get_portfolio_summary': {
        const data = await get('/api/projects?size=100');
        const projects = asList(data).map((p) => ({
          id: p.id, name: p.name, status: p.status,
        }));
        return JSON.stringify({ total: data.totalElements ?? projects.length, projects });
      }

      // =======================================================================
      // HR & EMPLOYEES
      // =======================================================================
      case 'search_employees': {
        const data = await get(`/api/hr/employees?search=${encodeURIComponent(String(args.search ?? ''))}&size=10`);
        const list = asList(data).slice(0, 8);
        return JSON.stringify({
          employees: list.map((e) => ({
            id: e.id,
            name: e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
            position: e.position,
          })),
        });
      }
      case 'list_employees': {
        const params = new URLSearchParams({ size: '20' });
        if (args.search) params.set('search', String(args.search));
        if (args.status) params.set('status', String(args.status));
        const data = await get(`/api/hr/employees?${params}`);
        const employees = asList(data).map((e) => ({
          id: e.id,
          name: e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
          position: e.position, department: e.departmentName,
        }));
        return JSON.stringify({ total: data.totalElements ?? employees.length, employees });
      }
      case 'get_employee_detail': {
        const { employeeId } = args as { employeeId: string };
        const data = await get(`/api/hr/employees/${employeeId}`);
        return JSON.stringify({
          id: data.id,
          name: data.fullName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
          position: data.position, department: data.departmentName,
          phone: data.phone, email: data.email, hireDate: data.hireDate,
        });
      }
      case 'create_employee': {
        const { ok, data } = await post('/api/employees', args);
        return JSON.stringify({ success: ok, employeeId: data.id, fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() });
      }

      // =======================================================================
      // CONTRACTS
      // =======================================================================
      case 'create_contract': {
        const { ok, data } = await post('/api/contracts', args);
        return JSON.stringify({ success: ok, contractId: data.id, name: data.name, number: data.number });
      }
      case 'update_contract_status': {
        const { contractId, status } = args as { contractId: string; status: string };
        const { ok, data } = await patch(`/api/contracts/${contractId}/status`, { status });
        return JSON.stringify({ success: ok, contract: { id: data.id, name: data.name, status: data.status } });
      }
      case 'list_contracts': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/contracts?${params}`);
        const contracts = asList(data).map((c) => ({
          id: c.id, number: c.number, name: c.name, contractType: c.contractType,
          amount: c.amount, status: c.status, startDate: c.startDate, endDate: c.endDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? contracts.length, contracts });
      }

      // =======================================================================
      // FINANCE
      // =======================================================================
      case 'create_invoice': {
        const { ok, data } = await post('/api/invoices', args);
        return JSON.stringify({ success: ok, invoiceId: data.id, totalAmount: data.totalAmount });
      }
      case 'list_invoices': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.contractId) params.set('contractId', String(args.contractId));
        if (args.status) params.set('status', String(args.status));
        if (args.invoiceType) params.set('invoiceType', String(args.invoiceType));
        const data = await get(`/api/invoices?${params}`);
        const invoices = asList(data).map((i) => ({
          id: i.id, number: i.number, invoiceType: i.invoiceType,
          totalAmount: i.totalAmount, status: i.status, invoiceDate: i.invoiceDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? invoices.length, invoices });
      }
      case 'create_payment': {
        const { ok, data } = await post('/api/payments', args);
        return JSON.stringify({ success: ok, paymentId: data.id, amount: data.amount });
      }
      case 'create_budget': {
        const { ok, data } = await post('/api/budgets', args);
        return JSON.stringify({ success: ok, budgetId: data.id, name: data.name });
      }
      case 'add_budget_item': {
        const { budgetId, ...rest } = args as { budgetId: string } & Record<string, unknown>;
        const { ok, data } = await post(`/api/budgets/${budgetId}/items`, rest);
        return JSON.stringify({ success: ok, itemId: data.id, name: data.name });
      }
      case 'list_budgets': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        const data = await get(`/api/budgets?${params}`);
        const budgets = asList(data).map((b) => ({
          id: b.id, name: b.name, status: b.status,
          plannedRevenue: b.plannedRevenue, plannedCost: b.plannedCost,
          actualRevenue: b.actualRevenue, actualCost: b.actualCost,
        }));
        return JSON.stringify({ total: data.totalElements ?? budgets.length, budgets });
      }

      // =======================================================================
      // PROCUREMENT
      // =======================================================================
      case 'create_purchase_request': {
        const { ok, data } = await post('/api/purchase-requests', args);
        return JSON.stringify({ success: ok, requestId: data.id, number: data.number });
      }
      case 'list_purchase_requests': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/purchase-requests?${params}`);
        const requests = asList(data).map((r) => ({
          id: r.id, number: r.number, status: r.status, priority: r.priority, requestDate: r.requestDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? requests.length, requests });
      }

      // =======================================================================
      // WAREHOUSE & DISPATCH
      // =======================================================================
      case 'create_warehouse_movement': {
        const { ok, data } = await post('/api/warehouse/movements', args);
        return JSON.stringify({ success: ok, movementId: data.id, movementType: data.movementType });
      }
      case 'list_warehouse_stock': {
        const params = new URLSearchParams({ size: '30' });
        if (args.search) params.set('search', String(args.search));
        if (args.projectId) params.set('projectId', String(args.projectId));
        const data = await get(`/api/warehouse/stock?${params}`);
        const stock = asList(data).slice(0, 20).map((s) => ({
          materialName: s.materialName ?? s.name, unit: s.unit, quantity: s.quantity,
        }));
        return JSON.stringify({ stock });
      }
      case 'create_dispatch_order': {
        const { ok, data } = await post('/api/dispatch/orders', args);
        return JSON.stringify({ success: ok, orderId: data.id, number: data.number });
      }

      // =======================================================================
      // ESTIMATES
      // =======================================================================
      case 'list_estimates': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/estimates?${params}`);
        const estimates = asList(data).map((e) => ({
          id: e.id, name: e.name, status: e.status, projectName: e.projectName,
          totalAmount: e.totalAmount, estimateClass: e.estimateClass,
        }));
        return JSON.stringify({ total: data.totalElements ?? estimates.length, estimates });
      }
      case 'get_estimate_detail': {
        const { estimateId } = args as { estimateId: string };
        const [estimate, summary] = await Promise.all([
          get(`/api/estimates/${estimateId}`),
          get(`/api/estimates/${estimateId}/financial-summary`).catch(() => null),
        ]);
        return JSON.stringify({ estimate, financialSummary: summary });
      }

      // =======================================================================
      // SPECIFICATIONS
      // =======================================================================
      case 'list_specifications': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/specifications?${params}`);
        const specs = asList(data).map((s) => ({
          id: s.id, name: s.name, status: s.status, projectName: s.projectName,
          itemCount: s.itemCount,
        }));
        return JSON.stringify({ total: data.totalElements ?? specs.length, specifications: specs });
      }
      case 'push_spec_to_fm': {
        const { specificationId, budgetId } = args as { specificationId: string; budgetId: string };
        const { ok, data } = await post(`/api/specifications/${specificationId}/push-to-fm`, { budgetId });
        return JSON.stringify({ success: ok, pushed: data.pushedCount ?? data.count ?? 0 });
      }

      // =======================================================================
      // CRM
      // =======================================================================
      case 'list_crm_leads': {
        const params = new URLSearchParams({ size: '20' });
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/v1/crm/leads?${params}`);
        const leads = asList(data).map((l) => ({
          id: l.id, companyName: l.companyName, contactPerson: l.contactPerson,
          estimatedValue: l.estimatedValue, status: l.status, stage: l.stageName,
        }));
        return JSON.stringify({ total: data.totalElements ?? leads.length, leads });
      }
      case 'create_crm_lead': {
        const { ok, data } = await post('/api/v1/crm/leads', args);
        return JSON.stringify({ success: ok, leadId: data.id, companyName: data.companyName });
      }
      case 'update_crm_lead': {
        const { leadId, ...rest } = args as { leadId: string } & Record<string, unknown>;
        const { ok, data } = await put(`/api/v1/crm/leads/${leadId}`, rest);
        return JSON.stringify({ success: ok, lead: { id: data.id, companyName: data.companyName, status: data.status } });
      }
      case 'convert_lead_to_project': {
        const { leadId, projectName, projectCode } = args as { leadId: string; projectName: string; projectCode: string };
        const { ok, data } = await post(`/api/v1/crm/leads/${leadId}/convert`, { projectName, projectCode });
        return JSON.stringify({ success: ok, projectId: data.id ?? data.projectId, projectName: data.name ?? projectName });
      }

      // =======================================================================
      // QUALITY (DEFECTS)
      // =======================================================================
      case 'list_defects': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.severity) params.set('severity', String(args.severity));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/defects?${params}`);
        const defects = asList(data).map((d) => ({
          id: d.id, title: d.title, severity: d.severity, status: d.status,
          location: d.location, fixDeadline: d.fixDeadline,
        }));
        return JSON.stringify({ total: data.totalElements ?? defects.length, defects });
      }
      case 'create_defect': {
        const { ok, data } = await post('/api/defects', args);
        return JSON.stringify({ success: ok, defectId: data.id, title: data.title });
      }
      case 'update_defect_status': {
        const { defectId, status, fixDescription } = args as { defectId: string; status: string; fixDescription?: string };
        const qp = new URLSearchParams({ status });
        if (fixDescription) qp.set('fixDescription', fixDescription);
        const { ok, data } = await patch(`/api/defects/${defectId}/transition?${qp}`, null);
        return JSON.stringify({ success: ok, defect: { id: data.id, title: data.title, status: data.status } });
      }

      // =======================================================================
      // SAFETY
      // =======================================================================
      case 'get_safety_dashboard': {
        const data = await get('/api/safety/compliance/dashboard');
        return JSON.stringify(data);
      }

      // =======================================================================
      // SUBMITTALS / PTO
      // =======================================================================
      case 'list_submittals': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/pto/submittals?${params}`);
        const submittals = asList(data).map((s) => ({
          id: s.id, title: s.title, status: s.status,
          submittalType: s.submittalType, projectName: s.projectName,
        }));
        return JSON.stringify({ total: data.totalElements ?? submittals.length, submittals });
      }
      case 'create_submittal': {
        const { ok, data } = await post('/api/pto/submittals', args);
        return JSON.stringify({ success: ok, submittalId: data.id, title: data.title });
      }
      case 'update_submittal_status': {
        const { submittalId, status } = args as { submittalId: string; status: string };
        const { ok, data } = await put(`/api/pto/submittals/${submittalId}`, { status });
        return JSON.stringify({ success: ok, submittal: { id: data.id, title: data.title, status: data.status } });
      }

      // =======================================================================
      // CLOSING DOCUMENTS (KS-2)
      // =======================================================================
      case 'list_ks2_documents': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.contractId) params.set('contractId', String(args.contractId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/ks2?${params}`);
        const docs = asList(data).map((d) => ({
          id: d.id, number: d.number, name: d.name, status: d.status,
          totalAmount: d.totalAmount, documentDate: d.documentDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? docs.length, ks2Documents: docs });
      }
      case 'get_ks2_detail': {
        const { ks2Id } = args as { ks2Id: string };
        const data = await get(`/api/ks2/${ks2Id}/detail`);
        return JSON.stringify(data);
      }

      // =======================================================================
      // SITE ASSESSMENT
      // =======================================================================
      case 'list_site_assessments': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        const data = await get(`/api/site-assessments?${params}`);
        const assessments = asList(data).map((a) => ({
          id: a.id, siteAddress: a.siteAddress, assessorName: a.assessorName,
          assessmentDate: a.assessmentDate, status: a.status,
        }));
        return JSON.stringify({ total: data.totalElements ?? assessments.length, assessments });
      }
      case 'create_site_assessment': {
        const { ok, data } = await post('/api/site-assessments', args);
        return JSON.stringify({ success: ok, assessmentId: data.id, siteAddress: data.siteAddress });
      }

      // =======================================================================
      // PREQUALIFICATION
      // =======================================================================
      case 'list_prequalifications': {
        const data = await get('/api/prequalifications');
        const preqs = asList(data).map((p) => ({
          id: p.id, companyName: p.companyName, inn: p.inn,
          status: p.status, workType: p.workType,
        }));
        return JSON.stringify({ total: preqs.length, prequalifications: preqs });
      }
      case 'create_prequalification': {
        const { ok, data } = await post('/api/prequalifications', args);
        return JSON.stringify({ success: ok, prequalificationId: data.id, companyName: data.companyName });
      }

      // =======================================================================
      // COMMERCIAL PROPOSALS
      // =======================================================================
      case 'list_commercial_proposals': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        const data = await get(`/api/commercial-proposals?${params}`);
        const proposals = asList(data).map((cp) => ({
          id: cp.id, name: cp.name, status: cp.status,
          totalAmount: cp.totalAmount,
        }));
        return JSON.stringify({ total: data.totalElements ?? proposals.length, proposals });
      }
      case 'create_commercial_proposal': {
        const { ok, data } = await post('/api/commercial-proposals', args);
        return JSON.stringify({ success: ok, proposalId: data.id, name: data.name });
      }

      // =======================================================================
      // FLEET
      // =======================================================================
      case 'list_fleet_vehicles': {
        const params = new URLSearchParams({ size: '20' });
        if (args.type) params.set('type', String(args.type));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/fleet/vehicles?${params}`);
        const vehicles = asList(data).map((v) => ({
          id: v.id, name: v.name, code: v.code, type: v.type,
          status: v.status, licensePlate: v.licensePlate,
          projectName: v.projectName,
        }));
        return JSON.stringify({ total: data.totalElements ?? vehicles.length, vehicles });
      }

      // =======================================================================
      // DOCUMENTS
      // =======================================================================
      case 'list_documents': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.category) params.set('category', String(args.category));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/documents?${params}`);
        const docs = asList(data).map((d) => ({
          id: d.id, title: d.title, documentNumber: d.documentNumber,
          category: d.category, status: d.status, createdAt: d.createdAt,
        }));
        return JSON.stringify({ total: data.totalElements ?? docs.length, documents: docs });
      }
      case 'upload_document_metadata': {
        const { ok, data } = await post('/api/documents', args);
        return JSON.stringify({ success: ok, documentId: data.id, title: data.title });
      }

      // =======================================================================
      // MESSAGING
      // =======================================================================
      case 'list_channels': {
        const data = await get('/api/messaging/channels');
        const channels = asList(data).map((ch) => ({
          id: ch.id, name: ch.name, type: ch.channelType ?? ch.type,
          memberCount: ch.memberCount,
        }));
        return JSON.stringify({ channels });
      }
      case 'create_channel': {
        const { ok, data } = await post('/api/messaging/channels', {
          name: args.name,
          channelType: String(args.channelType ?? 'public').toUpperCase(),
          description: args.description,
        });
        return JSON.stringify({ success: ok, channelId: data.id, name: data.name });
      }
      case 'send_message': {
        const { channelId, content } = args as { channelId: string; content: string };
        const { ok, data } = await post(`/api/messaging/channels/${channelId}/messages`, { content });
        return JSON.stringify({ success: ok, messageId: data.id });
      }

      // =======================================================================
      // RISKS
      // =======================================================================
      case 'list_risks': {
        const { projectId } = args as { projectId: string };
        const data = await get(`/api/projects/${projectId}/risks`);
        const risks = asList(data).map((r) => ({
          id: r.id, title: r.title, probability: r.probability,
          impact: r.impact, status: r.status,
        }));
        return JSON.stringify({ risks });
      }
      case 'create_risk': {
        const { projectId, ...rest } = args as { projectId: string } & Record<string, unknown>;
        const { ok, data } = await post(`/api/projects/${projectId}/risks`, rest);
        return JSON.stringify({ success: ok, riskId: data.id, title: data.title });
      }

      // =======================================================================
      // NOTIFICATIONS
      // =======================================================================
      case 'list_notifications': {
        const params = new URLSearchParams({ size: '20' });
        if (args.isRead !== undefined) params.set('isRead', String(args.isRead));
        const data = await get(`/api/notifications?${params}`);
        const notifications = asList(data).map((n) => ({
          id: n.id, title: n.title, message: n.message, type: n.type,
          isRead: n.isRead, createdAt: n.createdAt,
        }));
        return JSON.stringify({ total: data.totalElements ?? notifications.length, notifications });
      }
      case 'mark_notification_read': {
        const { notificationId } = args as { notificationId: string };
        await patch(`/api/notifications/${notificationId}/read`, {});
        return JSON.stringify({ success: true, notificationId });
      }

      // =======================================================================
      // SUPPORT
      // =======================================================================
      case 'list_support_tickets': {
        const params = new URLSearchParams({ size: '20' });
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/support/tickets?${params}`);
        const tickets = asList(data).map((tk) => ({
          id: tk.id, code: tk.code, subject: tk.subject,
          priority: tk.priority, status: tk.status, createdAt: tk.createdAt,
        }));
        return JSON.stringify({ total: data.totalElements ?? tickets.length, tickets });
      }
      case 'create_support_ticket': {
        const { ok, data } = await post('/api/support/tickets', args);
        return JSON.stringify({ success: ok, ticketId: data.id, code: data.code, subject: data.subject });
      }

      // =======================================================================
      // PERMITS
      // =======================================================================
      case 'list_permits': {
        const { projectId } = args as { projectId: string };
        const data = await get(`/api/projects/${projectId}/permits`);
        const permits = asList(data).map((p) => ({
          id: p.id, name: p.name ?? p.permitType, status: p.status,
          issueDate: p.issueDate, expiryDate: p.expiryDate,
        }));
        return JSON.stringify({ permits });
      }

      // =======================================================================
      // MILESTONES
      // =======================================================================
      case 'list_milestones': {
        const data = await get('/api/milestones');
        const milestones = asList(data).map((m) => ({
          id: m.id, name: m.name, dueDate: m.dueDate,
          status: m.status, projectName: m.projectName,
        }));
        return JSON.stringify({ milestones });
      }

      // =======================================================================
      // NAVIGATION
      // =======================================================================
      case 'navigate_to_page': {
        const { path } = args as { path: string };
        return JSON.stringify({ action: 'navigate', path });
      }

      default:
        return JSON.stringify({ error: t('aiChat.errors.unknownTool', { name }) });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
