/**
 * Enrich ЖК Олимп project — fill all empty modules with realistic data.
 *
 * Prerequisites: backend running at localhost:8080, project already seeded
 * via reset_and_seed.mjs (or equivalent).
 *
 * Usage:
 *   node scripts/enrich_olimp.mjs
 *
 * Optional env:
 *   API_ROOT=http://localhost:8080/api
 *   PRIVOD_EMAIL=admin@privod.ru
 *   PRIVOD_PASSWORD=admin123
 */

const API_ROOT = process.env.API_ROOT ?? 'http://localhost:8080/api';
const EMAIL    = process.env.PRIVOD_EMAIL ?? 'admin@privod.ru';
const PASSWORD = process.env.PRIVOD_PASSWORD ?? 'admin123';

const PROJECT_ID = 'd8d7bc98-8aea-4df4-8867-091e7d6366ef';
const BUDGET_ID  = '0097909e-b7b5-4984-9f5a-c1a173c500e5';
const ORG_ID     = '00000000-0000-0000-0000-000000000001';

let ACCESS_TOKEN = '';
let ADMIN_USER_ID = '';

// ─── HTTP helpers ───────────────────────────────────────────────────────────

const headers = () => ({
  'Content-Type': 'application/json',
  ...(ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {}),
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(method, path, body, attempt = 0) {
  await sleep(50); // rate-limit guard
  const url = `${API_ROOT}${path}`;
  const response = await fetch(url, {
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const rawText = await response.text();
  let parsed = null;
  try { parsed = rawText ? JSON.parse(rawText) : null; } catch { parsed = rawText; }

  if (!response.ok) {
    if (response.status === 429 && attempt < 8) {
      const retryMs = Math.max(Number(response.headers.get('retry-after') ?? 0) * 1000, 500 * (attempt + 1));
      await sleep(retryMs);
      return api(method, path, body, attempt + 1);
    }
    const details = typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed) : String(parsed);
    throw new Error(`${method} ${path} → ${response.status}: ${details}`);
  }

  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) return parsed.data;
  return parsed;
}

const post = (path, body) => api('POST', path, body);
const get  = (path)       => api('GET', path);

function pageContent(r) {
  if (!r) return [];
  if (Array.isArray(r.content)) return r.content;
  if (Array.isArray(r)) return r;
  return [];
}

let callCount = 0;
async function track(label, fn) {
  try {
    const result = await fn();
    callCount++;
    return result;
  } catch (err) {
    // 409 = data integrity (duplicate), skip gracefully
    if (err.message.includes('409')) {
      console.log(`  ⚠ ${label}: duplicate, skipping`);
      return null;
    }
    // 400/500 — log but don't abort (trackSoft behavior for non-critical data)
    if (err.message.includes('400') || err.message.includes('500')) {
      console.log(`  ⚠ ${label}: ${err.message.slice(0, 100)}`);
      return null;
    }
    console.error(`  ✗ ${label}: ${err.message}`);
    throw err;
  }
}

async function trackSoft(label, fn) {
  try {
    const result = await fn();
    callCount++;
    return result;
  } catch (err) {
    console.log(`  ⚠ ${label}: ${err.message.slice(0, 80)}`);
    return null;
  }
}

async function safeStep(title, fn, { critical = true } = {}) {
  process.stdout.write(`\n▶ ${title}\n`);
  try {
    const result = await fn();
    process.stdout.write(`  ✓ ${title}\n`);
    return result;
  } catch (err) {
    process.stdout.write(`  ✗ ${title}: ${err.message}\n`);
    if (critical) throw err;
    return null;
  }
}

// ─── TIER 1: HR ─────────────────────────────────────────────────────────────

async function tier1_hr() {
  const employees = [
    { firstName: 'Сергей',   lastName: 'Иванов',    middleName: 'Петрович',       position: 'Прораб',                 hourlyRate: 2500 },
    { firstName: 'Мария',    lastName: 'Петрова',    middleName: 'Ивановна',       position: 'Инженер ПТО',            hourlyRate: 2200 },
    { firstName: 'Алексей',  lastName: 'Сидоров',    middleName: 'Николаевич',     position: 'Монтажник ОВ',           hourlyRate: 1800 },
    { firstName: 'Дмитрий',  lastName: 'Козлов',     middleName: 'Андреевич',      position: 'Монтажник ВК',           hourlyRate: 1800 },
    { firstName: 'Елена',    lastName: 'Федорова',   middleName: 'Сергеевна',      position: 'Бухгалтер',              hourlyRate: 2000 },
    { firstName: 'Павел',    lastName: 'Николаев',   middleName: 'Витальевич',     position: 'Электромонтажник',       hourlyRate: 1900 },
    { firstName: 'Ольга',    lastName: 'Морозова',   middleName: 'Дмитриевна',     position: 'Инженер ОТ и ТБ',       hourlyRate: 2100 },
    { firstName: 'Андрей',   lastName: 'Волков',     middleName: 'Юрьевич',        position: 'Сварщик НАКС',           hourlyRate: 2300 },
    { firstName: 'Татьяна',  lastName: 'Кузнецова',  middleName: 'Александровна',  position: 'Снабженец',              hourlyRate: 1700 },
    { firstName: 'Виктор',   lastName: 'Лебедев',    middleName: 'Михайлович',     position: 'Водитель кат. С',        hourlyRate: 1600 },
    { firstName: 'Роман',    lastName: 'Новиков',    middleName: 'Олегович',       position: 'Монтажник СС',           hourlyRate: 1800 },
    { firstName: 'Максим',   lastName: 'Егоров',     middleName: 'Иванович',       position: 'Стропальщик',            hourlyRate: 1500 },
    { firstName: 'Анна',     lastName: 'Белова',     middleName: 'Петровна',       position: 'Инженер-сметчик',        hourlyRate: 2200 },
    { firstName: 'Артём',    lastName: 'Соколов',    middleName: 'Владимирович',   position: 'Маляр-штукатур',         hourlyRate: 1400 },
    { firstName: 'Игорь',    lastName: 'Андреев',    middleName: 'Константинович', position: 'Плотник-бетонщик',       hourlyRate: 1600 },
    { firstName: 'Наталья',  lastName: 'Григорьева', middleName: 'Сергеевна',      position: 'Кадровик',               hourlyRate: 1800 },
    { firstName: 'Денис',    lastName: 'Орлов',      middleName: 'Александрович',  position: 'Механик',                hourlyRate: 1900 },
    { firstName: 'Виталий',  lastName: 'Попов',      middleName: 'Геннадьевич',    position: 'Начальник участка',      hourlyRate: 2800 },
  ];

  const employeeIds = [];

  await safeStep('Создание 18 сотрудников', async () => {
    // Check if employees already exist
    const existing = pageContent(await get('/employees?size=200'));
    if (existing.length >= 18) {
      console.log(`  → Уже есть ${existing.length} сотрудников, переиспользуем`);
      for (const e of employees) {
        const match = existing.find(x => x.lastName === e.lastName && x.firstName === e.firstName);
        if (match) {
          employeeIds.push(match.id);
        } else {
          const created = await track(`employee ${e.lastName}`, () => post('/employees', {
            firstName: e.firstName, lastName: e.lastName, middleName: e.middleName,
            position: e.position, organizationId: ORG_ID, hireDate: '2025-08-15', hourlyRate: e.hourlyRate,
          }));
          employeeIds.push(created.id);
        }
      }
    } else {
      for (const e of employees) {
        const created = await track(`employee ${e.lastName}`, () => post('/employees', {
          firstName: e.firstName, lastName: e.lastName, middleName: e.middleName,
          position: e.position, organizationId: ORG_ID, hireDate: '2025-08-15', hourlyRate: e.hourlyRate,
        }));
        employeeIds.push(created.id);
      }
    }
  });

  await safeStep('Назначение сотрудников на проект (crew)', async () => {
    for (const empId of employeeIds) {
      await trackSoft('crew', () => post('/crew', {
        employeeId: empId,
        projectId: PROJECT_ID,
        startDate: '2025-09-01',
      }));
    }
  });

  // Timesheets: 5 days × 5 key employees
  const keyEmployees = [0, 1, 2, 5, 17]; // Прораб, ПТО, Монтажник ОВ, Электромонтажник, Нач. участка
  const workDays = ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'];

  await safeStep('Создание табелей (25 записей)', async () => {
    for (const idx of keyEmployees) {
      for (const day of workDays) {
        const overtime = idx === 0 || idx === 17 ? 2 : 0;
        await trackSoft('timesheet', () => post('/timesheets', {
          employeeId: employeeIds[idx],
          projectId: PROJECT_ID,
          workDate: day,
          hoursWorked: 8,
          overtimeHours: overtime,
        }));
      }
    }
  });

  return employeeIds;
}

// ─── TIER 2: WAREHOUSE ──────────────────────────────────────────────────────

async function tier2_warehouse(employeeIds) {
  // Locations
  const locationData = [
    { name: 'Основной склад ЖК Олимп',      code: 'WH-01', locationType: 'CENTRAL',      address: 'г. Москва, ул. Олимпийская, вл. 7, корп. С' },
    { name: 'Площадка секция А',              code: 'SITE-A', locationType: 'PROJECT_SITE', address: 'Корпус 1, секция А' },
    { name: 'Площадка секция Б',              code: 'SITE-B', locationType: 'PROJECT_SITE', address: 'Корпус 2, секция Б' },
    { name: 'Подсобное помещение',            code: 'AUX-01', locationType: 'PARTNER',      address: 'Временное строение №3' },
  ];

  const locationIds = [];
  await safeStep('Создание 4 складских локаций', async () => {
    // Check existing locations
    const existingLocs = pageContent(await get('/warehouse/locations?size=100'));
    for (const loc of locationData) {
      const existing = existingLocs.find(l => l.code === loc.code);
      if (existing) {
        locationIds.push(existing.id);
        continue;
      }
      const created = await track(`location ${loc.code}`, () => post('/warehouse/locations', {
        ...loc,
        projectId: PROJECT_ID,
        responsibleName: 'Кузнецова Т.А.',
      }));
      locationIds.push(created.id);
    }
    if (existingLocs.length >= locationData.length) {
      console.log(`  → Уже есть ${locationIds.length} локаций, переиспользуем`);
    }
  });

  // Materials
  const materialsData = [
    { name: 'Труба ПНД 110мм',           code: 'MAT-001', category: 'PIPES',       unit: 'м',  price: 420 },
    { name: 'Труба стальная 57×3.5',      code: 'MAT-002', category: 'PIPES',       unit: 'м',  price: 680 },
    { name: 'Кабель ВВГнг 3×2.5',         code: 'MAT-003', category: 'ELECTRICAL',  unit: 'м',  price: 85 },
    { name: 'Кабель ВВГнг 5×4',           code: 'MAT-004', category: 'ELECTRICAL',  unit: 'м',  price: 210 },
    { name: 'Арматура А500С d12',         code: 'MAT-005', category: 'METAL',       unit: 'т',  price: 72000 },
    { name: 'Цемент М500',                code: 'MAT-006', category: 'CONCRETE',    unit: 'т',  price: 5800 },
    { name: 'Щебень фр.20-40',            code: 'MAT-007', category: 'CONCRETE',    unit: 'м³', price: 2200 },
    { name: 'Песок строительный',          code: 'MAT-008', category: 'CONCRETE',    unit: 'м³', price: 950 },
    { name: 'Кирпич рядовой',             code: 'MAT-009', category: 'OTHER',       unit: 'шт', price: 14 },
    { name: 'Утеплитель Rockwool 100мм',  code: 'MAT-010', category: 'INSULATION',  unit: 'м²', price: 680 },
    { name: 'Профнастил С21',             code: 'MAT-011', category: 'METAL',       unit: 'м²', price: 520 },
    { name: 'Болт М16×80',                code: 'MAT-012', category: 'FASTENERS',   unit: 'шт', price: 28 },
    { name: 'Гайка М16',                  code: 'MAT-013', category: 'FASTENERS',   unit: 'шт', price: 8 },
    { name: 'Шайба 16 пружинная',         code: 'MAT-014', category: 'FASTENERS',   unit: 'шт', price: 5 },
    { name: 'Электрод УОНИ-13/55 d3',     code: 'MAT-015', category: 'OTHER',       unit: 'кг', price: 280 },
    { name: 'Лоток кабельный 200×50',     code: 'MAT-016', category: 'ELECTRICAL',  unit: 'м',  price: 340 },
    { name: 'Хомут трубный d110',         code: 'MAT-017', category: 'FASTENERS',   unit: 'шт', price: 120 },
    { name: 'Муфта ПЭ d110 SDR17',        code: 'MAT-018', category: 'PIPES',       unit: 'шт', price: 1450 },
    { name: 'Заглушка ПЭ d110',           code: 'MAT-019', category: 'PIPES',       unit: 'шт', price: 380 },
    { name: 'Манометр ДМ-02 0-10 МПа',    code: 'MAT-020', category: 'OTHER',       unit: 'шт', price: 3200 },
  ];

  const materialIds = [];
  await safeStep('Создание 20 материалов', async () => {
    const existingMats = pageContent(await get('/warehouse/materials?size=100'));
    for (const m of materialsData) {
      const existing = existingMats.find(e => e.code === m.code);
      if (existing) {
        materialIds.push(existing.id);
        continue;
      }
      const created = await track(`material ${m.code}`, () => post('/warehouse/materials', {
        name: m.name,
        code: m.code,
        category: m.category,
        unitOfMeasure: m.unit,
        currentPrice: m.price,
        minStockLevel: 10,
      }));
      materialIds.push(created.id);
    }
    if (existingMats.length >= materialsData.length) {
      console.log(`  → Уже есть ${materialIds.length} материалов, переиспользуем`);
    }
  });

  // Stock movements
  const [whMain, siteA, siteB] = locationIds;

  // Check if movements already exist
  const existingMovements = pageContent(await get(`/warehouse/movements?projectId=${PROJECT_ID}&size=1`));
  if (existingMovements.length > 0) {
    console.log(`  → Складские движения уже есть (${existingMovements.length}+), пропускаем`);
    // Check inventory too
    const existingInvChecks = pageContent(await get(`/warehouse/inventory-checks?size=1`));
    if (existingInvChecks.length > 0) console.log(`  → Инвентаризации уже есть, пропускаем`);
    return { locationIds, materialIds };
  }

  await safeStep('Создание 6 складских движений с позициями', async () => {
    // 1. RECEIPT: Трубы и фитинги → основной склад
    const mv1 = await track('movement-1', () => post('/warehouse/movements', {
      movementDate: '2026-02-10',
      movementType: 'RECEIPT',
      projectId: PROJECT_ID,
      destinationLocationId: whMain,
      responsibleName: 'Кузнецова Т.А.',
      notes: 'Приход труб и фитингов от ООО ТрубПоставка',
    }));
    for (const line of [
      { materialId: materialIds[0], quantity: 500, unitPrice: 420, unitOfMeasure: 'м' },
      { materialId: materialIds[1], quantity: 200, unitPrice: 680, unitOfMeasure: 'м' },
      { materialId: materialIds[17], quantity: 30, unitPrice: 1450, unitOfMeasure: 'шт' },
      { materialId: materialIds[18], quantity: 20, unitPrice: 380, unitOfMeasure: 'шт' },
    ]) {
      await track('mv1-line', () => post(`/warehouse/movements/${mv1.id}/lines`, { ...line, sequence: 10 }));
    }

    // 2. RECEIPT: Кабель и электрика
    const mv2 = await track('movement-2', () => post('/warehouse/movements', {
      movementDate: '2026-02-11',
      movementType: 'RECEIPT',
      projectId: PROJECT_ID,
      destinationLocationId: whMain,
      responsibleName: 'Кузнецова Т.А.',
      notes: 'Приход кабеля и электрики от ООО КабельТорг+',
    }));
    for (const line of [
      { materialId: materialIds[2], quantity: 2000, unitPrice: 85, unitOfMeasure: 'м' },
      { materialId: materialIds[3], quantity: 800, unitPrice: 210, unitOfMeasure: 'м' },
      { materialId: materialIds[15], quantity: 150, unitPrice: 340, unitOfMeasure: 'м' },
    ]) {
      await track('mv2-line', () => post(`/warehouse/movements/${mv2.id}/lines`, { ...line, sequence: 10 }));
    }

    // 3. ISSUE: Выдача на секцию А — трубы, арматура
    const mv3 = await track('movement-3', () => post('/warehouse/movements', {
      movementDate: '2026-02-13',
      movementType: 'ISSUE',
      projectId: PROJECT_ID,
      sourceLocationId: whMain,
      destinationLocationId: siteA,
      responsibleName: 'Сидоров А.Н.',
      notes: 'Выдача на секцию А — трубы ОВ, арматура',
    }));
    for (const line of [
      { materialId: materialIds[0], quantity: 200, unitPrice: 420, unitOfMeasure: 'м' },
      { materialId: materialIds[1], quantity: 80, unitPrice: 680, unitOfMeasure: 'м' },
      { materialId: materialIds[4], quantity: 5, unitPrice: 72000, unitOfMeasure: 'т' },
    ]) {
      await track('mv3-line', () => post(`/warehouse/movements/${mv3.id}/lines`, { ...line, sequence: 10 }));
    }

    // 4. ISSUE: Выдача на секцию Б — кабель, электроды
    const mv4 = await track('movement-4', () => post('/warehouse/movements', {
      movementDate: '2026-02-14',
      movementType: 'ISSUE',
      projectId: PROJECT_ID,
      sourceLocationId: whMain,
      destinationLocationId: siteB,
      responsibleName: 'Николаев П.В.',
      notes: 'Выдача на секцию Б — кабель, электроды',
    }));
    for (const line of [
      { materialId: materialIds[2], quantity: 500, unitPrice: 85, unitOfMeasure: 'м' },
      { materialId: materialIds[14], quantity: 50, unitPrice: 280, unitOfMeasure: 'кг' },
    ]) {
      await track('mv4-line', () => post(`/warehouse/movements/${mv4.id}/lines`, { ...line, sequence: 10 }));
    }

    // 5. TRANSFER: Утеплитель со склада на секцию А
    const mv5 = await track('movement-5', () => post('/warehouse/movements', {
      movementDate: '2026-02-17',
      movementType: 'TRANSFER',
      projectId: PROJECT_ID,
      sourceLocationId: whMain,
      destinationLocationId: siteA,
      responsibleName: 'Кузнецова Т.А.',
      notes: 'Перемещение утеплителя на секцию А',
    }));
    await track('mv5-line', () => post(`/warehouse/movements/${mv5.id}/lines`, {
      materialId: materialIds[9], quantity: 100, unitPrice: 680, unitOfMeasure: 'м²', sequence: 10,
    }));

    // 6. RETURN: Возврат излишков с секции Б
    const mv6 = await track('movement-6', () => post('/warehouse/movements', {
      movementDate: '2026-02-19',
      movementType: 'RETURN',
      projectId: PROJECT_ID,
      sourceLocationId: siteB,
      destinationLocationId: whMain,
      responsibleName: 'Николаев П.В.',
      notes: 'Возврат неиспользованных электродов',
    }));
    await track('mv6-line', () => post(`/warehouse/movements/${mv6.id}/lines`, {
      materialId: materialIds[14], quantity: 15, unitPrice: 280, unitOfMeasure: 'кг', sequence: 10,
    }));
  });

  // Inventory checks
  await safeStep('Создание 2 инвентаризаций', async () => {
    await track('inv-check-1', () => post('/warehouse/inventory-checks', {
      checkDate: '2026-02-15',
      locationId: whMain,
      projectId: PROJECT_ID,
      responsibleName: 'Кузнецова Т.А.',
      notes: 'Плановая инвентаризация основного склада',
    }));
    await track('inv-check-2', () => post('/warehouse/inventory-checks', {
      checkDate: '2026-02-20',
      locationId: siteA,
      projectId: PROJECT_ID,
      responsibleName: 'Сидоров А.Н.',
      notes: 'Инвентаризация площадки секции А',
    }));
  });

  return { locationIds, materialIds };
}

// ─── TIER 3: QUALITY & SAFETY ───────────────────────────────────────────────

async function tier3_quality_safety(employeeIds) {
  // Skip if quality data already exists
  const existingChecks = pageContent(await get(`/quality/checks?projectId=${PROJECT_ID}&size=1`));
  if (existingChecks.length > 0) {
    console.log(`  → Tier 3 (Качество + Безопасность) уже заполнен, пропускаем`);
    return;
  }

  // Quality checks
  await safeStep('Создание 8 проверок качества', async () => {
    const checks = [
      { checkType: 'HIDDEN_WORK',       name: 'Визуальный контроль сварных швов',                inspectorName: 'Волков А.Ю.' },
      { checkType: 'INTERMEDIATE_WORK', name: 'Проверка размеров ж/б конструкций',               inspectorName: 'Петрова М.И.' },
      { checkType: 'INCOMING_MATERIAL', name: 'Входной контроль арматуры А500С',                 inspectorName: 'Кузнецова Т.А.' },
      { checkType: 'INTERMEDIATE_WORK', name: 'Контроль монтажа трубопровода ОВ',                inspectorName: 'Иванов С.П.' },
      { checkType: 'FINAL',             name: 'Приёмка скрытых работ — гидроизоляция',           inspectorName: 'Попов В.Г.' },
      { checkType: 'HIDDEN_WORK',       name: 'Проверка укладки кабеля',                         inspectorName: 'Николаев П.В.' },
      { checkType: 'INTERMEDIATE_WORK', name: 'Испытание трубопровода ВК давлением',             inspectorName: 'Козлов Д.А.' },
      { checkType: 'INCOMING_MATERIAL', name: 'Входной контроль кабеля ВВГнг',                   inspectorName: 'Кузнецова Т.А.' },
    ];
    for (const c of checks) {
      await track(`qc ${c.name}`, () => post('/quality/checks', {
        projectId: PROJECT_ID,
        checkType: c.checkType,
        name: c.name,
        description: c.name,
        plannedDate: '2026-02-20',
        inspectorName: c.inspectorName,
      }));
    }
  });

  // Non-conformances
  await safeStep('Создание 3 NCR', async () => {
    const ncrs = [
      { severity: 'MINOR', description: 'Отклонение оси трубопровода на 15мм при допустимом 10мм — корректировка до заливки бетона', correctiveAction: 'Переустановка опоры и выставка по нивелиру' },
      { severity: 'MAJOR', description: 'Трещина в сварном шве участка ОВ — выявлена при визуальном контроле, требуется полная переварка', correctiveAction: 'Вырезать дефектный шов, выполнить повторную сварку с контролем НАКС' },
      { severity: 'MINOR', description: 'Повреждение изоляции кабеля ВВГнг при протяжке через проходку', correctiveAction: 'Заменить повреждённый участок (2м), установить защитную втулку' },
    ];
    for (const n of ncrs) {
      await track(`ncr ${n.severity}`, () => post('/quality/non-conformances', {
        projectId: PROJECT_ID,
        severity: n.severity,
        description: n.description,
        correctiveAction: n.correctiveAction,
        dueDate: '2026-03-01',
      }));
    }
  });

  // Safety incidents
  await safeStep('Создание 4 инцидентов', async () => {
    const incidents = [
      { severity: 'MINOR', incidentType: 'NEAR_MISS', description: 'Падение гаечного ключа с высоты 3м при монтаже воздуховодов. Пострадавших нет, зона была ограждена.', locationDescription: 'Секция А, отм. +6.000' },
      { severity: 'MINOR', incidentType: 'INJURY',    description: 'Порез руки при резке трубы болгаркой. Первая помощь на месте, госпитализация не потребовалась.', locationDescription: 'Площадка заготовки, основной склад', medicalTreatment: true },
      { severity: 'MINOR', incidentType: 'NEAR_MISS', description: 'Проскальзывание на мокрой лестнице. Работник удержался за перила, травм нет.', locationDescription: 'Лестничная клетка корп. 1, 3 этаж' },
      { severity: 'MINOR', incidentType: 'INJURY',    description: 'Ожог предплечья от сварки (1 степень). Амбулаторное лечение, листок нетрудоспособности не требовался.', locationDescription: 'Секция Б, подвал', medicalTreatment: true },
    ];
    for (const inc of incidents) {
      await track(`incident ${inc.incidentType}`, () => post('/safety/incidents', {
        incidentDate: '2026-02-18T10:30:00',
        projectId: PROJECT_ID,
        severity: inc.severity,
        incidentType: inc.incidentType,
        description: inc.description,
        locationDescription: inc.locationDescription,
        reportedByName: 'Морозова О.Д.',
        medicalTreatment: inc.medicalTreatment ?? false,
        hospitalization: false,
      }));
    }
  });

  // Safety inspections + violations
  await safeStep('Создание 4 инспекций ОТ с замечаниями', async () => {
    // 1. Planned: 2 violations
    const insp1 = await track('insp-1', () => post('/safety/inspections', {
      inspectionDate: '2026-02-14',
      projectId: PROJECT_ID,
      inspectorName: 'Морозова О.Д.',
      inspectionType: 'ROUTINE',
      notes: 'Еженедельная проверка строительной площадки',
    }));
    await track('viol-1a', () => post(`/safety/inspections/${insp1.id}/violations`, {
      description: 'Отсутствие ограждения проёма на 4 этаже',
      severity: 'HIGH',
      dueDate: '2026-02-16',
    }));
    await track('viol-1b', () => post(`/safety/inspections/${insp1.id}/violations`, {
      description: 'Складирование материалов в проходе эвакуационного выхода',
      severity: 'MEDIUM',
      dueDate: '2026-02-17',
    }));

    // 2. Unscheduled after incident: 1 violation
    const insp2 = await track('insp-2', () => post('/safety/inspections', {
      inspectionDate: '2026-02-18',
      projectId: PROJECT_ID,
      inspectorName: 'Морозова О.Д.',
      inspectionType: 'UNSCHEDULED',
      notes: 'Внеплановая проверка после инцидента с падением инструмента',
    }));
    await track('viol-2', () => post(`/safety/inspections/${insp2.id}/violations`, {
      description: 'Отсутствие бортового ограждения на площадке монтажа воздуховодов',
      severity: 'HIGH',
      dueDate: '2026-02-20',
    }));

    // 3. Planned electrical: 0 violations
    await track('insp-3', () => post('/safety/inspections', {
      inspectionDate: '2026-02-19',
      projectId: PROJECT_ID,
      inspectorName: 'Морозова О.Д.',
      inspectionType: 'ROUTINE',
      notes: 'Проверка электробезопасности — нарушений не выявлено',
    }));

    // 4. PPE check: 1 violation
    const insp4 = await track('insp-4', () => post('/safety/inspections', {
      inspectionDate: '2026-02-20',
      projectId: PROJECT_ID,
      inspectorName: 'Морозова О.Д.',
      inspectionType: 'ROUTINE',
      notes: 'Проверка средств индивидуальной защиты',
    }));
    await track('viol-4', () => post(`/safety/inspections/${insp4.id}/violations`, {
      description: 'Работник Соколов А.В. без защитных очков при работе с болгаркой',
      severity: 'MEDIUM',
      dueDate: '2026-02-21',
    }));
  });

  // Safety trainings
  await safeStep('Создание 5 инструктажей', async () => {
    const mkParticipants = (names) => JSON.stringify(names.map(n => ({ name: n })));
    const trainings = [
      { title: 'Вводный инструктаж для новых сотрудников',              trainingType: 'INITIAL',     participants: mkParticipants(['Иванов С.П.','Петрова М.И.','Сидоров А.Н.','Козлов Д.А.','Федорова Е.С.','Николаев П.В.','Морозова О.Д.','Волков А.Ю.','Кузнецова Т.А.','Лебедев В.М.']), duration: 120 },
      { title: 'Первичный инструктаж на рабочем месте — монтаж',       trainingType: 'INITIAL',     participants: mkParticipants(['Сидоров А.Н.','Козлов Д.А.','Николаев П.В.','Волков А.Ю.','Новиков Р.О.','Егоров М.И.']), duration: 90 },
      { title: 'Повторный инструктаж по электробезопасности (II группа)', trainingType: 'PERIODIC',   participants: mkParticipants(['Николаев П.В.','Волков А.Ю.','Новиков Р.О.','Егоров М.И.','Соколов А.В.','Андреев И.К.','Орлов Д.А.','Попов В.Г.']), duration: 60 },
      { title: 'Внеплановый инструктаж после инцидента 18.02',          trainingType: 'UNSCHEDULED', participants: mkParticipants(['Иванов С.П.','Сидоров А.Н.','Козлов Д.А.','Николаев П.В.','Волков А.Ю.','Новиков Р.О.','Егоров М.И.','Соколов А.В.','Андреев И.К.','Орлов Д.А.','Попов В.Г.','Лебедев В.М.']), duration: 45 },
      { title: 'Целевой инструктаж — работы на высоте свыше 5м',       trainingType: 'SPECIAL',     participants: mkParticipants(['Сидоров А.Н.','Козлов Д.А.','Новиков Р.О.','Егоров М.И.']), duration: 60 },
    ];
    for (const t of trainings) {
      await trackSoft(`training ${t.trainingType}`, () => post('/safety/trainings', {
        title: t.title,
        trainingType: t.trainingType,
        projectId: PROJECT_ID,
        date: '2026-02-18',
        instructorName: 'Морозова О.Д.',
        participants: t.participants,
        duration: t.duration,
      }));
    }
  });
}

// ─── TIER 4: PLANNING & OPERATIONS ──────────────────────────────────────────

async function tier4_operations(employeeIds) {
  // Check what already exists (granular skip checks)
  let hasWbs = false, hasDailyLogs = false, hasRfis = false, hasIssues = false;
  let hasSubmittals = false, hasPunchLists = false, hasWorkOrders = false;
  try {
    hasWbs = pageContent(await get(`/wbs-nodes?projectId=${PROJECT_ID}&size=1`)).length > 0;
    hasDailyLogs = pageContent(await get(`/daily-logs?projectId=${PROJECT_ID}&size=1`)).length > 0;
    hasRfis = pageContent(await get(`/pm/rfis?projectId=${PROJECT_ID}&size=1`)).length > 0;
    hasIssues = pageContent(await get(`/pm/issues?projectId=${PROJECT_ID}&size=1`)).length > 0;
    hasSubmittals = pageContent(await get(`/pm/submittals?projectId=${PROJECT_ID}&size=1`)).length > 0;
    hasPunchLists = pageContent(await get(`/punchlist?projectId=${PROJECT_ID}&size=1`)).length > 0;
    hasWorkOrders = pageContent(await get(`/ops/work-orders?projectId=${PROJECT_ID}&size=1`)).length > 0;
  } catch { /* continue */ }

  // WBS nodes
  const wbsIds = {};

  // Helper: create WBS node or find existing by code
  async function wbsNode(label, data) {
    const result = await track(label, () => post('/wbs-nodes', data));
    if (result) return result;
    // 409 duplicate — find existing by code
    const all = pageContent(await get(`/wbs-nodes?projectId=${PROJECT_ID}&size=100`));
    const found = all.find(n => n.code === data.code);
    if (found) return found;
    throw new Error(`WBS node ${data.code} not created and not found`);
  }

  if (hasWbs) {
    console.log(`  → WBS уже есть, пропускаем`);
  } else await safeStep('Создание 15 узлов WBS', async () => {
    const root = await wbsNode('wbs-root', {
      projectId: PROJECT_ID,
      name: 'ЖК Олимп — Инженерные системы',
      nodeType: 'SUMMARY',
      code: 'OLIMP',
      sortOrder: 1,
      plannedStartDate: '2025-09-01',
      plannedEndDate: '2026-06-30',
    });
    wbsIds.root = root.id;

    // Phase 1
    const p1 = await wbsNode('wbs-p1', {
      projectId: PROJECT_ID, parentId: root.id,
      name: 'Фаза 1: Подготовительные работы', nodeType: 'PHASE', code: 'P1', sortOrder: 1,
      plannedStartDate: '2025-09-01', plannedEndDate: '2025-10-15', percentComplete: 100,
    });
    await wbsNode('wbs-p1.1', {
      projectId: PROJECT_ID, parentId: p1.id,
      name: 'Мобилизация', nodeType: 'ACTIVITY', code: 'P1.1', sortOrder: 1,
      plannedStartDate: '2025-09-01', plannedEndDate: '2025-09-15', duration: 15, percentComplete: 100,
    });
    await wbsNode('wbs-p1.2', {
      projectId: PROJECT_ID, parentId: p1.id,
      name: 'Геодезическая разбивка', nodeType: 'ACTIVITY', code: 'P1.2', sortOrder: 2,
      plannedStartDate: '2025-09-10', plannedEndDate: '2025-09-25', duration: 15, percentComplete: 100,
    });
    await wbsNode('wbs-p1.3', {
      projectId: PROJECT_ID, parentId: p1.id,
      name: 'Устройство временных сетей', nodeType: 'MILESTONE', code: 'P1.3', sortOrder: 3,
      plannedStartDate: '2025-09-20', plannedEndDate: '2025-10-15', duration: 25, percentComplete: 100,
    });

    // Phase 2
    const p2 = await wbsNode('wbs-p2', {
      projectId: PROJECT_ID, parentId: root.id,
      name: 'Фаза 2: Монтаж ОВ и ВК', nodeType: 'PHASE', code: 'P2', sortOrder: 2,
      plannedStartDate: '2025-10-15', plannedEndDate: '2026-03-15', percentComplete: 45,
    });
    await wbsNode('wbs-p2.1', {
      projectId: PROJECT_ID, parentId: p2.id,
      name: 'Прокладка магистралей ОВ', nodeType: 'WORK_PACKAGE', code: 'P2.1', sortOrder: 1,
      plannedStartDate: '2025-10-15', plannedEndDate: '2026-01-30', duration: 107, percentComplete: 70,
    });
    await wbsNode('wbs-p2.2', {
      projectId: PROJECT_ID, parentId: p2.id,
      name: 'Монтаж стояков ВК', nodeType: 'WORK_PACKAGE', code: 'P2.2', sortOrder: 2,
      plannedStartDate: '2025-11-01', plannedEndDate: '2026-02-28', duration: 120, percentComplete: 55,
    });
    await wbsNode('wbs-p2.3', {
      projectId: PROJECT_ID, parentId: p2.id,
      name: 'Установка приборов отопления', nodeType: 'ACTIVITY', code: 'P2.3', sortOrder: 3,
      plannedStartDate: '2026-01-15', plannedEndDate: '2026-03-01', duration: 45, percentComplete: 20,
    });
    await wbsNode('wbs-p2.4', {
      projectId: PROJECT_ID, parentId: p2.id,
      name: 'Гидравлические испытания', nodeType: 'MILESTONE', code: 'P2.4', sortOrder: 4,
      plannedStartDate: '2026-03-10', plannedEndDate: '2026-03-15', duration: 5, percentComplete: 0,
    });

    // Phase 3
    const p3 = await wbsNode('wbs-p3', {
      projectId: PROJECT_ID, parentId: root.id,
      name: 'Фаза 3: Электромонтаж', nodeType: 'PHASE', code: 'P3', sortOrder: 3,
      plannedStartDate: '2025-11-15', plannedEndDate: '2026-04-30', percentComplete: 30,
    });
    await wbsNode('wbs-p3.1', {
      projectId: PROJECT_ID, parentId: p3.id,
      name: 'Прокладка кабельных трасс', nodeType: 'WORK_PACKAGE', code: 'P3.1', sortOrder: 1,
      plannedStartDate: '2025-11-15', plannedEndDate: '2026-03-15', duration: 120, percentComplete: 40,
    });
    await wbsNode('wbs-p3.2', {
      projectId: PROJECT_ID, parentId: p3.id,
      name: 'Монтаж щитового оборудования', nodeType: 'ACTIVITY', code: 'P3.2', sortOrder: 2,
      plannedStartDate: '2026-02-01', plannedEndDate: '2026-04-15', duration: 73, percentComplete: 15,
    });
    await wbsNode('wbs-p3.3', {
      projectId: PROJECT_ID, parentId: p3.id,
      name: 'Пусконаладочные работы ЭО', nodeType: 'MILESTONE', code: 'P3.3', sortOrder: 3,
      plannedStartDate: '2026-04-15', plannedEndDate: '2026-04-30', duration: 15, percentComplete: 0,
    });

    // Phase 4
    const p4 = await wbsNode('wbs-p4', {
      projectId: PROJECT_ID, parentId: root.id,
      name: 'Фаза 4: Слаботочные системы', nodeType: 'PHASE', code: 'P4', sortOrder: 4,
      plannedStartDate: '2026-03-01', plannedEndDate: '2026-06-30', percentComplete: 5,
    });
    await wbsNode('wbs-p4.1', {
      projectId: PROJECT_ID, parentId: p4.id,
      name: 'Монтаж СКС', nodeType: 'ACTIVITY', code: 'P4.1', sortOrder: 1,
      plannedStartDate: '2026-03-01', plannedEndDate: '2026-05-15', duration: 75, percentComplete: 5,
    });
    await wbsNode('wbs-p4.2', {
      projectId: PROJECT_ID, parentId: p4.id,
      name: 'Система пожарной сигнализации', nodeType: 'ACTIVITY', code: 'P4.2', sortOrder: 2,
      plannedStartDate: '2026-03-15', plannedEndDate: '2026-06-15', duration: 92, percentComplete: 0,
    });
    await wbsNode('wbs-p4.3', {
      projectId: PROJECT_ID, parentId: p4.id,
      name: 'Сдача в эксплуатацию', nodeType: 'MILESTONE', code: 'P4.3', sortOrder: 3,
      plannedStartDate: '2026-06-25', plannedEndDate: '2026-06-30', duration: 5, percentComplete: 0,
    });
  });

  // Daily logs
  if (hasDailyLogs) {
    console.log(`  → Журналы уже есть, пропускаем`);
  } else await safeStep('Создание 8 журналов с записями', async () => {
    const days = [
      { date: '2026-02-10', weather: 'CLEAR',  tMin: -5, tMax: 1 },
      { date: '2026-02-11', weather: 'CLOUDY', tMin: -8, tMax: -2 },
      { date: '2026-02-12', weather: 'SNOW',   tMin: -12, tMax: -6 },
      { date: '2026-02-13', weather: 'CLEAR',  tMin: -10, tMax: -3 },
      { date: '2026-02-14', weather: 'CLOUDY', tMin: -4, tMax: 2 },
      { date: '2026-02-17', weather: 'CLEAR',  tMin: -2, tMax: 4 },
      { date: '2026-02-18', weather: 'CLOUDY', tMin: -6, tMax: 0 },
      { date: '2026-02-19', weather: 'CLEAR',  tMin: -3, tMax: 3 },
    ];

    const entrySets = [
      [
        { entryType: 'WORK_PERFORMED', description: 'Монтаж магистралей ОВ подвал корп. 1 — 42 п.м.' },
        { entryType: 'PERSONNEL',      description: 'Бригада монтажа ОВ — 6 чел.' },
        { entryType: 'EQUIPMENT_USED', description: 'Автокран Liebherr LTM 1050 — 4ч' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Прокладка кабельных трасс секция А, этажи 1-3' },
        { entryType: 'MATERIAL_RECEIVED', description: 'Получен кабель ВВГнг 3×2.5 — 2000м, кабель ВВГнг 5×4 — 800м' },
        { entryType: 'PERSONNEL',      description: 'Электромонтажники — 4 чел., разнорабочие — 2 чел.' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Снегоуборка площадки. Работы на открытых участках приостановлены из-за метели.' },
        { entryType: 'PERSONNEL',      description: 'Дежурная бригада — 3 чел.' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Монтаж стояков ВК корп. 1, секция А — 12 стояков' },
        { entryType: 'WORK_PERFORMED', description: 'Сварка стыков трубопровода ОВ — 18 стыков' },
        { entryType: 'PERSONNEL',      description: 'Монтажники ВК — 4 чел., сварщик НАКС — 1 чел.' },
        { entryType: 'EQUIPMENT_USED', description: 'Сварочный аппарат TIG — 8ч' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Монтаж кабельных лотков в подвале корп. 2' },
        { entryType: 'MATERIAL_RECEIVED', description: 'Поставлена арматура А500С d12 — 5т' },
        { entryType: 'PERSONNEL',      description: 'Электромонтажники — 3 чел., стропальщик — 1 чел.' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Утепление трубопроводов ОВ — Rockwool 100мм, 95 м²' },
        { entryType: 'WORK_PERFORMED', description: 'Монтаж щита ЩР-1 корп. 1' },
        { entryType: 'PERSONNEL',      description: 'Изолировщики — 2 чел., электромонтажники — 2 чел.' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Гидроиспытание участка трубопровода ВК — давление 10 атм, выдержка 30 мин, течей нет' },
        { entryType: 'PERSONNEL',      description: 'Бригада ВК — 3 чел., инженер ПТО — 1 чел.' },
        { entryType: 'EQUIPMENT_USED', description: 'Компрессорная установка — 4ч' },
      ],
      [
        { entryType: 'WORK_PERFORMED', description: 'Продолжение монтажа стояков ВК секция Б, этажи 1-5 — 8 стояков' },
        { entryType: 'WORK_PERFORMED', description: 'Прокладка кабелей в лотках секция А, этажи 4-6' },
        { entryType: 'PERSONNEL',      description: 'Монтажники ВК — 4 чел., электромонтажники — 3 чел.' },
        { entryType: 'MATERIAL_RECEIVED', description: 'Поставлены электроды УОНИ-13/55 — 50 кг' },
      ],
    ];

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const log = await track(`daily-log ${d.date}`, () => post('/daily-logs', {
        projectId: PROJECT_ID,
        logDate: d.date,
        weatherConditions: d.weather,
        temperatureMin: d.tMin,
        temperatureMax: d.tMax,
        shiftSupervisorName: 'Иванов С.П.',
        generalNotes: `Ежедневный журнал ${d.date}`,
      }));
      for (const entry of entrySets[i]) {
        await track(`entry ${d.date}`, () => post(`/daily-logs/${log.id}/entries`, entry));
      }
    }
  });

  // RFIs
  if (hasRfis) {
    console.log(`  → RFI уже есть, пропускаем`);
  } else await safeStep('Создание 5 RFI', async () => {
    const rfis = [
      { subject: 'Уточнение высотных отметок для прокладки ОВ', question: 'На чертеже раздела ОВ лист 12 указана отметка +3.200 для магистрали, но фактически балка перекрытия проходит на +3.150. Просим уточнить отметку прокладки.', priority: 'HIGH' },
      { subject: 'Замена материала трубы ВК — аналог',         question: 'Проектом предусмотрена труба PPR d32 Aquatherm. Предлагаем замену на REHAU Rautitan по причине отсутствия Aquatherm на складе. Просим согласовать.', priority: 'NORMAL' },
      { subject: 'Согласование прохода через несущую стену',    question: 'Требуется проход трубопровода d110 через несущую стену по оси 5 на отм. +6.000. В проекте проход не предусмотрен. Просим выдать решение по усилению.', priority: 'CRITICAL' },
      { subject: 'Уточнение схемы подключения щита ЩР-1',      question: 'В проекте ЭО указано подключение ЩР-1 от ВРУ через кабель ВВГнг 5×16, но длина трассы 85м при допустимых 70м. Просим пересчитать сечение.', priority: 'NORMAL' },
      { subject: 'Расхождение проекта и факта на отм. +3.600',  question: 'При выносе в натуру обнаружено расхождение положения колонны по оси Б3 на 45мм. Монтаж воздуховода по проектной трассе невозможен. Просим решение.', priority: 'HIGH' },
    ];
    for (const r of rfis) {
      await track(`rfi ${r.priority}`, () => post('/pm/rfis', {
        projectId: PROJECT_ID,
        ...r,
        dueDate: '2026-03-01',
      }));
    }
  });

  // Issues
  if (hasIssues) {
    console.log(`  → Проблемы уже есть, пропускаем`);
  } else await safeStep('Создание 5 проблем', async () => {
    const issues = [
      { title: 'Задержка поставки кабеля ВВГнг 5×4',               priority: 'HIGH',     issueType: 'CONSTRUCTION', description: 'Поставщик ООО КабельТорг+ перенёс поставку на 2 недели. Критический путь: электромонтаж секции Б.' },
      { title: 'Коллизия трасс ОВ и ВК на отм. +6.000',           priority: 'CRITICAL', issueType: 'DESIGN',       description: 'Трасса вентканала пересекается с магистралью ВК. Необходим перевыпуск раздела ОВ лист 15.' },
      { title: 'Некомплект проектной документации раздел СС',       priority: 'NORMAL',   issueType: 'COORDINATION', description: 'Отсутствуют листы 8-12 раздела СС (структурированные кабельные системы). Запрошены у проектировщика.' },
      { title: 'Повреждение участка трубопровода при бетонировании', priority: 'HIGH',     issueType: 'CONSTRUCTION', description: 'При заливке перекрытия 4 этажа повреждена труба ОВ d57. Требуется замена 3м трубы и повторный контроль.' },
      { title: 'Отсутствие разрешения на земляные работы',          priority: 'NORMAL',   issueType: 'OTHER',        description: 'Ордер ОАТИ на наружные сети просрочен. Продление в работе, ожидаемый срок — 5 рабочих дней.' },
    ];
    for (const iss of issues) {
      await track(`issue ${iss.priority}`, () => post('/pm/issues', {
        projectId: PROJECT_ID,
        ...iss,
        reportedById: ADMIN_USER_ID,
        dueDate: '2026-03-10',
      }));
    }
  });

  // Submittals
  if (hasSubmittals) {
    console.log(`  → Сабмитталы уже есть, пропускаем`);
  } else await safeStep('Создание 4 сабмитталов', async () => {
    const submittals = [
      { title: 'Паспорта качества на арматуру А500С',         submittalType: 'CERTIFICATE' },
      { title: 'Сертификат соответствия на кабель ВВГнг',     submittalType: 'CERTIFICATE' },
      { title: 'Протокол испытания трубопровода ОВ',          submittalType: 'TEST_REPORT' },
      { title: 'Рабочая документация — изменения раздел ОВ',  submittalType: 'SHOP_DRAWING' },
    ];
    for (const s of submittals) {
      await track(`submittal ${s.submittalType}`, () => post('/pto/submittals', {
        projectId: PROJECT_ID,
        ...s,
        submittedById: ADMIN_USER_ID,
        dueDate: '2026-03-05',
      }));
    }
  });

  // Punch lists
  if (hasPunchLists) {
    console.log(`  → Панч-листы уже есть, пропускаем`);
  } else await safeStep('Создание 2 панч-листов с 8 пунктами', async () => {
    const pl1 = await track('punchlist-1', () => post('/punchlist', {
      projectId: PROJECT_ID,
      name: 'Панч-лист секция А — ОВ и ВК',
      dueDate: '2026-03-15',
      areaOrZone: 'Секция А, корпус 1',
    }));
    if (pl1) {
      const itemsA = [
        { description: 'Негерметичность фланцевого соединения на стояке ОВ-3, этаж 2', priority: 'HIGH', location: 'Стояк ОВ-3, отм. +3.000' },
        { description: 'Перекос крепления воздуховода d200 в коридоре 3 этажа',         priority: 'MEDIUM', location: 'Коридор 3 эт., ось А-Б/3' },
        { description: 'Недокрут фитинга PPR на стояке ВК-5, подвал',                  priority: 'HIGH', location: 'Подвал, стояк ВК-5' },
        { description: 'Отсутствует маркировка трубопровода ОВ в техподполье',          priority: 'LOW', location: 'Техподполье, ось 1-3' },
        { description: 'Повреждение теплоизоляции на повороте магистрали ОВ',            priority: 'MEDIUM', location: '4 этаж, поворот ось Б/5' },
      ];
      for (const item of itemsA) {
        await track('punch-item-A', () => post(`/punchlist/${pl1.id}/items`, item));
      }
    }

    const pl2 = await track('punchlist-2', () => post('/punchlist', {
      projectId: PROJECT_ID,
      name: 'Панч-лист секция Б — электромонтаж',
      dueDate: '2026-03-20',
      areaOrZone: 'Секция Б, корпус 2',
    }));
    if (pl2) {
      const itemsB = [
        { description: 'Сколы на кабельном лотке при монтаже (3 шт)',                   priority: 'LOW', location: '2 этаж, ось В/4-5' },
        { description: 'Отсутствует маркировка кабелей в щите ЩР-2',                   priority: 'MEDIUM', location: 'Электрощитовая, ЩР-2' },
        { description: 'Не установлены заглушки на свободных отверстиях лотков',        priority: 'LOW', location: 'Подвал, кабельный коллектор' },
      ];
      for (const item of itemsB) {
        await track('punch-item-B', () => post(`/punchlist/${pl2.id}/items`, item));
      }
    }
  });

  // Work orders
  if (hasWorkOrders) {
    console.log(`  → Наряды-допуски уже есть, пропускаем`);
  } else await safeStep('Создание 5 нарядов-допусков', async () => {
    const workOrders = [
      { title: 'Наряд-допуск: Огневые работы — сварка трубопровода ОВ',             workType: 'HVAC',       priority: 'CRITICAL', description: 'Сварка стыков стального трубопровода d57 в подвале корп. 1. Присутствие наблюдающего обязательно.' },
      { title: 'Наряд-допуск: Работы на высоте — монтаж воздуховодов',              workType: 'HVAC',       priority: 'HIGH',     description: 'Монтаж воздуховодов d200 на отм. +9.000 в атриуме. Использование страховочных систем обязательно.' },
      { title: 'Наряд-допуск: Земляные работы — прокладка наружных сетей',          workType: 'EARTHWORK',  priority: 'MEDIUM',   description: 'Рытьё траншеи для наружных сетей ВК от колодца КК-1 до ввода в корп. 1, глубина 2.5м.' },
      { title: 'Наряд-допуск: Электромонтаж в действующих электроустановках',       workType: 'ELECTRICAL', priority: 'HIGH',     description: 'Подключение фидера к ВРУ здания. Работа с напряжением 380В, III группа допуска обязательна.' },
      { title: 'Наряд-допуск: Работы в стеснённых условиях — монтаж в шахте лифта', workType: 'OTHER',      priority: 'MEDIUM',   description: 'Прокладка стояков ВК в шахте лифта корп. 2. Ограниченное пространство, вентиляция обязательна.' },
    ];
    for (const wo of workOrders) {
      await track(`work-order ${wo.priority}`, () => post('/ops/work-orders', {
        projectId: PROJECT_ID,
        ...wo,
        foremanId: ADMIN_USER_ID,
        plannedStart: '2026-02-20',
        plannedEnd: '2026-02-28',
      }));
    }
  });
}

// ─── TIER 5: FLEET ──────────────────────────────────────────────────────────

async function tier5_fleet(employeeIds) {
  // Skip if fleet data already exists
  const existingVehicles = pageContent(await get('/fleet/vehicles?size=100'));
  if (existingVehicles.length > 0) {
    console.log(`  → Tier 5 (Автопарк) уже заполнен, пропускаем`);
    return existingVehicles.map(v => v.id);
  }

  const vehicles = [
    { make: 'КамАЗ',   model: '6520',       year: 2021, vehicleType: 'TRUCK',      fuelType: 'DIESEL',   licensePlate: 'А 123 МО 77', fuelConsumptionRate: 35, currentMileage: 82000 },
    { make: 'ГАЗ',     model: 'NEXT фургон', year: 2023, vehicleType: 'TRUCK',      fuelType: 'GASOLINE', licensePlate: 'В 456 КО 50', fuelConsumptionRate: 14, currentMileage: 41000 },
    { make: 'Hitachi', model: 'ZX200',       year: 2019, vehicleType: 'EXCAVATOR',  fuelType: 'DIESEL',   licensePlate: '',            fuelConsumptionRate: 22, currentHours: 6800 },
    { make: 'Liebherr', model: 'LTM 1050',   year: 2020, vehicleType: 'CRANE',      fuelType: 'DIESEL',   licensePlate: '',            fuelConsumptionRate: 28, currentHours: 4200 },
    { make: 'CAT',     model: '950M',        year: 2022, vehicleType: 'LOADER',     fuelType: 'DIESEL',   licensePlate: '',            fuelConsumptionRate: 18, currentHours: 3100 },
    { make: 'УАЗ',     model: 'Патриот',     year: 2024, vehicleType: 'CAR',        fuelType: 'GASOLINE', licensePlate: 'Е 789 СТ 77', fuelConsumptionRate: 13, currentMileage: 15000 },
  ];

  const vehicleIds = [];
  await safeStep('Создание 6 единиц техники', async () => {
    for (const v of vehicles) {
      const created = await track(`vehicle ${v.make} ${v.model}`, () => post('/fleet/vehicles', {
        ...v,
        currentProjectId: PROJECT_ID,
        responsibleId: ADMIN_USER_ID,
      }));
      vehicleIds.push(created.id);
    }
  });

  // Fuel records: 2 per vehicle
  await safeStep('Создание 12 записей ГСМ', async () => {
    const fuelData = [
      // КамАЗ
      { idx: 0, fuelDate: '2026-02-10', quantity: 180, pricePerUnit: 62.5, mileageAtFuel: 82300 },
      { idx: 0, fuelDate: '2026-02-18', quantity: 200, pricePerUnit: 62.5, mileageAtFuel: 82800 },
      // ГАЗель
      { idx: 1, fuelDate: '2026-02-11', quantity: 55, pricePerUnit: 56.2, mileageAtFuel: 41200 },
      { idx: 1, fuelDate: '2026-02-19', quantity: 50, pricePerUnit: 56.2, mileageAtFuel: 41600 },
      // Hitachi
      { idx: 2, fuelDate: '2026-02-12', quantity: 150, pricePerUnit: 62.5, hoursAtFuel: 6830 },
      { idx: 2, fuelDate: '2026-02-20', quantity: 160, pricePerUnit: 62.5, hoursAtFuel: 6870 },
      // Liebherr
      { idx: 3, fuelDate: '2026-02-13', quantity: 120, pricePerUnit: 62.5, hoursAtFuel: 4220 },
      { idx: 3, fuelDate: '2026-02-19', quantity: 130, pricePerUnit: 62.5, hoursAtFuel: 4250 },
      // CAT
      { idx: 4, fuelDate: '2026-02-14', quantity: 100, pricePerUnit: 62.5, hoursAtFuel: 3120 },
      { idx: 4, fuelDate: '2026-02-20', quantity: 95,  pricePerUnit: 62.5, hoursAtFuel: 3150 },
      // УАЗ
      { idx: 5, fuelDate: '2026-02-10', quantity: 45, pricePerUnit: 56.2, mileageAtFuel: 15100 },
      { idx: 5, fuelDate: '2026-02-17', quantity: 40, pricePerUnit: 56.2, mileageAtFuel: 15350 },
    ];
    for (const f of fuelData) {
      await track('fuel', () => post('/fleet/fuel', {
        vehicleId: vehicleIds[f.idx],
        projectId: PROJECT_ID,
        fuelDate: f.fuelDate,
        quantity: f.quantity,
        pricePerUnit: f.pricePerUnit,
        mileageAtFuel: f.mileageAtFuel,
        hoursAtFuel: f.hoursAtFuel,
      }));
    }
  });

  // Maintenance
  await safeStep('Создание 4 записей ТО/ремонт', async () => {
    const maintenance = [
      { vehicleIdx: 0, maintenanceType: 'SCHEDULED',   description: 'ТО-1 КамАЗ 6520: замена масла, фильтров, проверка тормозной системы', startDate: '2026-02-12', cost: 28000, vendor: 'СТО КамАЗ-Сервис' },
      { vehicleIdx: 2, maintenanceType: 'REPAIR',       description: 'Замена гидрошланга высокого давления на стреле Hitachi ZX200',         startDate: '2026-02-15', cost: 45000, vendor: 'Хитачи СМ Россия' },
      { vehicleIdx: 1, maintenanceType: 'INSPECTION',   description: 'Технический осмотр ГАЗель NEXT — прохождение ГТО',                   startDate: '2026-02-17', cost: 5500, vendor: 'ГИБДД / ПТО' },
      { vehicleIdx: 4, maintenanceType: 'SCHEDULED',   description: 'ТО-2 CAT 950M: замена масла ДВС и гидравлики, фильтры, смазка',      startDate: '2026-02-20', cost: 62000, vendor: 'Цеппелин РУС' },
    ];
    for (const m of maintenance) {
      await track(`maint ${m.maintenanceType}`, () => post('/fleet/maintenance', {
        vehicleId: vehicleIds[m.vehicleIdx],
        maintenanceType: m.maintenanceType,
        description: m.description,
        startDate: m.startDate,
        cost: m.cost,
        vendor: m.vendor,
      }));
    }
  });

  return vehicleIds;
}

// ─── TIER 6: CLOSING ────────────────────────────────────────────────────────

async function tier6_closing() {
  // Fetch existing contracts for linking
  const contractsPage = await get(`/contracts?projectId=${PROJECT_ID}&size=100`);
  const contracts = pageContent(contractsPage);
  const contractorContracts = contracts.filter(c => c.direction === 'CONTRACTOR');

  // Check what already exists
  const existingKs2 = pageContent(await get(`/ks2?projectId=${PROJECT_ID}&size=1`));
  const existingChecklists = pageContent(await get(`/commissioning-checklists?projectId=${PROJECT_ID}&size=1`));
  const existingHandover = pageContent(await get(`/handover-packages?projectId=${PROJECT_ID}&size=1`));
  const existingWarranty = pageContent(await get(`/warranty-claims?projectId=${PROJECT_ID}&size=1`));
  const existingKs3 = pageContent(await get(`/ks3?projectId=${PROJECT_ID}&size=1`));

  // KS-2 documents
  const ks2Ids = [];
  if (existingKs2.length > 0) {
    console.log(`  → КС-2 уже есть (${existingKs2.length}+), пропускаем`);
  } else await safeStep('Создание 3 актов КС-2 с позициями', async () => {
    // KS-2 #1: Монтаж ОВ
    const ks2_1 = await track('ks2-1', () => post('/ks2', {
      number: 'КС-2 №1',
      documentDate: '2026-01-31',
      projectId: PROJECT_ID,
      contractId: contractorContracts[3]?.id,
      notes: 'Монтаж трубопровода ОВ — январь 2026',
    }));
    ks2Ids.push(ks2_1.id);
    const ks2_1_lines = [
      { name: 'Монтаж стальных трубопроводов d57',        quantity: 120, unitPrice: 1800, unitOfMeasure: 'м' },
      { name: 'Монтаж стальных трубопроводов d108',       quantity: 80,  unitPrice: 2400, unitOfMeasure: 'м' },
      { name: 'Установка опор и подвесок трубопровода',   quantity: 95,  unitPrice: 650,  unitOfMeasure: 'шт' },
      { name: 'Теплоизоляция трубопроводов Rockwool',     quantity: 180, unitPrice: 420,  unitOfMeasure: 'м²' },
      { name: 'Гидравлическое испытание трубопровода ОВ', quantity: 1,   unitPrice: 85000, unitOfMeasure: 'компл' },
    ];
    for (const [i, line] of ks2_1_lines.entries()) {
      await track('ks2-1-line', () => post(`/ks2/${ks2_1.id}/lines`, { ...line, sequence: (i + 1) * 10 }));
    }

    // KS-2 #2: Электромонтаж
    const ks2_2 = await track('ks2-2', () => post('/ks2', {
      number: 'КС-2 №2',
      documentDate: '2026-02-15',
      projectId: PROJECT_ID,
      contractId: contractorContracts[2]?.id,
      notes: 'Электромонтажные работы — февраль 2026',
    }));
    ks2Ids.push(ks2_2.id);
    const ks2_2_lines = [
      { name: 'Прокладка кабеля ВВГнг 3×2.5 в лотках',  quantity: 1500, unitPrice: 120, unitOfMeasure: 'м' },
      { name: 'Прокладка кабеля ВВГнг 5×4 в лотках',     quantity: 600,  unitPrice: 180, unitOfMeasure: 'м' },
      { name: 'Монтаж кабельных лотков 200×50',           quantity: 120,  unitPrice: 450, unitOfMeasure: 'м' },
      { name: 'Монтаж и подключение щита ЩР-1',          quantity: 1,    unitPrice: 125000, unitOfMeasure: 'компл' },
    ];
    for (const [i, line] of ks2_2_lines.entries()) {
      await track('ks2-2-line', () => post(`/ks2/${ks2_2.id}/lines`, { ...line, sequence: (i + 1) * 10 }));
    }

    // KS-2 #3: Монтаж ВК
    const ks2_3 = await track('ks2-3', () => post('/ks2', {
      number: 'КС-2 №3',
      documentDate: '2026-02-20',
      projectId: PROJECT_ID,
      contractId: contractorContracts[5]?.id,
      notes: 'Монтаж трубопровода ВК — февраль 2026',
    }));
    ks2Ids.push(ks2_3.id);
    const ks2_3_lines = [
      { name: 'Монтаж стояков ВК PPR d32',       quantity: 20, unitPrice: 8500,  unitOfMeasure: 'стояк' },
      { name: 'Монтаж магистралей ВК PPR d50',   quantity: 85, unitPrice: 1200,  unitOfMeasure: 'м' },
      { name: 'Установка запорной арматуры ВК',   quantity: 42, unitPrice: 2200,  unitOfMeasure: 'шт' },
    ];
    for (const [i, line] of ks2_3_lines.entries()) {
      await track('ks2-3-line', () => post(`/ks2/${ks2_3.id}/lines`, { ...line, sequence: (i + 1) * 10 }));
    }
  });

  // KS-3 documents
  if (existingKs3.length > 0) {
    console.log(`  → КС-3 уже есть, пропускаем`);
  } else await safeStep('Создание 2 справок КС-3', async () => {
    const clientContract = contracts.find(c => c.direction === 'CLIENT');
    const ks3_1 = await track('ks3-1', () => post('/ks3', {
      number: 'КС-3 №1',
      documentDate: '2026-01-31',
      periodFrom: '2026-01-01',
      periodTo: '2026-01-31',
      projectId: PROJECT_ID,
      contractId: clientContract?.id,
      retentionPercent: 5,
      notes: 'Справка о стоимости работ за январь 2026',
    }));
    // Link KS-2 #1 to KS-3 #1
    try {
      await track('link-ks2-to-ks3-1', () => post(`/ks3/${ks3_1.id}/link-ks2`, { ks2Id: ks2Ids[0] }));
    } catch { /* might fail if not submitted */ }

    const ks3_2 = await track('ks3-2', () => post('/ks3', {
      number: 'КС-3 №2',
      documentDate: '2026-02-28',
      periodFrom: '2026-02-01',
      periodTo: '2026-02-28',
      projectId: PROJECT_ID,
      contractId: clientContract?.id,
      retentionPercent: 5,
      notes: 'Справка о стоимости работ за февраль 2026',
    }));
    try {
      await track('link-ks2-to-ks3-2a', () => post(`/ks3/${ks3_2.id}/link-ks2`, { ks2Id: ks2Ids[1] }));
      await track('link-ks2-to-ks3-2b', () => post(`/ks3/${ks3_2.id}/link-ks2`, { ks2Id: ks2Ids[2] }));
    } catch { /* might fail */ }
  });

  // Commissioning checklists
  if (existingChecklists.length > 0) {
    console.log(`  → Чек-листы уже есть, пропускаем`);
  } else await safeStep('Создание 2 чек-листов ввода в эксплуатацию', async () => {
    const heatingChecks = JSON.stringify([
      { item: 'Визуальный осмотр трубопроводов и приборов отопления', passed: false },
      { item: 'Проверка герметичности фланцевых соединений', passed: false },
      { item: 'Гидравлическое испытание системы (давл. 10 атм)', passed: false },
      { item: 'Проверка работы запорно-регулирующей арматуры', passed: false },
      { item: 'Проверка крепления трубопроводов и подвесок', passed: false },
      { item: 'Замер температуры теплоносителя на вводе/выходе', passed: false },
      { item: 'Проверка работы автоматики регулирования', passed: false },
      { item: 'Балансировка стояков системы отопления', passed: false },
    ]);

    await track('checklist-heating', () => post('/commissioning-checklists', {
      projectId: PROJECT_ID,
      name: 'Чек-лист ввода: Система отопления (корп. 1)',
      system: 'Отопление',
      checkItems: heatingChecks,
      inspectionDate: '2026-03-15',
      notes: 'Пусконаладка системы отопления корпус 1',
    }));

    const electricalChecks = JSON.stringify([
      { item: 'Проверка сопротивления изоляции кабельных линий', passed: false },
      { item: 'Проверка работы автоматов защиты в ЩР', passed: false },
      { item: 'Замеры петли фаза-нуль', passed: false },
      { item: 'Проверка заземления и системы уравнивания потенциалов', passed: false },
      { item: 'Проверка работы аварийного освещения', passed: false },
      { item: 'Функциональное испытание электроустановки под нагрузкой', passed: false },
    ]);

    await track('checklist-electrical', () => post('/commissioning-checklists', {
      projectId: PROJECT_ID,
      name: 'Чек-лист ввода: Электроснабжение (корп. 1)',
      system: 'Электроснабжение',
      checkItems: electricalChecks,
      inspectionDate: '2026-04-30',
      notes: 'Пусконаладка электроустановки корпус 1',
    }));
  });

  // Handover package
  if (existingHandover.length > 0) {
    console.log(`  → Пакеты передачи уже есть, пропускаем`);
  } else await safeStep('Создание пакета передачи (секция А)', async () => {
    await track('handover', () => post('/handover-packages', {
      projectId: PROJECT_ID,
      title: 'Пакет передачи — Секция А, корпус 1 (ОВ + ВК + ЭО)',
      description: 'Комплект исполнительной документации, паспорта, протоколы испытаний для секции А',
      recipientOrganization: 'АО Заказчик Девелопмент',
      preparedDate: '2026-03-20',
    }));
  });

  // Warranty claims
  if (existingWarranty.length > 0) {
    console.log(`  → Гарантийные рекламации уже есть, пропускаем`);
  } else await safeStep('Создание 2 гарантийных рекламаций', async () => {
    await track('warranty-1', () => post('/warranty-claims', {
      projectId: PROJECT_ID,
      title: 'Протечка радиатора отопления кв. 15 (3 этаж)',
      description: 'Обнаружена течь из-под соединительной гайки радиатора. Дефект заводской — трещина в резьбовой части секции.',
      defectType: 'Производственный брак',
      location: 'Квартира 15, 3 этаж, секция А',
      reportedDate: '2026-03-25',
      warrantyExpiryDate: '2028-03-25',
      costOfRepair: 12000,
    }));
    await track('warranty-2', () => post('/warranty-claims', {
      projectId: PROJECT_ID,
      title: 'Неисправность автомата защиты ЩР-1 (поз. QF5)',
      description: 'Автоматический выключатель не срабатывает при перегрузке. Заводской брак — дефект расцепителя.',
      defectType: 'Заводской брак',
      location: 'Электрощитовая корп. 1, ЩР-1',
      reportedDate: '2026-04-10',
      warrantyExpiryDate: '2029-04-10',
      costOfRepair: 4500,
    }));
  });
}

// ─── TIER 7: DOCUMENTS, REGULATORY, CHANGES ─────────────────────────────────

async function tier7_docs(employeeIds) {
  // Check what already exists
  const existingDocs = pageContent(await get(`/documents?projectId=${PROJECT_ID}&size=1`));
  const existingPermits = pageContent(await get(`/regulatory/permits?projectId=${PROJECT_ID}&size=1`));
  const existingRegInsp = pageContent(await get(`/regulatory/inspections?projectId=${PROJECT_ID}&size=1`));
  const existingCE = pageContent(await get(`/change-events?projectId=${PROJECT_ID}&size=1`));
  const existingCO = pageContent(await get(`/change-orders?projectId=${PROJECT_ID}&size=1`));

  // Documents
  if (existingDocs.length > 0) {
    console.log(`  → Документы уже есть, пропускаем`);
  } else await safeStep('Создание 8 документов', async () => {
    const docs = [
      { title: 'Разрешение на строительство №77-РС-2025-1234',     category: 'PERMIT',      documentNumber: '77-РС-2025-1234' },
      { title: 'Проект ОВ — рабочая документация (листы 1-25)',     category: 'DRAWING',     documentNumber: 'ОВ-01-РД' },
      { title: 'Проект ВК — рабочая документация (листы 1-18)',     category: 'DRAWING',     documentNumber: 'ВК-01-РД' },
      { title: 'Проект ЭО — рабочая документация (листы 1-30)',     category: 'DRAWING',     documentNumber: 'ЭО-01-РД' },
      { title: 'Акт скрытых работ №1 — гидроизоляция фундамента',  category: 'ACT',         documentNumber: 'АСР-001' },
      { title: 'Акт скрытых работ №2 — армирование перекрытия',    category: 'ACT',         documentNumber: 'АСР-002' },
      { title: 'Журнал бетонных работ',                             category: 'OTHER',       documentNumber: 'ЖБР-001' },
      { title: 'Протокол испытаний системы ОВ (давление)',          category: 'PROTOCOL',    documentNumber: 'ПИ-ОВ-001' },
    ];
    for (const d of docs) {
      await track(`doc ${d.documentNumber}`, () => post('/documents', {
        ...d,
        projectId: PROJECT_ID,
        authorId: ADMIN_USER_ID,
        notes: `Документ проекта ЖК Олимп`,
      }));
    }
  });

  // Regulatory permits
  if (existingPermits.length > 0) {
    console.log(`  → Разрешительные документы уже есть, пропускаем`);
  } else await safeStep('Создание 3 разрешительных документов', async () => {
    const permits = [
      { permitNumber: '77-РС-2025-1234', issuedBy: 'Мосгосстройнадзор',     issuedDate: '2025-07-15', expiresDate: '2027-07-15', permitType: 'Разрешение на строительство' },
      { permitNumber: 'ОАТИ-2025-5678',  issuedBy: 'ОАТИ г. Москвы',         issuedDate: '2025-09-01', expiresDate: '2026-03-01', permitType: 'Ордер на земляные работы' },
      { permitNumber: 'ТУ-МОЭК-2025-99', issuedBy: 'ПАО МОЭК',              issuedDate: '2025-06-20', expiresDate: '2026-12-31', permitType: 'Технические условия на подключение к сетям теплоснабжения' },
    ];
    for (const p of permits) {
      await track(`permit ${p.permitNumber}`, () => post('/regulatory/permits', {
        projectId: PROJECT_ID,
        ...p,
      }));
    }
  });

  // Regulatory inspections + prescriptions
  if (existingRegInsp.length > 0) {
    console.log(`  → Регуляторные проверки уже есть, пропускаем`);
  } else await safeStep('Создание 2 регуляторных проверок с предписаниями', async () => {
    // 1. Ростехнадзор: 2 prescriptions
    const ri1 = await track('reg-insp-1', () => post('/regulatory/inspections', {
      projectId: PROJECT_ID,
      inspectionDate: '2026-02-05',
      inspectorName: 'Петров А.В.',
      inspectorOrgan: 'Ростехнадзор',
      inspectionType: 'PLANNED',
      result: 'VIOLATIONS',
      actNumber: 'АКТ-РТН-2026-042',
    }));
    if (ri1) {
      await track('prescription-1a', () => post(`/regulatory/inspections/${ri1.id}/prescriptions`, {
        description: 'Отсутствует проектная документация на сосуды давления в венткамере. Предоставить до 20.02.2026.',
        regulatoryBodyType: 'ROSTEKHNADZOR',
        receivedDate: '2026-02-05',
        deadline: '2026-02-20',
        violationCount: 1,
        regulatoryReference: 'ФНП ОРПД п.12',
      }));
      await track('prescription-1b', () => post(`/regulatory/inspections/${ri1.id}/prescriptions`, {
        description: 'Не проведена экспертиза промышленной безопасности грузоподъёмного крана. Предоставить заключение до 25.02.2026.',
        regulatoryBodyType: 'ROSTEKHNADZOR',
        receivedDate: '2026-02-05',
        deadline: '2026-02-25',
        violationCount: 1,
        regulatoryReference: 'ФНП ПС п.208',
      }));
    }

    // 2. Стройнадзор: 1 prescription
    const ri2 = await track('reg-insp-2', () => post('/regulatory/inspections', {
      projectId: PROJECT_ID,
      inspectionDate: '2026-02-15',
      inspectorName: 'Козлова Е.С.',
      inspectorOrgan: 'Мосгосстройнадзор',
      inspectionType: 'PLANNED',
      result: 'VIOLATIONS',
      actNumber: 'АКТ-МГСН-2026-118',
    }));
    if (ri2) {
      await track('prescription-2', () => post(`/regulatory/inspections/${ri2.id}/prescriptions`, {
        description: 'Ведение журнала авторского надзора не соответствует СП 246.1325800.2016. Устранить до 01.03.2026.',
        regulatoryBodyType: 'STROYNADZOR',
        receivedDate: '2026-02-15',
        deadline: '2026-03-01',
        violationCount: 1,
        regulatoryReference: 'СП 246.1325800.2016 п.5.3',
      }));
    }
  });

  // Change events
  const changeEventIds = [];
  if (existingCE.length > 0) {
    console.log(`  → События изменений уже есть, пропускаем`);
  } else await safeStep('Создание 3 событий изменений', async () => {
    const events = [
      { title: 'Замена марки стали трубопровода ОВ (09Г2С → Ст20)',      source: 'DESIGN_CHANGE',  description: 'По результатам экспертизы заменена марка стали с 09Г2С на Ст20 для участка магистрали d108.', estimatedCostImpact: -120000, estimatedScheduleImpact: 3 },
      { title: 'Дополнительные работы по запросу заказчика — домофония', source: 'OWNER_REQUEST',  description: 'Заказчик запросил дополнительную прокладку слаботочных сетей для домофонии (не предусмотрено проектом).', estimatedCostImpact: 850000, estimatedScheduleImpact: 10 },
      { title: 'Непредвиденные грунтовые условия — скала на трассе ВК',  source: 'FIELD_CONDITION', description: 'При рытье траншеи для наружных сетей ВК обнаружена скальная порода на глубине 1.8м вместо проектных 2.5м.', estimatedCostImpact: 340000, estimatedScheduleImpact: 7 },
    ];
    for (const e of events) {
      const created = await track(`change-event ${e.source}`, () => post('/change-events', {
        projectId: PROJECT_ID,
        ...e,
        identifiedById: ADMIN_USER_ID,
        identifiedDate: '2026-02-15',
      }));
      changeEventIds.push(created.id);
    }
  });

  // Change orders
  if (existingCO.length > 0) {
    console.log(`  → Ордера на изменения уже есть, пропускаем`);
    return;
  }
  const contractsPage = await get(`/contracts?projectId=${PROJECT_ID}&size=100`);
  const contracts = pageContent(contractsPage);
  const contractorContracts = contracts.filter(c => c.direction === 'CONTRACTOR');

  await safeStep('Создание 2 ордеров на изменения', async () => {
    // CO #1: ДС №1 — замена материала
    const co1 = await track('change-order-1', () => post('/change-orders', {
      projectId: PROJECT_ID,
      contractId: contractorContracts[3]?.id ?? contractorContracts[0]?.id,
      title: 'ДС №1 к договору ОВ — замена марки стали трубопровода',
      description: 'Дополнительное соглашение по замене марки стали 09Г2С на Ст20 для магистрального трубопровода d108.',
      changeOrderType: 'SUBSTITUTION',
      scheduleImpactDays: 3,
    }));
    const co1Items = [
      { description: 'Демонтаж участка трубопровода d108 (09Г2С) — 15м',    quantity: 15, unit: 'м', unitPrice: 1200 },
      { description: 'Поставка трубы Ст20 d108×4 взамен 09Г2С',             quantity: 15, unit: 'м', unitPrice: 1450 },
      { description: 'Монтаж нового участка трубопровода d108 (Ст20) — 15м', quantity: 15, unit: 'м', unitPrice: 1800 },
    ];
    for (const item of co1Items) {
      await track('co1-item', () => post(`/change-orders/${co1.id}/items`, {
        changeOrderId: co1.id,
        ...item,
      }));
    }

    // CO #2: ДС №2 — допработы
    const co2 = await track('change-order-2', () => post('/change-orders', {
      projectId: PROJECT_ID,
      contractId: contractorContracts[7]?.id ?? contractorContracts[0]?.id,
      title: 'ДС №2 — дополнительные работы по домофонии (запрос заказчика)',
      description: 'Прокладка слаботочных сетей и монтаж оборудования домофонной системы — по доп. запросу АО Заказчик Девелопмент.',
      changeOrderType: 'ADDITION',
      scheduleImpactDays: 10,
    }));
    const co2Items = [
      { description: 'Прокладка кабеля домофонии по стоякам (24 стояка × 9 этажей)', quantity: 2160, unit: 'м', unitPrice: 65 },
      { description: 'Монтаж домофонных панелей и абонентских устройств',             quantity: 216,  unit: 'компл', unitPrice: 2800 },
    ];
    for (const item of co2Items) {
      await track('co2-item', () => post(`/change-orders/${co2.id}/items`, {
        changeOrderId: co2.id,
        ...item,
      }));
    }
  });
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  PRIVOD ERP — Обогащение данных ЖК Олимп`);
  console.log(`  API: ${API_ROOT}`);
  console.log(`  Project: ${PROJECT_ID}`);
  console.log(`${'='.repeat(60)}`);

  // Auth
  const loginData = await safeStep('Авторизация', () => post('/auth/login', { email: EMAIL, password: PASSWORD }));
  ACCESS_TOKEN = loginData.accessToken;
  if (!ACCESS_TOKEN) throw new Error('Не получен accessToken');
  const me = await get('/auth/me');
  ADMIN_USER_ID = me.id;

  // Verify project exists
  await safeStep('Проверка проекта', async () => {
    const project = await get(`/projects/${PROJECT_ID}`);
    if (!project) throw new Error(`Проект ${PROJECT_ID} не найден`);
    console.log(`  Проект: ${project.name}`);
  });

  // Tier 1: HR
  const employeeIds = await tier1_hr();
  console.log(`  → Сотрудников: ${employeeIds.length}`);

  // Tier 2: Warehouse
  const { locationIds, materialIds } = await tier2_warehouse(employeeIds);
  console.log(`  → Локаций: ${locationIds.length}, Материалов: ${materialIds.length}`);

  // Tier 3: Quality & Safety
  await tier3_quality_safety(employeeIds);

  // Tier 4: Planning & Operations
  await tier4_operations(employeeIds);

  // Tier 5: Fleet
  const vehicleIds = await tier5_fleet(employeeIds);
  console.log(`  → Техники: ${vehicleIds.length}`);

  // Tier 6: Closing
  await tier6_closing();

  // Tier 7: Documents, Regulatory, Changes
  await tier7_docs(employeeIds);

  console.log('\n' + '='.repeat(60));
  console.log(`  ✅ Обогащение завершено!`);
  console.log(`  API вызовов: ${callCount}`);
  console.log(`  Модули: HR, Склад, Качество, Безопасность, Планирование,`);
  console.log(`          Операции, Автопарк, Закрытие, Сдача, Документы,`);
  console.log(`          Регуляторика, Управление изменениями`);
  console.log(`\n  Откройте в браузере:`);
  console.log(`  http://localhost:5173/projects/${PROJECT_ID}`);
  console.log('='.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});
