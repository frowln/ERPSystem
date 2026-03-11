/**
 * Typed factory functions for realistic Russian construction test data.
 * Every entity uses the "E2E-" prefix for identification and cleanup.
 * Counter-based: each call returns slightly different data.
 */

// ── Counters ───────────────────────────────────────────────────────────────

let projectCounter = 0;
let invoiceCounter = 0;
let employeeCounter = 0;
let materialCounter = 0;
let specCounter = 0;
let budgetItemCounter = 0;
let incidentCounter = 0;
let trainingCounter = 0;
let inspectionCounter = 0;
let timesheetCounter = 0;

export function resetCounters(): void {
  projectCounter = 0;
  invoiceCounter = 0;
  employeeCounter = 0;
  materialCounter = 0;
  specCounter = 0;
  budgetItemCounter = 0;
  incidentCounter = 0;
  trainingCounter = 0;
  inspectionCounter = 0;
  timesheetCounter = 0;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** ISO date string, offset from today by `daysOffset` */
function isoDate(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

// ── Project ────────────────────────────────────────────────────────────────

const PROJECT_TEMPLATES = [
  { name: 'Складской комплекс Логистик-Парк', code: 'LP', type: 'INDUSTRIAL' as const, budget: 280_000_000 },
  { name: 'ЖК Солнечный квартал', code: 'SK', type: 'RESIDENTIAL' as const, budget: 450_000_000 },
  { name: 'Детский сад Радуга', code: 'RG', type: 'COMMERCIAL' as const, budget: 95_000_000 },
  { name: 'БЦ Меридиан', code: 'MR', type: 'COMMERCIAL' as const, budget: 320_000_000 },
  { name: 'Школа №42', code: 'SH', type: 'COMMERCIAL' as const, budget: 150_000_000 },
];

export interface TestProject {
  name: string;
  code: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  budget: number;
  plannedStartDate: string;
  plannedEndDate: string;
  customerName: string;
  address: string;
  city: string;
  region: string;
}

export function createTestProject(overrides?: Partial<TestProject>): TestProject {
  const idx = projectCounter++ % PROJECT_TEMPLATES.length;
  const tpl = PROJECT_TEMPLATES[idx];
  return {
    name: `E2E-${tpl.name}`,
    code: `E2E-${tpl.code}-${pad3(projectCounter)}`,
    description: `Тестовый объект: ${tpl.name}. Автоматически создан E2E-тестами.`,
    type: tpl.type,
    priority: 'NORMAL',
    status: 'PLANNING',
    budget: tpl.budget,
    plannedStartDate: isoDate(-30),
    plannedEndDate: isoDate(365),
    customerName: 'E2E-ООО СтройИнвест',
    address: 'ул. Строителей, д. 15',
    city: 'Москва',
    region: 'Московская область',
    ...overrides,
  };
}

// ── Invoice ────────────────────────────────────────────────────────────────

const VENDORS = [
  { name: 'ООО ЭлектроПром', inn: '7701234567' },
  { name: 'ООО СтройМонтаж', inn: '7702345678' },
  { name: 'ООО ВентСистемы', inn: '7703456789' },
  { name: 'ИП Петров К.В.', inn: '770400000012' },
  { name: 'ООО ТехноСталь', inn: '7705567890' },
];

export interface TestInvoice {
  number: string;
  vendorName: string;
  vendorInn: string;
  amount: number;
  vatAmount: number;
  totalWithVat: number;
  issueDate: string;
  dueDate: string;
  description: string;
  status: string;
}

export function createTestInvoice(overrides?: Partial<TestInvoice>): TestInvoice {
  const idx = invoiceCounter++ % VENDORS.length;
  const vendor = VENDORS[idx];
  const amount = 500_000 + invoiceCounter * 150_000;
  const vat = Math.round(amount * 0.20);
  return {
    number: `E2E-СЧ-2026-${pad3(invoiceCounter)}`,
    vendorName: `E2E-${vendor.name}`,
    vendorInn: vendor.inn,
    amount,
    vatAmount: vat,
    totalWithVat: amount + vat,
    issueDate: isoDate(-15 + idx),
    dueDate: isoDate(30 + idx),
    description: `Счёт на оплату работ по договору E2E-${pad3(invoiceCounter)}`,
    status: 'PENDING',
    ...overrides,
  };
}

// ── Employee ───────────────────────────────────────────────────────────────

const EMPLOYEE_TEMPLATES = [
  { firstName: 'Алексей', lastName: 'Иванов', patronymic: 'Сергеевич', position: 'Прораб', department: 'Производство' },
  { firstName: 'Елена', lastName: 'Петрова', patronymic: 'Константиновна', position: 'Бухгалтер', department: 'Бухгалтерия' },
  { firstName: 'Виктор', lastName: 'Сидоров', patronymic: 'Михайлович', position: 'Директор', department: 'Руководство' },
  { firstName: 'Дмитрий', lastName: 'Козлов', patronymic: 'Андреевич', position: 'Инженер-сметчик', department: 'Сметный отдел' },
  { firstName: 'Наталья', lastName: 'Морозова', patronymic: 'Павловна', position: 'Снабженец', department: 'Снабжение' },
  { firstName: 'Сергей', lastName: 'Волков', patronymic: 'Игоревич', position: 'Инженер ПТО', department: 'ПТО' },
  { firstName: 'Ольга', lastName: 'Новикова', patronymic: 'Дмитриевна', position: 'Инженер по ОТ и ТБ', department: 'Охрана труда' },
  { firstName: 'Андрей', lastName: 'Кузнецов', patronymic: 'Владимирович', position: 'Электромонтажник', department: 'Электромонтаж' },
];

export interface TestEmployee {
  firstName: string;
  lastName: string;
  patronymic: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  hourlyRate: number;
}

export function createTestEmployee(overrides?: Partial<TestEmployee>): TestEmployee {
  const idx = employeeCounter++ % EMPLOYEE_TEMPLATES.length;
  const tpl = EMPLOYEE_TEMPLATES[idx];
  return {
    firstName: tpl.firstName,
    lastName: `E2E-${tpl.lastName}`,
    patronymic: tpl.patronymic,
    position: tpl.position,
    department: tpl.department,
    email: `e2e.${tpl.lastName.toLowerCase()}${employeeCounter}@privod.test`,
    phone: `+7-999-${pad3(100 + employeeCounter)}-00-${String(idx).padStart(2, '0')}`,
    hireDate: isoDate(-365 - idx * 30),
    hourlyRate: 800 + idx * 200,
    ...overrides,
  };
}

// ── Material ───────────────────────────────────────────────────────────────

const MATERIAL_TEMPLATES = [
  { name: 'Кирпич М150', unit: 'шт', unitPrice: 14.5, category: 'MATERIAL' },
  { name: 'Арматура А500С ∅12', unit: 'т', unitPrice: 62_000, category: 'MATERIAL' },
  { name: 'Кабель ВВГнг 3×2.5', unit: 'м', unitPrice: 42.5, category: 'MATERIAL' },
  { name: 'Бетон В25', unit: 'м³', unitPrice: 4_800, category: 'MATERIAL' },
  { name: 'Воздуховод оцинк. ∅200', unit: 'п.м.', unitPrice: 380, category: 'MATERIAL' },
  { name: 'Труба ПП ∅110', unit: 'м', unitPrice: 185, category: 'MATERIAL' },
  { name: 'Профлист С21', unit: 'м²', unitPrice: 650, category: 'MATERIAL' },
  { name: 'Утеплитель Rockwool 100мм', unit: 'м²', unitPrice: 420, category: 'MATERIAL' },
];

export interface TestMaterial {
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  category: string;
  warehouse: string;
}

export function createTestMaterial(overrides?: Partial<TestMaterial>): TestMaterial {
  const idx = materialCounter++ % MATERIAL_TEMPLATES.length;
  const tpl = MATERIAL_TEMPLATES[idx];
  return {
    name: `E2E-${tpl.name}`,
    unit: tpl.unit,
    unitPrice: tpl.unitPrice,
    quantity: 100 * (idx + 1),
    category: tpl.category,
    warehouse: 'E2E-Склад №1',
    ...overrides,
  };
}

// ── Specification Item ─────────────────────────────────────────────────────

const SPEC_ITEM_TEMPLATES = [
  { name: 'Щит силовой ЩС-1', type: 'EQUIPMENT', unit: 'шт', brand: 'IEK', manufacturer: 'ИнтерЭлектроКомплект', weight: 45 },
  { name: 'Автомат ВА47-29 3P 25А', type: 'EQUIPMENT', unit: 'шт', brand: 'IEK', manufacturer: 'ИнтерЭлектроКомплект', weight: 0.3 },
  { name: 'Кабель ВВГнг-LS 5×10', type: 'MATERIAL', unit: 'м', brand: 'Камкабель', manufacturer: 'Камский кабель', weight: 0.89 },
  { name: 'Приточная установка ПВУ-500', type: 'EQUIPMENT', unit: 'шт', brand: 'Systemair', manufacturer: 'Системэйр', weight: 120 },
  { name: 'Воздуховод оц. ∅315', type: 'MATERIAL', unit: 'п.м.', brand: '', manufacturer: 'Лиссант', weight: 3.2 },
  { name: 'Монтаж кабельных линий 0.4кВ', type: 'WORK', unit: 'м', brand: '', manufacturer: '', weight: 0 },
  { name: 'Пусконаладка электрооборудования', type: 'WORK', unit: 'компл.', brand: '', manufacturer: '', weight: 0 },
];

export interface TestSpecItem {
  name: string;
  type: string;
  unit: string;
  quantity: number;
  brand: string;
  manufacturer: string;
  weight: number;
  section: string;
}

export function createTestSpecItem(overrides?: Partial<TestSpecItem>): TestSpecItem {
  const idx = specCounter++ % SPEC_ITEM_TEMPLATES.length;
  const tpl = SPEC_ITEM_TEMPLATES[idx];
  const section = tpl.type === 'WORK' ? 'Монтажные работы' : (idx < 3 ? 'Электроснабжение' : 'Вентиляция');
  return {
    name: `E2E-${tpl.name}`,
    type: tpl.type,
    unit: tpl.unit,
    quantity: tpl.type === 'WORK' ? 1 : 10 + idx * 5,
    brand: tpl.brand,
    manufacturer: tpl.manufacturer,
    weight: tpl.weight,
    section,
    ...overrides,
  };
}

// ── Budget Item ────────────────────────────────────────────────────────────

const BUDGET_ITEM_TEMPLATES = [
  { name: 'Электромонтажные работы', category: 'WORK', plannedAmount: 5_500_000 },
  { name: 'Вентиляция и кондиционирование', category: 'WORK', plannedAmount: 3_200_000 },
  { name: 'Общестроительные работы', category: 'WORK', plannedAmount: 12_000_000 },
  { name: 'Материалы электро', category: 'MATERIAL', plannedAmount: 4_800_000 },
  { name: 'Материалы вент', category: 'MATERIAL', plannedAmount: 2_100_000 },
  { name: 'Оборудование электро', category: 'EQUIPMENT', plannedAmount: 6_300_000 },
];

export interface TestBudgetItem {
  name: string;
  category: string;
  plannedAmount: number;
  costPrice: number;
  estimatePrice: number;
  customerPrice: number;
}

export function createTestBudgetItem(overrides?: Partial<TestBudgetItem>): TestBudgetItem {
  const idx = budgetItemCounter++ % BUDGET_ITEM_TEMPLATES.length;
  const tpl = BUDGET_ITEM_TEMPLATES[idx];
  const costPrice = Math.round(tpl.plannedAmount * 0.7);
  const estimatePrice = Math.round(tpl.plannedAmount * 0.85);
  return {
    name: `E2E-${tpl.name}`,
    category: tpl.category,
    plannedAmount: tpl.plannedAmount,
    costPrice,
    estimatePrice,
    customerPrice: tpl.plannedAmount,
    ...overrides,
  };
}

// ── Safety Incident ────────────────────────────────────────────────────────

const INCIDENT_TEMPLATES = [
  { title: 'Падение с высоты при монтаже', severity: 'HIGH', type: 'FALL' },
  { title: 'Электротравма при подключении щита', severity: 'CRITICAL', type: 'ELECTRICAL' },
  { title: 'Порез руки при резке арматуры', severity: 'LOW', type: 'CUT' },
  { title: 'Ушиб ноги при разгрузке материалов', severity: 'MEDIUM', type: 'IMPACT' },
];

export interface TestSafetyIncident {
  title: string;
  description: string;
  severity: string;
  type: string;
  date: string;
  location: string;
  status: string;
}

export function createTestSafetyIncident(overrides?: Partial<TestSafetyIncident>): TestSafetyIncident {
  const idx = incidentCounter++ % INCIDENT_TEMPLATES.length;
  const tpl = INCIDENT_TEMPLATES[idx];
  return {
    title: `E2E-${tpl.title}`,
    description: `Инцидент на строительной площадке. Автоматически создан E2E-тестами. №${incidentCounter}`,
    severity: tpl.severity,
    type: tpl.type,
    date: isoDate(-idx * 7),
    location: `Секция ${idx + 1}, этаж ${idx + 2}`,
    status: 'OPEN',
    ...overrides,
  };
}

// ── Safety Training ────────────────────────────────────────────────────────

const TRAINING_TEMPLATES = [
  { title: 'Вводный инструктаж по ОТ', type: 'INDUCTION' },
  { title: 'Работы на высоте', type: 'HEIGHT_WORK' },
  { title: 'Электробезопасность III группа', type: 'ELECTRICAL' },
  { title: 'Пожарно-технический минимум', type: 'FIRE_SAFETY' },
];

export interface TestSafetyTraining {
  title: string;
  type: string;
  date: string;
  expiryDate: string;
  status: string;
}

export function createTestSafetyTraining(overrides?: Partial<TestSafetyTraining>): TestSafetyTraining {
  const idx = trainingCounter++ % TRAINING_TEMPLATES.length;
  const tpl = TRAINING_TEMPLATES[idx];
  return {
    title: `E2E-${tpl.title}`,
    type: tpl.type,
    date: isoDate(-90 + idx * 10),
    expiryDate: isoDate(275 + idx * 30),
    status: 'COMPLETED',
    ...overrides,
  };
}

// ── Safety Inspection ──────────────────────────────────────────────────────

const INSPECTION_TEMPLATES = [
  { title: 'Проверка ограждений котлована', area: 'Котлован' },
  { title: 'Осмотр лесов и подмостей', area: 'Фасад' },
  { title: 'Проверка электроинструмента', area: 'Склад' },
];

export interface TestSafetyInspection {
  title: string;
  area: string;
  date: string;
  result: string;
  notes: string;
  status: string;
}

export function createTestSafetyInspection(overrides?: Partial<TestSafetyInspection>): TestSafetyInspection {
  const idx = inspectionCounter++ % INSPECTION_TEMPLATES.length;
  const tpl = INSPECTION_TEMPLATES[idx];
  return {
    title: `E2E-${tpl.title}`,
    area: tpl.area,
    date: isoDate(-idx * 14),
    result: idx === 0 ? 'PASS' : 'FAIL',
    notes: `Автоматическая проверка E2E №${inspectionCounter}`,
    status: 'COMPLETED',
    ...overrides,
  };
}

// ── Timesheet ──────────────────────────────────────────────────────────────

export interface TestTimesheet {
  date: string;
  hoursWorked: number;
  overtime: number;
  description: string;
  status: string;
}

export function createTestTimesheet(overrides?: Partial<TestTimesheet>): TestTimesheet {
  const idx = timesheetCounter++;
  const dayOffset = -(idx % 30);
  const overtime = idx % 3 === 0 ? 2 : 0;
  return {
    date: isoDate(dayOffset),
    hoursWorked: 8,
    overtime,
    description: `E2E-Табель: работы на площадке, день ${idx + 1}`,
    status: 'SUBMITTED',
    ...overrides,
  };
}

// ── Competitive List Entry ─────────────────────────────────────────────────

export interface TestCompetitiveListEntry {
  vendorName: string;
  vendorInn: string;
  unitPrice: number;
  deliveryDays: number;
  warrantyMonths: number;
  paymentTerms: string;
}

export function createTestCompetitiveListEntry(
  basePrice: number,
  vendorIndex: number,
): TestCompetitiveListEntry {
  const vendor = VENDORS[vendorIndex % VENDORS.length];
  const priceVariation = 1 + (vendorIndex - 1) * 0.12; // ±12% spread per vendor
  return {
    vendorName: `E2E-${vendor.name}`,
    vendorInn: vendor.inn,
    unitPrice: Math.round(basePrice * priceVariation),
    deliveryDays: 14 + vendorIndex * 7,
    warrantyMonths: 12 + vendorIndex * 6,
    paymentTerms: vendorIndex === 0 ? 'PREPAYMENT' : 'NET_30',
  };
}

// ── Payment ────────────────────────────────────────────────────────────────

export interface TestPayment {
  amount: number;
  date: string;
  method: string;
  reference: string;
  description: string;
  status: string;
}

export function createTestPayment(
  invoiceAmount: number,
  paymentIndex: number,
): TestPayment {
  // Partial payment: 50% first, 50% second
  const amount = paymentIndex === 0 ? Math.round(invoiceAmount * 0.5) : invoiceAmount - Math.round(invoiceAmount * 0.5);
  return {
    amount,
    date: isoDate(-10 + paymentIndex * 15),
    method: 'BANK_TRANSFER',
    reference: `E2E-ПП-${pad3(paymentIndex + 1)}`,
    description: `E2E-Оплата по счёту, платёж ${paymentIndex + 1}`,
    status: 'COMPLETED',
  };
}
