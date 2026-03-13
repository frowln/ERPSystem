#!/usr/bin/env node
/**
 * seed_quality_regulatory.mjs
 *
 * Seed script for Quality and Regulatory modules.
 * Creates realistic demo data via the backend REST API.
 *
 * Usage:
 *   node scripts/seed_quality_regulatory.mjs [--api http://localhost:8080]
 *
 * Prerequisites:
 *   - Backend running at http://localhost:8080
 *   - User admin@privod.ru / admin123 exists
 *   - At least one project exists
 */

const API_BASE = process.env.API_BASE || process.argv.find(a => a.startsWith('--api='))?.split('=')[1] || 'http://localhost:8080';
const API = `${API_BASE}/api`;

let TOKEN = '';
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
    // Silently handle 409 Conflict (idempotent re-run)
    if (res.status === 409) {
      console.log(`  [409 Conflict — already exists] ${method} ${path}`);
      stats.skipped++;
      return '__skipped__';
    }
    const detail = typeof json === 'string' ? json.slice(0, 300) : JSON.stringify(json).slice(0, 300);
    console.error(`  [${res.status}] ${method} ${path}: ${detail}`);
    return null;
  }
  return json?.data ?? json;
}

const post = (path, body) => request('POST', path, body);
const get = (path) => request('GET', path);

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

let stats = { success: 0, failed: 0, skipped: 0 };

