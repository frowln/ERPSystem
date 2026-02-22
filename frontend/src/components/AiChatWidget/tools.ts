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

  try {
    switch (name) {
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
      case 'search_employees': {
        const data = await get(`/api/hr/employees?search=${encodeURIComponent(String(args.search ?? ''))}&size=10`);
        const list = ((data.content ?? data) as Record<string, unknown>[]).slice(0, 8);
        return JSON.stringify({
          employees: list.map((e) => ({
            id: e.id,
            name: e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
            position: e.position,
          })),
        });
      }
      case 'search_projects': {
        const data = await get(`/api/projects?search=${encodeURIComponent(String(args.search ?? ''))}&size=10`);
        const list = (data.content as Record<string, unknown>[] ?? []).slice(0, 8);
        return JSON.stringify({
          projects: list.map((p) => ({ id: p.id, name: p.name, status: p.status })),
        });
      }
      case 'list_tasks': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.assigneeId) params.set('assigneeId', String(args.assigneeId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/tasks?${params}`);
        const tasks = (data.content as Record<string, unknown>[] ?? []).map((t) => ({
          id: t.id, title: t.title, status: t.status, priority: t.priority,
          assigneeName: t.assigneeName, plannedEndDate: t.plannedEndDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? tasks.length, tasks });
      }
      case 'update_project_status': {
        const { projectId, status } = args as { projectId: string; status: string };
        const { ok, data } = await patch(`/api/projects/${projectId}/status`, { status });
        return JSON.stringify({ success: ok, project: { id: data.id, name: data.name, status: data.status } });
      }
      case 'update_contract_status': {
        const { contractId, status } = args as { contractId: string; status: string };
        const { ok, data } = await patch(`/api/contracts/${contractId}/status`, { status });
        return JSON.stringify({ success: ok, contract: { id: data.id, name: data.name, status: data.status } });
      }
      case 'create_invoice': {
        const { ok, data } = await post('/api/invoices', args);
        return JSON.stringify({ success: ok, invoiceId: data.id, totalAmount: data.totalAmount });
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
      case 'create_purchase_request': {
        const { ok, data } = await post('/api/purchase-requests', args);
        return JSON.stringify({ success: ok, requestId: data.id, number: data.number });
      }
      case 'create_contract': {
        const { ok, data } = await post('/api/contracts', args);
        return JSON.stringify({ success: ok, contractId: data.id, name: data.name, number: data.number });
      }
      case 'create_employee': {
        const { ok, data } = await post('/api/employees', args);
        return JSON.stringify({ success: ok, employeeId: data.id, fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() });
      }
      case 'create_dispatch_order': {
        const { ok, data } = await post('/api/dispatch/orders', args);
        return JSON.stringify({ success: ok, orderId: data.id, number: data.number });
      }
      case 'create_warehouse_movement': {
        const { ok, data } = await post('/api/warehouse/movements', args);
        return JSON.stringify({ success: ok, movementId: data.id, movementType: data.movementType });
      }
      case 'list_invoices': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.contractId) params.set('contractId', String(args.contractId));
        if (args.status) params.set('status', String(args.status));
        if (args.invoiceType) params.set('invoiceType', String(args.invoiceType));
        const data = await get(`/api/invoices?${params}`);
        const invoices = (data.content as Record<string, unknown>[] ?? []).map((i) => ({
          id: i.id, number: i.number, invoiceType: i.invoiceType,
          totalAmount: i.totalAmount, status: i.status, invoiceDate: i.invoiceDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? invoices.length, invoices });
      }
      case 'list_contracts': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/contracts?${params}`);
        const contracts = (data.content as Record<string, unknown>[] ?? []).map((c) => ({
          id: c.id, number: c.number, name: c.name, contractType: c.contractType,
          amount: c.amount, status: c.status, startDate: c.startDate, endDate: c.endDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? contracts.length, contracts });
      }
      case 'get_analytics': {
        const { projectId } = args as { projectId: string };
        const [project, financials] = await Promise.all([
          get(`/api/projects/${projectId}`),
          get(`/api/projects/${projectId}/financials`),
        ]);
        return JSON.stringify({ project: { id: project.id, name: project.name, status: project.status }, financials });
      }
      case 'list_budgets': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        const data = await get(`/api/budgets?${params}`);
        const budgets = (data.content as Record<string, unknown>[] ?? []).map((b) => ({
          id: b.id, name: b.name, status: b.status,
          plannedRevenue: b.plannedRevenue, plannedCost: b.plannedCost,
          actualRevenue: b.actualRevenue, actualCost: b.actualCost,
        }));
        return JSON.stringify({ total: data.totalElements ?? budgets.length, budgets });
      }
      case 'list_purchase_requests': {
        const params = new URLSearchParams({ size: '20' });
        if (args.projectId) params.set('projectId', String(args.projectId));
        if (args.status) params.set('status', String(args.status));
        if (args.search) params.set('search', String(args.search));
        const data = await get(`/api/purchase-requests?${params}`);
        const requests = (data.content as Record<string, unknown>[] ?? []).map((r) => ({
          id: r.id, number: r.number, status: r.status, priority: r.priority, requestDate: r.requestDate,
        }));
        return JSON.stringify({ total: data.totalElements ?? requests.length, requests });
      }
      case 'list_warehouse_stock': {
        const params = new URLSearchParams({ size: '30' });
        if (args.search) params.set('search', String(args.search));
        if (args.projectId) params.set('projectId', String(args.projectId));
        const data = await get(`/api/warehouse/stock?${params}`);
        const stock = ((data.content ?? data) as Record<string, unknown>[]).slice(0, 20).map((s) => ({
          materialName: s.materialName ?? s.name, unit: s.unit, quantity: s.quantity,
        }));
        return JSON.stringify({ stock });
      }
      default:
        return JSON.stringify({ error: t('aiChat.errors.unknownTool', { name }) });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
