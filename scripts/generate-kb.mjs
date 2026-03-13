#!/usr/bin/env node
/**
 * generate-kb.mjs — Генерация базы знаний из markdown файлов
 *
 * Читает docs/knowledge-base/ → генерирует JSON в frontend/public/kb/
 * Запуск: node scripts/generate-kb.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { createRequire } from 'module';
const require = createRequire(join(import.meta.dirname, '..', 'frontend', 'package.json'));
const { marked } = require('marked');

const ROOT = join(import.meta.dirname, '..');
const KB_DIR = join(ROOT, 'docs', 'knowledge-base');
const BY_MODULE_DIR = join(KB_DIR, 'by-module');
const WORKFLOWS_DIR = join(KB_DIR, 'workflows');
const OUT_DIR = join(ROOT, 'frontend', 'public', 'kb');
const ARTICLES_DIR = join(OUT_DIR, 'articles');

// ─── Category mapping (filename → category) ───
const CATEGORY_MAP = {
  // Getting Started
  'onboarding': 'getting-started',
  '00-system-map': 'getting-started',
  'mobile': 'getting-started',

  // Finance
  'budgets': 'finance',
  'invoices': 'finance',
  'payments': 'finance',
  'cash-flow': 'finance',
  'financial-model': 'finance',
  'revenue': 'finance',
  'accounting': 'finance',
  'cost-management': 'finance',
  'pricing-database': 'finance',
  'price-coefficients': 'finance',
  'tax-risk': 'finance',
  'monte-carlo': 'finance',

  // Estimates & Pricing
  'estimates': 'estimates',
  'specifications': 'estimates',
  'competitive-lists': 'estimates',
  'commercial-proposals': 'estimates',

  // HR
  'employees': 'hr',
  'timesheets': 'hr',
  'crews': 'hr',
  'leave': 'hr',
  'payroll': 'hr',
  'recruitment': 'hr',
  'self-employed': 'hr',
  'hr-russian': 'hr',

  // Safety
  'safety-incidents': 'safety',
  'safety-inspections': 'safety',
  'safety-trainings': 'safety',
  'ppe': 'safety',
  'accident-acts': 'safety',
  'sout': 'safety',

  // Construction
  'ks2': 'construction',
  'ks3': 'construction',
  'planning': 'construction',
  'bim': 'construction',
  'closeout': 'construction',
  'executive-docs': 'construction',
  'field-docs': 'construction',
  'change-orders': 'construction',
  'design': 'construction',
  'daily-log': 'construction',
  'work-orders': 'construction',

  // Warehouse & Procurement
  'warehouse': 'warehouse',
  'materials': 'warehouse',
  'stock-movements': 'warehouse',
  'purchase-orders': 'warehouse',
  'dispatch': 'warehouse',

  // Quality
  'quality-inspections': 'quality',
  'non-conformance': 'quality',
  'defects': 'quality',
  'punch-list': 'quality',
  'submittals': 'quality',
  'rfi': 'quality',
  'site-assessment': 'quality',
  'maintenance': 'quality',

  // CRM & Portal
  'crm-leads': 'crm',
  'crm-contacts': 'crm',
  'portfolio': 'crm',
  'prequalification': 'crm',
  'client-portal': 'crm',
  'support-tickets': 'crm',

  // Documents & Communication
  'documents': 'documents',
  'messaging': 'documents',
  'email': 'documents',
  'digital-signature': 'documents',
  'edo': 'documents',
  'calendar': 'documents',
  'notifications': 'documents',

  // Integrations & Settings
  'integrations': 'integrations',
  'marketplace': 'integrations',
  'subscriptions': 'integrations',
  'data-exchange': 'integrations',
  'monitoring': 'integrations',
  'fleet': 'integrations',

  // Settings
  'settings': 'settings',
  'users-roles': 'settings',
  'regulatory': 'settings',
  'legal': 'settings',

  // Analytics & AI
  'analytics': 'analytics',
  'dashboards': 'analytics',
  'ai-assistant': 'analytics',
  'tasks': 'analytics',
  'contracts': 'analytics',
  'projects': 'analytics',
};

// Override: some articles belong to more specific categories
const CATEGORY_OVERRIDES = {
  'projects': 'getting-started',
  'tasks': 'getting-started',
  'contracts': 'getting-started',
};

const SCREENSHOTS_DIR = join(KB_DIR, 'screenshots');

// Mapping article slug → screenshot subdirectory name(s)
const SCREENSHOT_DIR_MAP = {
  'accounting': ['accounting'],
  'analytics': ['analytics'],
  'bim': ['bim'],
  'budgets': ['finance'],
  'calendar': ['calendar'],
  'cash-flow': ['finance'],
  'change-orders': ['change-management'],
  'client-portal': ['portal'],
  'closeout': ['closeout'],
  'commercial-proposals': ['finance'],
  'competitive-lists': ['specifications'],
  'contracts': ['contracts'],
  'cost-management': ['cost-management'],
  'crews': ['hr'],
  'crm-contacts': ['counterparties', 'crm'],
  'crm-leads': ['crm'],
  'daily-log': ['daily-log'],
  'defects': ['defects'],
  'design': ['design'],
  'digital-signature': ['kep'],
  'dispatch': ['dispatch'],
  'documents': ['documents', 'cde'],
  'edo': ['integrations'],
  'email': ['email'],
  'employees': ['hr'],
  'estimates': ['estimates'],
  'executive-docs': ['exec-docs'],
  'field-docs': ['exec-docs'],
  'financial-model': ['finance'],
  'fleet': ['fleet'],
  'integrations': ['integrations', '1c', 'isup'],
  'invoices': ['finance'],
  'ks2': ['closing', 'closing-advanced'],
  'ks3': ['closing', 'closing-advanced'],
  'leave': ['leave'],
  'maintenance': ['maintenance'],
  'marketplace': ['integrations'],
  'materials': ['warehouse'],
  'messaging': ['messaging'],
  'monitoring': ['iot'],
  'non-conformance': ['quality'],
  'onboarding': ['onboarding'],
  'payroll': ['hr-advanced'],
  'payments': ['finance'],
  'planning': ['planning'],
  'portfolio': ['portfolio'],
  'ppe': ['safety'],
  'prequalification': ['prequalification'],
  'pricing-database': ['pricing'],
  'projects': ['projects'],
  'punch-list': ['defects'],
  'purchase-orders': ['procurement'],
  'quality-inspections': ['quality'],
  'recruitment': ['hr-advanced'],
  'regulatory': ['regulatory'],
  'revenue': ['finance-advanced'],
  'rfi': ['rfi'],
  'safety-incidents': ['safety'],
  'safety-inspections': ['safety'],
  'safety-trainings': ['safety'],
  'settings': ['settings'],
  'site-assessment': ['prequalification'],
  'specifications': ['specifications'],
  'stock-movements': ['warehouse'],
  'submittals': ['submittals'],
  'subscriptions': ['subscription'],
  'support-tickets': ['support'],
  'tasks': ['tasks'],
  'timesheets': ['hr'],
  'users-roles': ['settings'],
  'warehouse': ['warehouse', 'warehouse-advanced'],
  'work-orders': ['operations'],
  'ai-assistant': ['ai'],
  'data-exchange': ['data-exchange'],
  'self-employed': ['self-employed'],
  'sout': ['safety'],
  'accident-acts': ['safety'],
};

// Russian translations for screenshot filenames
const SCREENSHOT_LABELS = {
  'dashboard': 'Дашборд',
  'list': 'Список',
  'create': 'Создание',
  'detail': 'Детали',
  'chart-of-accounts': 'План счетов',
  'journal-entries': 'Проводки',
  'journals': 'Журналы',
  'fixed-assets': 'Основные средства',
  'list-projects': 'Список объектов',
  'create-project': 'Создание объекта',
  'list-estimates': 'Список смет',
  'import-lsr': 'Импорт ЛСР',
  'minstroy-index': 'Индексы Минстроя',
  'list-specifications': 'Список спецификаций',
  'create-specification': 'Создание спецификации',
  'competitive-registry': 'Реестр конкурентных листов',
  'list-budgets': 'Бюджеты',
  'create-budget': 'Создание бюджета',
  'financial-models': 'Финансовые модели',
  'list-cp': 'Коммерческие предложения',
  'create-cp': 'Создание КП',
  'list-invoices': 'Счета',
  'create-invoice': 'Создание счёта',
  'list-payments': 'Оплаты',
  'create-payment': 'Создание оплаты',
  'cash-flow': 'Движение денег',
  'list-ks2': 'Список КС-2',
  'create-ks2': 'Создание КС-2',
  'list-ks3': 'Список КС-3',
  'create-ks3': 'Создание КС-3',
  'ks6a-journal': 'Журнал КС-6а',
  'list-materials': 'Материалы',
  'create-material': 'Создание материала',
  'stock': 'Остатки на складе',
  'movements': 'Движение материалов',
  'inventory': 'Инвентаризация',
  'm29-report': 'Отчёт М-29',
  'list-requests': 'Заявки на закупку',
  'create-request': 'Создание заявки',
  'list-po': 'Заказы на закупку',
  'create-po': 'Создание заказа',
  'list-employees': 'Сотрудники',
  'create-employee': 'Создание сотрудника',
  'crew': 'Бригады',
  'list-timesheets': 'Табели',
  'create-timesheet': 'Создание табеля',
  'leave-board': 'Доска отпусков',
  'leave-allocations': 'Баланс отпусков',
  'list-incidents': 'Инциденты',
  'create-incident': 'Создание инцидента',
  'list-inspections': 'Проверки',
  'create-inspection': 'Создание проверки',
  'list-trainings': 'Инструктажи',
  'ppe-management': 'Средства защиты (СИЗ)',
  'list-defects': 'Дефекты',
  'create-defect': 'Создание дефекта',
  'defect-pareto': 'Парето дефектов',
  'defect-dashboard': 'Дашборд дефектов',
  'list-quality': 'Проверки качества',
  'punch-items': 'Замечания',
  'punch-dashboard': 'Дашборд замечаний',
  'list-ncr': 'Несоответствия (NCR)',
  'list-submittals': 'Сабмитталы',
  'list-rfis': 'Запросы информации (RFI)',
  'list-documents': 'Документы',
  'documents': 'Документы',
  'transmittals': 'Трансмитталы',
  'list-contracts': 'Договоры',
  'create-contract': 'Создание договора',
  'board-contracts': 'Доска договоров',
  'list-events': 'События изменений',
  'list-orders': 'Доп. соглашения',
  'board-orders': 'Доска доп. соглашений',
  'create-order': 'Создание доп. соглашения',
  'list-leads': 'Лиды',
  'kanban-leads': 'Канбан лидов',
  'list-contacts': 'Контрагенты',
  'create-contact': 'Создание контрагента',
  'list-models': 'BIM модели',
  'clash-detection': 'Поиск коллизий',
  'design-packages': 'Пакеты проектирования',
  'construction-progress': 'Ход строительства',
  'bcf-issues': 'BCF замечания',
  'commissioning': 'Пусконаладка',
  'handover': 'Передача объекта',
  'warranty': 'Гарантии',
  'zos': 'ЗОС',
  'stroynadzor': 'Пакет стройнадзора',
  'as-built': 'Исполнительная документация',
  'gantt': 'Диаграмма Ганта',
  'calendar': 'Календарь',
  'kanban-tasks': 'Канбан задач',
  'list-tasks': 'Список задач',
  'list-vehicles': 'Транспорт',
  'fuel': 'Топливо и ГСМ',
  'list-dispatches': 'Отгрузки',
  'tracking': 'Отслеживание',
  'settings-main': 'Настройки системы',
  'users-admin': 'Пользователи',
  'permissions': 'Права доступа',
  'admin-dashboard': 'Дашборд администратора',
  'assistant': 'AI-ассистент',
  'reports': 'Отчёты',
  'kpi': 'KPI',
  'kpi-achievements': 'Достижения KPI',
  'executive-kpi': 'KPI руководителя',
  'report-builder': 'Конструктор отчётов',
  'list-packages': 'Тендерные пакеты',
  'list-versions': 'Версии проекта',
  'sections': 'Разделы',
  'reviews': 'Рецензии',
  'budget-overview': 'Обзор бюджета',
  'commitments': 'Обязательства',
  'forecast': 'Прогноз',
  'cost-codes': 'Коды затрат',
  'portal-dashboard': 'Дашборд портала',
  'portal-projects': 'Объекты (портал)',
  'portal-documents': 'Документы (портал)',
  'ks-export': 'Экспорт КС в 1С',
  'contractors': 'Подрядчики',
  'payments': 'Оплаты',
  'registries': 'Реестры',
  'ks2-pipeline': 'Конвейер КС-2',
  'ks2-approvals': 'Согласование КС-2',
  'correction-acts': 'Корректировочные акты',
  'limit-fence-cards': 'Лимитно-заборные карты',
  'barcode-scanner': 'Сканер штрих-кодов',
  'address-storage': 'Адресное хранение',
  'material-demand': 'Потребность в материалах',
  'stock-alerts': 'Оповещения по остаткам',
  'stock-limits': 'Лимиты запасов',
  'locations': 'Ячейки хранения',
  'orders': 'Заказы',
  'messaging': 'Мессенджер',
  'email-inbox': 'Почта',
  'main-dashboard': 'Главный дашборд',

  // --- Auto-generated: missing screenshot labels ---
  '1c': 'Интеграция 1С',
  '1c-config': 'Настройка 1С',
  'accident-n1': 'Акт Н-1 (несчастный случай)',
  'admin': 'Администрирование',
  'alerts': 'Оповещения',
  'allocations': 'Распределение отпусков',
  'aosr': 'Акты АОСР',
  'approval-inbox': 'Входящие на согласование',
  'audit-logs': 'Журнал аудита',
  'bank-statement': 'Банковская выписка',
  'bdds': 'БДДС (бюджет движения денежных средств)',
  'board': 'Канбан-доска',
  'board-applicants': 'Доска кандидатов',
  'board-rfis': 'Доска RFI',
  'board-tasks': 'Доска задач',
  'calculate': 'Расчёт зарплаты',
  'cases': 'Судебные дела',
  'catalog': 'Каталог маркетплейса',
  'center': 'Центр помощи',
  'certificates': 'Сертификаты',
  'certification-matrix': 'Матрица аттестаций',
  'checklist-templates': 'Шаблоны чек-листов',
  'checklists': 'Чек-листы',
  'compliance': 'Соответствие требованиям',
  'config': 'Конфигурация',
  'contracts': 'Договоры',
  'create-briefing': 'Создание инструктажа',
  'create-counterparty': 'Создание контрагента',
  'create-document': 'Создание документа',
  'create-issue': 'Создание замечания',
  'create-lead': 'Создание лида',
  'create-rfi': 'Создание RFI',
  'create-submittal': 'Создание сабмиттала',
  'create-training': 'Создание обучения',
  'create-waybill': 'Создание путевого листа',
  'defect-register': 'Реестр дефектов',
  'designer': 'Конструктор бизнес-процессов',
  'devices': 'Устройства IoT',
  'dispatch-calendar': 'Календарь диспетчеризации',
  'employment-contracts': 'Трудовые договоры',
  'equipment': 'Оборудование',
  'evm': 'Метод освоенного объёма (EVM)',
  'export': 'Экспорт данных',
  'factoring': 'Факторинг',
  'fuel-accounting': 'Учёт ГСМ',
  'global': 'Глобальный поиск',
  'gps-tracking': 'GPS-трекинг',
  'hidden-work-acts': 'Акты скрытых работ',
  'import': 'Импорт данных',
  'incoming-control': 'Входной контроль',
  'inspections': 'Проверки надзорных органов',
  'instances': 'Экземпляры процессов',
  'integrations': 'Интеграции',
  'invoices': 'Счета на оплату',
  'jobs': 'Вакансии',
  'journal': 'Журнал работ',
  'ks2-generator': 'Генератор КС-2',
  'ks3-generator': 'Генератор КС-3',
  'ks6': 'Журнал КС-6',
  'lab-tests': 'Лабораторные испытания',
  'leads': 'Лиды CRM',
  'licenses': 'Лицензии',
  'list-applicants': 'Список кандидатов',
  'list-briefings': 'Список инструктажей',
  'list-codes': 'Список кодов затрат',
  'list-counterparties': 'Список контрагентов',
  'list-issues': 'Список замечаний',
  'list-items': 'Список замечаний (пунч-лист)',
  'list-training': 'Список обучений',
  'm29': 'Отчёт М-29',
  'mail': 'Электронная почта',
  'main': 'Главный экран',
  'maintenance': 'Техническое обслуживание',
  'maintenance-schedule': 'График ТО',
  'material-inspection': 'Входной контроль материалов',
  'messages': 'Сообщения',
  'metrics': 'Метрики безопасности',
  'opportunities': 'Возможности (тендеры)',
  'periods': 'Отчётные периоды',
  'permits': 'Разрешения на строительство',
  'personnel-orders': 'Кадровые приказы',
  'ppe': 'Средства индивидуальной защиты (СИЗ)',
  'prescriptions': 'Предписания надзорных органов',
  'pricing-calculator': 'Калькулятор расценок',
  'pricing-databases': 'Базы расценок',
  'pricing-rates': 'Тарифы и расценки',
  'profile': 'Профиль пользователя',
  'profitability': 'Рентабельность',
  'projects': 'Объекты (портал)',
  'qualifications': 'Квалификации сотрудников',
  'quality-gates': 'Контрольные точки качества',
  'requests': 'Заявки на обслуживание',
  'resources': 'Ресурсное планирование',
  'routes': 'Маршруты доставки',
  's-curve': 'S-кривая',
  'schedule': 'Расписание',
  'security': 'Безопасность учётной записи',
  'sensors': 'Датчики IoT',
  'setup': 'Начальная настройка',
  'signing': 'Подписание ЭЦП',
  'sout': 'СОУТ (спецоценка условий труда)',
  'special-journals': 'Специальные журналы работ',
  'sro-licenses': 'Допуски СРО',
  'staffing': 'Штатное расписание',
  'staffing-schedule': 'График штатного расписания',
  'subscription': 'Управление подпиской',
  'system-settings': 'Системные настройки',
  'tasks': 'Задачи (портал)',
  'tax-calendar': 'Налоговый календарь',
  'telegram': 'Интеграция с Telegram',
  'templates': 'Шаблоны',
  'tenders': 'Тендеры',
  'tickets': 'Тикеты поддержки',
  'timesheet-t13': 'Табель Т-13',
  'timesheets': 'Табели учёта рабочего времени',
  'tolerance-rules': 'Допуски и правила качества',
  'transmissions': 'Передача данных в ИСУП',
  'treasury-calendar': 'Казначейский календарь',
  'verification': 'Проверка ЭЦП',
  'violations': 'Нарушения ОТ и ТБ',
  'waybills': 'Путевые листы',
  'welding': 'Журнал сварочных работ',
  'work-orders': 'Наряд-заказы',
  'work-orders-board': 'Доска наряд-заказов',
  'work-permits': 'Наряд-допуски',
  'work-volumes': 'Объёмы работ',
};

function translateScreenshotName(filename) {
  const name = filename.replace(/\.\w+$/, '');
  if (SCREENSHOT_LABELS[name]) return SCREENSHOT_LABELS[name];
  // Fallback: transliterate common patterns
  return name.replace(/[-_]/g, ' ');
}

// Get screenshots for an article slug
function getScreenshots(slug) {
  const dirs = SCREENSHOT_DIR_MAP[slug] || [slug];
  const screenshots = [];
  for (const dir of dirs) {
    const dirPath = join(SCREENSHOTS_DIR, dir);
    if (existsSync(dirPath)) {
      const files = readdirSync(dirPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));
      for (const file of files.sort()) {
        screenshots.push({
          src: `/kb/screenshots/${dir}/${file}`,
          alt: translateScreenshotName(file),
        });
      }
    }
  }
  return screenshots;
}

// Inject screenshots gallery into HTML after first section
function injectScreenshots(html, screenshots) {
  if (screenshots.length === 0) return html;

  const gallery = screenshots.map(s =>
    `<figure style="margin:1rem 0;break-inside:avoid">` +
    `<a href="${s.src}" target="_blank" rel="noopener" style="display:block;cursor:zoom-in">` +
    `<img loading="lazy" src="${s.src}" alt="${s.alt}" style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:100%;height:auto;transition:transform 0.2s;border:1px solid #e2e8f0" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" />` +
    `</a>` +
    `<figcaption style="text-align:center;font-size:0.8rem;color:#64748b;margin-top:0.5rem;font-weight:500">${s.alt}</figcaption>` +
    `</figure>`
  ).join('\n');

  const galleryHtml = `<div style="margin:2rem 0;padding:1.5rem;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:16px;border:1px solid #e2e8f0">\n<h3 style="margin-top:0;margin-bottom:1rem;font-size:1.1rem;font-weight:600">Скриншоты модуля</h3>\n<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem">\n${gallery}\n</div>\n</div>`;

  // Insert before the second h2 (after initial description)
  const firstH2End = html.indexOf('</h2>');
  const secondH2 = firstH2End > 0 ? html.indexOf('<h2', firstH2End + 5) : -1;
  if (secondH2 > 0) {
    return html.slice(0, secondH2) + galleryHtml + '\n' + html.slice(secondH2);
  }
  // If no second h2, append at end
  return html + '\n' + galleryHtml;
}

// ─── Russian→Latin transliteration for heading IDs ───
const TRANSLIT_MAP = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
  'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
  'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
  'ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
};

function slugify(text) {
  return text
    .toLowerCase()
    .split('')
    .map(ch => TRANSLIT_MAP[ch] !== undefined ? TRANSLIT_MAP[ch] : ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Generate Table of Contents from h2 headings ───
function generateToc(html) {
  const h2Regex = /<h2([^>]*)>(.*?)<\/h2>/gi;
  const headings = [];
  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    headings.push({ text, id: slugify(text) });
  }

  // Only generate TOC for 3+ headings
  if (headings.length < 3) return html;

  // Add id attributes to each h2
  let idx = 0;
  html = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (full, attrs, inner) => {
    const heading = headings[idx++];
    // If there's already an id, replace it; otherwise add one
    if (/\bid=/.test(attrs)) {
      attrs = attrs.replace(/\bid="[^"]*"/, `id="${heading.id}"`);
    } else {
      attrs = ` id="${heading.id}"` + attrs;
    }
    return `<h2${attrs}>${inner}</h2>`;
  });

  // Build TOC HTML
  const tocItems = headings.map(h =>
    `    <li><a href="#${h.id}">${h.text}</a></li>`
  ).join('\n');

  const tocHtml = `<nav class="kb-toc">\n  <div class="kb-toc-title">\u0421\u043e\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435</div>\n  <ul>\n${tocItems}\n  </ul>\n</nav>\n`;

  // Insert TOC before the first h2
  const firstH2Pos = html.search(/<h2[\s>]/i);
  if (firstH2Pos > 0) {
    html = html.slice(0, firstH2Pos) + tocHtml + html.slice(firstH2Pos);
  } else {
    html = tocHtml + html;
  }

  return html;
}

// ─── Parse markdown file ───
function parseArticle(filePath, type = 'article') {
  const raw = readFileSync(filePath, 'utf-8');
  const slug = basename(filePath, '.md');

  // Extract title from first # heading
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Extract excerpt: first paragraph after title (skip --- separators)
  const lines = raw.split('\n');
  let excerpt = '';
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith('# ')) { foundTitle = true; continue; }
    if (!foundTitle) continue;
    if (line.trim() === '---') continue;
    if (line.trim() === '') continue;
    if (line.startsWith('#')) break;
    // Skip markdown formatting for excerpt
    excerpt = line.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    if (excerpt.length > 20) break;
  }

  // Calculate read time (avg 200 words/min for Russian)
  const wordCount = raw.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  // Extract tags from content (key terms)
  const tags = extractTags(raw, slug);

  // Extract related articles from "Связь с другими модулями" section
  const related = extractRelated(raw);

  // Convert markdown to HTML
  let html = marked.parse(raw, { gfm: true, breaks: false });

  // Fix image paths: ../screenshots/X → /kb/screenshots/X
  html = html.replace(/src="\.\.\/screenshots\//g, 'src="/kb/screenshots/');
  html = html.replace(/src="screenshots\//g, 'src="/kb/screenshots/');
  // Strip leading <h1> + first <hr> (they duplicate the React page header)
  html = html.replace(/^<h1[^>]*>.*?<\/h1>\s*/s, '');
  html = html.replace(/^\s*<hr>\s*/, '');

  // Generate Table of Contents (for articles with 3+ h2 headings)
  html = generateToc(html);

  // Add loading=lazy and styling to all images
  html = html.replace(/<img /g, '<img loading="lazy" class="kb-screenshot" ');

  // Inject screenshots from screenshots/ directory
  const screenshots = getScreenshots(slug);
  html = injectScreenshots(html, screenshots);

  // Determine category
  const category = CATEGORY_OVERRIDES[slug] || CATEGORY_MAP[slug] || 'other';

  return {
    slug,
    title,
    category,
    type,
    excerpt,
    readTime,
    tags,
    related,
    html,
    wordCount,
  };
}