function trackResult(label, result) {
  if (result === '__skipped__') {
    // Already counted in request()
    return;
  } else if (result === null) {
    stats.failed++;
  } else {
    stats.success++;
    console.log(`  + ${label}: ${result?.id || 'OK'}`);
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function login() {
  console.log('\n=== Авторизация ===');
  const res = await post('/auth/login', { email: 'admin@privod.ru', password: 'admin123' });
  if (!res?.accessToken) {
    console.error('Не удалось авторизоваться');
    process.exit(1);
  }
  TOKEN = res.accessToken;
  console.log('  Авторизован');
}

async function getContext() {
  console.log('\n=== Загрузка контекста ===');
  const projects = await get('/projects?size=50');
  const list = projects?.content || projects || [];
  if (Array.isArray(list) && list.length > 0) {
    PROJECT_ID = list[0].id;
    PROJECT_IDS = list.map(p => p.id);
    console.log(`  Проектов: ${list.length}, основной: ${list[0].name || PROJECT_ID}`);
  } else {
    console.error('  Нет проектов! Сначала создайте хотя бы один проект.');
    process.exit(1);
  }
}

// ── QUALITY MODULE ───────────────────────────────────────────────────────────

async function seedQualityChecks() {
  console.log('\n=== Quality Checks (Проверки качества) ===');

  const checks = [
    {
      projectId: PROJECT_ID,
      checkType: 'INCOMING_MATERIAL',
      name: 'Входной контроль арматуры А500С партия 2026-03',
      description: 'Проверка сертификатов и геометрических параметров арматуры класса А500С. Партия от 01.03.2026.',
      plannedDate: daysAgo(5),
      inspectorName: 'Козлов Д.А.',
    },
    {
      projectId: PROJECT_ID,
      checkType: 'INTERMEDIATE_WORK',
      name: 'Промежуточный контроль бетонирования плиты перекрытия эт.3',
      description: 'Проверка армирования, опалубки, закладных деталей перед бетонированием. Секция А, этаж 3.',
      plannedDate: daysAgo(2),
      inspectorName: 'Петров И.С.',
    },
    {
      projectId: PROJECT_ID,
      checkType: 'HIDDEN_WORK',
      name: 'АОСР: Устройство гидроизоляции фундамента секция Б',
      description: 'Освидетельствование скрытых работ по гидроизоляции фундаментной плиты. Секция Б, оси 1-5/А-Г.',
      plannedDate: daysAgo(10),
      inspectorName: 'Сидоров А.В.',
    },
    {
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      checkType: 'FINAL',
      name: 'Итоговый контроль качества монтажа вентиляции этаж 2',
      description: 'Финальная проверка смонтированной системы вентиляции на этаже 2. Проверка герметичности, крепления, уклонов.',
      plannedDate: today(),
      inspectorName: 'Волков М.Е.',
    },
    {
      projectId: PROJECT_ID,
      checkType: 'LABORATORY',
      name: 'Лабораторные испытания бетона класс В25 (куб 7 суток)',
      description: 'Контрольные образцы (кубы 100x100x100 мм) — промежуточные испытания на 7-е сутки. Партия 2026-03-01.',
      plannedDate: daysAgo(7),
      inspectorName: 'Кузнецова Н.А.',
    },
    {
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      checkType: 'INCOMING_MATERIAL',
      name: 'Входной контроль кирпича керамического М150',
      description: 'Проверка геометрии, маркировки, внешнего вида. Партия 500 шт от ООО "Кирпичный завод".',
      plannedDate: daysAgo(3),
      inspectorName: 'Козлов Д.А.',
    },
    {
      projectId: PROJECT_ID,
      checkType: 'INTERMEDIATE_WORK',
      name: 'Контроль сварных соединений металлоконструкций каркаса',
      description: 'Визуальный и ультразвуковой контроль сварных швов. Узлы Н1-Н12, каркас здания.',
      plannedDate: daysFromNow(3),
      inspectorName: 'Лебедев В.Г.',
    },
    {
      projectId: PROJECT_IDS[2] || PROJECT_ID,
      checkType: 'HIDDEN_WORK',
      name: 'АОСР: Устройство теплоизоляции кровли здание 2',
      description: 'Скрытые работы по монтажу утеплителя (мин. вата 200мм) кровли. Здание 2, вся площадь.',
      plannedDate: daysAgo(1),
      inspectorName: 'Петров И.С.',
    },
  ];

  for (const c of checks) {
    const res = await post('/quality/checks', c);
    trackResult(`Проверка: ${c.name.slice(0, 50)}...`, res);
  }
}

async function seedNonConformances() {
  console.log('\n=== Non-Conformances (Несоответствия) ===');

  const ncs = [
    {
      projectId: PROJECT_ID,
      severity: 'CRITICAL',
      description: 'Недостаточная толщина защитного слоя бетона (15 мм вместо требуемых 25 мм) в плите перекрытия этажа 3, секция А, оси 3-5.',
      rootCause: 'Неправильная установка фиксаторов арматуры. Использованы фиксаторы 15 мм вместо 25 мм.',
      correctiveAction: 'Демонтаж бетонного слоя и повторное бетонирование с установкой правильных фиксаторов.',
      preventiveAction: 'Обязательная проверка фиксаторов перед бетонированием. Внесение в чек-лист.',
      dueDate: daysFromNow(14),
      cost: 450000.00,
    },
    {
      projectId: PROJECT_ID,
      severity: 'MAJOR',
      description: 'Отклонение от проектного уклона канализационной трубы DN110: фактический уклон 0.01 вместо проектного 0.02 на участке 12 м.',
      rootCause: 'Ошибка при разбивке трассы. Отметки не проверены геодезистом.',
      correctiveAction: 'Переукладка трубы с корректным уклоном 0.02. Повторная геодезическая съёмка.',
      preventiveAction: 'Геодезический контроль уклонов перед засыпкой.',
      dueDate: daysFromNow(7),
      cost: 85000.00,
    },
    {
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      severity: 'MINOR',
      description: 'Царапины на лицевой поверхности кирпичной кладки (эстетический дефект) на фасаде здания 1, 2-й этаж, ось В.',
      rootCause: 'Механическое повреждение при монтаже строительных лесов.',
      correctiveAction: 'Расшивка швов и замена повреждённых кирпичей (12 шт).',
      preventiveAction: 'Защита готовых поверхностей при монтаже вспомогательных конструкций.',
      dueDate: daysFromNow(21),
      cost: 15000.00,
    },
    {
      projectId: PROJECT_ID,
      severity: 'MAJOR',
      description: 'Несоответствие марки бетона: проектная В25, фактическая по результатам испытаний В20. Партия от 28.02.2026, конструкция — колонна К-7.',
      rootCause: 'Нарушение рецептуры на РБУ поставщика (превышение водоцементного отношения).',
      correctiveAction: 'Инъектирование колонны усиливающим составом. Дополнительные испытания кернов.',
      preventiveAction: 'Лабораторный контроль каждой партии бетона на площадке. Отбор проб при приёмке.',
      dueDate: daysFromNow(10),
      cost: 280000.00,
    },
    {
      projectId: PROJECT_IDS[2] || PROJECT_ID,
      severity: 'MINOR',
      description: 'Не установлены маркировочные бирки на трубопроводах отопления в подвале здания 2.',
      rootCause: 'Пропуск операции в процессе монтажа.',
      correctiveAction: 'Установка маркировочных бирок на все трубопроводы согласно проекту.',
      preventiveAction: 'Добавление контрольной точки в журнал монтажа.',
      dueDate: daysFromNow(5),
      cost: 5000.00,
    },
  ];

  for (const nc of ncs) {
    const res = await post('/quality/non-conformances', nc);
    trackResult(`НС (${nc.severity}): ${nc.description.slice(0, 50)}...`, res);
  }
}

async function seedChecklistTemplates() {
  console.log('\n=== Checklist Templates (Шаблоны чек-листов) ===');

  const templates = [
    {
      name: 'Чек-лист бетонирования конструкций',
      workType: 'CONCRETING',
      items: [
        { description: 'Проверка опалубки: геометрия, жёсткость, герметичность', required: true },
        { description: 'Проверка армирования: диаметры, шаг, защитный слой', required: true },
        { description: 'Проверка закладных деталей и проходок', required: true },
        { description: 'Наличие акта на скрытые работы (АОСР) на предыдущие слои', required: true },
        { description: 'Документы на бетонную смесь (паспорт, осадка конуса)', required: true },
        { description: 'Контроль температуры бетонной смеси при укладке', required: false },
        { description: 'Виброуплотнение бетонной смеси', required: true },
        { description: 'Отбор контрольных образцов (кубов)', required: true },
        { description: 'Уход за бетоном (укрытие, полив)', required: false },
      ],
    },
    {
      name: 'Чек-лист монтажа металлоконструкций',
      workType: 'STEEL_INSTALLATION',
      items: [
        { description: 'Проверка сертификатов на металл (сталь С245/С345)', required: true },
        { description: 'Проверка геометрических размеров элементов', required: true },
        { description: 'Контроль антикоррозийного покрытия', required: true },
        { description: 'Проверка болтовых соединений (момент затяжки)', required: true },
        { description: 'Контроль сварных швов (ВИК + УЗК)', required: true },
        { description: 'Проверка соосности и вертикальности колонн', required: true },
        { description: 'Геодезическая съёмка смонтированных конструкций', required: true },
      ],
    },
    {
      name: 'Чек-лист сварочных работ',
      workType: 'WELDING',
      items: [
        { description: 'Проверка квалификации сварщика (удостоверение НАКС)', required: true },
        { description: 'Проверка сварочного оборудования и материалов', required: true },
        { description: 'Подготовка кромок (зачистка, разделка)', required: true },
        { description: 'Контроль режимов сварки (ток, напряжение, скорость)', required: true },
        { description: 'Визуальный контроль шва (ВИК)', required: true },
        { description: 'Измерительный контроль (размеры шва, катет)', required: true },
        { description: 'Неразрушающий контроль (УЗК/радиография) — по проекту', required: false },
        { description: 'Термообработка (при необходимости)', required: false },
      ],
    },
  ];

  for (const t of templates) {
    const res = await post('/quality/checklist-templates', t);
    trackResult(`Шаблон: ${t.name}`, res);
  }
}

async function seedMaterialInspections() {
  console.log('\n=== Material Inspections (Входной контроль материалов) ===');

  const inspections = [
    {
      materialName: 'Арматура А500С д.12 мм',
      supplier: 'ООО "МеталлТрейд"',
      batchNumber: 'MT-2026-0312-A500',
      inspectorName: 'Козлов Д.А.',
      inspectionDate: daysAgo(3),
      result: 'accepted',
      testProtocolNumber: 'ПР-2026/087',
      notes: 'Сертификат качества 3.1. Размеры в допуске. Маркировка соответствует.',
      projectId: PROJECT_ID,
      testResults: [
        { parameter: 'Диаметр', value: '12.1 мм', norm: '12±0.3 мм', passed: true },
        { parameter: 'Предел текучести', value: '520 МПа', norm: '≥500 МПа', passed: true },
      ],
    },
    {
      materialName: 'Бетон В25 (М350), П4, F200, W8',
      supplier: 'ООО "БетонСтрой"',
      batchNumber: 'BS-2026-0310-B25',
      inspectorName: 'Кузнецова Н.А.',
      inspectionDate: daysAgo(2),
      result: 'accepted',
      testProtocolNumber: 'ПР-2026/088',
      notes: 'Осадка конуса 18 см (норма 16-20). Температура 18°C. Паспорт качества получен.',
      projectId: PROJECT_ID,
      testResults: [
        { parameter: 'Осадка конуса', value: '18 см', norm: '16-20 см', passed: true },
        { parameter: 'Температура', value: '18°C', norm: '5-30°C', passed: true },
      ],
    },
    {
      materialName: 'Труба ПП канализационная DN110 SN4',
      supplier: 'ООО "ТрубоПласт"',
      batchNumber: 'TP-2026-0308-DN110',
      inspectorName: 'Петров И.С.',
      inspectionDate: daysAgo(5),
      result: 'conditional',
      testProtocolNumber: 'ПР-2026/085',
      notes: 'Маркировка частично стёрта на 20% труб. Геометрия в допуске. Условно принято с требованием дополнительной маркировки.',
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      testResults: [
        { parameter: 'Наружный диаметр', value: '110.2 мм', norm: '110±0.5 мм', passed: true },
        { parameter: 'Маркировка', value: 'Частично стёрта', norm: 'Читаема', passed: false },
      ],
    },
    {
      materialName: 'Кирпич керамический М150 лицевой',
      supplier: 'ОАО "Кирпичный завод"',
      batchNumber: 'KZ-2026-0305-M150',
      inspectorName: 'Козлов Д.А.',
      inspectionDate: daysAgo(8),
      result: 'rejected',
      testProtocolNumber: 'ПР-2026/082',
      notes: 'Выявлены сколы на >10% кирпичей в партии. Цвет неоднородный — два оттенка. Партия возвращена поставщику.',
      projectId: PROJECT_ID,
      testResults: [
        { parameter: 'Внешний вид', value: 'Сколы >10%', norm: 'Сколы ≤5%', passed: false },
        { parameter: 'Однородность цвета', value: '2 оттенка', norm: '1 оттенок', passed: false },
      ],
    },
  ];

  for (const mi of inspections) {
    const res = await post('/quality/material-inspections', mi);
    trackResult(`Контроль: ${mi.materialName}`, res);
  }
}

async function seedQualityCertificates() {
  console.log('\n=== Quality Certificates (Сертификаты качества) ===');

  const certificates = [
    {
      certificateNumber: 'РОСС RU.СЛ28.Н01254',
      certificateType: 'GOST',
      supplierName: 'ООО "МеталлТрейд"',
      issueDate: daysAgo(180),
      expiryDate: daysFromNow(185),
    },
    {
      certificateNumber: 'TC-RU-0032.B.01478',
      certificateType: 'CONFORMITY',
      supplierName: 'ООО "БетонСтрой"',
      issueDate: daysAgo(90),
      expiryDate: daysFromNow(275),
    },
    {
      certificateNumber: 'ISO-9001-2024-RU-0089',
      certificateType: 'ISO',
      supplierName: 'ЗАО "СтальПром"',
      issueDate: daysAgo(365),
      expiryDate: daysFromNow(0),  // Expired today
    },
    {
      certificateNumber: 'ПС-00432-2025',
      certificateType: 'FIRE_SAFETY',
      supplierName: 'ООО "ТрубоПласт"',
      issueDate: daysAgo(60),
      expiryDate: daysFromNow(305),
    },
    {
      certificateNumber: 'СЭЗ-77.01.09.024.T.001245.02.26',
      certificateType: 'SANITARY',
      supplierName: 'ООО "ХимЗащита"',
      issueDate: daysAgo(30),
      expiryDate: daysFromNow(335),
    },
  ];

  for (const cert of certificates) {
    const res = await post('/quality/certificates', cert);
    trackResult(`Сертификат: ${cert.certificateNumber}`, res);
  }
}

async function seedSupervisionEntries() {
  console.log('\n=== Supervision Entries (Журнал авторского надзора) ===');

  const entries = [
    {
      date: daysAgo(7),
      inspectorName: 'Архитектор Белов К.П.',
      workType: 'Бетонирование фундаментов',
      remarks: 'Работы ведутся в соответствии с проектом. Армирование проверено, фиксаторы установлены. Замечаний нет.',
      directives: 'Продолжить работы. Обеспечить уход за бетоном в течение 7 суток (укрытие + полив).',
      projectId: PROJECT_ID,
    },
    {
      date: daysAgo(3),
      inspectorName: 'ГИП Новиков А.С.',
      workType: 'Монтаж металлоконструкций каркаса',
      remarks: 'Отклонение колонны К-5 от вертикали 18 мм (допуск 15 мм). Сварные швы узла Н-8 — подрез длиной 25 мм.',
      directives: 'Выправить колонну К-5 до допустимого отклонения. Переварить узел Н-8 с зачисткой подреза. Предъявить к повторному контролю.',
      projectId: PROJECT_ID,
    },
    {
      date: daysAgo(1),
      inspectorName: 'Конструктор Сидоров А.В.',
      workType: 'Устройство кровли',
      remarks: 'Примыкания к парапетам выполнены с нарушением: отсутствует дополнительный слой гидроизоляции. Основная площадь — без замечаний.',
      directives: 'Устранить нарушение по примыканиям в срок до ' + daysFromNow(5) + '. Выполнить дополнительный слой по детали 12 проекта.',
      projectId: PROJECT_IDS[1] || PROJECT_ID,
    },
  ];

  for (const entry of entries) {
    const res = await post('/quality/supervision-entries', entry);
    trackResult(`Запись АН: ${entry.workType}`, res);
  }
}

// ── REGULATORY MODULE ────────────────────────────────────────────────────────

async function seedPermits() {
  console.log('\n=== Construction Permits (Разрешения на строительство) ===');

  const permits = [
    {
      projectId: PROJECT_ID,
      permitNumber: 'RU77-2026-0001-СТР',
      issuedBy: 'Мосгосстройнадзор',
      issuedDate: daysAgo(120),
      expiresDate: daysFromNow(610),
      permitType: 'BUILDING_PERMIT',
      conditions: 'Строительство 5-этажного жилого дома. Ограничение высоты 20 м. Соблюдение СП 54.13330.',
    },
    {
      projectId: PROJECT_ID,
      permitNumber: 'RU77-2026-0045-ЗР',
      issuedBy: 'Администрация района',
      issuedDate: daysAgo(90),
      expiresDate: daysFromNow(275),
      permitType: 'EXCAVATION',
      conditions: 'Земляные работы в пределах красных линий. Глубина до 5 м. Обязательное крепление стен котлована.',
    },
    {
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      permitNumber: 'RU-RT-2026-0012',
      issuedBy: 'Ростехнадзор, УТЭН по г. Москве',
      issuedDate: daysAgo(60),
      expiresDate: daysFromNow(305),
      permitType: 'ROSTECHNADZOR',
      conditions: 'Эксплуатация грузоподъёмного крана КБ-408. Регулярные технические освидетельствования.',
    },
    {
      projectId: PROJECT_ID,
      permitNumber: 'RU77-ПБ-2026-0078',
      issuedBy: 'ГУ МЧС по г. Москве',
      issuedDate: daysAgo(100),
      expiresDate: daysFromNow(265),
      permitType: 'FIRE_SAFETY',
      conditions: 'Пожарная безопасность при производстве строительных работ. Наличие средств пожаротушения.',
    },
    {
      projectId: PROJECT_IDS[2] || PROJECT_ID,
      permitNumber: 'RU77-ЭКО-2026-0034',
      issuedBy: 'Департамент природопользования г. Москвы',
      issuedDate: daysAgo(150),
      expiresDate: daysFromNow(215),
      permitType: 'ENVIRONMENTAL',
      conditions: 'Вывоз строительных отходов на лицензированный полигон. Мониторинг уровня шума и пыли.',
    },
    {
      projectId: PROJECT_ID,
      permitNumber: 'RU77-ОРД-2026-0091',
      issuedBy: 'ЦОДД г. Москвы',
      issuedDate: daysAgo(80),
      expiresDate: daysFromNow(10),  // Expiring soon!
      permitType: 'TRAFFIC',
      conditions: 'Ограничение движения транспорта на ул. Строителей, д.5. Временная схема организации движения.',
    },
  ];

  for (const p of permits) {
    const res = await post('/regulatory/permits', p);
    trackResult(`Разрешение: ${p.permitNumber}`, res);
  }
}

async function seedRegulatoryInspections() {
  console.log('\n=== Regulatory Inspections (Проверки надзорных органов) ===');

  const inspectionIds = [];

  const inspections = [
    {
      projectId: PROJECT_ID,
      inspectionDate: daysAgo(30),
      inspectorName: 'Иванченко П.А.',
      inspectorOrgan: 'Ростехнадзор',
      inspectionType: 'PLANNED',
      result: 'PASS',
      violations: null,
      actNumber: 'АКТ-2026/0145',
    },
    {
      projectId: PROJECT_ID,
      inspectionDate: daysAgo(14),
      inspectorName: 'Смирнова Е.В.',
      inspectorOrgan: 'ГИТ (Государственная инспекция труда)',
      inspectionType: 'UNPLANNED',
      result: 'VIOLATIONS',
      violations: '1. Отсутствие ограждения на 3-м этаже (нарушение СНиП 12-03-2001 п.6.2.16). 2. Работник без каски в зоне монтажа (нарушение ТОИ Р-66-21).',
      actNumber: 'АКТ-ГИТ-2026/0089',
      deadlineToFix: daysFromNow(14),
    },
    {
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      inspectionDate: daysAgo(7),
      inspectorName: 'Петренко В.И.',
      inspectorOrgan: 'Стройнадзор г. Москвы',
      inspectionType: 'PLANNED',
      result: 'VIOLATIONS',
      violations: 'Не предъявлены АОСР на скрытые работы по гидроизоляции подвала (3 акта).',
      actNumber: 'АКТ-СН-2026/0056',
      deadlineToFix: daysFromNow(7),
    },
    {
      projectId: PROJECT_ID,
      inspectionDate: daysAgo(45),
      inspectorName: 'Кузьмин А.Д.',
      inspectorOrgan: 'ГУ МЧС / Госпожнадзор',
      inspectionType: 'PLANNED',
      result: 'PASS',
      violations: null,
      actNumber: 'АКТ-МЧС-2026/0023',
    },
    {
      projectId: PROJECT_IDS[2] || PROJECT_ID,
      inspectionDate: daysAgo(3),
      inspectorName: 'Соколова А.Н.',
      inspectorOrgan: 'Роспотребнадзор',
      inspectionType: 'UNPLANNED',
      result: 'VIOLATIONS',
      violations: 'Превышение допустимого уровня шума на границе жилой застройки: 72 дБА вместо 55 дБА (СН 2.2.4/2.1.8.562-96).',
      actNumber: 'АКТ-РПН-2026/0178',
      deadlineToFix: daysFromNow(10),
    },
  ];

  for (const insp of inspections) {
    const res = await post('/regulatory/inspections', insp);
    trackResult(`Проверка: ${insp.inspectorOrgan} (${insp.result})`, res);
    if (res && res !== '__skipped__' && res?.id) inspectionIds.push(res.id);
  }

  return inspectionIds;
}

async function seedPrescriptions(inspectionIds) {
  console.log('\n=== Prescriptions (Предписания) ===');

  const prescriptions = [
    {
      projectId: PROJECT_ID,
      inspectionId: inspectionIds[1] || null,
      description: 'Установить ограждения на открытых проёмах и перепадах высот более 1.3 м на 3-м этаже здания. Обеспечить инвентарным ограждением высотой не менее 1.1 м с бортовой доской.',
      regulatoryBodyType: 'GIT',
      receivedDate: daysAgo(14),
      deadline: daysFromNow(14),
      responsibleName: 'Начальник участка Волков М.Е.',
      fineAmount: 150000.00,
      violationCount: 2,
      regulatoryReference: 'СНиП 12-03-2001 п.6.2.16, ТОИ Р-66-21',
      notes: 'При повторном нарушении — приостановка работ до 90 суток.',
    },
    {
      projectId: PROJECT_IDS[1] || PROJECT_ID,
      inspectionId: inspectionIds[2] || null,
      description: 'Предъявить акты освидетельствования скрытых работ (АОСР) на гидроизоляцию подвала. Оформить недостающую исполнительную документацию в соответствии с СП 48.13330.',
      regulatoryBodyType: 'STROYNADZOR',
      receivedDate: daysAgo(7),
      deadline: daysFromNow(7),
      responsibleName: 'ПТО Кузнецова Н.А.',
      fineAmount: 80000.00,
      violationCount: 3,
      regulatoryReference: 'СП 48.13330.2019 п.7.3',
      notes: 'Задержка оформления ИД более 5 раб. дней.',
    },
    {
      projectId: PROJECT_IDS[2] || PROJECT_ID,
      inspectionId: inspectionIds[4] || null,
      description: 'Принять меры по снижению уровня шума при производстве строительных работ до нормативных значений. Ограничить шумные работы временным интервалом 09:00-18:00.',
      regulatoryBodyType: 'ROSPOTREBNADZOR',
      receivedDate: daysAgo(3),
      deadline: daysFromNow(10),
      responsibleName: 'Прораб Лебедев В.Г.',
      fineAmount: 200000.00,
      violationCount: 1,
      regulatoryReference: 'СН 2.2.4/2.1.8.562-96, ФЗ-52 ст.23',
      notes: 'Жалобы жителей ул. Строителей д.7.',
    },
    {
      projectId: PROJECT_ID,
      description: 'Устранить нарушения правил пожарной безопасности: восстановить средства пожаротушения (2 огнетушителя ОП-8 на 2-м этаже), обеспечить свободный доступ к эвакуационным выходам.',
      regulatoryBodyType: 'MCHS',
      receivedDate: daysAgo(20),
      deadline: daysAgo(5),  // Already overdue!
      responsibleName: 'Инженер по ОТ Лебедев В.Г.',
      fineAmount: 100000.00,
      violationCount: 2,
      regulatoryReference: 'ППР-2012 п.55, п.36',
      notes: 'ВНИМАНИЕ: Срок исполнения истёк. Повторная проверка назначена.',
    },
  ];

  for (const p of prescriptions) {
    // Try standalone endpoint first
    const res = await post('/regulatory/prescriptions', p);
    trackResult(`Предписание (${p.regulatoryBodyType}): ${p.description.slice(0, 50)}...`, res);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  PRIVOD — Seed Quality & Regulatory Modules          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await login();
  await getContext();

  // Quality module
  await seedQualityChecks();
  await seedNonConformances();
  await seedChecklistTemplates();
  await seedMaterialInspections();
  await seedQualityCertificates();
  await seedSupervisionEntries();

  // Regulatory module
  await seedPermits();
  const inspectionIds = await seedRegulatoryInspections();
  await seedPrescriptions(inspectionIds);

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log(`║  ИТОГО: ${stats.success} создано, ${stats.failed} ошибок, ${stats.skipped} пропущено`);
  console.log('╚════════════════════════════════════════════════════════╝');

  if (stats.failed > 0) {
    console.log('\n⚠ Некоторые записи не были созданы — см. ошибки выше.');
  }
}

main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
