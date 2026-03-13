/**
 * Маппинг route pathname → KB article slug
 * Используется кнопкой ? и контекстными подсказками в виджете
 */
export const HELP_MAP: Record<string, string> = {
  // Core
  '/projects': 'projects',
  '/tasks': 'tasks',
  '/contracts': 'contracts',
  '/documents': 'documents',
  '/calendar': 'calendar',

  // Finance
  '/budgets': 'budgets',
  '/invoices': 'invoices',
  '/payments': 'payments',
  '/cash-flow': 'cash-flow',
  '/financial-models': 'financial-model',
  '/accounting': 'accounting',
  '/cost-management': 'cost-management',
  '/pricing': 'pricing-database',

  // Estimates
  '/estimates': 'estimates',
  '/specifications': 'specifications',
  '/competitive-lists': 'competitive-lists',
  '/commercial-proposals': 'commercial-proposals',

  // Closing
  '/ks2': 'ks2',
  '/ks3': 'ks3',

  // HR
  '/hr/employees': 'employees',
  '/hr/timesheets': 'timesheets',
  '/hr/crews': 'crews',
  '/hr/leave': 'leave',
  '/hr/payroll': 'payroll',
  '/hr/recruitment': 'recruitment',
  '/hr/self-employed': 'self-employed',
  '/hr/russian': 'hr-russian',

  // Safety
  '/safety/inspections': 'safety-inspections',
  '/safety/incidents': 'safety-incidents',
  '/safety/trainings': 'safety-trainings',
  '/safety/ppe': 'ppe',
  '/safety/sout': 'sout',

  // Ops
  '/work-orders': 'work-orders',
  '/daily-log': 'daily-log',
  '/dispatch': 'dispatch',

  // Warehouse
  '/warehouse': 'warehouse',
  '/materials': 'materials',
  '/purchase-orders': 'purchase-orders',

  // Quality
  '/quality/inspections': 'quality-inspections',
  '/quality/non-conformance': 'non-conformance',
  '/defects': 'defects',
  '/punch-list': 'punch-list',
  '/submittals': 'submittals',
  '/rfi': 'rfi',

  // Construction
  '/planning': 'planning',
  '/bim': 'bim',
  '/closeout': 'closeout',
  '/change-orders': 'change-orders',
  '/design': 'design',
  '/exec-docs': 'executive-docs',

  // CRM & Portal
  '/crm/leads': 'crm-leads',
  '/crm/contacts': 'crm-contacts',
  '/portfolio': 'portfolio',
  '/prequalification': 'prequalification',
  '/site-assessments': 'site-assessment',
  '/portal': 'client-portal',
  '/support/tickets': 'support-tickets',

  // Communication
  '/messaging': 'messaging',
  '/email': 'email',

  // Integrations
  '/integrations': 'integrations',
  '/fleet': 'fleet',
  '/monitoring': 'monitoring',

  // Settings
  '/settings': 'settings',
  '/settings/users': 'users-roles',
  '/regulatory': 'regulatory',

  // Analytics
  '/analytics': 'analytics',

  // Help itself
  '/help': 'onboarding',
};

/**
 * Найти slug статьи по текущему pathname
 * Поддерживает точное совпадение и совпадение по префиксу
 */
export function findHelpSlug(pathname: string): string | null {
  // Exact match
  if (HELP_MAP[pathname]) return HELP_MAP[pathname];

  // Prefix match (e.g. /projects/123 → projects)
  const parts = pathname.split('/').filter(Boolean);
  while (parts.length > 0) {
    const prefix = '/' + parts.join('/');
    if (HELP_MAP[prefix]) return HELP_MAP[prefix];
    parts.pop();
  }

  return null;
}
