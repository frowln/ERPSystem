import {
  Home,
  FolderKanban,
  FileSignature,
  Calculator,
  ClipboardList,
  MessageSquare,
  CalendarDays,
  FileText,
  FolderOpen,
  FileCheck,
  ArrowLeftRight,
  Banknote,
  Wallet,
  Receipt,
  CreditCard,
  TrendingDown,
  Target,
  Briefcase,
  Scale,
  ShoppingCart,
  Warehouse,
  Boxes,
  ClipboardCheck,
  BookOpen,
  ListOrdered,
  Users,
  Clock,
  HardHat,
  UserPlus,
  Calendar,
  ShieldCheck,
  ListChecks,
  Award,
  Search,
  Truck,
  Wrench,
  Fuel,
  AlertTriangle,
  CheckSquare,
  Send,
  Shield,
  LifeBuoy,
  BarChart3,
  FileBarChart,
  TrendingUp,
  Activity,
  Settings,
  UserCog,
  Plug,
  Bell,
  MessageCircle,
  Key,
  LayoutDashboard,
  Layers,
  FolderTree,
  Bug,
  Building2,
  Sparkles,
  Mail,
  Package,
  GraduationCap,
  Hammer,
  FileOutput,
  Sigma,
  Workflow,
  GitBranch,
  Landmark,
  PieChart,
  Cpu,
  MapPin,
  Gavel,
  Construction,
  Handshake,
  ClipboardPenLine,
  Scroll,
  NotebookPen,
  CheckCheck,
  Milestone,
  Ruler,
  Inbox,
  Database,
  Download,
  Upload,
  ScanLine,
  Shuffle,
  FlaskConical,
  Gauge,
  FileDown,
  FileUp,
  Dice5,
  FileSpreadsheet,
  CircleDollarSign,
  CalendarClock,
  CalendarRange,
  Percent,
  PenLine,
  StickyNote,
  Crosshair,
  ThermometerSun,
  Kanban,
  FilePieChart,
  Radar,
  ScrollText,
  User,
  Phone,
  Star,
  Smartphone,
  Zap,
  FileQuestion,
  UserCheck,
  Clipboard,
} from 'lucide-react';
import type React from 'react';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Helpers — use getters so t() is called at access time (locale-aware)
// ---------------------------------------------------------------------------

function navGroup(id: string, icon: React.ElementType, items: NavItem[]): NavGroup {
  return {
    get title() { return t(`navigation.groups.${id}`); },
    id,
    icon,
    items,
  };
}

function navItem(id: string, icon: React.ElementType, href: string, badge?: number): NavItem {
  const item: NavItem = {
    get label() { return t(`navigation.items.${id}`); },
    id,
    icon,
    href,
  };
  if (badge !== undefined) item.badge = badge;
  return item;
}

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

