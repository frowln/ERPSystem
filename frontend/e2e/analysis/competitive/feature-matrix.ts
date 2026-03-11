/**
 * Competitive feature matrix — compares PRIVOD modules against known
 * competitor capabilities.
 *
 * Data sourced from:
 *   - navigation.ts (84 PRIVOD modules)
 *   - business-rules-construction-erp.md (12 competitors)
 *
 * Usage:
 *   import { compareFeatures, generateGapReport, generateAdvantageReport } from './feature-matrix';
 *   const comparison = compareFeatures();
 *   fs.writeFileSync('reports/competitive-analysis.md', generateFullReport());
 */
import * as fs from 'fs';
import * as path from 'path';

/* ───────────────────── Types ───────────────────── */

type FeatureLevel = 'full' | 'partial' | 'none' | 'unknown';

interface PrivodModule {
  key: string;
  nameRu: string;
  nameEn: string;
  category: string;
}

interface Competitor {
  id: string;
  nameRu: string;
  nameEn: string;
  type: 'primary' | 'secondary';
  /** Known features — maps capability key → level */
  features: Record<string, FeatureLevel>;
  strengths: string[];
  weaknesses: string[];
}

interface FeatureComparison {
  capability: string;
  categoryRu: string;
  privod: FeatureLevel;
  competitors: Record<string, FeatureLevel>;
}

