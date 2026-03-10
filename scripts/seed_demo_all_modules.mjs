#!/usr/bin/env node
/**
 * seed_demo_all_modules.mjs
 *
 * Комплексный seed-скрипт для заполнения ВСЕХ ключевых модулей реалистичными данными.
 * Работает поверх уже засеянных данных (project + finance).
 *
 * Использование:
 *   node scripts/seed_demo_all_modules.mjs [--api http://localhost:8080]
 *
 * Предусловия:
 *   - Backend запущен
 *   - Есть пользователь admin@privod.ru / admin123
 *   - Выполнен reset_and_seed.mjs (есть проект и финансовые данные)
 */

const API_BASE = process.env.API_BASE || process.argv.find(a => a.startsWith('--api='))?.split('=')[1] || 'http://localhost:8080';
const API = `${API_BASE}/api`;

let TOKEN = '';
let ADMIN_USER_ID = '';
let ORG_ID = '';
let PROJECT_ID = '';
let PROJECT_IDS = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function request(method, path, body) {
  const url = `${API}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }

  if (!res.ok) {
    console.error(`  [${res.status}] ${method} ${path}`, typeof json === 'string' ? json.slice(0, 200) : JSON.stringify(json).slice(0, 200));
    return null;
  }
  return json?.data ?? json;
}

const post = (path, body) => request('POST', path, body);
const get = (path) => request('GET', path);
const put = (path, body) => request('PUT', path, body);
const patch = (path, body) => request('PATCH', path, body);

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uuid() { return crypto.randomUUID(); }
function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

let created = {};
function track(module, id) {
  if (!created[module]) created[module] = [];
  if (id) created[module].push(id);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function login() {
  console.log('\n=== Авторизация ===');
  const res = await post('/auth/login', { email: 'admin@privod.ru', password: 'admin123' });
  if (!res?.accessToken) {
    // попробуем demo-аккаунт
    const res2 = await post('/auth/login', { email: 'admin@demo.privod.ru', password: 'Demo123!' });
    if (!res2?.accessToken) {
      console.error('Не удалось авторизоваться');
      process.exit(1);
    }
    TOKEN = res2.accessToken;
    ADMIN_USER_ID = res2.userId || res2.user?.id || '';
    return;
  }
  TOKEN = res.accessToken;
  ADMIN_USER_ID = res.userId || res.user?.id || '';
  console.log(`  Авторизован, userId=${ADMIN_USER_ID}`);
}

async function getContext() {
  console.log('\n=== Загрузка контекста ===');

  // Получить проекты
  const projects = await get('/projects?size=50');
  const list = projects?.content || projects || [];
  if (Array.isArray(list) && list.length > 0) {
    PROJECT_ID = list[0].id;
    PROJECT_IDS = list.map(p => p.id);
    console.log(`  Проектов: ${list.length}, основной: ${list[0].name || PROJECT_ID}`);
  } else {
    console.error('  Нет проектов! Сначала выполните reset_and_seed.mjs');
    process.exit(1);
  }

  // Получить пользователей
  const users = await get('/admin/users?size=50');
  const userList = users?.content || users || [];
  if (Array.isArray(userList) && userList.length > 0) {
    ADMIN_USER_ID = ADMIN_USER_ID || userList[0].id;
    console.log(`  Пользователей: ${userList.length}`);
  }
}

// ── 0. Пользователи (разные роли) ──────────────────────────────────────────

async function seedUsers() {
  console.log('\n=== Пользователи ===');
  const users = [
    { email: 'manager@privod.ru', firstName: 'Иван', lastName: 'Петров', role: 'MANAGER', password: 'Manager123!' },
    { email: 'engineer@privod.ru', firstName: 'Алексей', lastName: 'Сидоров', role: 'ENGINEER', password: 'Engineer123!' },
    { email: 'engineer2@privod.ru', firstName: 'Дмитрий', lastName: 'Козлов', role: 'ENGINEER', password: 'Engineer123!' },
    { email: 'accountant@privod.ru', firstName: 'Ольга', lastName: 'Иванова', role: 'ACCOUNTANT', password: 'Account123!' },
    { email: 'accountant2@privod.ru', firstName: 'Елена', lastName: 'Смирнова', role: 'ACCOUNTANT', password: 'Account123!' },
    { email: 'viewer@privod.ru', firstName: 'Сергей', lastName: 'Морозов', role: 'VIEWER', password: 'Viewer123!' },
    { email: 'manager2@privod.ru', firstName: 'Андрей', lastName: 'Новиков', role: 'MANAGER', password: 'Manager123!' },
    { email: 'engineer3@privod.ru', firstName: 'Михаил', lastName: 'Волков', role: 'ENGINEER', password: 'Engineer123!' },
    { email: 'pto@privod.ru', firstName: 'Наталья', lastName: 'Кузнецова', role: 'ENGINEER', password: 'Engineer123!' },
    { email: 'safety@privod.ru', firstName: 'Владимир', lastName: 'Лебедев', role: 'ENGINEER', password: 'Engineer123!' },
    { email: 'procurement@privod.ru', firstName: 'Анна', lastName: 'Соколова', role: 'MANAGER', password: 'Manager123!' },
    { email: 'hr@privod.ru', firstName: 'Мария', lastName: 'Попова', role: 'MANAGER', password: 'Manager123!' },
    { email: 'viewer2@privod.ru', firstName: 'Павел', lastName: 'Федоров', role: 'VIEWER', password: 'Viewer123!' },
    { email: 'viewer3@privod.ru', firstName: 'Константин', lastName: 'Белов', role: 'VIEWER', password: 'Viewer123!' },
  ];

  for (const u of users) {
    const res = await post('/admin/users', u);
    track('users', res?.id);
  }
  console.log(`  Создано пользователей: ${created.users?.length || 0}`);
}

// ── 1. Отделы (Organization) ─────────────────────────────────────────────────

async function seedDepartments() {
  console.log('\n=== Отделы ===');

  // Корневые отделы
  const rootDepartments = [
    { name: 'Управление проектами', code: 'PM', description: 'Отдел управления строительными проектами', sortOrder: 1 },
    { name: 'Проектно-техническое управление (ПТО)', code: 'PTO', description: 'Контроль качества проектной документации', sortOrder: 2 },
    { name: 'Отдел снабжения (ОМТС)', code: 'OMTS', description: 'Материально-техническое снабжение', sortOrder: 3 },
    { name: 'Производственно-технический отдел', code: 'PTO-PROD', description: 'Производство строительных работ', sortOrder: 4 },
    { name: 'Финансовый отдел', code: 'FIN', description: 'Бюджетирование, финмодель, казначейство', sortOrder: 5 },
    { name: 'Отдел кадров (HR)', code: 'HR', description: 'Управление персоналом и кадровый учёт', sortOrder: 6 },
    { name: 'Охрана труда (ОТ)', code: 'OT', description: 'Техника безопасности и охрана труда', sortOrder: 7 },
    { name: 'Юридический отдел', code: 'LEGAL', description: 'Контракты, претензионная работа', sortOrder: 8 },
    { name: 'IT-отдел', code: 'IT', description: 'Информационные технологии и BIM', sortOrder: 9 },
    { name: 'Сметный отдел', code: 'SMET', description: 'Сметная документация, ГЭСН/ФЕР', sortOrder: 10 },
  ];

  const parentIds = {};
  for (const dept of rootDepartments) {
    const res = await post('/admin/departments', dept);
    track('departments', res?.id);
    if (res?.id) parentIds[dept.code] = res.id;
  }

  // Дочерние подотделы для иерархии
  const childDepartments = [
    { name: 'Группа планирования', code: 'PM-PLAN', description: 'Календарное планирование и графики', sortOrder: 1, parentId: parentIds['PM'] },
    { name: 'Группа контроля', code: 'PM-CTRL', description: 'Контроль выполнения проектов', sortOrder: 2, parentId: parentIds['PM'] },
    { name: 'Отдел входного контроля', code: 'PTO-QC', description: 'Входной контроль проектной документации', sortOrder: 1, parentId: parentIds['PTO'] },
    { name: 'Отдел согласований', code: 'PTO-APR', description: 'Согласование с надзорными органами', sortOrder: 2, parentId: parentIds['PTO'] },
    { name: 'Группа закупок', code: 'OMTS-PUR', description: 'Тендеры и закупки материалов', sortOrder: 1, parentId: parentIds['OMTS'] },
    { name: 'Склад', code: 'OMTS-WH', description: 'Складское хозяйство', sortOrder: 2, parentId: parentIds['OMTS'] },
    { name: 'Бухгалтерия', code: 'FIN-ACC', description: 'Бухгалтерский учёт', sortOrder: 1, parentId: parentIds['FIN'] },
    { name: 'Казначейство', code: 'FIN-TRES', description: 'Управление денежными потоками', sortOrder: 2, parentId: parentIds['FIN'] },
  ];

  for (const dept of childDepartments) {
    if (dept.parentId) {
      const res = await post('/admin/departments', dept);
      track('departments', res?.id);
    }
  }

  console.log(`  Создано отделов: ${created.departments?.length || 0}`);
}

// ── 2. Контрагенты ──────────────────────────────────────────────────────────

async function seedCounterparties() {
  console.log('\n=== Контрагенты ===');
  const counterparties = [
    { name: 'ООО "СтройМонтаж"', inn: '7701234567', kpp: '770101001', legalAddress: 'г. Москва, ул. Строителей, д. 15', supplier: true, customer: false, bankAccount: '40702810500000012345', bik: '044525225' },
    { name: 'АО "ТехноСтрой Инжиниринг"', inn: '7702345678', kpp: '770201001', legalAddress: 'г. Москва, Варшавское ш., д. 42', supplier: true, customer: false, bankAccount: '40702810600000023456', bik: '044525593' },
    { name: 'ООО "ЭлектроПроф"', inn: '7703456789', kpp: '770301001', legalAddress: 'г. Москва, ул. Энергетиков, д. 8', supplier: true, customer: false },
    { name: 'ПАО "Стальконструкция"', inn: '7704567890', kpp: '770401001', legalAddress: 'г. Москва, Промышленный пр., д. 22', supplier: true, customer: false },
    { name: 'ООО "КлиматВент"', inn: '7705678901', kpp: '770501001', legalAddress: 'г. Москва, ул. Инженерная, д. 5', supplier: true, customer: false },
    { name: 'ИП Смирнов А.В. (бетон)', inn: '770612345678', legalAddress: 'г. Москва, п. Внуково', supplier: true, customer: false },
    { name: 'ООО "ДевелопИнвест"', inn: '7707890123', kpp: '770701001', legalAddress: 'г. Москва, Ленинский пр., д. 119', supplier: false, customer: true },
    { name: 'АО "Жилстрой-1"', inn: '7708901234', kpp: '770801001', legalAddress: 'г. Москва, ул. Академика Пилюгина, д. 2', supplier: false, customer: true },
    { name: 'ООО "Сантехмонтаж Плюс"', inn: '5001234567', kpp: '500101001', legalAddress: 'г. Подольск, ул. Литейная, д. 10', supplier: true, customer: false },
    { name: 'ООО "ФасадМастер"', inn: '5002345678', kpp: '500201001', legalAddress: 'г. Мытищи, Олимпийский пр., д. 33', supplier: true, customer: false },
  ];

  for (const cp of counterparties) {
    const res = await post('/counterparties', cp);
    track('counterparties', res?.id);
  }
  console.log(`  Создано контрагентов: ${created.counterparties?.length || 0}`);
}

// ── 3. Задачи и стадии Kanban ────────────────────────────────────────────────

async function seedTasksAndStages() {
  console.log('\n=== Задачи и стадии Kanban ===');

  // Создаём стадии для основного проекта
  const stages = [
    { name: 'Бэклог', color: '#9CA3AF', icon: 'inbox', sequence: 1, isDefault: true, isClosed: false },
    { name: 'К выполнению', color: '#3B82F6', icon: 'list-todo', sequence: 2, isDefault: false, isClosed: false },
    { name: 'В работе', color: '#F59E0B', icon: 'loader', sequence: 3, isDefault: false, isClosed: false },
    { name: 'На проверке', color: '#8B5CF6', icon: 'eye', sequence: 4, isDefault: false, isClosed: false },
    { name: 'Готово', color: '#10B981', icon: 'check-circle', sequence: 5, isDefault: false, isClosed: true },
  ];

  const stageIds = [];
  for (const stage of stages) {
    const res = await post('/task-stages', { ...stage, projectId: PROJECT_ID });
    stageIds.push(res?.id);
    track('taskStages', res?.id);
  }

  // Создаём задачи
  const tasks = [
    { title: 'Разработка ППР (проект производства работ)', priority: 'HIGH', assigneeName: 'Петров И.С.', plannedStartDate: daysAgo(10), plannedEndDate: daysFromNow(5), estimatedHours: 80, progress: 65, tags: 'ППР,документация' },
    { title: 'Геодезическая разбивка осей здания', priority: 'CRITICAL', assigneeName: 'Козлов А.М.', plannedStartDate: daysAgo(5), plannedEndDate: daysFromNow(2), estimatedHours: 24, progress: 90, tags: 'геодезия' },
    { title: 'Устройство свайного поля секция 1', priority: 'HIGH', assigneeName: 'Сидоров М.Н.', plannedStartDate: daysAgo(3), plannedEndDate: daysFromNow(14), estimatedHours: 320, progress: 25, tags: 'фундамент,сваи' },
    { title: 'Монтаж опалубки перекрытия 1 этажа', priority: 'NORMAL', assigneeName: 'Кузнецов Д.В.', plannedStartDate: daysFromNow(7), plannedEndDate: daysFromNow(21), estimatedHours: 160, progress: 0, tags: 'монолит,опалубка' },
    { title: 'Армирование ростверка секция 2', priority: 'HIGH', assigneeName: 'Сидоров М.Н.', plannedStartDate: daysFromNow(3), plannedEndDate: daysFromNow(10), estimatedHours: 120, progress: 0, tags: 'арматура,фундамент' },
    { title: 'Прокладка наружных инженерных сетей', priority: 'NORMAL', assigneeName: 'Волков Р.А.', plannedStartDate: daysFromNow(14), plannedEndDate: daysFromNow(35), estimatedHours: 240, progress: 0, tags: 'сети,инженерия' },
    { title: 'Входной контроль арматуры A500C', priority: 'URGENT', assigneeName: 'Лебедев П.К.', plannedStartDate: daysAgo(1), plannedEndDate: daysFromNow(1), estimatedHours: 8, progress: 50, tags: 'качество,материалы' },
    { title: 'Оформление разрешения на строительство', priority: 'CRITICAL', assigneeName: 'Морозова Е.А.', plannedStartDate: daysAgo(30), plannedEndDate: daysAgo(5), estimatedHours: 40, progress: 100, tags: 'разрешения,документы' },
    { title: 'Согласование ТУ на электроснабжение', priority: 'HIGH', assigneeName: 'Новиков С.Г.', plannedStartDate: daysAgo(15), plannedEndDate: daysFromNow(10), estimatedHours: 32, progress: 70, tags: 'ТУ,электрика' },
    { title: 'Монтаж временного ограждения стройплощадки', priority: 'NORMAL', assigneeName: 'Попов В.И.', plannedStartDate: daysAgo(20), plannedEndDate: daysAgo(15), estimatedHours: 24, progress: 100, tags: 'подготовка' },
    { title: 'Установка бытового городка', priority: 'NORMAL', assigneeName: 'Попов В.И.', plannedStartDate: daysAgo(18), plannedEndDate: daysAgo(12), estimatedHours: 32, progress: 100, tags: 'подготовка,бытовки' },
    { title: 'Заключение договора с лабораторией на испытания', priority: 'HIGH', assigneeName: 'Лебедев П.К.', plannedStartDate: daysAgo(7), plannedEndDate: daysFromNow(3), estimatedHours: 16, progress: 80, tags: 'качество,лаборатория' },
    { title: 'Закупка бетона М350 на ростверк', priority: 'URGENT', assigneeName: 'Козлова Н.В.', plannedStartDate: daysFromNow(1), plannedEndDate: daysFromNow(5), estimatedHours: 12, progress: 30, tags: 'снабжение,бетон' },
    { title: 'Разработка графика производства работ (Гантт)', priority: 'NORMAL', assigneeName: 'Петров И.С.', plannedStartDate: daysAgo(7), plannedEndDate: daysFromNow(7), estimatedHours: 40, progress: 55, tags: 'планирование,график' },
    { title: 'Проведение вводного инструктажа бригад', priority: 'HIGH', assigneeName: 'Медведев О.Б.', plannedStartDate: daysAgo(2), plannedEndDate: daysFromNow(1), estimatedHours: 16, progress: 75, tags: 'ОТ,инструктаж' },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    // Распределяем по стадиям и статусам
    let stageIdx;
    let status;
    if (task.progress === 100) { stageIdx = 4; status = 'DONE'; }
    else if (task.progress >= 50) { stageIdx = 2; status = 'IN_PROGRESS'; }
    else if (task.progress > 0) { stageIdx = 2; status = 'IN_PROGRESS'; }
    else { stageIdx = 1; status = 'TODO'; }

    const res = await post('/tasks', {
      ...task,
      status,
      projectId: PROJECT_ID,
      stageId: stageIds[stageIdx] || undefined,
    });
    track('tasks', res?.id);
  }
  console.log(`  Создано стадий: ${created.taskStages?.length || 0}, задач: ${created.tasks?.length || 0}`);
}

// ── 4. CRM Лиды ─────────────────────────────────────────────────────────────

async function seedCrmLeads() {
  console.log('\n=== CRM: Лиды ===');

  const leads = [
    { name: 'ЖК "Новая Высота" — инженерные системы', companyName: 'ООО "НоваДев"', email: 'tender@novadev.ru', phone: '+7(495)123-45-67', source: 'Тендерная площадка', expectedRevenue: 450000000, probability: 70, priority: 'HIGH', description: 'Тендер на инженерные системы ЖК, 3 корпуса, 24 этажа. Срок подачи 15.04.2026.' },
    { name: 'Бизнес-центр "Панорама" — фасадные работы', companyName: 'АО "Панорама Девелопмент"', email: 'info@panorama-dev.ru', phone: '+7(495)234-56-78', source: 'Рекомендация', expectedRevenue: 280000000, probability: 85, priority: 'HIGH', description: 'Навесной вентилируемый фасад класса А. Заказчик уже видел наши объекты.' },
    { name: 'Реконструкция ТЦ "Кристалл"', companyName: 'ИП Белов С.Ю.', email: 'belov@crystal-mall.ru', phone: '+7(916)345-67-89', source: 'Входящий звонок', expectedRevenue: 120000000, probability: 40, priority: 'NORMAL', description: 'Реконструкция торгового центра. Этап предпроектной подготовки.' },
    { name: 'Школа на 1100 мест — Госзаказ', companyName: 'Департамент строительства г. Москвы', email: 'depstroy@mos.ru', phone: '+7(495)456-78-90', source: 'Госзакупки', expectedRevenue: 950000000, probability: 30, priority: 'HIGH', description: '44-ФЗ, электронный аукцион. Срок подачи заявки: 01.04.2026.' },
    { name: 'Складской комплекс класса А — Домодедово', companyName: 'ООО "Логистик Парк"', email: 'dev@logistic-park.ru', phone: '+7(495)567-89-01', source: 'Выставка', expectedRevenue: 680000000, probability: 55, priority: 'HIGH', description: 'Склад 45 000 м². Заказчик заинтересован в генподряде.' },
    { name: 'Жилой дом — капитальный ремонт фасада', companyName: 'ТСЖ "Восход"', email: 'predsedatel@voshod-tszh.ru', phone: '+7(903)678-90-12', source: 'Входящий звонок', expectedRevenue: 18000000, probability: 90, priority: 'LOW', description: 'Капремонт фасада 9-этажного дома. Бюджет из фонда капремонта.' },
    { name: 'Поликлиника — г. Химки', companyName: 'Администрация г.о. Химки', email: 'admin@himki.gov.ru', phone: '+7(495)572-00-00', source: 'Госзакупки', expectedRevenue: 520000000, probability: 20, priority: 'NORMAL', description: 'Строительство поликлиники на 350 посещений в смену. Этап ПИР.' },
    { name: 'Апарт-отель "Морской бриз" — Сочи', companyName: 'ООО "Курорт Инвест"', email: 'projects@resort-invest.com', phone: '+7(862)789-01-23', source: 'Сайт', expectedRevenue: 380000000, probability: 45, priority: 'HIGH', description: 'Апарт-отель 12 этажей на первой линии. Заказчик ищет генподрядчика.' },
  ];

  for (const lead of leads) {
    const res = await post('/v1/crm/leads', lead);
    track('crmLeads', res?.id);
  }
  console.log(`  Создано лидов: ${created.crmLeads?.length || 0}`);
}

// ── 5. Тикеты техподдержки ──────────────────────────────────────────────────

async function seedSupportTickets() {
  console.log('\n=== Тикеты техподдержки ===');

  // Create ticket categories first
  const categories = [
    { code: 'TECHNICAL', name: 'Техническая проблема', description: 'Ошибки, баги, сбои в работе системы', slaHours: 4 },
    { code: 'ACCESS', name: 'Доступ и права', description: 'Вопросы по правам доступа, ролям, авторизации', slaHours: 8 },
    { code: 'DOCUMENTS', name: 'Документация', description: 'Проблемы с документами, экспортом, шаблонами', slaHours: 24 },
    { code: 'EQUIPMENT', name: 'Оборудование', description: 'Вопросы по интеграциям с оборудованием, IoT', slaHours: 24 },
    { code: 'SAFETY', name: 'Безопасность', description: 'Вопросы информационной безопасности', slaHours: 2 },
    { code: 'SCHEDULE', name: 'Планирование', description: 'Вопросы по календарям, графикам, Ганту', slaHours: 24 },
    { code: 'OTHER', name: 'Прочее', description: 'Общие вопросы и предложения', slaHours: 48 },
  ];

  for (const cat of categories) {
    await post('/support/kb/categories', cat);
  }
  console.log(`  Создано категорий: ${categories.length}`);

  // Create tickets with correct categories
  const tickets = [
    { subject: 'Не загружается страница финмодели', description: 'При открытии ФМ по проекту "ЖК Олимп" получаю белый экран. Chrome 120, Windows 11. Пробовал очистить кэш — не помогает. В консоли ошибка TypeError.', category: 'TECHNICAL', priority: 'HIGH' },
    { subject: 'Нет доступа к разделу "Финансы"', description: 'У пользователя с ролью "Инженер" нет доступа к разделу финансов, хотя руководитель просил предоставить доступ на чтение.', category: 'ACCESS', priority: 'MEDIUM' },
    { subject: 'Ошибка при экспорте КС-2 в Excel', description: 'Нажимаю "Экспорт" → "Excel", но скачивается пустой файл. Проект: ЖК Олимп, акт КС-2-003. Воспроизводится стабильно.', category: 'DOCUMENTS', priority: 'HIGH' },
    { subject: 'Как настроить интеграцию с IoT-датчиками?', description: 'Установили датчики температуры на стройплощадке. Нужна помощь с подключением к системе.', category: 'EQUIPMENT', priority: 'LOW' },
    { subject: 'Не приходят уведомления на почту', description: 'Настроил email-уведомления в профиле, но письма не приходят уже 3 дня. Почта: petrov@company.ru. Проверил спам — пусто.', category: 'TECHNICAL', priority: 'HIGH' },
    { subject: 'Подозрительная активность в логах', description: 'Обнаружил неизвестные IP-адреса в журнале входов. 5 попыток с IP 185.x.x.x за последний час.', category: 'SAFETY', priority: 'CRITICAL' },
    { subject: 'Гант-диаграмма не отображает зависимости', description: 'Создал зависимости между задачами, но на диаграмме Ганта линии связей не рисуются. Проект "БЦ Горизонт".', category: 'SCHEDULE', priority: 'MEDIUM' },
    { subject: 'Просьба добавить роль "Прораб"', description: 'Текущих ролей недостаточно. Прорабам нужен доступ к задачам, дневным отчётам и дефектам, но без финансов.', category: 'OTHER', priority: 'MEDIUM' },
    { subject: 'Интеграция с 1С: ошибка синхронизации', description: 'При синхронизации контрагентов получаю ошибку "Connection timeout". Связь с сервером 1С есть, пинг проходит. Версия 1С: 8.3.25.', category: 'TECHNICAL', priority: 'CRITICAL' },
    { subject: 'Дашборд загружается дольше 10 секунд', description: 'После добавления 5+ проектов главная панель грузится очень долго. Раньше было 1-2 секунды.', category: 'TECHNICAL', priority: 'MEDIUM' },
    { subject: 'Нужны шаблоны КС-6а и М-29', description: 'В системе нет готовых шаблонов для форм КС-6а (журнал учёта выполненных работ) и М-29 (отчёт о расходе материалов).', category: 'DOCUMENTS', priority: 'LOW' },
    { subject: 'Сброс пароля не работает', description: 'При нажатии "Забыли пароль?" письмо со ссылкой для сброса не приходит. Пробовал для трёх разных пользователей.', category: 'ACCESS', priority: 'HIGH' },
  ];

  const createdTicketIds = [];
  for (const ticket of tickets) {
    const res = await post('/support/tickets', ticket);
    if (res?.id) createdTicketIds.push(res.id);
    track('tickets', res?.id);
  }
  console.log(`  Создано тикетов: ${createdTicketIds.length}`);

  // Add comments to first few tickets
  const ticketComments = [
    { ticketIdx: 0, comments: [
      { content: 'Воспроизвёл проблему. Связано с отсутствием бюджетных позиций. Исправляю.', isInternal: true },
      { content: 'Исправление выпущено в версии 2.4.1. Пожалуйста, обновите страницу (Ctrl+Shift+R).', isInternal: false },
    ]},
    { ticketIdx: 4, comments: [
      { content: 'Проверил SMTP-логи — сервер отклоняет письма. Скорее всего проблема в SPF-записи домена.', isInternal: true },
      { content: 'Передал в отдел инфраструктуры. Ожидаемое время решения — до конца рабочего дня.', isInternal: false },
    ]},
    { ticketIdx: 5, comments: [
      { content: 'СРОЧНО: Заблокировал IP в файрволе. Начинаю расследование.', isInternal: true },
      { content: 'Все подозрительные сессии заблокированы. Пароли затронутых пользователей сброшены. Рекомендуем включить 2FA.', isInternal: false },
    ]},
    { ticketIdx: 8, comments: [
      { content: 'Проблема в таймауте соединения. Увеличил timeout до 30с в конфигурации интеграции.', isInternal: true },
    ]},
  ];

  for (const tc of ticketComments) {
    const ticketId = createdTicketIds[tc.ticketIdx];
    if (!ticketId) continue;
    for (const comment of tc.comments) {
      await post(`/support/tickets/${ticketId}/comments`, comment);
    }
  }
  console.log(`  Добавлено комментариев: ${ticketComments.reduce((sum, tc) => sum + tc.comments.length, 0)}`);

  // Move some tickets to different statuses
  const statusChanges = [
    { idx: 0, action: 'start' },   // IN_PROGRESS
    { idx: 0, action: 'resolve' }, // RESOLVED
    { idx: 4, action: 'start' },   // IN_PROGRESS
    { idx: 5, action: 'start' },   // IN_PROGRESS
    { idx: 5, action: 'resolve' }, // RESOLVED
    { idx: 5, action: 'close' },   // CLOSED
    { idx: 8, action: 'start' },   // IN_PROGRESS
  ];

  for (const sc of statusChanges) {
    const ticketId = createdTicketIds[sc.idx];
    if (!ticketId) continue;
    await request('PATCH', `/support/tickets/${ticketId}/${sc.action}`);
  }
  console.log('  Обновлены статусы тикетов');
}

// ── 6. Мессенджер: каналы и сообщения ───────────────────────────────────────

async function seedMessaging() {
  console.log('\n=== Мессенджер ===');

  const channels = [
    { name: 'Общий', description: 'Общий канал для всей компании', channelType: 'PUBLIC' },
    { name: 'ЖК Олимп — Координация', description: 'Координация работ по проекту ЖК Олимп', channelType: 'PUBLIC', projectId: PROJECT_ID },
    { name: 'Снабжение — Срочные заявки', description: 'Канал для срочных заявок на материалы', channelType: 'PUBLIC' },
    { name: 'ОТ и ТБ — Инциденты', description: 'Оповещения об инцидентах на площадках', channelType: 'PUBLIC' },
    { name: 'IT-поддержка', description: 'Вопросы по системе и техническая поддержка', channelType: 'PUBLIC' },
  ];

  for (const ch of channels) {
    const res = await post('/messaging/channels', ch);
    track('channels', res?.id);

    // Добавляем сообщения в каждый канал
    if (res?.id) {
      const messages = getMessagesForChannel(ch.name);
      for (const msg of messages) {
        await post(`/messaging/channels/${res.id}/messages`, { content: msg });
      }
    }
  }
  console.log(`  Создано каналов: ${created.channels?.length || 0}`);
}

function getMessagesForChannel(channelName) {
  const map = {
    'Общий': [
      'Доброе утро! Напоминаю — завтра в 10:00 совещание по итогам недели.',
      'Коллеги, обновили систему. Если заметите баги — пишите в IT-поддержку.',
      'Поздравляем команду ЖК Олимп с завершением нулевого цикла! 🎉',
    ],
    'ЖК Олимп — Координация': [
      'Бетон на ростверк заказан на завтра, 8:00. Миксер будет к 7:30.',
      'Геодезист подтвердил отметки по осям А-Г. Можно начинать армирование.',
      'Внимание: завтра ожидается дождь. Подготовьте укрывной материал для арматуры.',
      'Лаборатория подтвердила — прочность бетона на кубиках соответствует М350.',
      'Отчёт за сегодня: выполнено армирование ростверка на 80%, бетонирование завтра.',
    ],
    'Снабжение — Срочные заявки': [
      'Срочно нужна арматура d12 A500C — 2 тонны. Поставщик "СтройМонтаж" задерживает.',
      'Заявка на опалубку PERI — 200 м² на следующую неделю. Контакт: Кузнецов.',
      'Кабель ВВГнг 3х2.5 — 500 м. Нужен к понедельнику на площадку.',
    ],
    'ОТ и ТБ — Инциденты': [
      '⚠️ Мелкий инцидент на площадке ЖК Олимп: рабочий получил порез руки. Первая помощь оказана на месте.',
      'Напоминание: все бригады должны пройти повторный инструктаж по работе на высоте до пятницы.',
      'Проверка СИЗ проведена. 3 каски заменены, 5 жилетов выданы новым рабочим.',
    ],
    'IT-поддержка': [
      'Выложили обновление v2.5.0. Добавлен экспорт КС-2 в PDF и улучшена ФМ.',
      'Если у вас проблемы с авторизацией — попробуйте очистить кэш браузера.',
    ],
  };
  return map[channelName] || ['Тестовое сообщение'];
}

// ── 7. Охрана труда: инциденты и инструктажи ────────────────────────────────

async function seedSafety() {
  console.log('\n=== Охрана труда ===');

  // Инциденты
  const incidents = [
    { incidentDate: `${daysAgo(15)}T09:30:00`, severity: 'MINOR', incidentType: 'INJURY', description: 'Монтажник поцарапал руку при работе с арматурой. Оказана первая помощь на месте. Работник вернулся к работе.', locationDescription: 'Секция 1, подвал', reportedByName: 'Медведев О.Б.', injuredEmployeeName: 'Рабочий Иванченко С.А.', workDaysLost: 0, medicalTreatment: false, hospitalization: false, projectId: PROJECT_ID },
    { incidentDate: `${daysAgo(8)}T14:15:00`, severity: 'MINOR', incidentType: 'NEAR_MISS', description: 'Предмет упал с 3-го этажа в зону прохода. Никто не пострадал. Зона была ограждена, но крепление лесов ослабло.', locationDescription: 'Секция 2, фасад', reportedByName: 'Козлов А.М.', workDaysLost: 0, medicalTreatment: false, hospitalization: false, projectId: PROJECT_ID },
    { incidentDate: `${daysAgo(3)}T11:00:00`, severity: 'SERIOUS', incidentType: 'FALL', description: 'Рабочий споткнулся на лестнице и ушиб колено. Направлен в травмпункт. Больничный лист на 5 дней.', locationDescription: 'Секция 1, лестничная клетка', reportedByName: 'Медведев О.Б.', injuredEmployeeName: 'Рабочий Федоров В.Г.', workDaysLost: 5, medicalTreatment: true, hospitalization: false, projectId: PROJECT_ID },
  ];

  for (const inc of incidents) {
    const res = await post('/safety/incidents', inc);
    track('incidents', res?.id);
  }

  // Инструктажи
  const trainings = [
    { title: 'Вводный инструктаж — новые сотрудники (март 2026)', trainingType: 'INITIAL', date: daysAgo(20), instructorName: 'Медведев О.Б.', topics: 'Общие правила ОТ,Пожарная безопасность,Оказание первой помощи,СИЗ', duration: 180, participants: JSON.stringify(['Иванченко С.А.','Федоров В.Г.','Петренко К.Н.','Сидорчук А.П.','Борисова Л.М.']), projectId: PROJECT_ID },
    { title: 'Инструктаж по работе на высоте', trainingType: 'SPECIAL', date: daysAgo(10), instructorName: 'Медведев О.Б.', topics: 'Работа на высоте более 1.8м,Использование страховочных систем,Монтаж лесов', duration: 120, participants: JSON.stringify(['Бригада №4 — Смирнов','Козлов','Петров','Сидоров','Кузнецов','Попов','Новиков','Волков']), projectId: PROJECT_ID },
    { title: 'Повторный инструктаж (квартальный)', trainingType: 'PERIODIC', date: daysAgo(5), instructorName: 'Медведев О.Б.', topics: 'Электробезопасность,Работа в стеснённых условиях,Правила складирования', duration: 90, participants: JSON.stringify(['Бригада №1','Бригада №2','Бригада №3','Бригада №4']), projectId: PROJECT_ID },
    { title: 'Целевой инструктаж — бетонирование ростверка', trainingType: 'SPECIAL', date: daysAgo(1), instructorName: 'Козлов А.М.', topics: 'Работа с бетононасосом,Вибрирование бетона,Техника безопасности при бетонировании', duration: 60, participants: JSON.stringify(['Бригада №2 — 12 человек']), projectId: PROJECT_ID },
  ];

  for (const tr of trainings) {
    const res = await post('/safety/trainings', tr);
    track('trainings', res?.id);
  }
  console.log(`  Создано инцидентов: ${created.incidents?.length || 0}, инструктажей: ${created.trainings?.length || 0}`);
}

// ── 8. Наряд-заказы и дневные отчёты ────────────────────────────────────────

async function seedOps() {
  console.log('\n=== Производство: наряд-заказы и отчёты ===');

  const workOrders = [
    { title: 'Устройство буронабивных свай секция 1', description: 'Бурение и бетонирование 48 свай d600 длиной 12м', workType: 'FOUNDATION', location: 'Секция 1, пятно застройки', plannedStart: daysAgo(14), plannedEnd: daysFromNow(7), priority: 'HIGH' },
    { title: 'Армирование ростверка секция 1', description: 'Монтаж арматурных каркасов ростверка по осям А-Д', workType: 'FOUNDATION', location: 'Секция 1, подвал', plannedStart: daysAgo(3), plannedEnd: daysFromNow(10), priority: 'HIGH' },
    { title: 'Подготовка основания под временные дороги', description: 'Планировка, укладка геотекстиля и щебня фр. 40-70', workType: 'EARTHWORK', location: 'Проезд по периметру', plannedStart: daysAgo(21), plannedEnd: daysAgo(14), priority: 'MEDIUM' },
    { title: 'Монтаж временного электроснабжения', description: 'Установка ТП-250, прокладка кабеля ВВГнг 4х16 до щитовых', workType: 'ELECTRICAL', location: 'Стройплощадка, ввод', plannedStart: daysAgo(18), plannedEnd: daysAgo(10), priority: 'HIGH' },
    { title: 'Обратная засыпка пазух котлована', description: 'Засыпка песком с послойным уплотнением, толщина слоя 30 см', workType: 'EARTHWORK', location: 'Секция 1, периметр', plannedStart: daysFromNow(14), plannedEnd: daysFromNow(21), priority: 'MEDIUM' },
  ];

  for (const wo of workOrders) {
    const res = await post('/ops/work-orders', { ...wo, projectId: PROJECT_ID });
    track('workOrders', res?.id);

    // Добавляем дневной отчёт к первым 3 заказам
    if (res?.id && workOrders.indexOf(wo) < 3) {
      const report = await post('/ops/daily-reports', {
        workOrderId: res.id,
        reportDate: daysAgo(1),
        workDone: `Выполнено: ${wo.title.toLowerCase()} — объём за день согласно плану.`,
        issues: workOrders.indexOf(wo) === 0 ? 'Задержка поставки бетона на 2 часа.' : null,
        materialsUsed: JSON.stringify([
          { name: 'Бетон М350', quantity: 12, unit: 'м³' },
          { name: 'Арматура A500C d16', quantity: 1.5, unit: 'т' },
        ]),
        laborHours: 64,
        equipmentHours: 8,
        weatherImpact: 'NONE',
      });
      track('dailyReports', report?.id);
    }
  }

  // Дефекты
  const defects = [
    { title: 'Трещина в бетоне ростверка (ось Б-3)', description: 'Обнаружена усадочная трещина шириной 0.3мм в бетоне ростверка. Требуется инъектирование.', location: 'Секция 1, ось Б, пересечение 3', severity: 'MEDIUM', assignedToId: ADMIN_USER_ID || undefined },
    { title: 'Отклонение оси сваи №12 от проектного положения', description: 'Свая №12 отклонена на 45мм от проектного положения (допуск 30мм). Необходимо решение проектировщика.', location: 'Секция 1, ось В-2', severity: 'HIGH' },
    { title: 'Некачественный защитный слой арматуры', description: 'Защитный слой 15мм вместо требуемых 40мм. Необходима установка дополнительных фиксаторов.', location: 'Секция 1, ростверк, ось А-1', severity: 'MEDIUM' },
  ];

  for (const defect of defects) {
    const res = await post('/ops/defects', { ...defect, projectId: PROJECT_ID });
    track('defects', res?.id);
  }

  console.log(`  Создано нарядов: ${created.workOrders?.length || 0}, отчётов: ${created.dailyReports?.length || 0}, дефектов: ${created.defects?.length || 0}`);
}

// ── 9. Обследование площадки ────────────────────────────────────────────────

async function seedSiteAssessments() {
  console.log('\n=== Обследование площадки ===');

  const assessments = [
    {
      projectId: PROJECT_ID,
      assessmentDate: daysAgo(60),
      assessorName: 'Козлов А.М.',
      siteAddress: 'г. Москва, ул. Олимпийская, вл. 15',
      latitude: 55.7558,
      longitude: 37.6176,
      accessRoads: true,
      powerSupplyAvailable: true,
      waterSupplyAvailable: true,
      sewageAvailable: false,
      groundConditionsOk: true,
      noEnvironmentalRestrictions: true,
      cranePlacementPossible: true,
      materialStorageArea: true,
      workersCampArea: true,
      neighboringBuildingsSafe: true,
      zoningCompliant: true,
      geodeticMarksPresent: true,
      groundType: 'Суглинок, водонасыщенный на глубине 4м',
      siteAreaSqm: 28500,
      maxBuildingHeightM: 75,
      distanceToPowerM: 120,
      distanceToWaterM: 45,
      observations: 'Площадка ровная, без значительного уклона. Существующие коммуникации: водопровод d200 проходит по западной границе. Высоковольтная ЛЭП 10кВ на расстоянии 120м.',
      risksIdentified: 'Высокий уровень грунтовых вод (4м). Необходимо водопонижение при устройстве котлована. Соседнее здание (жилой дом) на расстоянии 18м — контроль вибрации при забивке свай.',
    },
  ];

  for (const sa of assessments) {
    const res = await post('/site-assessments', sa);
    track('siteAssessments', res?.id);
  }
  console.log(`  Создано обследований: ${created.siteAssessments?.length || 0}`);
}

// ── 10. Преквалификация подрядчиков ─────────────────────────────────────────

async function seedPrequalifications() {
  console.log('\n=== Преквалификация ===');

  const prequalifications = [
    { companyName: 'ООО "СтройМонтаж"', inn: '7701234567', contactPerson: 'Кузнецов Д.В.', contactEmail: 'kuzn@stroymontazh.ru', contactPhone: '+7(495)111-22-33', workType: 'Монолитные работы', annualRevenue: 850000000, yearsInBusiness: 12, hasNoDebts: true, hasCreditLine: true, similarProjectsCount: 8, maxProjectValue: 500000000, hasReferences: true, hasSroMembership: true, sroNumber: 'СРО-С-001-2024', hasIsoCertification: true, hasSafetyCertification: true, ltir: 0.5, hasSafetyPlan: true, noFatalIncidents3y: true, hasLiabilityInsurance: true, insuranceCoverage: 100000000, canProvideBankGuarantee: true, employeeCount: 340, hasOwnEquipment: true, hasOwnTransport: true, notes: 'Надёжный подрядчик, работали на ЖК "Созвездие".' },
    { companyName: 'АО "ТехноСтрой Инжиниринг"', inn: '7702345678', contactPerson: 'Орлова Е.С.', contactEmail: 'orlova@tehnostroy.ru', contactPhone: '+7(495)222-33-44', workType: 'Инженерные системы (ОВиК, ВК, ЭО)', annualRevenue: 1200000000, yearsInBusiness: 18, hasNoDebts: true, hasCreditLine: true, similarProjectsCount: 15, maxProjectValue: 800000000, hasReferences: true, hasSroMembership: true, sroNumber: 'СРО-С-005-2024', hasIsoCertification: true, hasSafetyCertification: true, ltir: 0.3, hasSafetyPlan: true, noFatalIncidents3y: true, hasLiabilityInsurance: true, insuranceCoverage: 200000000, canProvideBankGuarantee: true, employeeCount: 520, hasOwnEquipment: true, hasOwnTransport: true, notes: 'Крупный подрядчик, есть собственное проектное бюро.' },
    { companyName: 'ООО "ЭлектроПроф"', inn: '7703456789', contactPerson: 'Соколов И.Р.', contactEmail: 'sokolov@electro-prof.ru', contactPhone: '+7(495)333-44-55', workType: 'Электромонтажные работы', annualRevenue: 320000000, yearsInBusiness: 8, hasNoDebts: true, hasCreditLine: false, similarProjectsCount: 5, maxProjectValue: 150000000, hasReferences: true, hasSroMembership: true, sroNumber: 'СРО-С-012-2024', hasIsoCertification: false, hasSafetyCertification: true, ltir: 0.8, hasSafetyPlan: true, noFatalIncidents3y: true, hasLiabilityInsurance: true, insuranceCoverage: 50000000, canProvideBankGuarantee: false, employeeCount: 85, hasOwnEquipment: true, hasOwnTransport: false, notes: 'Средний подрядчик. Хорошие отзывы по электрике.' },
    { companyName: 'ООО "ФасадМастер"', inn: '5002345678', contactPerson: 'Титов А.Н.', contactEmail: 'titov@fasadmaster.ru', contactPhone: '+7(495)444-55-66', workType: 'Фасадные работы (НВФ, штукатурка)', annualRevenue: 450000000, yearsInBusiness: 10, hasNoDebts: false, hasCreditLine: true, similarProjectsCount: 12, maxProjectValue: 200000000, hasReferences: true, hasSroMembership: true, sroNumber: 'СРО-С-018-2024', hasIsoCertification: true, hasSafetyCertification: true, ltir: 1.2, hasSafetyPlan: true, noFatalIncidents3y: false, hasLiabilityInsurance: true, insuranceCoverage: 80000000, canProvideBankGuarantee: true, employeeCount: 150, hasOwnEquipment: true, hasOwnTransport: true, notes: 'Был инцидент со смертельным исходом в 2024 году. Требуется дополнительный контроль ОТ.' },
  ];

  for (const pq of prequalifications) {
    const res = await post('/prequalifications', pq);
    track('prequalifications', res?.id);
  }
  console.log(`  Создано преквалификаций: ${created.prequalifications?.length || 0}`);
}

// ── 11. Исполнительная документация (Submittals / ПТО) ──────────────────────

async function seedSubmittals() {
  console.log('\n=== Исполнительная документация (ПТО) ===');

  const submittals = [
    { title: 'Рабочие чертежи КЖ — секция 1 (ростверк)', submittalType: 'SHOP_DRAWING', description: 'Комплект рабочих чертежей на ростверк секции 1, включая армирование и закладные.', dueDate: daysFromNow(5) },
    { title: 'Сертификат на арматуру A500C d16 (партия 2026-03)', submittalType: 'CERTIFICATE', description: 'Сертификат соответствия и паспорт качества на арматуру от поставщика ООО "СтройМонтаж".', dueDate: daysFromNow(2) },
    { title: 'Протокол испытаний бетона М350 (февраль 2026)', submittalType: 'TEST_REPORT', description: 'Результаты испытаний контрольных кубиков бетона за февраль. Лаборатория "СтройЛаб".', dueDate: daysAgo(3) },
    { title: 'Состав бетонной смеси М350 W8 F200', submittalType: 'DESIGN_MIX', description: 'Подбор состава бетонной смеси для ростверка. Требования: М350, W8, F200.', dueDate: daysAgo(10) },
    { title: 'Расчёт несущей способности свай', submittalType: 'CALCULATION', description: 'Статический расчёт несущей способности буронабивных свай d600 L=12м.', dueDate: daysAgo(30) },
    { title: 'Образец фасадной плитки "Керамогранит 600х600"', submittalType: 'SAMPLE', description: 'Образец керамогранита для фасада: цвет "Серый антрацит", 600х600х10мм.', dueDate: daysFromNow(15) },
    { title: 'Данные о материале — кабель ВВГнг-LS 3х2.5', submittalType: 'PRODUCT_DATA', description: 'Техническая документация, сертификат пожарной безопасности, протокол испытаний.', dueDate: daysFromNow(7) },
  ];

  for (const sub of submittals) {
    const res = await post('/pto/submittals', { ...sub, projectId: PROJECT_ID });
    track('submittals', res?.id);
  }
  console.log(`  Создано документов ПТО: ${created.submittals?.length || 0}`);
}

// ── 12. КС-2 (Закрытие) ────────────────────────────────────────────────────

async function seedKs2() {
  console.log('\n=== Акты КС-2 ===');

  const ks2Docs = [
    {
      number: 'КС-2-001',
      documentDate: daysAgo(30),
      notes: 'Акт за январь 2026 — подготовительные работы',
      lines: [
        { sequence: 1, name: 'Планировка территории бульдозером', quantity: 2850, unitPrice: 120, unitOfMeasure: 'м²' },
        { sequence: 2, name: 'Устройство временных дорог (щебень фр. 40-70)', quantity: 450, unitPrice: 1800, unitOfMeasure: 'м²' },
        { sequence: 3, name: 'Установка временного ограждения', quantity: 620, unitPrice: 950, unitOfMeasure: 'п.м.' },
      ],
    },
    {
      number: 'КС-2-002',
      documentDate: daysAgo(15),
      notes: 'Акт за февраль 2026 — свайные работы',
      lines: [
        { sequence: 1, name: 'Бурение скважин d600 L=12м', quantity: 24, unitPrice: 85000, unitOfMeasure: 'шт' },
        { sequence: 2, name: 'Армирование свай (каркасы d600)', quantity: 24, unitPrice: 35000, unitOfMeasure: 'шт' },
        { sequence: 3, name: 'Бетонирование свай М350', quantity: 81.4, unitPrice: 12500, unitOfMeasure: 'м³' },
        { sequence: 4, name: 'Срубка голов свай', quantity: 24, unitPrice: 8500, unitOfMeasure: 'шт' },
      ],
    },
    {
      number: 'КС-2-003',
      documentDate: daysAgo(5),
      notes: 'Акт за март 2026 — ростверк',
      lines: [
        { sequence: 1, name: 'Устройство опалубки ростверка', quantity: 380, unitPrice: 2200, unitOfMeasure: 'м²' },
        { sequence: 2, name: 'Армирование ростверка (A500C)', quantity: 18.5, unitPrice: 95000, unitOfMeasure: 'т' },
        { sequence: 3, name: 'Бетонирование ростверка М350 W8', quantity: 245, unitPrice: 14500, unitOfMeasure: 'м³' },
        { sequence: 4, name: 'Гидроизоляция ростверка (обмазочная)', quantity: 760, unitPrice: 850, unitOfMeasure: 'м²' },
      ],
    },
  ];

  for (const ks2 of ks2Docs) {
    const res = await post('/ks2', {
      number: ks2.number,
      documentDate: ks2.documentDate,
      projectId: PROJECT_ID,
      notes: ks2.notes,
    });
    track('ks2', res?.id);

    if (res?.id) {
      for (const line of ks2.lines) {
        await post(`/ks2/${res.id}/lines`, line);
      }
    }
  }
  console.log(`  Создано актов КС-2: ${created.ks2?.length || 0}`);
}

// ── 13. Автопарк: техника и путевые листы ───────────────────────────────────

async function seedFleet() {
  console.log('\n=== Автопарк ===');

  const vehicles = [
    { licensePlate: 'А 123 МО 77', make: 'КАМАЗ', model: '65115 (самосвал)', year: 2022, vehicleType: 'TRUCK', fuelType: 'DIESEL', fuelConsumptionRate: 32, currentMileage: 45200, notes: 'Самосвал 15т, используется для вывоза грунта' },
    { licensePlate: 'В 456 КР 50', make: 'Liebherr', model: 'LTM 1100-4.2', year: 2021, vehicleType: 'CRANE', fuelType: 'DIESEL', fuelConsumptionRate: 45, currentHours: 3200, notes: 'Автокран 100т, основной кран на площадке' },
    { licensePlate: 'Е 789 СТ 77', make: 'CAT', model: '320 GC', year: 2023, vehicleType: 'EXCAVATOR', fuelType: 'DIESEL', fuelConsumptionRate: 22, currentHours: 1800, notes: 'Гусеничный экскаватор, 20т' },
    { licensePlate: 'К 012 ПР 77', make: 'Toyota', model: 'Land Cruiser 300', year: 2024, vehicleType: 'CAR', fuelType: 'DIESEL', fuelConsumptionRate: 12, currentMileage: 18500, notes: 'Служебный автомобиль руководителя проекта' },
    { licensePlate: 'М 345 БТ 50', make: 'Putzmeister', model: 'BSA 1005D', year: 2022, vehicleType: 'OTHER', fuelType: 'DIESEL', fuelConsumptionRate: 18, currentHours: 950, notes: 'Стационарный бетононасос' },
    { licensePlate: 'Н 678 ГН 77', make: 'Atlas Copco', model: 'XAS 186', year: 2023, vehicleType: 'COMPRESSOR', fuelType: 'DIESEL', fuelConsumptionRate: 15, currentHours: 620, notes: 'Компрессор для пневмоинструмента' },
  ];

  for (const v of vehicles) {
    const res = await post('/fleet/vehicles', { ...v, currentProjectId: PROJECT_ID });
    track('vehicles', res?.id);

    // Создаём путевой лист для первых 3 единиц
    if (res?.id && vehicles.indexOf(v) < 3) {
      const waybill = await post('/fleet/waybills', {
        vehicleId: res.id,
        projectId: PROJECT_ID,
        waybillDate: daysAgo(1),
        driverName: ['Степанов А.И.', 'Николаев Б.С.', 'Тарасов Г.Д.'][vehicles.indexOf(v)],
        routeDescription: `Площадка ЖК Олимп → ${['полигон ТБО', 'площадка', 'котлован'][vehicles.indexOf(v)]}`,
        departurePoint: 'г. Москва, ул. Олимпийская, вл. 15',
        destinationPoint: ['Полигон ТБО "Кучино"', 'Площадка, секция 1', 'Котлован, секция 1'][vehicles.indexOf(v)],
        mileageStart: v.currentMileage || 0,
        mileageEnd: (v.currentMileage || 0) + 85,
        fuelDispensed: v.fuelConsumptionRate * 3,
        fuelConsumed: v.fuelConsumptionRate * 2.8,
        medicalExamPassed: true,
        medicalExaminer: 'Петрова Н.К.',
        mechanicApproved: true,
        mechanicName: 'Григорьев С.В.',
        notes: 'Работа в штатном режиме',
      });
      track('waybills', waybill?.id);
    }
  }
  console.log(`  Создано техники: ${created.vehicles?.length || 0}, путевых: ${created.waybills?.length || 0}`);
}

// ── 14. Сотрудники (HR) ──────────────────────────────────────────────────────

async function seedEmployees() {
  console.log('\n=== Сотрудники (HR) ===');

  const employees = [
    { firstName: 'Иван', lastName: 'Петров', middleName: 'Сергеевич', position: 'Руководитель проекта', hireDate: '2020-03-15', phone: '+7(916)100-11-22', email: 'petrov@privod.ru', hourlyRate: 3500, monthlyRate: 280000, inn: '771234567890', snils: '123-456-789 01' },
    { firstName: 'Алексей', lastName: 'Козлов', middleName: 'Михайлович', position: 'Главный инженер проекта (ГИП)', hireDate: '2019-06-01', phone: '+7(916)200-22-33', email: 'kozlov@privod.ru', hourlyRate: 3200, monthlyRate: 250000, inn: '771234567891', snils: '123-456-789 02' },
    { firstName: 'Максим', lastName: 'Сидоров', middleName: 'Николаевич', position: 'Начальник участка', hireDate: '2021-01-10', phone: '+7(916)300-33-44', email: 'sidorov@privod.ru', hourlyRate: 2800, monthlyRate: 220000 },
    { firstName: 'Дмитрий', lastName: 'Кузнецов', middleName: 'Васильевич', position: 'Прораб', hireDate: '2022-04-20', phone: '+7(916)400-44-55', email: 'kuznecov@privod.ru', hourlyRate: 2200, monthlyRate: 180000 },
    { firstName: 'Олег', lastName: 'Медведев', middleName: 'Борисович', position: 'Инженер по охране труда', hireDate: '2020-09-01', phone: '+7(916)500-55-66', email: 'medvedev@privod.ru', hourlyRate: 2000, monthlyRate: 160000 },
    { firstName: 'Роман', lastName: 'Волков', middleName: 'Андреевич', position: 'Инженер ПТО', hireDate: '2023-02-15', phone: '+7(916)600-66-77', email: 'volkov@privod.ru', hourlyRate: 1800, monthlyRate: 140000 },
    { firstName: 'Наталья', lastName: 'Козлова', middleName: 'Владимировна', position: 'Начальник ОМТС', hireDate: '2021-07-01', phone: '+7(916)700-77-88', email: 'kozlova@privod.ru', hourlyRate: 2500, monthlyRate: 200000 },
    { firstName: 'Елена', lastName: 'Морозова', middleName: 'Александровна', position: 'Юрист', hireDate: '2022-01-10', phone: '+7(916)800-88-99', email: 'morozova@privod.ru', hourlyRate: 2300, monthlyRate: 185000 },
    { firstName: 'Сергей', lastName: 'Новиков', middleName: 'Геннадьевич', position: 'Инженер-электрик', hireDate: '2023-05-20', phone: '+7(916)900-99-00', email: 'novikov@privod.ru', hourlyRate: 2000, monthlyRate: 160000 },
    { firstName: 'Павел', lastName: 'Лебедев', middleName: 'Константинович', position: 'Инженер ОТК (контроль качества)', hireDate: '2022-08-01', phone: '+7(916)010-10-10', email: 'lebedev@privod.ru', hourlyRate: 1900, monthlyRate: 150000 },
    { firstName: 'Виктор', lastName: 'Попов', middleName: 'Иванович', position: 'Мастер СМР', hireDate: '2021-11-15', phone: '+7(916)020-20-20', email: 'popov@privod.ru', hourlyRate: 2000, monthlyRate: 160000 },
    { firstName: 'Анна', lastName: 'Смирнова', middleName: 'Дмитриевна', position: 'Сметчик', hireDate: '2023-03-01', phone: '+7(916)030-30-30', email: 'smirnova@privod.ru', hourlyRate: 2100, monthlyRate: 170000 },
  ];

  for (const emp of employees) {
    const res = await post('/employees', emp);
    track('employees', res?.id);
  }
  console.log(`  Создано сотрудников: ${created.employees?.length || 0}`);
}

// ── 15. Контракты ──────────────────────────────────────────────────────────────

async function seedContracts() {
  console.log('\n=== Контракты ===');

  const contracts = [
    { name: 'Генподрядный договор — ЖК "Олимп"', direction: 'CLIENT', contractDate: daysAgo(90), partnerName: 'ООО "ДевелопИнвест"', projectId: PROJECT_ID, amount: 1850000000, vatRate: 20, paymentTerms: '30 дней после подписания КС-2/КС-3', retentionPercent: 5, prepaymentPercent: 15, paymentDelayDays: 30, guaranteePeriodMonths: 60, notes: 'Основной генподрядный контракт на строительство ЖК' },
    { name: 'Субподряд — монолитные работы', direction: 'CONTRACTOR', contractDate: daysAgo(60), partnerName: 'ООО "СтройМонтаж"', projectId: PROJECT_ID, amount: 420000000, vatRate: 20, paymentTerms: '15 дней после КС-2', retentionPercent: 5, prepaymentPercent: 10, paymentDelayDays: 15, guaranteePeriodMonths: 36, notes: 'Субподряд на монолитные работы (фундамент, каркас)' },
    { name: 'Договор поставки — арматура A500C', direction: 'CONTRACTOR', contractDate: daysAgo(45), partnerName: 'ПАО "Стальконструкция"', projectId: PROJECT_ID, amount: 85000000, vatRate: 20, paymentTerms: 'Предоплата 100% за партию', prepaymentPercent: 100, paymentDelayDays: 0, notes: 'Рамочный договор на поставку арматуры' },
    { name: 'Субподряд — электромонтаж', direction: 'CONTRACTOR', contractDate: daysAgo(30), partnerName: 'ООО "ЭлектроПроф"', projectId: PROJECT_ID, amount: 195000000, vatRate: 20, paymentTerms: '20 дней после КС-2', retentionPercent: 3, prepaymentPercent: 10, paymentDelayDays: 20, guaranteePeriodMonths: 36 },
    { name: 'Договор аренды — автокран Liebherr LTM 1100', direction: 'CONTRACTOR', contractDate: daysAgo(75), partnerName: 'ИП Смирнов А.В. (бетон)', projectId: PROJECT_ID, amount: 12000000, vatRate: 0, paymentTerms: 'Ежемесячно до 5 числа', paymentDelayDays: 5, notes: 'Аренда автокрана 100т с экипажем' },
    { name: 'Субподряд — ОВиК (отопление, вентиляция, кондиционирование)', direction: 'CONTRACTOR', contractDate: daysAgo(15), partnerName: 'АО "ТехноСтрой Инжиниринг"', projectId: PROJECT_ID, amount: 310000000, vatRate: 20, paymentTerms: '20 дней после КС-2', retentionPercent: 5, prepaymentPercent: 10, paymentDelayDays: 20, guaranteePeriodMonths: 24 },
  ];

  for (const contract of contracts) {
    const res = await post('/contracts', contract);
    track('contracts', res?.id);
  }
  console.log(`  Создано контрактов: ${created.contracts?.length || 0}`);
}

// ── 16. Счета (Invoices) ─────────────────────────────────────────────────────

async function seedInvoices() {
  console.log('\n=== Счета ===');

  const invoices = [
    { invoiceDate: daysAgo(25), dueDate: daysFromNow(5), projectId: PROJECT_ID, partnerName: 'ООО "СтройМонтаж"', invoiceType: 'RECEIVED', subtotal: 35000000, vatRate: 20, totalAmount: 42000000, notes: 'Счёт за монолитные работы — январь 2026' },
    { invoiceDate: daysAgo(20), dueDate: daysFromNow(10), projectId: PROJECT_ID, partnerName: 'ПАО "Стальконструкция"', invoiceType: 'RECEIVED', subtotal: 12500000, vatRate: 20, totalAmount: 15000000, notes: 'Счёт за арматуру A500C — партия 1 (48 тонн)' },
    { invoiceDate: daysAgo(15), dueDate: daysFromNow(15), projectId: PROJECT_ID, partnerName: 'ООО "ЭлектроПроф"', invoiceType: 'RECEIVED', subtotal: 8000000, vatRate: 20, totalAmount: 9600000, notes: 'Аванс по договору электромонтажа' },
    { invoiceDate: daysAgo(30), dueDate: daysAgo(0), projectId: PROJECT_ID, partnerName: 'ООО "ДевелопИнвест"', invoiceType: 'ISSUED', subtotal: 58000000, vatRate: 20, totalAmount: 69600000, notes: 'Счёт заказчику за подготовительные работы (КС-2-001)' },
    { invoiceDate: daysAgo(10), dueDate: daysFromNow(20), projectId: PROJECT_ID, partnerName: 'ООО "ДевелопИнвест"', invoiceType: 'ISSUED', subtotal: 145000000, vatRate: 20, totalAmount: 174000000, notes: 'Счёт заказчику за свайные работы (КС-2-002)' },
    { invoiceDate: daysAgo(5), dueDate: daysFromNow(25), projectId: PROJECT_ID, partnerName: 'ИП Смирнов А.В. (бетон)', invoiceType: 'RECEIVED', subtotal: 2000000, vatRate: 0, totalAmount: 2000000, notes: 'Аренда автокрана — февраль 2026' },
    { invoiceDate: daysAgo(3), dueDate: daysFromNow(27), projectId: PROJECT_ID, partnerName: 'ООО "КлиматВент"', invoiceType: 'RECEIVED', subtotal: 4500000, vatRate: 20, totalAmount: 5400000, notes: 'Поставка воздуховодов и вентоборудования' },
    { invoiceDate: daysAgo(1), dueDate: daysFromNow(29), projectId: PROJECT_ID, partnerName: 'ООО "Сантехмонтаж Плюс"', invoiceType: 'RECEIVED', subtotal: 3200000, vatRate: 20, totalAmount: 3840000, notes: 'Авансовый счёт на трубную продукцию' },
  ];

  for (const inv of invoices) {
    const res = await post('/invoices', inv);
    track('invoices', res?.id);
  }
  console.log(`  Создано счетов: ${created.invoices?.length || 0}`);
}

// ── 17. Сметы ────────────────────────────────────────────────────────────────

async function seedEstimates() {
  console.log('\n=== Сметы ===');

  // Сначала нужна спецификация
  const specs = await get(`/specifications?projectId=${PROJECT_ID}&size=10`);
  const specList = specs?.content || specs || [];
  let specId = specList.length > 0 ? specList[0].id : null;

  if (!specId) {
    // Создаём спецификацию
    const spec = await post('/specifications', { name: 'Спецификация ЖК Олимп — общестрой', projectId: PROJECT_ID, discipline: 'КЖ', notes: 'Основная спецификация на конструктивные решения' });
    specId = spec?.id;
    track('specifications', specId);
  }

  if (!specId) {
    console.log('  ⚠ Не удалось создать спецификацию, пропускаем сметы');
    return;
  }

  const estimates = [
    { name: 'ЛС-01 Свайное основание', projectId: PROJECT_ID, specificationId: specId, notes: 'Локальная смета на устройство буронабивных свай' },
    { name: 'ЛС-02 Монолитный ростверк', projectId: PROJECT_ID, specificationId: specId, notes: 'Локальная смета на ростверк (армирование + бетонирование)' },
    { name: 'ЛС-03 Подготовительные работы', projectId: PROJECT_ID, specificationId: specId, notes: 'Временные дороги, ограждения, бытовой городок' },
  ];

  for (const est of estimates) {
    const res = await post('/estimates', est);
    track('estimates', res?.id);

    if (res?.id) {
      // Добавляем позиции в смету
      const items = est.name.includes('Свайн') ? [
        { name: 'Бурение скважин d600 L=12м под сваи', quantity: 48, unitOfMeasure: 'шт', unitPrice: 85000, unitPriceCustomer: 95000, sequence: 1 },
        { name: 'Армирование свай каркасами d600', quantity: 48, unitOfMeasure: 'шт', unitPrice: 35000, unitPriceCustomer: 42000, sequence: 2 },
        { name: 'Бетонирование свай М350', quantity: 162.8, unitOfMeasure: 'м³', unitPrice: 12500, unitPriceCustomer: 15000, sequence: 3 },
        { name: 'Срубка голов свай', quantity: 48, unitOfMeasure: 'шт', unitPrice: 8500, unitPriceCustomer: 10000, sequence: 4 },
      ] : est.name.includes('Ростверк') ? [
        { name: 'Устройство опалубки ростверка (PERI)', quantity: 380, unitOfMeasure: 'м²', unitPrice: 2200, unitPriceCustomer: 2800, sequence: 1 },
        { name: 'Армирование ростверка A500C', quantity: 18.5, unitOfMeasure: 'т', unitPrice: 95000, unitPriceCustomer: 110000, sequence: 2 },
        { name: 'Бетонирование ростверка М350 W8', quantity: 245, unitOfMeasure: 'м³', unitPrice: 14500, unitPriceCustomer: 17000, sequence: 3 },
        { name: 'Гидроизоляция обмазочная', quantity: 760, unitOfMeasure: 'м²', unitPrice: 850, unitPriceCustomer: 1100, sequence: 4 },
      ] : [
        { name: 'Планировка территории бульдозером', quantity: 2850, unitOfMeasure: 'м²', unitPrice: 120, unitPriceCustomer: 180, sequence: 1 },
        { name: 'Устройство временных дорог (щебень фр. 40-70)', quantity: 450, unitOfMeasure: 'м²', unitPrice: 1800, unitPriceCustomer: 2200, sequence: 2 },
        { name: 'Временное ограждение стройплощадки', quantity: 620, unitOfMeasure: 'п.м.', unitPrice: 950, unitPriceCustomer: 1200, sequence: 3 },
      ];

      for (const item of items) {
        await post(`/estimates/${res.id}/items`, item);
      }
    }
  }
  console.log(`  Создано смет: ${created.estimates?.length || 0}`);
}

// ── 18. Заявки на закупку ────────────────────────────────────────────────────

async function seedPurchaseRequests() {
  console.log('\n=== Заявки на закупку ===');

  const requests = [
    { requestDate: daysAgo(10), projectId: PROJECT_ID, priority: 'CRITICAL', requestedByName: 'Козлова Н.В.', notes: 'Бетон М350 W8 F200 — 245 м³ на ростверк секции 1. Срочно, бетонирование через 5 дней.' },
    { requestDate: daysAgo(7), projectId: PROJECT_ID, priority: 'HIGH', requestedByName: 'Кузнецов Д.В.', notes: 'Опалубка PERI MAXIMO — 400 м² для перекрытия 1 этажа. Поставка до 20.03.2026.' },
    { requestDate: daysAgo(5), projectId: PROJECT_ID, priority: 'HIGH', requestedByName: 'Сидоров М.Н.', notes: 'Арматура A500C d12, d16, d20 — всего 35 тонн. Армирование стен подвала.' },
    { requestDate: daysAgo(3), projectId: PROJECT_ID, priority: 'MEDIUM', requestedByName: 'Новиков С.Г.', notes: 'Кабель ВВГнг-LS 5х16 — 1200 м, кабель ВВГнг-LS 3х2.5 — 3000 м. Электроснабжение 1 этажа.' },
    { requestDate: daysAgo(2), projectId: PROJECT_ID, priority: 'LOW', requestedByName: 'Волков Р.А.', notes: 'Геотекстиль TYPAR SF-40 — 5000 м². Обратная засыпка пазух котлована.' },
    { requestDate: daysAgo(1), projectId: PROJECT_ID, priority: 'MEDIUM', requestedByName: 'Козлова Н.В.', notes: 'Гидроизоляция битумная мастика — 20 бочек (200л). ТехноНИКОЛЬ №24.' },
    { requestDate: today(), projectId: PROJECT_ID, priority: 'HIGH', requestedByName: 'Попов В.И.', notes: 'Фиксаторы защитного слоя «стульчик» h=40мм — 5000 шт. Армирование перекрытия.' },
  ];

  for (const req of requests) {
    const res = await post('/purchase-requests', req);
    track('purchaseRequests', res?.id);
  }
  console.log(`  Создано заявок: ${created.purchaseRequests?.length || 0}`);
}

// ── 19. Разрешительная документация ──────────────────────────────────────────

async function seedPermits() {
  console.log('\n=== Разрешительная документация ===');

  const permits = [
    { projectId: PROJECT_ID, permitNumber: 'РС-77-2025-12345', issuedBy: 'Мосгосстройнадзор', issuedDate: daysAgo(120), expiresDate: daysFromNow(610), permitType: 'CONSTRUCTION', conditions: 'Срок действия 24 месяца. Обязательный авторский надзор.' },
    { projectId: PROJECT_ID, permitNumber: 'ТУ-ЭС-2025-001', issuedBy: 'ПАО "МОЭСК"', issuedDate: daysAgo(180), expiresDate: daysFromNow(550), permitType: 'UTILITY_CONNECTION', conditions: 'Подключение 2500 кВт. Точка подключения: ТП-1432. Срок — до 01.09.2027.' },
    { projectId: PROJECT_ID, permitNumber: 'ТУ-ВК-2025-042', issuedBy: 'АО "Мосводоканал"', issuedDate: daysAgo(160), expiresDate: daysFromNow(570), permitType: 'UTILITY_CONNECTION', conditions: 'Водопровод d150, канализация d200. Точка подключения: колодец ВК-78.' },
    { projectId: PROJECT_ID, permitNumber: 'ТУ-ТС-2025-018', issuedBy: 'ПАО "МОЭК"', issuedDate: daysAgo(150), expiresDate: daysFromNow(580), permitType: 'UTILITY_CONNECTION', conditions: 'Теплоснабжение 3.2 Гкал/ч. Подключение к тепловой камере ТК-22.' },
    { projectId: PROJECT_ID, permitNumber: 'ГПЗУ-77-2024-9876', issuedBy: 'Москомархитектура', issuedDate: daysAgo(365), expiresDate: daysFromNow(365), permitType: 'ZONING', conditions: 'Этажность до 25 эт. Плотность застройки — 25 000 м². Процент озеленения — 25%.' },
  ];

  for (const permit of permits) {
    const res = await post('/regulatory/permits', permit);
    track('permits', res?.id);
  }
  console.log(`  Создано разрешений: ${created.permits?.length || 0}`);
}

// ── 20. Несоответствия (Quality) ────────────────────────────────────────────

async function seedQuality() {
  console.log('\n=== Несоответствия (контроль качества) ===');

  const nonConformances = [
    { projectId: PROJECT_ID, severity: 'MAJOR', description: 'Защитный слой арматуры ростверка 15мм вместо проектных 40мм на участке оси А-1. Необходима установка дополнительных фиксаторов.', rootCause: 'Недостаточное количество фиксаторов защитного слоя', correctiveAction: 'Установить фиксаторы «стульчик» h=40мм с шагом 500мм', preventiveAction: 'Обязательная приёмка арматурного каркаса перед бетонированием', dueDate: daysFromNow(3) },
    { projectId: PROJECT_ID, severity: 'MINOR', description: 'Видимые раковины на поверхности бетона ростверка (ось Б-3), глубина до 5мм.', rootCause: 'Недостаточное вибрирование бетонной смеси', correctiveAction: 'Заделка раковин ремонтным составом Emaco S88C', preventiveAction: 'Увеличить продолжительность вибрирования при бетонировании', dueDate: daysFromNow(7) },
    { projectId: PROJECT_ID, severity: 'CRITICAL', description: 'Отклонение оси сваи №12 на 45мм от проектного положения (допуск по СП — 30мм).', rootCause: 'Смещение обсадной трубы при бурении из-за валуна', correctiveAction: 'Пересчёт ростверка с учётом фактического положения сваи (решение проектировщика)', preventiveAction: 'Геологический контроль при бурении каждой скважины', dueDate: daysFromNow(5) },
    { projectId: PROJECT_ID, severity: 'MINOR', description: 'Несоответствие марки арматуры в накладной: указано А400 вместо А500С на 2 бухты d12.', rootCause: 'Ошибка при комплектации на складе поставщика', correctiveAction: 'Возврат несоответствующей арматуры поставщику, замена на A500C', preventiveAction: 'Входной контроль каждой партии арматуры с проверкой сертификата', dueDate: daysFromNow(2) },
  ];

  for (const nc of nonConformances) {
    const res = await post('/quality/non-conformances', nc);
    track('nonConformances', res?.id);
  }
  console.log(`  Создано несоответствий: ${created.nonConformances?.length || 0}`);
}

// ── 21. КС-3 (Справки о стоимости) ─────────────────────────────────────────

async function seedKs3() {
  console.log('\n=== КС-3 (Справки о стоимости) ===');

  const ks3Docs = [
    { number: 'КС-3-001', documentDate: daysAgo(25), periodFrom: daysAgo(60), periodTo: daysAgo(30), projectId: PROJECT_ID, retentionPercent: 5, notes: 'Справка за январь 2026 — подготовительный период' },
    { number: 'КС-3-002', documentDate: daysAgo(10), periodFrom: daysAgo(30), periodTo: daysAgo(5), projectId: PROJECT_ID, retentionPercent: 5, notes: 'Справка за февраль 2026 — свайные работы' },
  ];

  for (const ks3 of ks3Docs) {
    const res = await post('/ks3', ks3);
    track('ks3', res?.id);
  }
  console.log(`  Создано КС-3: ${created.ks3?.length || 0}`);
}

// ── 22. Изменения (Change Orders) ───────────────────────────────────────────

async function seedChangeOrders() {
  console.log('\n=== Изменения (Change Orders) ===');

  // Нужен contractId — возьмём из только что созданных
  const contractsData = await get(`/contracts?projectId=${PROJECT_ID}&size=10`);
  const contractList = contractsData?.content || contractsData || [];
  const contractId = contractList.length > 0 ? contractList[0].id : null;

  if (!contractId) {
    console.log('  ⚠ Нет контрактов, пропускаем change orders');
    return;
  }

  const changeOrders = [
    { projectId: PROJECT_ID, contractId, title: 'Дополнительные сваи (6 шт.) — обнаружен слабый грунт', description: 'По результатам контрольного бурения в зоне осей В-5,6 обнаружен слабый суглинок. Требуется 6 дополнительных свай для обеспечения несущей способности.', changeOrderType: 'ADDITION', originalContractAmount: 420000000, scheduleImpactDays: 5 },
    { projectId: PROJECT_ID, contractId, title: 'Замена гидроизоляции на мембранную', description: 'Заказчик запросил замену обмазочной гидроизоляции на ПВХ-мембрану Logicroof для повышения надёжности. Удорожание: +2.8 млн руб.', changeOrderType: 'SUBSTITUTION', originalContractAmount: 420000000, scheduleImpactDays: 3 },
    { projectId: PROJECT_ID, contractId, title: 'Продление сроков — задержка поставки опалубки', description: 'Поставщик PERI задержал отгрузку опалубки на 10 дней. Необходимо продление сроков без удорожания.', changeOrderType: 'TIME_EXTENSION', originalContractAmount: 420000000, scheduleImpactDays: 10 },
  ];

  for (const co of changeOrders) {
    const res = await post('/change-orders', co);
    track('changeOrders', res?.id);
  }
  console.log(`  Создано изменений: ${created.changeOrders?.length || 0}`);
}

// ── 23. Замечания (Punch List) ──────────────────────────────────────────────

async function seedPunchList() {
  console.log('\n=== Замечания (Punch List) ===');

  const punchItems = [
    { projectId: PROJECT_ID, name: 'Замечания по ростверку секции 1', dueDate: daysFromNow(10), areaOrZone: 'Секция 1, подвал' },
    { projectId: PROJECT_ID, name: 'Дефекты бетонирования свай — визуальный осмотр', dueDate: daysFromNow(5), areaOrZone: 'Секция 1, свайное поле' },
    { projectId: PROJECT_ID, name: 'Замечания технадзора — временные дороги', dueDate: daysFromNow(3), areaOrZone: 'Проезд по периметру' },
  ];

  for (const item of punchItems) {
    const res = await post('/punchlist', item);
    track('punchLists', res?.id);
  }
  console.log(`  Создано замечаний: ${created.punchLists?.length || 0}`);
}

// ── 24. Безопасность (IP-whitelist + System Settings) ─────────────────────

async function seedSecurity() {
  console.log('\n=== Безопасность (IP Whitelist + System Settings) ===');

  // IP-whitelist entries
  const ipEntries = [
    { ipAddress: '192.168.1.0/24', description: 'Офисная сеть — штаб-квартира' },
    { ipAddress: '10.0.0.0/8', description: 'VPN-сеть корпоративная' },
    { ipAddress: '172.16.0.0/12', description: 'Внутренняя сеть строительной площадки' },
    { ipAddress: '85.192.45.100', description: 'Статический IP — филиал Москва' },
    { ipAddress: '91.220.164.50', description: 'Статический IP — филиал Санкт-Петербург' },
  ];

  for (const entry of ipEntries) {
    const res = await post('/admin/ip-whitelist', entry);
    track('ipWhitelist', res?.id);
  }
  console.log(`  IP-адресов: ${created.ipWhitelist?.length || 0}`);

  // System settings — password policy, 2FA, session
  const settings = [
    { key: 'password_min_length', value: '10', type: 'INTEGER', category: 'SECURITY', description: 'Минимальная длина пароля' },
    { key: 'password_require_uppercase', value: 'true', type: 'BOOLEAN', category: 'SECURITY', description: 'Требовать заглавные буквы' },
    { key: 'password_require_digits', value: 'true', type: 'BOOLEAN', category: 'SECURITY', description: 'Требовать цифры в пароле' },
    { key: 'password_require_special', value: 'true', type: 'BOOLEAN', category: 'SECURITY', description: 'Требовать спецсимволы' },
    { key: 'password_expiry_days', value: '90', type: 'INTEGER', category: 'SECURITY', description: 'Срок действия пароля (дней)' },
    { key: 'max_login_attempts', value: '5', type: 'INTEGER', category: 'SECURITY', description: 'Макс. неудачных попыток входа' },
    { key: 'lockout_duration_minutes', value: '15', type: 'INTEGER', category: 'SECURITY', description: 'Блокировка аккаунта (мин)' },
    { key: 'two_factor_enabled', value: 'false', type: 'BOOLEAN', category: 'SECURITY', description: 'Двухфакторная аутентификация' },
    { key: 'two_factor_required_admins', value: 'false', type: 'BOOLEAN', category: 'SECURITY', description: 'Обязательная 2FA для администраторов' },
    { key: 'session_timeout_minutes', value: '480', type: 'INTEGER', category: 'SECURITY', description: 'Тайм-аут сессии (мин)' },
  ];

  for (const s of settings) {
    const res = await post('/admin/system-settings', s);
    track('systemSettings', res?.id);
  }
  console.log(`  Настроек безопасности: ${created.systemSettings?.length || 0}`);

  // General system settings
  const generalSettings = [
    { key: 'company.name', value: 'ООО «СтройИнвест»', type: 'STRING', category: 'GENERAL', description: 'Наименование организации' },
    { key: 'company.inn', value: '7712345678', type: 'STRING', category: 'GENERAL', description: 'ИНН организации' },
    { key: 'company.kpp', value: '771201001', type: 'STRING', category: 'GENERAL', description: 'КПП организации' },
    { key: 'company.address', value: 'г. Москва, ул. Строителей, д. 15, оф. 401', type: 'STRING', category: 'GENERAL', description: 'Юридический адрес' },
    { key: 'company.phone', value: '+7 (495) 123-45-67', type: 'STRING', category: 'GENERAL', description: 'Телефон организации' },
    { key: 'app.language', value: 'ru', type: 'STRING', category: 'GENERAL', description: 'Язык интерфейса по умолчанию' },
    { key: 'app.timezone', value: 'Europe/Moscow', type: 'STRING', category: 'GENERAL', description: 'Часовой пояс' },
    { key: 'app.dateFormat', value: 'DD.MM.YYYY', type: 'STRING', category: 'GENERAL', description: 'Формат даты' },
    { key: 'app.currency', value: 'RUB', type: 'STRING', category: 'GENERAL', description: 'Основная валюта' },
  ];

  for (const s of generalSettings) {
    const res = await post('/admin/system-settings', s);
    track('systemSettings', res?.id);
  }

  // Email settings
  const emailSettings = [
    { key: 'email.smtpHost', value: 'smtp.company.ru', type: 'STRING', category: 'EMAIL', description: 'SMTP-сервер' },
    { key: 'email.smtpPort', value: '465', type: 'INTEGER', category: 'EMAIL', description: 'Порт SMTP' },
    { key: 'email.smtpUsername', value: 'noreply@privod.ru', type: 'STRING', category: 'EMAIL', description: 'Имя пользователя SMTP' },
    { key: 'email.smtpPassword', value: '********', type: 'STRING', category: 'EMAIL', description: 'Пароль SMTP' },
    { key: 'email.fromEmail', value: 'noreply@privod.ru', type: 'STRING', category: 'EMAIL', description: 'Email отправителя' },
    { key: 'email.fromName', value: 'ПРИВОД ERP', type: 'STRING', category: 'EMAIL', description: 'Имя отправителя' },
    { key: 'email.useTls', value: 'true', type: 'BOOLEAN', category: 'EMAIL', description: 'Использовать TLS' },
  ];

  for (const s of emailSettings) {
    const res = await post('/admin/system-settings', s);
    track('systemSettings', res?.id);
  }

  // Backup settings
  const backupSettings = [
    { key: 'backup.schedule', value: 'daily', type: 'STRING', category: 'BACKUP', description: 'Расписание резервного копирования' },
    { key: 'backup.retentionDays', value: '30', type: 'INTEGER', category: 'BACKUP', description: 'Срок хранения копий (дней)' },
    { key: 'backup.time', value: '03:00', type: 'STRING', category: 'BACKUP', description: 'Время запуска (МСК)' },
    { key: 'backup.includeAttachments', value: 'true', type: 'BOOLEAN', category: 'BACKUP', description: 'Включать вложения' },
  ];

  for (const s of backupSettings) {
    const res = await post('/admin/system-settings', s);
    track('systemSettings', res?.id);
  }

  // Email templates
  const emailTemplates = [
    { code: 'WELCOME', name: 'Приглашение в систему', subject: 'Добро пожаловать в ПРИВОД', body: '<h1>Добро пожаловать!</h1><p>Ваш аккаунт создан. Перейдите по ссылке для входа.</p>', category: 'AUTH' },
    { code: 'PASSWORD_RESET', name: 'Сброс пароля', subject: 'Сброс пароля — ПРИВОД', body: '<h1>Сброс пароля</h1><p>Для сброса пароля перейдите по ссылке: {{resetLink}}</p>', category: 'AUTH' },
    { code: 'TASK_ASSIGNED', name: 'Назначена задача', subject: 'Вам назначена задача: {{taskName}}', body: '<p>Вам назначена задача <b>{{taskName}}</b> в проекте {{projectName}}.</p>', category: 'TASKS' },
    { code: 'INVOICE_CREATED', name: 'Новый счёт', subject: 'Создан счёт №{{invoiceNumber}}', body: '<p>Создан новый счёт №{{invoiceNumber}} на сумму {{amount}} ₽.</p>', category: 'FINANCE' },
    { code: 'DEFECT_REPORTED', name: 'Обнаружен дефект', subject: 'Дефект: {{defectTitle}}', body: '<p>Обнаружен дефект <b>{{defectTitle}}</b> на объекте {{projectName}}.</p>', category: 'QUALITY' },
  ];

  for (const tmpl of emailTemplates) {
    const res = await post('/admin/email-templates', tmpl);
    track('emailTemplates', res?.id);
  }

  console.log(`  Настроек всего: ${created.systemSettings?.length || 0}`);
  console.log(`  Email-шаблонов: ${created.emailTemplates?.length || 0}`);
}

// ── Интеграции ──────────────────────────────────────────────────────────────

async function seedMonitoring() {
  console.log('\n=== Мониторинг (Health Checks, Events, Metrics, Backups) ===');

  // 1) Run health check for all components
  const healthCheckResult = await post('/admin/health/check-all');
  track('healthChecks', healthCheckResult ? 'all' : null);
  console.log(`  Health check: ${healthCheckResult ? 'выполнен' : 'пропущен'}`);

  // 2) System events — seed realistic events
  const systemEvents = [
    { eventType: 'STARTUP', severity: 'INFO', message: 'Приложение успешно запущено. Версия 2.4.1, Java 21, профиль: production', source: 'application' },
    { eventType: 'MIGRATION', severity: 'INFO', message: 'Flyway: выполнено 3 новых миграции (V1108-V1110). Время: 1.2с', source: 'flyway' },
    { eventType: 'BACKUP_COMPLETED', severity: 'INFO', message: 'Резервная копия БД успешно создана. Размер: 2.4 GB, время: 45с', source: 'backup-service' },
    { eventType: 'WARNING', severity: 'WARNING', message: 'Redis: высокое использование памяти (87%). Рекомендуется очистка кеша', source: 'redis' },
    { eventType: 'WARNING', severity: 'WARNING', message: 'Превышение лимита API-запросов от клиента api-key-0042 (1200/мин при лимите 1000)', source: 'rate-limiter' },
    { eventType: 'ERROR', severity: 'ERROR', message: 'SMTP: не удалось отправить email. Тайм-аут подключения к smtp.company.ru:465', source: 'email-service' },
    { eventType: 'ERROR', severity: 'ERROR', message: 'MinIO: ошибка загрузки файла spec-2026-03.xlsx — bucket not found', source: 'file-storage' },
    { eventType: 'WARNING', severity: 'WARNING', message: 'Очередь задач: 45 задач ожидают обработки (порог: 30)', source: 'task-queue' },
    { eventType: 'DEPLOYMENT', severity: 'INFO', message: 'Развёртывание v2.4.1 завершено. Контейнеры: api(3), worker(2), scheduler(1)', source: 'deployment' },
    { eventType: 'WARNING', severity: 'WARNING', message: 'SSL-сертификат api.privod.ru истекает через 14 дней. Обновите до 2026-03-24', source: 'ssl-monitor' },
    { eventType: 'ERROR', severity: 'CRITICAL', message: 'PostgreSQL: пул соединений исчерпан (50/50). Запросы блокируются', source: 'database' },
    { eventType: 'STARTUP', severity: 'INFO', message: 'Кеш прогрет: загружено 1247 записей справочников за 3.2с', source: 'cache-warmer' },
  ];

  for (const evt of systemEvents) {
    const res = await post('/admin/events', evt);
    track('systemEvents', res?.id);
  }
  console.log(`  Системные события: ${created.systemEvents?.length || 0}`);

  // 3) Record some metrics
  const metrics = [
    { metricName: 'cpu_usage_percent', metricValue: 34.5, metricUnit: '%', tags: { host: 'api-node-1' } },
    { metricName: 'memory_usage_percent', metricValue: 67.2, metricUnit: '%', tags: { host: 'api-node-1' } },
    { metricName: 'disk_usage_percent', metricValue: 42.8, metricUnit: '%', tags: { host: 'api-node-1', mount: '/data' } },
    { metricName: 'http_requests_per_second', metricValue: 142.3, metricUnit: 'req/s', tags: { endpoint: '/api' } },
    { metricName: 'average_response_time_ms', metricValue: 78.4, metricUnit: 'ms', tags: { endpoint: '/api' } },
    { metricName: 'active_db_connections', metricValue: 28, metricUnit: 'connections', tags: { pool: 'HikariCP' } },
    { metricName: 'jvm_heap_used_mb', metricValue: 512, metricUnit: 'MB', tags: { gc: 'G1' } },
    { metricName: 'redis_cache_hit_ratio', metricValue: 94.7, metricUnit: '%', tags: {} },
  ];

  for (const m of metrics) {
    const res = await post('/admin/metrics', m);
    track('systemMetrics', res?.id);
  }
  console.log(`  Метрики: ${created.systemMetrics?.length || 0}`);

  // 4) Start a backup record
  const backup = await post('/admin/backups/start', {
    backupType: 'FULL',
    storageLocation: '/backups/privod-db-full-2026-03-10.sql.gz',
  });
  track('backups', backup?.id);
  console.log(`  Резервные копии: ${created.backups?.length || 0}`);
}

async function seedIntegrations() {
  console.log('\n=== Интеграции (1С, Telegram, СБИС, ЭДО, SMS, WebDAV, API-ключи, Гос. реестры) ===');

  // 1) 1C configurations
  const oneCConfigs = [
    {
      name: '1С:Бухгалтерия 3.0',
      baseUrl: 'http://192.168.1.10/1c_accounting/hs/exchange',
      username: 'exchange_user',
      password: 'Exch@nge2026!',
      databaseName: 'accounting_prod',
      syncDirection: 'BIDIRECTIONAL',
      syncIntervalMinutes: 30,
    },
    {
      name: '1С:Зарплата и Управление Персоналом',
      baseUrl: 'http://192.168.1.10/1c_hrm/hs/exchange',
      username: 'hr_sync',
      password: 'HrSync2026!',
      databaseName: 'hrm_prod',
      syncDirection: 'IMPORT',
      syncIntervalMinutes: 60,
    },
    {
      name: '1С:Управление Строительной Организацией',
      baseUrl: 'http://192.168.1.10/1c_construction/hs/exchange',
      username: 'constr_sync',
      password: 'ConstrSync2026!',
      databaseName: 'construction_prod',
      syncDirection: 'BIDIRECTIONAL',
      syncIntervalMinutes: 15,
    },
  ];

  for (const cfg of oneCConfigs) {
    const res = await post('/integrations/1c/configs', cfg);
    track('oneC_configs', res?.id);
  }
  console.log(`  1С конфигурации: ${created.oneC_configs?.length || 0}`);

  // 2) SBIS configurations
  const sbisConfigs = [
    {
      name: 'СБИС — Основной контур',
      apiUrl: 'https://online.sbis.ru/service/',
      login: 'privod_edi@company.ru',
      password: 'SbisAccess2026!',
      certificateThumbprint: 'A1B2C3D4E5F6789012345678ABCDEF01',
      organizationInn: '7712345678',
      organizationKpp: '771201001',
      autoSend: true,
    },
    {
      name: 'СБИС — Филиал СПб',
      apiUrl: 'https://online.sbis.ru/service/',
      login: 'privod_spb@company.ru',
      password: 'SbisSPB2026!',
      organizationInn: '7801234567',
      organizationKpp: '780101001',
      autoSend: false,
    },
  ];

  for (const cfg of sbisConfigs) {
    const res = await post('/integrations/sbis/configs', cfg);
    track('sbis_configs', res?.id);
  }
  console.log(`  СБИС конфигурации: ${created.sbis_configs?.length || 0}`);

  // 3) Telegram config
  const tgConfig = await put('/integrations/telegram/config', {
    botToken: '7123456789:AAF_demo_bot_token_not_real_xxxxxx',
    botUsername: 'PrivodNotifyBot',
    webhookUrl: 'https://api.privod.ru/api/integrations/telegram/webhook',
    enabled: true,
    organizationId: ORG_ID || '1',
  });
  track('telegram', tgConfig?.id || 'config');
  console.log(`  Telegram: настроен`);

  // 4) SMS config
  const smsConfig = await put('/integrations/sms/config', {
    provider: 'sms_ru',
    enabled: true,
    apiUrl: 'https://sms.ru/sms/send',
    apiKey: 'DEMO_SMS_KEY_NOT_REAL_12345678',
    senderName: 'ПРИВОД',
    balance: 4850.00,
  });
  track('sms', smsConfig?.id || 'config');
  console.log(`  SMS: настроен`);

  // 5) WebDAV config
  const webdavConfig = await put('/integrations/webdav/config', {
    serverUrl: 'https://cloud.privod.ru/remote.php/dav',
    username: 'sync_service',
    password: 'WebDav2026!',
    basePath: '/privod-documents/',
    enabled: true,
    autoSync: true,
    syncIntervalMinutes: 15,
  });
  track('webdav', webdavConfig?.id || 'config');
  console.log(`  WebDAV: настроен`);

  // 6) Gov registries — update configs for each registry type
  const registryTypes = ['EGRUL', 'FNS', 'RNPO', 'EFRSB', 'RSMP'];
  for (const type of registryTypes) {
    await put(`/integrations/gov-registries/config/${type}`, {
      enabled: true,
      apiUrl: `https://api.${type.toLowerCase()}.nalog.ru/v1`,
      apiKey: `DEMO_${type}_KEY_NOT_REAL`,
      description: `Реестр ${type} — демо-ключ`,
    });
    track('govRegistries', type);
  }
  console.log(`  Гос. реестры: ${created.govRegistries?.length || 0} типов`);

  // 7) Check a few counterparties in gov registries
  const testInns = ['7707083893', '7736050003', '7728240240']; // Сбербанк, Газпром, Мосэнергосбыт
  for (const inn of testInns) {
    const res = await post(`/integrations/gov-registries/check?inn=${inn}`, null);
    track('govRegistryChecks', res?.inn || inn);
  }
  console.log(`  Проверки контрагентов: ${created.govRegistryChecks?.length || 0}`);

  // 8) API keys
  const apiKeyNames = [
    { name: 'Мобильное приложение — прораб', permissions: ['PROJECTS_READ', 'TASKS_READ', 'TASKS_WRITE'], expiresInDays: 365 },
    { name: 'Интеграция с CRM', permissions: ['PROJECTS_READ', 'CRM_READ', 'CRM_WRITE'], expiresInDays: 180 },
    { name: 'BI-система аналитики', permissions: ['PROJECTS_READ', 'FINANCE_READ', 'ANALYTICS_READ'], expiresInDays: 365 },
    { name: 'Webhook-интеграция Bitrix24', permissions: ['WEBHOOKS_MANAGE'], expiresInDays: 90 },
    { name: 'Тестовый ключ разработчика', permissions: ['PROJECTS_READ'], expiresInDays: 30 },
  ];

  for (const keyData of apiKeyNames) {
    const res = await post('/api-keys', keyData);
    track('apiKeys', res?.id);
  }
  console.log(`  API-ключи: ${created.apiKeys?.length || 0}`);

  // 9) EDO — send a few documents
  const edoDocs = [
    { provider: 'DIADOC', docType: 'UPD', recipientInn: '7707083893', number: 'УПД-2026-001', name: 'УПД за январь 2026', amount: 1250000 },
    { provider: 'SBIS', docType: 'ACT', recipientInn: '7736050003', number: 'АКТ-2026-015', name: 'Акт выполненных работ — этап 3', amount: 3400000 },
    { provider: 'KONTUR', docType: 'INVOICE', recipientInn: '7728240240', number: 'СФ-2026-042', name: 'Счёт-фактура на поставку материалов', amount: 890000 },
  ];

  for (const doc of edoDocs) {
    const res = await post('/integrations/edo/send', doc);
    track('edoDocuments', res?.id);
  }
  console.log(`  ЭДО документы: ${created.edoDocuments?.length || 0}`);

  // 10) Webhooks
  const webhooks = [
    { url: 'https://bitrix24.privod.ru/rest/webhook/incoming', eventTypes: ['PROJECT_CREATED', 'TASK_COMPLETED'], secret: 'whk_demo_secret_1', description: 'Bitrix24 — новые проекты и задачи' },
    { url: 'https://analytics.privod.ru/api/events', eventTypes: ['INVOICE_PAID', 'BUDGET_UPDATED'], secret: 'whk_demo_secret_2', description: 'Аналитика — финансовые события' },
  ];

  for (const wh of webhooks) {
    const res = await post('/admin/webhooks', wh);
    track('webhooks', res?.id);
  }
  console.log(`  Вебхуки: ${created.webhooks?.length || 0}`);
}