export const navigation: NavGroup[] = [
  // ── Главная ────────────────────────────────────────────────────────────
  navGroup('home', Home, [
    navItem('dashboard', Home, '/'),
    navItem('an-dashboards', BarChart3, '/analytics'),
    navItem('an-reports', FileBarChart, '/reports'),
  ]),

  // ── Задачи (плоский раздел — переключатель режимов внутри) ──────────────
  navGroup('tasks', Activity, [
    navItem('pm-tasks', Activity, '/tasks'),
  ]),

  // ── Календарь (самостоятельный раздел) ────────────────────────────────
  navGroup('calendar', Calendar, [
    navItem('pm-calendar', Calendar, '/calendar'),
  ]),

  // ── Планирование ────────────────────────────────────────────────────────
  navGroup('planning', CalendarDays, [
    navItem('pm-gantt', CalendarDays, '/planning/gantt'),
    navItem('pm-evm', TrendingUp, '/planning/evm'),
    navItem('pm-resources', Users, '/planning/resource-planning'),
    navItem('pm-work-volumes', Gauge, '/planning/work-volumes'),
  ]),

  // ── Процессы ────────────────────────────────────────────────────────────
  navGroup('processes', Workflow, [
    navItem('pm-rfis', FileQuestion, '/pm/rfis'),
    navItem('pm-submittals', Send, '/pm/submittals'),
    navItem('pm-issues', Bug, '/pm/issues'),
    navItem('pm-workflows', Workflow, '/workflow/templates'),
    navItem('pm-approval-inbox', Inbox, '/workflow/approval-inbox'),
    navItem('pm-change-mgmt', Shuffle, '/change-management/dashboard'),
  ]),

  // ── Объекты ──────────────────────────────────────────────────────────
  navGroup('projects', FolderKanban, [
    navItem('projects-list', FolderKanban, '/projects'),
    navItem('site-assessments', Search, '/site-assessments'),
  ]),

  // ── Продажи ─────────────────────────────────────────────────────────
  navGroup('sales', Briefcase, [
    navItem('crm-leads', Target, '/crm/leads'),
    navItem('crm-dashboard', LayoutDashboard, '/crm/dashboard'),
    navItem('counterparties', Building2, '/counterparties'),
    navItem('fin-commercial-proposals', FileText, '/commercial-proposals'),
    navItem('portfolio-health', BarChart3, '/portfolio/health'),
    navItem('fin-opportunities', Briefcase, '/portfolio/opportunities'),
    navItem('portfolio-tenders', Briefcase, '/portfolio/tenders'),
    navItem('bid-packages', Package, '/bid-packages'),
  ]),

  // ── Документы ──────────────────────────────────────────────────────────
  navGroup('documents', FileText, [
    navItem('doc-list', FileText, '/documents'),
    navItem('doc-smart-recognition', Sparkles, '/documents/smart-recognition'),
    navItem('cde-docs', FolderOpen, '/cde/documents'),
    navItem('cde-transmittals', Send, '/cde/transmittals'),
    navItem('pto-docs', ClipboardList, '/pto/documents'),
    navItem('pto-hidden-work', NotebookPen, '/pto/hidden-work-acts'),
    navItem('pto-permits', FileCheck, '/pto/work-permits'),
    navItem('pto-lab', FlaskConical, '/pto/lab-tests'),
    navItem('pto-ks6-calendar', CalendarDays, '/pto/ks6-calendar'),
    navItem('pto-itd-validation', ShieldCheck, '/pto/itd-validation'),
    navItem('russian-ks2', FileCheck, '/russian-docs/ks2'),
    navItem('russian-ks3', FileCheck, '/russian-docs/ks3'),
    navItem('russian-edo', FileOutput, '/russian-docs/edo'),
    navItem('russian-docs', FileText, '/russian-docs/list'),
    navItem('russian-sbis', FileText, '/russian-docs/sbis'),
    navItem('data-import', Download, '/data-exchange/import'),
    navItem('data-export', Upload, '/data-exchange/export'),
    navItem('data-mapping', ArrowLeftRight, '/data-exchange/mapping'),
    navItem('data-1c-config', Settings, '/data-exchange/1c-config'),
    navItem('data-1c-logs', ScrollText, '/data-exchange/1c-logs'),
  ]),

  // ── Проектирование (ПИР) ──────────────────────────────────────────────
  navGroup('design', Ruler, [
    navItem('design-versions', FileText, '/design/versions'),
    navItem('design-reviews', ClipboardCheck, '/design/reviews'),
    navItem('design-review-board', LayoutDashboard, '/design/reviews/board'),
    navItem('design-sections', FolderTree, '/design/sections'),
  ]),

  // ── Исполнительная документация ────────────────────────────────────────
  navGroup('execDocs', Scroll, [
    navItem('ed-aosr', FileCheck, '/exec-docs/aosr'),
    navItem('ed-ks6', FileCheck, '/exec-docs/ks6'),
    navItem('ed-incoming', ClipboardCheck, '/exec-docs/incoming-control'),
    navItem('ed-welding', Hammer, '/exec-docs/welding'),
    navItem('ed-special', BookOpen, '/exec-docs/special-journals'),
  ]),

  // ── Финансы ────────────────────────────────────────────────────────────
  navGroup('finance', Banknote, [
    navItem('fin-budgets', Wallet, '/budgets'),
    navItem('fin-fm', BarChart3, '/financial-models'),
    navItem('CONTRACTS', FileSignature, '/contracts'),
    navItem('fin-invoices', Receipt, '/invoices'),
    navItem('fin-payments', CreditCard, '/payments'),
    navItem('fin-cashflow', TrendingDown, '/cash-flow'),
    navItem('fin-cashflow-charts', PieChart, '/cash-flow/charts'),
    navItem('fin-accounting', Landmark, '/accounting'),
    navItem('fin-execution-chain', GitBranch, '/execution-chain'),
    navItem('fin-rev-dashboard', BarChart3, '/revenue/dashboard'),
    navItem('fin-rev-periods', CalendarClock, '/revenue/recognition-periods'),
    navItem('fin-rev-contracts', FileSignature, '/revenue/all-contracts'),
    navItem('fin-cost-codes', ListOrdered, '/cost-management/codes'),
    navItem('fin-cost-budget', Wallet, '/cost-management/budget'),
    navItem('fin-commitments', FileSignature, '/cost-management/commitments'),
    navItem('fin-forecast', TrendingUp, '/cost-management/forecast'),
    navItem('fin-cost-cashflow', TrendingDown, '/cost-management/cashflow-forecast'),
    navItem('fin-forecasting-hub', Radar, '/cost-management/forecasting-hub'),
    navItem('fin-profitability', PieChart, '/cost-management/profitability'),
    navItem('fin-bank-matching', ArrowLeftRight, '/bank-statement-matching'),
    navItem('fin-bank-export', FileDown, '/bank-export'),
    navItem('fin-treasury', CalendarClock, '/treasury-calendar'),
    navItem('fin-tax-calendar', CalendarRange, '/tax-calendar'),
    navItem('fin-factoring', Percent, '/factoring-calculator'),
    navItem('fin-bdds', FileSpreadsheet, '/bdds'),
    navItem('fin-expenses', CircleDollarSign, '/finance/expenses'),
    navItem('fin-s-curve-cashflow', TrendingUp, '/finance/s-curve-cashflow'),
    navItem('fin-tax-risk', AlertTriangle, '/tax-risk'),
  ]),

  // ── Сметы и ценообразование ────────────────────────────────────────────
  navGroup('pricing', Calculator, [
    navItem('specifications', ClipboardList, '/specifications'),
    navItem('spec-analogs', ArrowLeftRight, '/specifications/analogs'),
    navItem('spec-analog-requests', StickyNote, '/specifications/analog-requests'),
    navItem('spec-competitive-registry', ListChecks, '/specifications/competitive-registry'),
    navItem('estimates', Calculator, '/estimates'),
    navItem('estimates-minstroy', BarChart3, '/estimates/minstroy'),
    navItem('estimates-pivot', Sigma, '/estimates/pivot'),
    navItem('estimates-import', Upload, '/estimates/import'),
    navItem('estimates-export', Download, '/estimates/export'),
    navItem('estimates-volume', Gauge, '/estimates/volume-calculator'),
    navItem('estimates-pricing-databases', Database, '/estimates/pricing/databases'),
    navItem('estimates-pricing-rates', ListOrdered, '/estimates/pricing/rates'),
    navItem('estimates-pricing-calc', Calculator, '/estimates/pricing/calculate'),
    navItem('fin-price-coefficients', Scale, '/price-coefficients'),
  ]),

  // ── Снабжение и склад ─────────────────────────────────────────────────
  navGroup('supply', ShoppingCart, [
    navItem('fin-procurement', ShoppingCart, '/procurement'),
    navItem('fin-purchase-orders', Package, '/procurement/purchase-orders'),
    navItem('fin-tenders', Briefcase, '/procurement/tenders'),
    navItem('fin-bid-comparison', Scale, '/procurement/bid-comparison'),
    navItem('fin-prequalification', UserCheck, '/procurement/prequalification'),
    navItem('wh-locations', Warehouse, '/warehouse/locations'),
    navItem('wh-stock', Boxes, '/warehouse/stock'),
    navItem('wh-materials', Boxes, '/warehouse/materials'),
    navItem('wh-movements', ArrowLeftRight, '/warehouse/movements'),
    navItem('wh-inventory', ClipboardCheck, '/warehouse/inventory'),
    navItem('wh-quick-receipt', FileUp, '/warehouse/quick-receipt'),
    navItem('wh-quick-confirm', CheckSquare, '/warehouse/quick-confirm'),
    navItem('wh-barcode-scanner', ScanLine, '/warehouse/barcode-scanner'),
    navItem('wh-inter-project', Shuffle, '/warehouse/inter-project-transfer'),
    navItem('wh-inter-site', ArrowLeftRight, '/warehouse/inter-site-transfer'),
    navItem('wh-stock-limits', Gauge, '/warehouse/stock-limits'),
    navItem('wh-stock-alerts', Bell, '/warehouse/stock-alerts'),
    navItem('wh-m29-report', FileText, '/warehouse/m29-report'),
    navItem('wh-limit-fence', FileSpreadsheet, '/warehouse/limit-fence-cards'),
    navItem('wh-limit-fence-sheets', FileSpreadsheet, '/warehouse/limit-fence-sheets'),
    navItem('wh-address-storage', Warehouse, '/warehouse/address-storage'),
    navItem('wh-material-demand', Clipboard, '/warehouse/material-demand'),
    navItem('wh-orders', Package, '/warehouse/warehouse-orders'),
    navItem('ops-work-orders', ListOrdered, '/operations/work-orders'),
    navItem('ops-dispatch', Truck, '/dispatch/orders'),
    navItem('ops-routes', MapPin, '/dispatch/routes'),
    navItem('ops-dispatch-calendar', Calendar, '/operations/dispatch-calendar'),
  ]),

  // ── Кадры ──────────────────────────────────────────────────────────────
  navGroup('hr', Users, [
    navItem('hr-employees', Users, '/employees'),
    navItem('hr-timesheets', Clock, '/timesheets'),
    navItem('hr-timesheet-t13', Clock, '/hr/timesheet-t13'),
    navItem('hr-timesheet-pivot', Sigma, '/hr/timesheet-pivot'),
    navItem('hr-staffing-schedule', ListOrdered, '/hr/staffing-schedule'),
    navItem('hr-qualifications', Award, '/hr/qualifications'),
    navItem('hr-seniority-leave', Calendar, '/hr/seniority-leave'),
    navItem('hr-certification-matrix', ClipboardCheck, '/hr/certification-matrix'),
    navItem('hr-leave', Calendar, '/leave/requests'),
    navItem('hr-leave-board', Kanban, '/leave/board'),
    navItem('hr-leave-allocations', CalendarDays, '/leave/allocations'),
    navItem('hr-leave-types', ListOrdered, '/leave/types'),
    navItem('hr-payroll', Banknote, '/payroll'),
    navItem('hr-payroll-calc', Calculator, '/payroll/calculate'),
    navItem('hr-recruitment', UserPlus, '/recruitment/applicants'),
    navItem('hr-crew', Users, '/crew'),
    navItem('hr-crew-timesheets', Clock, '/hr/crew-timesheets'),
    navItem('hr-crew-entries', ClipboardPenLine, '/hr/crew-time-entries'),
    navItem('hr-crew-calendar', Calendar, '/hr/crew-time-calendar'),
    navItem('hr-ru-contracts', FileSignature, '/hr-russian/employment-contracts'),
    navItem('hr-ru-orders', FileText, '/hr-russian/personnel-orders'),
    navItem('hr-ru-staffing', ListOrdered, '/hr-russian/staffing'),
    navItem('hr-ru-timesheets', Clock, '/hr-russian/timesheets'),
    navItem('hr-self-employed', UserCheck, '/self-employed'),
    navItem('hr-se-payments', CreditCard, '/self-employed/payments'),
    navItem('hr-se-registries', FileSpreadsheet, '/self-employed/registries'),
    navItem('hr-work-orders', Hammer, '/operations/work-orders'),
  ]),

  // ── Охрана труда ───────────────────────────────────────────────────────
  navGroup('safety', HardHat, [
    navItem('safety-dashboard', HardHat, '/safety'),
    navItem('safety-incidents', AlertTriangle, '/safety/incidents'),
    navItem('safety-inspections', Search, '/safety/inspections'),
    navItem('safety-briefings', GraduationCap, '/safety/briefings'),
    navItem('safety-training', GraduationCap, '/safety/training-journal'),
    navItem('safety-ppe', Shield, '/safety/ppe'),
    navItem('safety-accidents', AlertTriangle, '/safety/accident-acts'),
    navItem('safety-metrics', BarChart3, '/safety/metrics'),
    navItem('safety-sout', FileCheck, '/safety/sout'),
    navItem('safety-compliance', ShieldCheck, '/safety/compliance'),
    navItem('safety-violations', Gavel, '/safety/violations'),
    navItem('safety-worker-certs', Award, '/safety/worker-certs'),
    navItem('safety-cert-matrix', ClipboardCheck, '/safety/certification-matrix'),
  ]),

  // ── Качество и регуляторика ────────────────────────────────────────────
  navGroup('quality', ShieldCheck, [
    navItem('qa-quality', ShieldCheck, '/quality'),
    navItem('qa-defects', Bug, '/defects'),
    navItem('qa-defect-dashboard', LayoutDashboard, '/defects/dashboard'),
    navItem('qa-defect-on-plan', MapPin, '/defects/on-plan'),
    navItem('qa-defect-pareto', BarChart3, '/quality/defect-pareto'),
    navItem('qa-punchlist', ListChecks, '/punchlist/items'),
    navItem('qa-punchlist-dash', LayoutDashboard, '/punchlist/dashboard'),
    navItem('qa-material-inspection', Search, '/quality/material-inspection'),
    navItem('qa-checklist-templates', ClipboardList, '/quality/checklist-templates'),
    navItem('qa-checklists', ClipboardCheck, '/quality/checklists'),
    navItem('qa-quality-gates', FlaskConical, '/quality/gates'),
    navItem('qa-tolerance-rules', Ruler, '/quality/tolerance-rules'),
    navItem('qa-tolerance-checks', CheckSquare, '/quality/tolerance-checks'),
    navItem('qa-certificates', Award, '/quality/certificates'),
    navItem('qa-defect-register', ScrollText, '/quality/defect-register'),
    navItem('qa-supervision', PenLine, '/quality/supervision-journal'),
    navItem('qa-permits', FileCheck, '/regulatory/permits'),
    navItem('qa-inspections', Search, '/regulatory/inspections'),
    navItem('qa-reg-dashboard', LayoutDashboard, '/regulatory/dashboard'),
    navItem('reg-prescriptions', Gavel, '/regulatory/prescriptions'),
    navItem('reg-compliance', FilePieChart, '/regulatory/compliance'),
    navItem('reg-licenses', FileCheck, '/regulatory/licenses'),
    navItem('reg-sro', Shield, '/regulatory/sro-licenses'),
    navItem('qa-reporting-calendar', CalendarRange, '/regulatory/reporting-calendar'),
    navItem('reg-inspection-prep', ClipboardCheck, '/regulatory/inspection-prep'),
    navItem('reg-inspection-history', ScrollText, '/regulatory/inspection-history'),
    navItem('reg-prescription-responses', FileText, '/regulatory/prescription-responses'),
    navItem('reg-prescriptions-journal', Gavel, '/regulatory/prescriptions-journal'),
  ]),

  // ── Техника и IoT ─────────────────────────────────────────────────────
  navGroup('fleet', Truck, [
    navItem('eq-vehicles', Truck, '/fleet'),
    navItem('eq-fuel', Fuel, '/fleet/fuel'),
    navItem('eq-fuel-accounting', Fuel, '/fleet/fuel-accounting'),
    navItem('eq-maintenance', Wrench, '/fleet/maintenance'),
    navItem('eq-maint-repair', Wrench, '/fleet/maint-repair'),
    navItem('eq-maint-schedule', CalendarDays, '/fleet/maintenance-schedule'),
    navItem('eq-waybills', FileText, '/fleet/waybills-esm'),
    navItem('eq-usage-logs', Clock, '/fleet/usage-logs'),
    navItem('eq-gps-tracking', MapPin, '/fleet/gps-tracking'),
    navItem('eq-driver-rating', Star, '/fleet/driver-rating'),
    navItem('eq-iot-devices', Cpu, '/iot/devices'),
    navItem('eq-iot-sensors', Cpu, '/iot/sensors'),
    navItem('eq-iot-alerts', Bell, '/iot/alerts'),
  ]),

  // ── Стройплощадка и BIM ────────────────────────────────────────────────
  navGroup('site', Construction, [
    navItem('ops-daily', ClipboardPenLine, '/operations/daily-logs'),
    navItem('ops-dashboard', LayoutDashboard, '/operations/dashboard'),
    navItem('site-bim-models', Layers, '/bim/models'),
    navItem('site-bim-clash', Bug, '/bim/clash-detection'),
    navItem('site-bim-overlay', Layers, '/bim/drawing-overlay'),
    navItem('site-bim-pins', Crosshair, '/bim/drawing-pins'),
    navItem('site-bim-progress', Construction, '/bim/construction-progress'),
    navItem('site-bim-heatmap', ThermometerSun, '/bim/defect-heatmap'),
    navItem('site-m29', FileText, '/m29'),
    navItem('site-mobile-dash', Smartphone, '/mobile/dashboard'),
    navItem('site-mobile-reports', Smartphone, '/mobile/reports'),
    navItem('site-mobile-photos', Smartphone, '/mobile/photos'),
    navItem('site-ai-photos', Sparkles, '/ai/photo-analysis'),
    navItem('site-ai-risk', Zap, '/ai/risk-dashboard'),
  ]),

  // ── Завершение ─────────────────────────────────────────────────────────
  navGroup('closeout', CheckCheck, [
    navItem('co-dashboard', LayoutDashboard, '/closeout/dashboard'),
    navItem('co-commissioning', Milestone, '/closeout/commissioning'),
    navItem('co-templates', ClipboardList, '/closeout/commissioning-templates'),
    navItem('co-handover', Handshake, '/closeout/handover'),
    navItem('co-warranty', Shield, '/closeout/warranty'),
    navItem('co-warranty-obligations', Shield, '/closeout/warranty-obligations'),
    navItem('co-warranty-tracking', Search, '/closeout/warranty-tracking'),
    navItem('co-as-built', FileCheck, '/closeout/as-built'),
    navItem('co-zos', FileText, '/closeout/zos'),
    navItem('co-stroynadzor', ShieldCheck, '/closeout/stroynadzor'),
    navItem('co-exec-schemas', Layers, '/closeout/executive-schemas'),
  ]),

  // ── Обслуживание ───────────────────────────────────────────────────────
  navGroup('maintenance', Wrench, [
    navItem('maint-dashboard', LayoutDashboard, '/maintenance/dashboard'),
    navItem('maint-requests', ClipboardList, '/maintenance/requests'),
    navItem('maint-equipment', Wrench, '/maintenance/equipment'),
  ]),

  // ── Юридический ────────────────────────────────────────────────────────
  navGroup('legal', Gavel, [
    navItem('legal-cases', Gavel, '/legal/cases'),
    navItem('legal-templates', FileText, '/legal/templates'),
    navItem('precon-insurance', Shield, '/insurance-certificates'),
  ]),

  // ── Портал подрядчика ──────────────────────────────────────────────────
  navGroup('portal', Handshake, [
    navItem('portal-dashboard', LayoutDashboard, '/portal'),
    navItem('portal-projects', FolderKanban, '/portal/projects'),
    navItem('portal-documents', FileText, '/portal/documents'),
    navItem('portal-messages', MessageCircle, '/portal/messages'),
    navItem('portal-contracts', FileSignature, '/portal/contracts'),
    navItem('portal-invoices', Receipt, '/portal/invoices'),
    navItem('portal-tasks', Activity, '/portal/tasks'),
    navItem('portal-schedule', CalendarDays, '/portal/schedule'),
    navItem('portal-cp-approval', CheckSquare, '/portal/cp-approval'),
    navItem('portal-ks2-drafts', FileCheck, '/portal/ks2-drafts'),
  ]),

  // ── Мессенджер ───────────────────────────────────────────────────────
  navGroup('messenger', MessageSquare, [
    navItem('msg-chat', MessageCircle, '/messaging'),
  ]),

  // ── Почта ───────────────────────────────────────────────────────────
  navGroup('mail', Mail, [
    navItem('mail-inbox', Mail, '/mail'),
  ]),

  // ── Администрирование ──────────────────────────────────────────────────
  navGroup('admin', Settings, [
    navItem('adm-dashboard', LayoutDashboard, '/admin/dashboard'),
    navItem('adm-modules', Layers, '/admin/modules'),
    navItem('adm-users', UserCog, '/admin/users'),
    navItem('adm-permissions', Shield, '/admin/permissions'),
    navItem('adm-departments', Building2, '/admin/departments'),
    navItem('adm-security', ShieldCheck, '/admin/security'),
    navItem('an-monitoring', Activity, '/monitoring'),
    navItem('adm-integrations-hub', Plug, '/integrations'),
    navItem('adm-custom-fields', ListChecks, '/admin/custom-fields'),
    navItem('adm-sso', Shield, '/admin/sso'),
    navItem('adm-system-settings', Settings, '/admin/system-settings'),
    navItem('sup-tickets', LifeBuoy, '/support/tickets'),
    navItem('sup-dashboard', LayoutDashboard, '/support/dashboard'),
    navItem('adm-subscription', CreditCard, '/settings/subscription'),
    navItem('adm-api-docs', BookOpen, '/settings/api-docs'),
    navItem('adm-marketplace', Package, '/marketplace'),
  ]),

  // ── База знаний ──────────────────────────────────────────────────────
  navGroup('knowledge', BookOpen, [
    navItem('kb-main', BookOpen, '/help'),
  ]),
];