// ─── Extract tags from content ───
function extractTags(content, slug) {
  const tags = new Set();
  tags.add(slug.replace(/-/g, ' '));

  // Extract bold terms (likely key concepts)
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g) || [];
  for (const m of boldMatches.slice(0, 10)) {
    const term = m.replace(/\*\*/g, '').toLowerCase().trim();
    if (term.length > 2 && term.length < 40) tags.add(term);
  }

  // Extract section headings
  const headingMatches = content.match(/^##\s+(.+)$/gm) || [];
  for (const h of headingMatches) {
    const term = h.replace(/^##\s+/, '').toLowerCase().trim();
    if (term.length > 2 && term.length < 50) tags.add(term);
  }

  return [...tags].slice(0, 15);
}

// ─── Extract related article slugs ───
function extractRelated(content) {
  const related = [];
  const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\.md\)/g) || [];
  for (const m of linkMatches) {
    const slugMatch = m.match(/\(([^)]+)\.md\)/);
    if (slugMatch) {
      const relSlug = basename(slugMatch[1]);
      if (!related.includes(relSlug)) related.push(relSlug);
    }
  }
  return related;
}

// ─── Main ───
function main() {
  console.log('📖 Generating knowledge base...\n');

  mkdirSync(ARTICLES_DIR, { recursive: true });

  const index = [];
  const allArticles = [];

  // Process by-module articles
  if (existsSync(BY_MODULE_DIR)) {
    const files = readdirSync(BY_MODULE_DIR).filter(f => f.endsWith('.md'));
    console.log(`  📂 by-module/: ${files.length} files`);

    for (const file of files) {
      const article = parseArticle(join(BY_MODULE_DIR, file), 'article');
      allArticles.push(article);

      // Write individual article JSON (with HTML)
      writeFileSync(
        join(ARTICLES_DIR, `${article.slug}.json`),
        JSON.stringify({
          slug: article.slug,
          title: article.title,
          category: article.category,
          type: article.type,
          excerpt: article.excerpt,
          readTime: article.readTime,
          tags: article.tags,
          related: article.related,
          html: article.html,
        }, null, 0) // no pretty-print for smaller files
      );

      // Add to index (without HTML)
      index.push({
        slug: article.slug,
        title: article.title,
        category: article.category,
        type: article.type,
        excerpt: article.excerpt,
        readTime: article.readTime,
        tags: article.tags,
        related: article.related,
      });
    }
  }

  // Process workflow files
  if (existsSync(WORKFLOWS_DIR)) {
    const files = readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.md'));
    console.log(`  📂 workflows/: ${files.length} files`);

    for (const file of files) {
      const article = parseArticle(join(WORKFLOWS_DIR, file), 'workflow');
      article.category = 'workflows';
      allArticles.push(article);

      writeFileSync(
        join(ARTICLES_DIR, `${article.slug}.json`),
        JSON.stringify({
          slug: article.slug,
          title: article.title,
          category: 'workflows',
          type: 'workflow',
          excerpt: article.excerpt,
          readTime: article.readTime,
          tags: article.tags,
          related: article.related,
          html: article.html,
        }, null, 0)
      );

      index.push({
        slug: article.slug,
        title: article.title,
        category: 'workflows',
        type: 'workflow',
        excerpt: article.excerpt,
        readTime: article.readTime,
        tags: article.tags,
        related: article.related,
      });
    }
  }

  // Process special files (FAQ, role navigator)
  const specialFiles = [
    { path: join(KB_DIR, 'faq.md'), type: 'faq' },
    { path: join(KB_DIR, 'by-role-navigator.md'), type: 'role-navigator' },
  ];

  for (const { path, type } of specialFiles) {
    if (existsSync(path)) {
      const article = parseArticle(path, type);
      article.category = 'getting-started';
      allArticles.push(article);

      writeFileSync(
        join(ARTICLES_DIR, `${article.slug}.json`),
        JSON.stringify({
          slug: article.slug,
          title: article.title,
          category: 'getting-started',
          type,
          excerpt: article.excerpt,
          readTime: article.readTime,
          tags: article.tags,
          related: article.related,
          html: article.html,
        }, null, 0)
      );

      index.push({
        slug: article.slug,
        title: article.title,
        category: 'getting-started',
        type,
        excerpt: article.excerpt,
        readTime: article.readTime,
        tags: article.tags,
        related: article.related,
      });
    }
  }

  // Write main index
  writeFileSync(
    join(OUT_DIR, 'index.json'),
    JSON.stringify(index, null, 2)
  );

  // Build search index (lightweight: title + excerpt + tags flattened)
  const searchIndex = index.map(a => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
    type: a.type,
    excerpt: a.excerpt,
    readTime: a.readTime,
    searchText: [a.title, a.excerpt, ...a.tags].join(' ').toLowerCase(),
  }));

  writeFileSync(
    join(OUT_DIR, 'search-index.json'),
    JSON.stringify(searchIndex, null, 0)
  );

  // Stats
  const cats = {};
  for (const a of index) {
    cats[a.category] = (cats[a.category] || 0) + 1;
  }

  console.log(`\n  ✅ Generated ${index.length} articles:`);
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat}: ${count}`);
  }
  console.log(`\n  📁 Output: frontend/public/kb/`);
  console.log(`     index.json (${(JSON.stringify(index).length / 1024).toFixed(1)} KB)`);
  console.log(`     search-index.json`);
  console.log(`     articles/*.json (${allArticles.length} files)`);
  console.log('\n  Done! 🎉\n');
}

main();