// ── 24. Календарные события ──────────────────────────────────────────────────

async function seedCalendarEvents() {
  console.log('\n=== Календарные события ===');

  const events = [
    // Совещания
    {
      title: 'Еженедельная планёрка по проекту',
      eventType: 'MEETING',
      startDate: daysFromNow(1),
      startTime: '09:00',
      endDate: daysFromNow(1),
      endTime: '10:00',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Переговорная №1',
      isOnline: false,
      recurrenceRule: 'WEEKLY',
      projectId: PROJECT_ID,
      description: 'Обсуждение хода работ, рисков и отклонений от графика',
    },
    {
      title: 'Совещание по безопасности',
      eventType: 'MEETING',
      startDate: daysFromNow(2),
      startTime: '08:00',
      endDate: daysFromNow(2),
      endTime: '08:30',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Штаб строительства',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Ежедневный инструктаж по охране труда перед началом смены',
    },
    {
      title: 'Совещание с заказчиком',
      eventType: 'MEETING',
      startDate: daysFromNow(5),
      startTime: '14:00',
      endDate: daysFromNow(5),
      endTime: '16:00',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      isOnline: true,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      projectId: PROJECT_ID,
      description: 'Презентация статуса проекта и утверждение следующих этапов',
    },
    {
      title: 'Координационное совещание субподрядчиков',
      eventType: 'MEETING',
      startDate: daysFromNow(3),
      startTime: '11:00',
      endDate: daysFromNow(3),
      endTime: '12:30',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Конференц-зал',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Согласование графиков работ между субподрядчиками',
    },

    // Дедлайны
    {
      title: 'Сдача рабочей документации (раздел КР)',
      eventType: 'DEADLINE',
      startDate: daysFromNow(7),
      endDate: daysFromNow(7),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      projectId: PROJECT_ID,
      description: 'Срок предоставления рабочей документации раздела КР заказчику',
    },
    {
      title: 'Срок подачи КС-2 за текущий месяц',
      eventType: 'DEADLINE',
      startDate: daysFromNow(14),
      endDate: daysFromNow(14),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      projectId: PROJECT_ID,
      description: 'Крайний срок формирования и подписания актов КС-2 за отчётный период',
    },
    {
      title: 'Подача отчётности в Ростехнадзор',
      eventType: 'DEADLINE',
      startDate: daysFromNow(21),
      endDate: daysFromNow(21),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      description: 'Ежеквартальная отчётность по опасным производственным объектам',
    },

    // Инспекции
    {
      title: 'Проверка Ростехнадзора',
      eventType: 'INSPECTION',
      startDate: daysFromNow(10),
      startTime: '10:00',
      endDate: daysFromNow(10),
      endTime: '17:00',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Строительная площадка',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Плановая проверка соблюдения требований промышленной безопасности',
    },
    {
      title: 'Авторский надзор — осмотр фундаментов',
      eventType: 'INSPECTION',
      startDate: daysFromNow(4),
      startTime: '09:00',
      endDate: daysFromNow(4),
      endTime: '12:00',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Корпус А, секция 1-3',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Проверка соответствия выполненных работ проектным решениям',
    },
    {
      title: 'Приёмка скрытых работ (армирование плиты)',
      eventType: 'INSPECTION',
      startDate: daysFromNow(6),
      startTime: '08:30',
      endDate: daysFromNow(6),
      endTime: '10:30',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Корпус Б, подземный уровень',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Освидетельствование скрытых работ перед заливкой бетона',
    },

    // Поставки
    {
      title: 'Поставка арматуры А500С (партия 12т)',
      eventType: 'DELIVERY',
      startDate: daysFromNow(3),
      endDate: daysFromNow(3),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Площадка складирования №2',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Ожидаемая поставка от ООО "Металлснаб" по договору №45-МС',
    },
    {
      title: 'Поставка оконных блоков (корпус А)',
      eventType: 'DELIVERY',
      startDate: daysFromNow(8),
      endDate: daysFromNow(8),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Склад стройплощадки',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'ПВХ окна по спецификации 3-1, 86 шт.',
    },
    {
      title: 'Поставка бетона М300 (240 м³)',
      eventType: 'DELIVERY',
      startDate: daysFromNow(6),
      endDate: daysFromNow(6),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      projectId: PROJECT_ID,
      description: 'Бетон товарный М300 W6 F150 для устройства перекрытия 2 этажа',
    },

    // Вехи
    {
      title: 'Завершение этапа: нулевой цикл',
      eventType: 'MILESTONE',
      startDate: daysFromNow(15),
      endDate: daysFromNow(15),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      projectId: PROJECT_ID,
      description: 'Контрольная точка: завершение фундаментов и подземной части',
    },
    {
      title: 'Начало монтажа металлоконструкций',
      eventType: 'MILESTONE',
      startDate: daysFromNow(18),
      endDate: daysFromNow(18),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      projectId: PROJECT_ID,
      description: 'Старт монтажа металлического каркаса здания',
    },

    // Выходные / праздники
    {
      title: 'День строителя',
      eventType: 'HOLIDAY',
      startDate: '2026-08-09',
      endDate: '2026-08-09',
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      description: 'Профессиональный праздник — второе воскресенье августа',
    },

    // Прочие
    {
      title: 'Обучение работе в ПРИВОД ERP',
      eventType: 'OTHER',
      startDate: daysFromNow(9),
      startTime: '15:00',
      endDate: daysFromNow(9),
      endTime: '17:00',
      isAllDay: false,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      isOnline: true,
      meetingUrl: 'https://zoom.us/j/123456789',
      description: 'Обучение сотрудников работе с модулями закрытия и финансов',
    },
    {
      title: 'Субботник на территории стройплощадки',
      eventType: 'OTHER',
      startDate: daysFromNow(12),
      endDate: daysFromNow(12),
      isAllDay: true,
      organizerId: ADMIN_USER_ID,
      organizerName: 'Администратор',
      location: 'Строительная площадка',
      isOnline: false,
      projectId: PROJECT_ID,
      description: 'Уборка территории и подготовка площадки к инспекции',
    },
  ];

  for (const event of events) {
    const res = await post('/calendar/events', event);
    track('calendarEvents', res?.id);
  }
  console.log(`  Календарных событий: ${created.calendarEvents?.length || 0}`);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

// ── Planning / WBS / Gantt ─────────────────────────────────────────────────

async function seedPlanning() {
  console.log('\n📊 Seeding Planning (WBS, Dependencies, Baselines, EVM)...');

  // Root node
  const root = await post('/wbs-nodes', {
    projectId: PROJECT_ID,
    code: 'P0',
    name: 'Строительство объекта — Полный цикл',
    nodeType: 'SUMMARY',
    level: 0,
    sortOrder: 0,
    plannedStartDate: daysAgo(60),
    plannedEndDate: daysFromNow(300),
    duration: 360,
    percentComplete: 28,
  });
  if (root?.id) track('planning', root.id);
  const rootId = root?.id;

  // Phase 1: Подготовительные работы (100% done)
  const phase1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: rootId,
    code: 'P1', name: 'Подготовительные работы', nodeType: 'PHASE',
    level: 1, sortOrder: 1,
    plannedStartDate: daysAgo(60), plannedEndDate: daysAgo(31),
    duration: 30, percentComplete: 100,
  });
  if (phase1?.id) track('planning', phase1.id);

  const p1_1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase1?.id,
    code: 'P1.1', name: 'Мобилизация', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 1,
    plannedStartDate: daysAgo(60), plannedEndDate: daysAgo(51),
    actualStartDate: daysAgo(60), actualEndDate: daysAgo(52),
    duration: 10, percentComplete: 100,
    plannedVolume: 100, volumeUnitOfMeasure: 'м³',
  });
  if (p1_1?.id) track('planning', p1_1.id);

  const p1_2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase1?.id,
    code: 'P1.2', name: 'Геодезическая разбивка осей', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 2,
    plannedStartDate: daysAgo(50), plannedEndDate: daysAgo(41),
    actualStartDate: daysAgo(51), actualEndDate: daysAgo(43),
    duration: 10, percentComplete: 100,
    plannedVolume: 50, volumeUnitOfMeasure: 'т',
  });
  if (p1_2?.id) track('planning', p1_2.id);

  const p1_3 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase1?.id,
    code: 'P1.3', name: 'Временные сети и ограждения', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 3,
    plannedStartDate: daysAgo(40), plannedEndDate: daysAgo(31),
    actualStartDate: daysAgo(42), actualEndDate: daysAgo(33),
    duration: 10, percentComplete: 100,
    plannedVolume: 120, volumeUnitOfMeasure: 'м³',
  });
  if (p1_3?.id) track('planning', p1_3.id);

  const m1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase1?.id,
    code: 'M1', name: 'Площадка подготовлена', nodeType: 'MILESTONE',
    level: 2, sortOrder: 4,
    plannedStartDate: daysAgo(31), plannedEndDate: daysAgo(31),
    actualStartDate: daysAgo(33), actualEndDate: daysAgo(33),
    duration: 0, percentComplete: 100,
  });
  if (m1?.id) track('planning', m1.id);

  // Phase 2: Фундамент (65% done)
  const phase2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: rootId,
    code: 'P2', name: 'Фундаментные работы', nodeType: 'PHASE',
    level: 1, sortOrder: 2,
    plannedStartDate: daysAgo(30), plannedEndDate: daysFromNow(15),
    duration: 45, percentComplete: 65,
  });
  if (phase2?.id) track('planning', phase2.id);

  const p2_1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase2?.id,
    code: 'P2.1', name: 'Земляные работы и котлован', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 1,
    plannedStartDate: daysAgo(30), plannedEndDate: daysAgo(11),
    actualStartDate: daysAgo(30), actualEndDate: daysAgo(12),
    duration: 20, percentComplete: 100,
    plannedVolume: 350, volumeUnitOfMeasure: 'м²',
  });
  if (p2_1?.id) track('planning', p2_1.id);

  const p2_2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase2?.id,
    code: 'P2.2', name: 'Армирование и опалубка', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 2,
    plannedStartDate: daysAgo(10), plannedEndDate: daysFromNow(5),
    actualStartDate: daysAgo(11),
    duration: 15, percentComplete: 70,
    plannedVolume: 25, volumeUnitOfMeasure: 'т',
  });
  if (p2_2?.id) track('planning', p2_2.id);

  const p2_3 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase2?.id,
    code: 'P2.3', name: 'Бетонирование фундамента', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 3,
    plannedStartDate: daysFromNow(3), plannedEndDate: daysFromNow(15),
    duration: 12, percentComplete: 10,
    plannedVolume: 200, volumeUnitOfMeasure: 'м³',
  });
  if (p2_3?.id) track('planning', p2_3.id);

  const m2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase2?.id,
    code: 'M2', name: 'Фундамент завершён', nodeType: 'MILESTONE',
    level: 2, sortOrder: 4,
    plannedStartDate: daysFromNow(15), plannedEndDate: daysFromNow(15),
    duration: 0, percentComplete: 0,
  });
  if (m2?.id) track('planning', m2.id);

  // Phase 3: Каркас (20% done)
  const phase3 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: rootId,
    code: 'P3', name: 'Монтаж каркаса', nodeType: 'PHASE',
    level: 1, sortOrder: 3,
    plannedStartDate: daysFromNow(16), plannedEndDate: daysFromNow(105),
    duration: 90, percentComplete: 0,
  });
  if (phase3?.id) track('planning', phase3.id);

  const p3_1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase3?.id,
    code: 'P3.1', name: 'Колонны и балки 1-3 этажи', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 1,
    plannedStartDate: daysFromNow(16), plannedEndDate: daysFromNow(55),
    duration: 40, percentComplete: 0,
    plannedVolume: 500, volumeUnitOfMeasure: 'м²',
  });
  if (p3_1?.id) track('planning', p3_1.id);

  const p3_2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase3?.id,
    code: 'P3.2', name: 'Перекрытия и лестницы', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 2,
    plannedStartDate: daysFromNow(40), plannedEndDate: daysFromNow(85),
    duration: 45, percentComplete: 0,
    plannedVolume: 300, volumeUnitOfMeasure: 'пог.м',
  });
  if (p3_2?.id) track('planning', p3_2.id);

  const p3_3 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase3?.id,
    code: 'P3.3', name: 'Кровля', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 3,
    plannedStartDate: daysFromNow(80), plannedEndDate: daysFromNow(105),
    duration: 25, percentComplete: 0,
    plannedVolume: 800, volumeUnitOfMeasure: 'м²',
  });
  if (p3_3?.id) track('planning', p3_3.id);

  const m3 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase3?.id,
    code: 'M3', name: 'Каркас собран', nodeType: 'MILESTONE',
    level: 2, sortOrder: 4,
    plannedStartDate: daysFromNow(105), plannedEndDate: daysFromNow(105),
    duration: 0, percentComplete: 0,
  });
  if (m3?.id) track('planning', m3.id);

  // Phase 4: Инженерные системы (0%)
  const phase4 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: rootId,
    code: 'P4', name: 'Инженерные системы', nodeType: 'PHASE',
    level: 1, sortOrder: 4,
    plannedStartDate: daysFromNow(90), plannedEndDate: daysFromNow(210),
    duration: 120, percentComplete: 0,
  });
  if (phase4?.id) track('planning', phase4.id);

  const p4_1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase4?.id,
    code: 'P4.1', name: 'Электроснабжение', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 1,
    plannedStartDate: daysFromNow(90), plannedEndDate: daysFromNow(150),
    duration: 60, percentComplete: 0,
  });
  if (p4_1?.id) track('planning', p4_1.id);

  const p4_2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase4?.id,
    code: 'P4.2', name: 'ОВиК (отопление, вентиляция)', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 2,
    plannedStartDate: daysFromNow(100), plannedEndDate: daysFromNow(180),
    duration: 80, percentComplete: 0,
  });
  if (p4_2?.id) track('planning', p4_2.id);

  const p4_3 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase4?.id,
    code: 'P4.3', name: 'Водоснабжение и канализация', nodeType: 'WORK_PACKAGE',
    level: 2, sortOrder: 3,
    plannedStartDate: daysFromNow(110), plannedEndDate: daysFromNow(195),
    duration: 85, percentComplete: 0,
  });
  if (p4_3?.id) track('planning', p4_3.id);

  const m4 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase4?.id,
    code: 'M4', name: 'Инженерные системы смонтированы', nodeType: 'MILESTONE',
    level: 2, sortOrder: 4,
    plannedStartDate: daysFromNow(210), plannedEndDate: daysFromNow(210),
    duration: 0, percentComplete: 0,
  });
  if (m4?.id) track('planning', m4.id);

  // Phase 5: Отделочные работы (0%)
  const phase5 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: rootId,
    code: 'P5', name: 'Отделочные работы', nodeType: 'PHASE',
    level: 1, sortOrder: 5,
    plannedStartDate: daysFromNow(200), plannedEndDate: daysFromNow(285),
    duration: 85, percentComplete: 0,
  });
  if (phase5?.id) track('planning', phase5.id);

  const p5_1 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase5?.id,
    code: 'P5.1', name: 'Фасадные работы', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 1,
    plannedStartDate: daysFromNow(200), plannedEndDate: daysFromNow(250),
    duration: 50, percentComplete: 0,
  });
  if (p5_1?.id) track('planning', p5_1.id);

  const p5_2 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase5?.id,
    code: 'P5.2', name: 'Внутренняя отделка', nodeType: 'ACTIVITY',
    level: 2, sortOrder: 2,
    plannedStartDate: daysFromNow(230), plannedEndDate: daysFromNow(285),
    duration: 55, percentComplete: 0,
  });
  if (p5_2?.id) track('planning', p5_2.id);

  const m5 = await post('/wbs-nodes', {
    projectId: PROJECT_ID, parentId: phase5?.id,
    code: 'M5', name: 'Объект готов к сдаче', nodeType: 'MILESTONE',
    level: 2, sortOrder: 3,
    plannedStartDate: daysFromNow(285), plannedEndDate: daysFromNow(285),
    duration: 0, percentComplete: 0,
  });
  if (m5?.id) track('planning', m5.id);

  // Dependencies (Finish-to-Start)
  const depPairs = [
    [p1_1?.id, p1_2?.id],
    [p1_2?.id, p1_3?.id],
    [p1_3?.id, m1?.id],
    [m1?.id, p2_1?.id],
    [p2_1?.id, p2_2?.id],
    [p2_2?.id, p2_3?.id],
    [p2_3?.id, m2?.id],
    [m2?.id, p3_1?.id],
    [p3_1?.id, p3_2?.id],
    [p3_2?.id, p3_3?.id],
    [p3_3?.id, m3?.id],
    [m3?.id, p4_1?.id],
    [p4_1?.id, p4_2?.id],
    [p4_2?.id, p4_3?.id],
    [p4_3?.id, m4?.id],
    [m4?.id, p5_1?.id],
    [p5_1?.id, p5_2?.id],
    [p5_2?.id, m5?.id],
  ];

  for (const [predId, succId] of depPairs) {
    if (predId && succId) {
      const dep = await post('/wbs-dependencies', {
        predecessorId: predId,
        successorId: succId,
        dependencyType: 'FINISH_TO_START',
        lagDays: 0,
      });
      if (dep?.id) track('planning', dep.id);
    }
  }

  // Schedule Baselines
  const bl1 = await post('/schedule-baselines', {
    projectId: PROJECT_ID,
    name: 'Исходный базовый план',
    baselineType: 'ORIGINAL',
    baselineDate: daysAgo(60),
    notes: 'Утверждённый первоначальный календарный план',
  });
  if (bl1?.id) track('planning', bl1.id);

  const bl2 = await post('/schedule-baselines', {
    projectId: PROJECT_ID,
    name: 'Текущий план (корректировка №1)',
    baselineType: 'CURRENT',
    baselineDate: daysAgo(10),
    notes: 'Корректировка после задержки подготовительных работ',
  });
  if (bl2?.id) track('planning', bl2.id);

  // EVM Snapshots — monthly series for S-curve trend
  const BAC = 85000000;
  const evmMonths = [
    { monthsAgo: 9, pv: 2500000, ev: 2400000, ac: 2600000, pct: 3 },
    { monthsAgo: 8, pv: 5800000, ev: 5500000, ac: 5900000, pct: 6 },
    { monthsAgo: 7, pv: 9200000, ev: 8600000, ac: 9400000, pct: 10 },
    { monthsAgo: 6, pv: 12800000, ev: 11800000, ac: 13100000, pct: 14 },
    { monthsAgo: 5, pv: 15500000, ev: 14200000, ac: 16000000, pct: 17 },
    { monthsAgo: 4, pv: 18200000, ev: 16500000, ac: 18800000, pct: 19 },
    { monthsAgo: 3, pv: 20100000, ev: 18400000, ac: 20900000, pct: 22 },
    { monthsAgo: 2, pv: 21800000, ev: 19600000, ac: 22500000, pct: 23 },
    { monthsAgo: 1, pv: 22900000, ev: 20400000, ac: 23600000, pct: 25 },
    { monthsAgo: 0, pv: 23800000, ev: 21200000, ac: 24500000, pct: 28 },
  ];
  for (const m of evmMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() - m.monthsAgo);
    const dateStr = d.toISOString().slice(0, 10);
    const snapshot = await post('/evm-snapshots', {
      projectId: PROJECT_ID,
      snapshotDate: dateStr,
      dataDate: dateStr,
      budgetAtCompletion: BAC,
      plannedValue: m.pv,
      earnedValue: m.ev,
      actualCost: m.ac,
      percentComplete: m.pct,
      criticalPathLength: 285,
    });
    if (snapshot?.id) track('planning', snapshot.id);
  }

  // Resource Allocations (per WBS node)
  const raData = [
    { wbsNodeId: p2_2?.id, resourceType: 'LABOR', resourceName: 'Бригада арматурщиков', plannedUnits: 120, actualUnits: 95, unitRate: 2500 },
    { wbsNodeId: p2_2?.id, resourceType: 'EQUIPMENT', resourceName: 'Автокран КС-55713', plannedUnits: 40, actualUnits: 38, unitRate: 8000 },
    { wbsNodeId: p2_3?.id, resourceType: 'LABOR', resourceName: 'Бригада бетонщиков', plannedUnits: 80, actualUnits: 8, unitRate: 2800 },
    { wbsNodeId: p2_3?.id, resourceType: 'MATERIAL', resourceName: 'Бетон М350 B25', plannedUnits: 450, actualUnits: 45, unitRate: 4200 },
    { wbsNodeId: p3_1?.id, resourceType: 'LABOR', resourceName: 'Монтажники металлоконструкций', plannedUnits: 200, actualUnits: 0, unitRate: 3200 },
    { wbsNodeId: p3_1?.id, resourceType: 'EQUIPMENT', resourceName: 'Башенный кран КБ-408', plannedUnits: 160, actualUnits: 0, unitRate: 12000 },
    { wbsNodeId: p1_1?.id, resourceType: 'LABOR', resourceName: 'Геодезическая группа', plannedUnits: 60, actualUnits: 58, unitRate: 3500 },
    { wbsNodeId: p1_3?.id, resourceType: 'MATERIAL', resourceName: 'Ограждение временное', plannedUnits: 200, actualUnits: 200, unitRate: 1200 },
  ];
  for (const ra of raData) {
    if (!ra.wbsNodeId) continue;
    const res = await post('/resource-allocations', {
      ...ra,
      plannedCost: ra.plannedUnits * ra.unitRate,
      actualCost: ra.actualUnits * ra.unitRate,
      startDate: daysAgo(30),
      endDate: daysFromNow(30),
    });
    if (res?.id) track('planning', res.id);
  }

  // Multi-project resource allocations
  const empIds = created.employees ?? [];
  const mpaData = [
    { resourceType: 'WORKER', resourceId: empIds[0] || crypto.randomUUID(), role: 'Прораб', allocationPercent: 80 },
    { resourceType: 'WORKER', resourceId: empIds[1] || crypto.randomUUID(), role: 'Мастер участка', allocationPercent: 100 },
    { resourceType: 'EQUIPMENT', resourceId: crypto.randomUUID(), role: 'Экскаватор CAT 320', allocationPercent: 60 },
    { resourceType: 'WORKER', resourceId: empIds[2] || crypto.randomUUID(), role: 'Инженер ПТО', allocationPercent: 50 },
  ];
  for (const mpa of mpaData) {
    const res = await post('/planning/multi-project-allocation', {
      resourceType: mpa.resourceType,
      resourceId: mpa.resourceId || crypto.randomUUID(),
      projectId: PROJECT_ID,
      startDate: daysAgo(15),
      endDate: daysFromNow(60),
      allocationPercent: mpa.allocationPercent,
      role: mpa.role,
    });
    if (res?.id) track('planning', res.id);
  }

  // Work Volume entries
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  const workVolumes = [
    { wbsNodeId: p1_1?.id, recordDate: twoDaysAgo, quantity: 25, unitOfMeasure: 'м³', description: 'Котлован секция А' },
    { wbsNodeId: p1_1?.id, recordDate: yesterday, quantity: 30, unitOfMeasure: 'м³', description: 'Котлован секция Б' },
    { wbsNodeId: p1_1?.id, recordDate: today, quantity: 18, unitOfMeasure: 'м³', description: 'Котлован секция В' },
    { wbsNodeId: p1_2?.id, recordDate: twoDaysAgo, quantity: 12, unitOfMeasure: 'т', description: 'Арматурные каркасы' },
    { wbsNodeId: p1_2?.id, recordDate: yesterday, quantity: 15, unitOfMeasure: 'т', description: 'Арматура плита ростверка' },
    { wbsNodeId: p1_3?.id, recordDate: yesterday, quantity: 40, unitOfMeasure: 'м³', description: 'Бетон фундаментная плита' },
    { wbsNodeId: p1_3?.id, recordDate: today, quantity: 35, unitOfMeasure: 'м³', description: 'Бетон фундамент ростверк' },
    { wbsNodeId: p2_1?.id, recordDate: twoDaysAgo, quantity: 120, unitOfMeasure: 'м²', description: 'Опалубка перекрытие этаж 1' },
    { wbsNodeId: p2_1?.id, recordDate: yesterday, quantity: 95, unitOfMeasure: 'м²', description: 'Опалубка перекрытие этаж 2' },
    { wbsNodeId: p2_2?.id, recordDate: yesterday, quantity: 8.5, unitOfMeasure: 'т', description: 'Армирование каркаса этаж 1' },
    { wbsNodeId: p2_2?.id, recordDate: today, quantity: 6.2, unitOfMeasure: 'т', description: 'Армирование каркаса этаж 2' },
    { wbsNodeId: p2_3?.id, recordDate: today, quantity: 45, unitOfMeasure: 'м³', description: 'Бетонирование перекрытия' },
    { wbsNodeId: p3_1?.id, recordDate: yesterday, quantity: 200, unitOfMeasure: 'м²', description: 'Кладка наружных стен' },
    { wbsNodeId: p3_1?.id, recordDate: today, quantity: 180, unitOfMeasure: 'м²', description: 'Кладка внутренних стен' },
    { wbsNodeId: p3_2?.id, recordDate: today, quantity: 50, unitOfMeasure: 'пог.м', description: 'Трубопровод ГВС' },
  ];
  for (const wv of workVolumes) {
    if (!wv.wbsNodeId) continue;
    await post('/work-volumes', { projectId: PROJECT_ID, ...wv });
  }

  console.log('  ✅ Planning seeded (WBS nodes, dependencies, baselines, 10 EVM snapshots, 8 resource allocations, 4 multi-project allocations, 15 work volumes)');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  ПРИВОД — Seed демо-данных по всем модулям             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`API: ${API}`);

  await login();
  await getContext();

  // Пользователи
  await seedUsers();

  // Базовая структура
  await seedDepartments();
  await seedCounterparties();
  await seedEmployees();

  // Проектное управление
  await seedTasksAndStages();
  await seedCrmLeads();

  // Документы и контракты
  await seedContracts();
  await seedEstimates();
  await seedPermits();

  // Финансы
  await seedInvoices();

  // Снабжение
  await seedPurchaseRequests();

  // Производство
  await seedOps();
  await seedSafety();
  await seedSubmittals();

  // Закрытие
  await seedKs2();
  await seedKs3();

  // Качество и контроль
  await seedQuality();
  await seedChangeOrders();
  await seedPunchList();

  // Обследования и квалификация
  await seedSiteAssessments();
  await seedPrequalifications();

  // Коммуникации
  await seedSupportTickets();
  await seedMessaging();

  // Транспорт
  await seedFleet();

  // Интеграции
  await seedIntegrations();

  // Мониторинг
  await seedMonitoring();

  // Календарь
  await seedCalendarEvents();

  // Планирование / WBS / Гант
  await seedPlanning();

  // Администрирование / Безопасность
  await seedSecurity();

  // Итоги
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  ИТОГО:');
  let total = 0;
  for (const [module, ids] of Object.entries(created)) {
    const count = ids?.length || 0;
    total += count;
    console.log(`    ${module}: ${count}`);
  }
  console.log(`  ─────────────────────────────`);
  console.log(`  ВСЕГО записей: ${total}`);
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