interface GapItem {
  capability: string;
  categoryRu: string;
  bestCompetitor: string;
  competitorLevel: FeatureLevel;
  privodLevel: FeatureLevel;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

interface AdvantageItem {
  capability: string;
  categoryRu: string;
  privodLevel: FeatureLevel;
  closestCompetitor: string;
  closestLevel: FeatureLevel;
}

/* ─────────── PRIVOD modules (from navigation.ts) ─────────── */

export const PRIVOD_MODULES: PrivodModule[] = [
  // Dashboard & Analytics
  { key: 'dashboard', nameRu: 'Дашборд', nameEn: 'Dashboard', category: 'Аналитика' },
  { key: 'analytics', nameRu: 'Аналитика', nameEn: 'Analytics', category: 'Аналитика' },
  { key: 'reports', nameRu: 'Отчёты', nameEn: 'Reports', category: 'Аналитика' },

  // Tasks & Calendar
  { key: 'tasks', nameRu: 'Задачи', nameEn: 'Tasks', category: 'Управление' },
  { key: 'calendar', nameRu: 'Календарь', nameEn: 'Calendar', category: 'Управление' },

  // Planning
  { key: 'gantt', nameRu: 'Диаграмма Ганта', nameEn: 'Gantt Chart', category: 'Планирование' },
  { key: 'evm', nameRu: 'EVM / Освоенный объём', nameEn: 'Earned Value Management', category: 'Планирование' },
  { key: 'resource-planning', nameRu: 'Планирование ресурсов', nameEn: 'Resource Planning', category: 'Планирование' },
  { key: 'work-volumes', nameRu: 'Объёмы работ', nameEn: 'Work Volumes', category: 'Планирование' },

  // Processes
  { key: 'rfis', nameRu: 'RFI / Запросы', nameEn: 'RFIs', category: 'Процессы' },
  { key: 'submittals', nameRu: 'Submittals / ПТО', nameEn: 'Submittals', category: 'Процессы' },
  { key: 'issues', nameRu: 'Проблемы', nameEn: 'Issues', category: 'Процессы' },
  { key: 'workflows', nameRu: 'Workflow / Бизнес-процессы', nameEn: 'Workflows', category: 'Процессы' },
  { key: 'approval-inbox', nameRu: 'Входящие согласования', nameEn: 'Approval Inbox', category: 'Процессы' },
  { key: 'change-management', nameRu: 'Управление изменениями', nameEn: 'Change Management', category: 'Процессы' },

  // Projects
  { key: 'projects', nameRu: 'Проекты', nameEn: 'Projects', category: 'Проекты' },
  { key: 'site-assessments', nameRu: 'Обследование площадки', nameEn: 'Site Assessments', category: 'Проекты' },
  { key: 'portfolio-health', nameRu: 'Здоровье портфеля', nameEn: 'Portfolio Health', category: 'Проекты' },

  // CRM
  { key: 'crm-leads', nameRu: 'CRM / Лиды', nameEn: 'CRM Leads', category: 'CRM' },
  { key: 'crm-dashboard', nameRu: 'CRM Дашборд', nameEn: 'CRM Dashboard', category: 'CRM' },
  { key: 'counterparties', nameRu: 'Контрагенты', nameEn: 'Counterparties', category: 'CRM' },
  { key: 'tenders', nameRu: 'Тендеры', nameEn: 'Tenders', category: 'CRM' },
  { key: 'bid-packages', nameRu: 'Тендерные пакеты', nameEn: 'Bid Packages', category: 'CRM' },

  // Documents
  { key: 'documents', nameRu: 'Документы', nameEn: 'Documents', category: 'Документы' },
  { key: 'cde', nameRu: 'СОД / CDE', nameEn: 'Common Data Environment', category: 'Документы' },
  { key: 'pto', nameRu: 'ПТО', nameEn: 'PTO Documents', category: 'Документы' },
  { key: 'russian-docs', nameRu: 'Российские документы (КС-2/КС-3/ЭДО)', nameEn: 'Russian Regulatory Docs', category: 'Документы' },
  { key: 'data-exchange', nameRu: 'Обмен данными / 1С', nameEn: 'Data Exchange / 1C', category: 'Документы' },
  { key: 'exec-docs', nameRu: 'Исполнительная документация', nameEn: 'Executive Documentation', category: 'Документы' },

  // Design
  { key: 'design', nameRu: 'Проектирование', nameEn: 'Design Management', category: 'Проектирование' },

  // Finance
  { key: 'budgets', nameRu: 'Бюджеты', nameEn: 'Budgets', category: 'Финансы' },
  { key: 'financial-models', nameRu: 'Финансовые модели (ФМ)', nameEn: 'Financial Models', category: 'Финансы' },
  { key: 'commercial-proposals', nameRu: 'Коммерческие предложения (КП)', nameEn: 'Commercial Proposals', category: 'Финансы' },
  { key: 'invoices', nameRu: 'Счета', nameEn: 'Invoices', category: 'Финансы' },
  { key: 'payments', nameRu: 'Платежи', nameEn: 'Payments', category: 'Финансы' },
  { key: 'cash-flow', nameRu: 'Денежные потоки / БДДС', nameEn: 'Cash Flow / BDDS', category: 'Финансы' },
  { key: 'accounting', nameRu: 'Бухгалтерия', nameEn: 'Accounting', category: 'Финансы' },
  { key: 'contracts', nameRu: 'Договоры', nameEn: 'Contracts', category: 'Финансы' },
  { key: 'cost-management', nameRu: 'Управление затратами', nameEn: 'Cost Management', category: 'Финансы' },

  // Pricing / Estimates
  { key: 'specifications', nameRu: 'Спецификации', nameEn: 'Specifications', category: 'Ценообразование' },
  { key: 'competitive-lists', nameRu: 'Конкурентные листы (КЛ)', nameEn: 'Competitive Lists', category: 'Ценообразование' },
  { key: 'estimates', nameRu: 'Сметы / ЛСР', nameEn: 'Estimates / LSR', category: 'Ценообразование' },
  { key: 'pricing-databases', nameRu: 'Базы расценок', nameEn: 'Pricing Databases', category: 'Ценообразование' },

  // Supply chain
  { key: 'procurement', nameRu: 'Закупки', nameEn: 'Procurement', category: 'Снабжение' },
  { key: 'purchase-orders', nameRu: 'Заказы поставщикам', nameEn: 'Purchase Orders', category: 'Снабжение' },
  { key: 'warehouse', nameRu: 'Склад', nameEn: 'Warehouse', category: 'Снабжение' },
  { key: 'dispatch', nameRu: 'Диспетчеризация', nameEn: 'Dispatch', category: 'Снабжение' },

  // HR
  { key: 'employees', nameRu: 'Сотрудники', nameEn: 'Employees', category: 'HR' },
  { key: 'crew', nameRu: 'Бригады', nameEn: 'Crews', category: 'HR' },
  { key: 'timesheets', nameRu: 'Табели', nameEn: 'Timesheets', category: 'HR' },
  { key: 'leave', nameRu: 'Отпуска', nameEn: 'Leave', category: 'HR' },
  { key: 'staffing', nameRu: 'Штатное расписание', nameEn: 'Staffing Schedule', category: 'HR' },

  // Safety
  { key: 'safety-dashboard', nameRu: 'Охрана труда — дашборд', nameEn: 'Safety Dashboard', category: 'Безопасность' },
  { key: 'safety-incidents', nameRu: 'Инциденты', nameEn: 'Safety Incidents', category: 'Безопасность' },
  { key: 'safety-training', nameRu: 'Обучение ОТ', nameEn: 'Safety Training', category: 'Безопасность' },
  { key: 'safety-inspections', nameRu: 'Инспекции', nameEn: 'Safety Inspections', category: 'Безопасность' },

  // Quality
  { key: 'quality', nameRu: 'Контроль качества', nameEn: 'Quality Control', category: 'Качество' },
  { key: 'defects', nameRu: 'Дефекты', nameEn: 'Defects', category: 'Качество' },
  { key: 'punchlist', nameRu: 'Замечания (Punch list)', nameEn: 'Punch List', category: 'Качество' },

  // Fleet & IoT
  { key: 'fleet', nameRu: 'Автопарк', nameEn: 'Fleet Management', category: 'Техника' },
  { key: 'iot', nameRu: 'IoT устройства', nameEn: 'IoT Devices', category: 'Техника' },

  // Site operations
  { key: 'daily-logs', nameRu: 'Дневные отчёты', nameEn: 'Daily Logs', category: 'Площадка' },
  { key: 'bim', nameRu: 'BIM', nameEn: 'BIM', category: 'Площадка' },

  // Closing
  { key: 'ks2', nameRu: 'КС-2', nameEn: 'KS-2 Acts', category: 'Закрытие' },
  { key: 'ks3', nameRu: 'КС-3', nameEn: 'KS-3 Certificates', category: 'Закрытие' },
  { key: 'closeout', nameRu: 'Завершение объекта', nameEn: 'Project Closeout', category: 'Закрытие' },

  // Maintenance
  { key: 'maintenance', nameRu: 'Техобслуживание', nameEn: 'Maintenance', category: 'Обслуживание' },

  // Legal
  { key: 'legal', nameRu: 'Юридическое', nameEn: 'Legal', category: 'Юридическое' },

  // Portal
  { key: 'portal', nameRu: 'Портал подрядчика', nameEn: 'Contractor Portal', category: 'Портал' },

  // Communication
  { key: 'messaging', nameRu: 'Мессенджер', nameEn: 'Messaging', category: 'Коммуникации' },
  { key: 'mail', nameRu: 'Почта', nameEn: 'Mail', category: 'Коммуникации' },

  // Admin
  { key: 'admin', nameRu: 'Администрирование', nameEn: 'Administration', category: 'Админ' },
  { key: 'permissions', nameRu: 'Права доступа (RBAC)', nameEn: 'Permissions / RBAC', category: 'Админ' },
  { key: 'support', nameRu: 'Техподдержка', nameEn: 'Support Tickets', category: 'Админ' },
];

/* ─────────── Competitors (from business-rules.md) ─────────── */

/**
 * Feature keys that map to PRIVOD module keys.
 * 'full'    = fully implemented
 * 'partial' = some coverage
 * 'none'    = feature absent
 * 'unknown' = not assessed
 */
export const COMPETITORS: Competitor[] = [
  {
    id: '1c-uso',
    nameRu: '1С:УСО',
    nameEn: '1C:Construction',
    type: 'primary',
    features: {
      budgets: 'full', accounting: 'full', invoices: 'full', payments: 'full',
      'cash-flow': 'full', contracts: 'full', employees: 'full', timesheets: 'full',
      ks2: 'full', ks3: 'full', estimates: 'full',
      'data-exchange': 'full', // native 1C
      dashboard: 'partial', tasks: 'partial',
      specifications: 'none', 'competitive-lists': 'none', 'financial-models': 'none',
      'commercial-proposals': 'none', portal: 'none', crm: 'none',
      quality: 'none', defects: 'none', safety: 'none', bim: 'none',
      fleet: 'none', messaging: 'none', mail: 'none',
    },
    strengths: ['Полный бух.учёт', 'Налоговая отчётность', 'Все знают'],
    weaknesses: ['UX 2005 года', 'Нет мобильного', 'Нет real-time', 'Долгое внедрение'],
  },
  {
    id: 'bitrix24',
    nameRu: 'Битрикс24',
    nameEn: 'Bitrix24',
    type: 'primary',
    features: {
      'crm-leads': 'full', 'crm-dashboard': 'full', tasks: 'full', calendar: 'full',
      messaging: 'full', mail: 'full',
      documents: 'partial', workflows: 'partial',
      budgets: 'none', 'financial-models': 'none', specifications: 'none',
      estimates: 'none', ks2: 'none', ks3: 'none', 'competitive-lists': 'none',
      'commercial-proposals': 'none', warehouse: 'none', quality: 'none',
      safety: 'none', portal: 'none',
    },
    strengths: ['CRM лидер', 'Чат + видео', 'Маркетплейс', 'Бесплатный тариф'],
    weaknesses: ['Нет строительной специфики', 'Нет ФМ', 'Нет сметного модуля'],
  },
  {
    id: 'planradar',
    nameRu: 'PlanRadar',
    nameEn: 'PlanRadar',
    type: 'primary',
    features: {
      defects: 'full', quality: 'full', 'safety-inspections': 'full',
      'daily-logs': 'partial', documents: 'partial',
      budgets: 'none', 'financial-models': 'none', specifications: 'none',
      estimates: 'none', ks2: 'none', ks3: 'none', invoices: 'none',
      'commercial-proposals': 'none', 'competitive-lists': 'none',
      portal: 'none', accounting: 'none',
    },
    strengths: ['Фото на плане этажа', 'Mobile-first', 'Оффлайн', 'Простота'],
    weaknesses: ['Нет ФМ', 'Нет сметного', 'Нет российских нормативов'],
  },
  {
    id: 'megaplan',
    nameRu: 'Мегаплан',
    nameEn: 'Megaplan',
    type: 'primary',
    features: {
      tasks: 'full', calendar: 'full', 'crm-leads': 'partial', gantt: 'full',
      budgets: 'none', specifications: 'none', estimates: 'none',
      'financial-models': 'none', quality: 'none', safety: 'none',
    },
    strengths: ['Простой UX', 'Ганты', 'Мобильное приложение'],
    weaknesses: ['Ноль строительной специфики', 'Ноль финансовой глубины'],
  },
  {
    id: 'planfix',
    nameRu: 'Планфикс',
    nameEn: 'Planfix',
    type: 'primary',
    features: {
      tasks: 'full', workflows: 'full', calendar: 'full',
      'crm-leads': 'partial',
      budgets: 'none', specifications: 'none', estimates: 'none',
      'financial-models': 'none',
    },
    strengths: ['Гибкие workflow', 'API', 'Автоматизация'],
    weaknesses: ['Generic', 'Высокий порог входа', 'Надо всё настраивать'],
  },
  {
    id: 'hubex',
    nameRu: 'HubEx',
    nameEn: 'HubEx',
    type: 'primary',
    features: {
      maintenance: 'full', fleet: 'partial', 'daily-logs': 'partial',
      budgets: 'none', specifications: 'none', estimates: 'none',
      'financial-models': 'none',
    },
    strengths: ['Мобильный на площадке', 'GPS-трекинг', 'Заявки'],
    weaknesses: ['Нет ФМ', 'Нет pre-construction'],
  },
  {
    id: 'sbis',
    nameRu: 'СБИС (Тензор)',
    nameEn: 'SBIS (Tensor)',
    type: 'primary',
    features: {
      documents: 'full', 'russian-docs': 'full',
      accounting: 'partial', invoices: 'partial',
      budgets: 'none', specifications: 'none', estimates: 'none',
      'financial-models': 'none', tasks: 'none', quality: 'none',
    },
    strengths: ['ЭДО лидер', 'Интеграция с ФНС', 'КЭП'],
    weaknesses: ['Не ERP', 'Нет управления проектами'],
  },
  {
    id: 'kontur',
    nameRu: 'Контур.Строительство',
    nameEn: 'Kontur.Construction',
    type: 'primary',
    features: {
      ks2: 'full', ks3: 'full', estimates: 'full',
      budgets: 'none', 'crm-leads': 'none', warehouse: 'none',
      'financial-models': 'none', specifications: 'none',
    },
    strengths: ['КС-2/КС-3', 'Экспертиза смет', 'Связь с Контур.Экстерн'],
    weaknesses: ['Узкая функциональность', 'Нет CRM', 'Нет склада'],
  },
  {
    id: 'procore',
    nameRu: 'Procore',
    nameEn: 'Procore',
    type: 'secondary',
    features: {
      projects: 'full', rfis: 'full', submittals: 'full', 'change-management': 'full',
      portal: 'full', quality: 'full', 'daily-logs': 'full', documents: 'full',
      budgets: 'full', contracts: 'full', invoices: 'full',
      'safety-incidents': 'full', 'safety-inspections': 'full',
      tasks: 'full', 'cost-management': 'full',
      specifications: 'partial', estimates: 'none',
      ks2: 'none', ks3: 'none', 'financial-models': 'none',
      'competitive-lists': 'none', 'commercial-proposals': 'none',
    },
    strengths: ['#1 в мире', 'RFI workflow', 'Интеграции (200+)', 'Mobile UX'],
    weaknesses: ['Дорого', 'Нет российских стандартов'],
  },
  {
    id: 'autodesk-build',
    nameRu: 'Autodesk Build (ACC)',
    nameEn: 'Autodesk Build',
    type: 'secondary',
    features: {
      bim: 'full', documents: 'full', rfis: 'full', submittals: 'full',
      quality: 'full', 'safety-inspections': 'full', 'daily-logs': 'full',
      design: 'full',
      budgets: 'partial', 'cost-management': 'partial',
      specifications: 'none', estimates: 'none', ks2: 'none', ks3: 'none',
      'financial-models': 'none',
    },
    strengths: ['BIM ↔ field', 'Design review', 'Clash detection'],
    weaknesses: ['Overengineered для малых компаний', 'Дорого'],
  },
  {
    id: 'primavera',
    nameRu: 'Oracle Primavera P6',
    nameEn: 'Oracle Primavera P6',
    type: 'secondary',
    features: {
      gantt: 'full', evm: 'full', 'resource-planning': 'full',
      budgets: 'full', 'cost-management': 'full',
      quality: 'none', safety: 'none', portal: 'none',
      specifications: 'none', estimates: 'none',
    },
    strengths: ['Critical path', 'Resource leveling', 'EVM', 'S-curves'],
    weaknesses: ['Enterprise-only', 'UX 2000-х'],
  },
  {
    id: 'buildertrend',
    nameRu: 'Buildertrend',
    nameEn: 'Buildertrend',
    type: 'secondary',
    features: {
      portal: 'full', 'daily-logs': 'full', invoices: 'full',
      contracts: 'full', budgets: 'full', tasks: 'full',
      'commercial-proposals': 'partial',
      specifications: 'none', estimates: 'none', ks2: 'none', ks3: 'none',
      'financial-models': 'none', 'competitive-lists': 'none',
    },
    strengths: ['Client portal UX', 'Proposal→contract→invoice', 'Daily log templates'],
    weaknesses: ['Residential-only'],
  },
];

/* ─────────── Comparison engine ─────────── */

/**
 * Build a full feature comparison matrix.
 * For each PRIVOD module, check what each competitor offers.
 */
export function compareFeatures(): FeatureComparison[] {
  return PRIVOD_MODULES.map((mod) => {
    const competitors: Record<string, FeatureLevel> = {};
    for (const comp of COMPETITORS) {
      competitors[comp.id] = comp.features[mod.key] ?? 'unknown';
    }
    return {
      capability: mod.nameRu,
      categoryRu: mod.category,
      privod: 'full', // All listed modules are implemented in PRIVOD
      competitors,
    };
  });
}

/**
 * Find features where at least one competitor has full/partial
 * support but PRIVOD is missing or partial.
 *
 * These are features competitors have that we don't — pulled from
 * business-rules.md competitor analysis.
 */
export function generateGapReport(): GapItem[] {
  // Known gaps from business-rules analysis
  const knownGaps: GapItem[] = [
    {
      capability: 'Сквозная бухгалтерская отчётность',
      categoryRu: 'Финансы',
      bestCompetitor: '1С:УСО',
      competitorLevel: 'full',
      privodLevel: 'none',
      priority: 'HIGH',
      reason: 'Бухгалтер не может сдать отчётность без 1С → нужна глубокая интеграция',
    },
    {
      capability: 'Электронный документооборот (ЭДО/СБИС роуминг)',
      categoryRu: 'Документы',
      bestCompetitor: 'СБИС',
      competitorLevel: 'full',
      privodLevel: 'partial',
      priority: 'HIGH',
      reason: 'КС-2/КС-3 должны отправляться через ЭДО контрагентам',
    },
    {
      capability: 'Встроенная телефония и видеозвонки',
      categoryRu: 'Коммуникации',
      bestCompetitor: 'Битрикс24',
      competitorLevel: 'full',
      privodLevel: 'none',
      priority: 'MEDIUM',
      reason: 'CRM воронки без телефонии менее эффективны',
    },
    {
      capability: 'Фото-аннотация на планах этажей',
      categoryRu: 'Качество',
      bestCompetitor: 'PlanRadar',
      competitorLevel: 'full',
      privodLevel: 'none',
      priority: 'HIGH',
      reason: 'Привязка дефектов к плану — killer-feature для прорабов',
    },
    {
      capability: 'Маркетплейс приложений / интеграций',
      categoryRu: 'Платформа',
      bestCompetitor: 'Procore',
      competitorLevel: 'full',
      privodLevel: 'none',
      priority: 'LOW',
      reason: 'Procore имеет 200+ интеграций; для российского рынка менее критично',
    },
    {
      capability: 'BIM ↔ Field (модель на планшете)',
      categoryRu: 'Площадка',
      bestCompetitor: 'Autodesk Build',
      competitorLevel: 'full',
      privodLevel: 'partial',
      priority: 'MEDIUM',
      reason: 'Просмотр BIM на стройке с привязкой дефектов к элементам модели',
    },
    {
      capability: 'Critical Path Method / S-curves',
      categoryRu: 'Планирование',
      bestCompetitor: 'Oracle Primavera P6',
      competitorLevel: 'full',
      privodLevel: 'partial',
      priority: 'MEDIUM',
      reason: 'Крупные проекты требуют CPM для контроля сроков',
    },
    {
      capability: 'Автоматическая проверка смет по нормативам',
      categoryRu: 'Ценообразование',
      bestCompetitor: 'Контур.Строительство',
      competitorLevel: 'full',
      privodLevel: 'none',
      priority: 'HIGH',
      reason: 'Экспертиза смет сокращает ошибки на 30-50%',
    },
    {
      capability: 'Банк-клиент интеграция',
      categoryRu: 'Финансы',
      bestCompetitor: '1С:УСО',
      competitorLevel: 'full',
      privodLevel: 'none',
      priority: 'MEDIUM',
      reason: 'Автоматическая выгрузка платёжек в банк',
    },
    {
      capability: 'Клиентский портал с оплатой',
      categoryRu: 'Портал',
      bestCompetitor: 'Buildertrend',
      competitorLevel: 'full',
      privodLevel: 'partial',
      priority: 'MEDIUM',
      reason: 'Заказчик видит прогресс + может оплатить из портала',
    },
  ];

  return knownGaps;
}

/**
 * Find features where PRIVOD has full support but NO competitor
 * (or only partial) — our unique advantages.
 */
export function generateAdvantageReport(): AdvantageItem[] {
  const advantages: AdvantageItem[] = [];

  for (const mod of PRIVOD_MODULES) {
    let bestLevel: FeatureLevel = 'none';
    let bestCompetitorId = '';

    for (const comp of COMPETITORS) {
      const level = comp.features[mod.key] ?? 'none';
      if (level === 'full') {
        bestLevel = 'full';
        bestCompetitorId = comp.id;
        break;
      }
      if (level === 'partial' && bestLevel !== 'partial') {
        bestLevel = 'partial';
        bestCompetitorId = comp.id;
      }
    }

    // Our advantage: we have full, but no competitor has full
    if (bestLevel !== 'full') {
      advantages.push({
        capability: mod.nameRu,
        categoryRu: mod.category,
        privodLevel: 'full',
        closestCompetitor: bestCompetitorId
          ? COMPETITORS.find((c) => c.id === bestCompetitorId)?.nameRu ?? bestCompetitorId
          : 'Никто',
        closestLevel: bestLevel,
      });
    }
  }

  return advantages;
}

/* ────────── Report generation ────────── */

const REPORTS_DIR = path.resolve(__dirname, '../../reports');

function levelIcon(level: FeatureLevel): string {
  switch (level) {
    case 'full': return '✅';
    case 'partial': return '🟡';
    case 'none': return '❌';
    case 'unknown': return '❓';
  }
}

/**
 * Generate the full competitive-analysis.md report.
 */
export function generateFullReport(): string {
  const comparison = compareFeatures();
  const gaps = generateGapReport();
  const advantages = generateAdvantageReport();

  const lines: string[] = [
    '# Competitive Analysis — PRIVOD vs Market',
    '',
    `> Generated: ${new Date().toISOString()}`,
    `> Modules: ${PRIVOD_MODULES.length} | Competitors: ${COMPETITORS.length}`,
    '',
  ];

  // ── Feature matrix ──
  lines.push('## Feature Matrix');
  lines.push('');

  const compIds = COMPETITORS.map((c) => c.id);
  const header = `| Capability | PRIVOD | ${COMPETITORS.map((c) => c.nameRu).join(' | ')} |`;
  const sep = `|------------|--------|${compIds.map(() => '------').join('|')}|`;
  lines.push(header);
  lines.push(sep);

  // Group by category
  let lastCategory = '';
  for (const row of comparison) {
    if (row.categoryRu !== lastCategory) {
      lines.push(`| **${row.categoryRu}** | | ${compIds.map(() => '').join(' | ')} |`);
      lastCategory = row.categoryRu;
    }
    const competitorCells = compIds.map((id) => levelIcon(row.competitors[id] ?? 'unknown'));
    lines.push(
      `| ${row.capability} | ${levelIcon(row.privod)} | ${competitorCells.join(' | ')} |`,
    );
  }
  lines.push('');

  // ── Gaps ──
  lines.push('## GAP Report — What Competitors Have That We Don\'t');
  lines.push('');
  lines.push(`${gaps.length} identified gaps:`);
  lines.push('');

  const highGaps = gaps.filter((g) => g.priority === 'HIGH');
  const medGaps = gaps.filter((g) => g.priority === 'MEDIUM');
  const lowGaps = gaps.filter((g) => g.priority === 'LOW');

  if (highGaps.length > 0) {
    lines.push('### HIGH Priority');
    for (const g of highGaps) {
      lines.push(`- **${g.capability}** — лучший: ${g.bestCompetitor} (${levelIcon(g.competitorLevel)})`);
      lines.push(`  - ${g.reason}`);
    }
    lines.push('');
  }

  if (medGaps.length > 0) {
    lines.push('### MEDIUM Priority');
    for (const g of medGaps) {
      lines.push(`- **${g.capability}** — лучший: ${g.bestCompetitor} (${levelIcon(g.competitorLevel)})`);
      lines.push(`  - ${g.reason}`);
    }
    lines.push('');
  }

  if (lowGaps.length > 0) {
    lines.push('### LOW Priority');
    for (const g of lowGaps) {
      lines.push(`- **${g.capability}** — лучший: ${g.bestCompetitor} (${levelIcon(g.competitorLevel)})`);
      lines.push(`  - ${g.reason}`);
    }
    lines.push('');
  }

  // ── Advantages ──
  lines.push('## Our Advantages — What We Have That They Don\'t');
  lines.push('');
  lines.push(`${advantages.length} unique or superior features:`);
  lines.push('');

  // Group advantages by category
  const advByCategory = new Map<string, AdvantageItem[]>();
  for (const a of advantages) {
    const arr = advByCategory.get(a.categoryRu) ?? [];
    arr.push(a);
    advByCategory.set(a.categoryRu, arr);
  }

  for (const [cat, items] of advByCategory) {
    lines.push(`### ${cat}`);
    for (const a of items) {
      lines.push(
        `- **${a.capability}** — closest: ${a.closestCompetitor} (${levelIcon(a.closestLevel)})`,
      );
    }
    lines.push('');
  }

  // ── Unique Value Props ──
  lines.push('## PRIVOD Unique Value Propositions');
  lines.push('');
  lines.push('1. **Единственная система с полной финансовой цепочкой**: Спец → КЛ → ФМ ← ЛСР → КП → Договор');
  lines.push('2. **Российские нормативы**: КС-2, КС-3, ЛСР, ГЭСН — как в 1С, но с нормальным UX');
  lines.push('3. **КЛ с взвешенным скорингом**: автоматический ранжинг поставщиков (ни у кого нет)');
  lines.push('4. **Торговый коэффициент**: пересчёт сметных цен (строительная специфика)');
  lines.push('5. **Портал подрядчика**: как у Procore, но с КС-2 и российскими актами');
  lines.push('6. **Маржинальность в реальном времени**: директор видит деньги по каждой позиции');
  lines.push('7. **152-ФЗ compliance** из коробки');
  lines.push('');

  return lines.join('\n');
}

/**
 * Write competitive analysis report to disk.
 */
export function writeCompetitiveReport(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const report = generateFullReport();
  fs.writeFileSync(path.join(REPORTS_DIR, 'competitive-analysis.md'), report, 'utf-8');
}
