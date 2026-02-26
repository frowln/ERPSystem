/**
 * Reset + Full Seed script.
 *
 * 1. Deletes ALL existing data (projects cascade-delete most things)
 * 2. Runs the full financial model seed to create ONE project with ALL data
 *
 * Usage:
 *   node scripts/reset_and_seed.mjs
 *
 * Optional env:
 *   API_ROOT=http://localhost:8080/api
 *   PRIVOD_EMAIL=admin@privod.ru
 *   PRIVOD_PASSWORD=admin123
 */

const API_ROOT = process.env.API_ROOT ?? 'http://localhost:8080/api';
const EMAIL = process.env.PRIVOD_EMAIL ?? 'admin@privod.ru';
const PASSWORD = process.env.PRIVOD_PASSWORD ?? 'admin123';

const RUN_ID = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const TODAY = new Date().toISOString().slice(0, 10);
const DUE_30 = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const NEXT_YEAR = String(new Date().getFullYear() + 1);

let ACCESS_TOKEN = '';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {}),
});

async function api(method, path, body, attempt = 0) {
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const rawText = await response.text();
  let parsed = null;
  try { parsed = rawText ? JSON.parse(rawText) : null; } catch { parsed = rawText; }

  if (!response.ok) {
    if (response.status === 429 && attempt < 8) {
      const retryAfterMs = Math.max(Number(response.headers.get('retry-after') ?? 0) * 1000, 500 * (attempt + 1));
      await new Promise((r) => setTimeout(r, retryAfterMs));
      return api(method, path, body, attempt + 1);
    }
    if (response.status === 404) return null;
    const details = typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed) : String(parsed);
    throw new Error(`${method} ${path} -> ${response.status}: ${details}`);
  }

  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) return parsed.data;
  return parsed;
}

const post = (path, body) => api('POST', path, body);
const get = (path) => api('GET', path);
const put = (path, body) => api('PUT', path, body);
const patch = (path, body) => api('PATCH', path, body);
const del = (path) => api('DELETE', path);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function money(v) { return Number(Number(v).toFixed(2)); }
function withVat(subtotal, vatRate = 20) {
  const vat = money(subtotal * vatRate / 100);
  return { subtotal: money(subtotal), vat, total: money(subtotal + vat), vatRate };
}
function pageContent(r) {
  if (!r) return [];
  if (Array.isArray(r.content)) return r.content;
  if (Array.isArray(r)) return r;
  return [];
}
function toNumber(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

async function safeStep(title, fn) {
  process.stdout.write(`\n▶ ${title}\n`);
  try {
    const result = await fn();
    process.stdout.write(`  ✓ ${title}\n`);
    return result;
  } catch (err) {
    process.stdout.write(`  ✗ ${title}: ${err.message}\n`);
    throw err;
  }
}

async function tryDelete(path) {
  try { await del(path); } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────────────────────

async function cleanupAll() {
  console.log('\n🧹 Удаление всех данных...');

  // Delete all projects (cascade should delete contracts, invoices, budgets, etc.)
  const projectsPage = await get('/projects?size=500').catch(() => null);
  const projects = pageContent(projectsPage);
  console.log(`  Найдено проектов: ${projects.length}`);
  for (const p of projects) {
    process.stdout.write(`  Удаление проекта: ${p.name} (${p.id})\n`);
    await tryDelete(`/projects/${p.id}`);
    await sleep(50);
  }

  // Orphaned contracts (without project)
  const contractsPage = await get('/contracts?size=500').catch(() => null);
  const contracts = pageContent(contractsPage);
  for (const c of contracts) { await tryDelete(`/contracts/${c.id}`); }

  // Orphaned invoices
  const invoicesPage = await get('/invoices?size=500').catch(() => null);
  const invoices = pageContent(invoicesPage);
  for (const i of invoices) { await tryDelete(`/invoices/${i.id}`); }

  // Orphaned payments
  const paymentsPage = await get('/payments?size=500').catch(() => null);
  const payments = pageContent(paymentsPage);
  for (const p of payments) { await tryDelete(`/payments/${p.id}`); }

  // Orphaned budgets
  const budgetsPage = await get('/budgets?size=500').catch(() => null);
  const budgets = pageContent(budgetsPage);
  for (const b of budgets) { await tryDelete(`/budgets/${b.id}`); }

  // Orphaned specifications
  const specsPage = await get('/specifications?size=500').catch(() => null);
  const specs = pageContent(specsPage);
  for (const s of specs) { await tryDelete(`/specifications/${s.id}`); }

  // Orphaned estimates
  const estimatesPage = await get('/estimates?size=500').catch(() => null);
  const estimates = pageContent(estimatesPage);
  for (const e of estimates) { await tryDelete(`/estimates/${e.id}`); }

  console.log('  ✓ Очистка завершена');
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT WORKFLOW HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function moveContractToSigned(contractId) {
  await post(`/contracts/${contractId}/submit-approval`);
  for (const stage of ['lawyer', 'management', 'finance']) {
    await post(`/contracts/${contractId}/approve`, { stage, comment: `Авто seed ${RUN_ID}` });
  }
  await post(`/contracts/${contractId}/sign`);
}

async function ensureContractActivated(contractId) {
  await moveContractToSigned(contractId);
  await post(`/contracts/${contractId}/activate`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  // 1. PROJECT
  const project = await safeStep('Создание проекта', () => post('/projects', {
    name: 'ЖК Олимп — Инженерные системы',
    description: 'Жилой комплекс «Олимп», корпуса 1–3. Монтаж инженерных систем и инфраструктуры.',
    plannedStartDate: `${NEXT_YEAR}-01-15`,
    plannedEndDate: `${NEXT_YEAR}-12-25`,
    address: 'г. Москва, ул. Олимпийская, вл. 7',
    city: 'Москва',
    region: 'Московский регион',
    budgetAmount: 980_000_000,
    contractAmount: 1_120_000_000,
    type: 'RESIDENTIAL',
    category: 'Жилой комплекс',
    priority: 'HIGH',
  }));

  await safeStep('Перевод проекта в IN_PROGRESS', async () => {
    await patch(`/projects/${project.id}/status`, { status: 'PLANNING', reason: `Seed ${RUN_ID}` });
    await patch(`/projects/${project.id}/status`, { status: 'IN_PROGRESS', reason: `Seed ${RUN_ID}` });
  });

  // 2. SPECIFICATION + ESTIMATE
  const specItemsData = [
    { itemType: 'WORK',     name: 'Монтаж ГРЩ и ВРУ',                    qty: 1,    unit: 'компл', amount: 1_800_000,   code: 'EOM-GRSH-01' },
    { itemType: 'MATERIAL', name: 'Кабель ВВГнг-LS 5×16',                qty: 6200, unit: 'м',     amount: 4_960_000,   code: 'EOM-CABLE-516' },
    { itemType: 'WORK',     name: 'Монтаж освещения МОП',                 qty: 18500,unit: 'м²',    amount: 5_272_500,   code: 'EO-LIGHT-MOP' },
    { itemType: 'MATERIAL', name: 'Светильники аварийные и эвакуационные',qty: 410,  unit: 'шт',    amount: 1_968_000,   code: 'EO-EMERG-410' },
    { itemType: 'WORK',     name: 'Монтаж венткамер и воздуховодов',      qty: 1,    unit: 'компл', amount: 15_400_000,  code: 'OV-VENT-CORE' },
    { itemType: 'MATERIAL', name: 'Воздуховоды оцинкованные',             qty: 9200, unit: 'м²',    amount: 13_248_000,  code: 'OV-DUCT-ZN' },
    { itemType: 'WORK',     name: 'Монтаж ВК (стояки и магистрали)',      qty: 1,    unit: 'компл', amount: 9_700_000,   code: 'VK-RISERS' },
    { itemType: 'MATERIAL', name: 'Трубы PPR/PVC + фитинги',              qty: 1,    unit: 'компл', amount: 6_850_000,   code: 'VK-PIPES' },
    { itemType: 'WORK',     name: 'Система пожарной сигнализации АПС',    qty: 1,    unit: 'компл', amount: 12_200_000,  code: 'PB-APS' },
    { itemType: 'MATERIAL', name: 'Кабельные линии СС и слаботочка',      qty: 1,    unit: 'компл', amount: 9_100_000,   code: 'SS-LINES' },
    { itemType: 'WORK',     name: 'Монтаж металлоконструкций КМ',         qty: 1450, unit: 'т',     amount: 73_950_000,  code: 'KM-MNT' },
    { itemType: 'MATERIAL', name: 'Поставка арматуры А500С',              qty: 1320, unit: 'т',     amount: 106_920_000, code: 'KJ-ARM-A500' },
  ];

  const specification = await safeStep('Создание спецификации', () => post('/specifications', {
    projectId: project.id,
    notes: `Спецификация инженерных систем ${RUN_ID}`,
  }));

  const specItems = [];
  await safeStep('Добавление позиций спецификации', async () => {
    for (const [i, d] of specItemsData.entries()) {
      const item = await post(`/specifications/${specification.id}/items`, {
        itemType: d.itemType, name: d.name, quantity: d.qty, unitOfMeasure: d.unit,
        plannedAmount: d.amount, productCode: d.code, sequence: (i + 1) * 10, isCustomerProvided: false,
      });
      specItems.push(item);
    }
  });

  await safeStep('Активация спецификации', async () => {
    await patch(`/specifications/${specification.id}/status`, { status: 'IN_REVIEW' });
    await patch(`/specifications/${specification.id}/status`, { status: 'APPROVED' });
    await patch(`/specifications/${specification.id}/status`, { status: 'ACTIVE' });
  });

  const estimate = await safeStep('Создание сметы', () => post('/estimates', {
    name: `Смета инженерные системы ${RUN_ID}`,
    projectId: project.id,
    specificationId: specification.id,
    notes: `Привязка цен к позициям бюджета (${RUN_ID})`,
  }));

  const estimateItemMap = new Map();
  await safeStep('Добавление позиций сметы', async () => {
    for (const [i, specItem] of specItems.entries()) {
      const qty = Number(specItem.quantity ?? 1);
      const unitPrice = money(Number(specItem.plannedAmount ?? 0) / (qty || 1));
      const coef = 1.14 + (i % 3) * 0.03;
      const ei = await post(`/estimates/${estimate.id}/items`, {
        specItemId: specItem.id, name: specItem.name, quantity: qty,
        unitOfMeasure: specItem.unitOfMeasure, unitPrice,
        unitPriceCustomer: money(unitPrice * coef), sequence: (i + 1) * 10,
      });
      estimateItemMap.set(specItem.name, ei);
    }
  });

  await safeStep('Активация сметы', async () => {
    await patch(`/estimates/${estimate.id}/status`, { status: 'IN_WORK' });
    await patch(`/estimates/${estimate.id}/status`, { status: 'APPROVED' });
    await patch(`/estimates/${estimate.id}/status`, { status: 'ACTIVE' });
  });

  // 3. PURCHASE REQUESTS
  let worksRequest, materialsRequest;
  await safeStep('Создание заявок на закупку', async () => {
    worksRequest = await post('/purchase-requests', {
      requestDate: TODAY, projectId: project.id, priority: 'HIGH',
      notes: `Работы (тендер) для бюджета ${RUN_ID}`,
    });
    for (const item of [
      { name: 'Электромонтаж ЭМ', qty: 1, unit: 'компл', price: 21_500_000 },
      { name: 'Монтаж систем ОВ',  qty: 1, unit: 'компл', price: 18_400_000 },
      { name: 'Монтаж систем ВК',  qty: 1, unit: 'компл', price: 12_600_000 },
      { name: 'Монтаж СС / АПС',   qty: 1, unit: 'компл', price: 9_800_000  },
    ]) {
      await post(`/purchase-requests/${worksRequest.id}/items`, {
        name: item.name, quantity: item.qty, unitOfMeasure: item.unit, unitPrice: item.price, sequence: 10,
      });
    }
    await post(`/purchase-requests/${worksRequest.id}/submit`);
    await post(`/purchase-requests/${worksRequest.id}/approve`);

    materialsRequest = await post('/purchase-requests', {
      requestDate: TODAY, projectId: project.id, priority: 'CRITICAL',
      notes: `Материалы (тендер) для бюджета ${RUN_ID}`,
    });
    for (const item of [
      { name: 'Кабельная продукция ЭО/ЭМ',    qty: 1, unit: 'компл', price: 13_800_000  },
      { name: 'Арматура и металлопрокат КЖ/КМ',qty: 1, unit: 'компл', price: 112_400_000 },
      { name: 'Оборудование вентиляции',        qty: 1, unit: 'компл', price: 22_600_000  },
      { name: 'Сантехнические материалы ВК',    qty: 1, unit: 'компл', price: 7_600_000   },
    ]) {
      await post(`/purchase-requests/${materialsRequest.id}/items`, {
        name: item.name, quantity: item.qty, unitOfMeasure: item.unit, unitPrice: item.price, sequence: 10,
      });
    }
    await post(`/purchase-requests/${materialsRequest.id}/submit`);
    await post(`/purchase-requests/${materialsRequest.id}/approve`);
  });

  // 4. BUDGET + POSITIONS
  const budget = await safeStep('Создание бюджета (финансовой модели)', () => post('/budgets', {
    name: `Финансовая модель — ЖК Олимп (${RUN_ID})`,
    projectId: project.id,
    plannedRevenue: 980_000_000,
    plannedCost: 762_000_000,
    plannedMargin: 218_000_000,
    notes: `Авто-создано seed ${RUN_ID}`,
  }));

  await sleep(400);

  let budgetItems = await get(`/budgets/${budget.id}/items?size=2000`) ?? [];
  if (!Array.isArray(budgetItems)) budgetItems = budgetItems?.content ?? [];

  const ensureSection = async (name, parentId, mark) => {
    const existing = budgetItems.find((i) => i.section === true && i.name === name && (i.parentId ?? null) === (parentId ?? null));
    if (existing) return existing;
    const created = await post(`/budgets/${budget.id}/items`, {
      parentId: parentId ?? undefined, section: true, category: 'OTHER', itemType: 'OTHER',
      name, plannedAmount: 0, sequence: (budgetItems.length + 1) * 10,
      disciplineMark: mark ?? undefined, notes: `Раздел seed ${RUN_ID}`,
    });
    budgetItems.push(created);
    return created;
  };

  let sectionRef;
  await safeStep('Создание разделов бюджета', async () => {
    const rootKr   = await ensureSection('КР', null, 'КР');
    const rootIos1 = await ensureSection('ИОС1 — Электроснабжение', null, 'ИОС1');
    const rootIos2 = await ensureSection('ИОС2 — Водоснабжение', null, 'ИОС2');
    const rootIos4 = await ensureSection('ИОС4 — ОВиК и теплосети', null, 'ИОС4');
    const rootIos5 = await ensureSection('ИОС5 — Сети связи', null, 'ИОС5');
    const rootPb   = await ensureSection('ПБ', null, 'ПБ');

    sectionRef = {
      eo: await ensureSection('ЭО', rootIos1.id, 'ЭО'),
      em: await ensureSection('ЭМ', rootIos1.id, 'ЭМ'),
      ov: await ensureSection('ОВ / ОВиК', rootIos4.id, 'ОВ'),
      vk: await ensureSection('ВК (внутреннее)', rootIos2.id, 'ВК'),
      ss: await ensureSection('СС / СКС', rootIos5.id, 'СС'),
      kj: await ensureSection('КЖ', rootKr.id, 'КЖ'),
      km: await ensureSection('КМ', rootKr.id, 'КМ'),
      pb: await ensureSection('МПБ', rootPb.id, 'ПБ'),
    };
  });

  const ei = (name) => {
    const item = estimateItemMap.get(name);
    if (!item) throw new Error(`Не найдена позиция сметы: ${name}`);
    return item;
  };
  const pa = (costPrice, qty, coef = 1) => money(costPrice * qty * coef);

  const positionsPlan = [
    { parentId: sectionRef.eo.id, name: 'ЭО: щитовое оборудование и сборка ВРУ', itemType: 'EQUIPMENT', category: 'EQUIPMENT', unit: 'компл', qty: 1,    mark: 'ЭО', costPrice: ei('Монтаж ГРЩ и ВРУ').unitPrice,                    coef: 1.16 },
    { parentId: sectionRef.eo.id, name: 'ЭО: светильники аварийные/эвакуационные',itemType: 'MATERIALS', category: 'MATERIALS', unit: 'шт',   qty: 410,  mark: 'ЭО', costPrice: ei('Светильники аварийные и эвакуационные').unitPrice,   coef: 1.14 },
    { parentId: sectionRef.em.id, name: 'ЭМ: кабельные линии силовые',            itemType: 'MATERIALS', category: 'MATERIALS', unit: 'м',    qty: 6200, mark: 'ЭМ', costPrice: ei('Кабель ВВГнг-LS 5×16').unitPrice,                   coef: 1.13 },
    { parentId: sectionRef.em.id, name: 'ЭМ: электромонтажные работы',            itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'ЭМ', costPrice: 21_500_000,                                            coef: 1.12 },
    { parentId: sectionRef.em.id, name: 'ЭМ: пусконаладочные работы',             itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'ЭМ', costPrice: 4_800_000,                                             coef: 1.18 },
    { parentId: sectionRef.ov.id, name: 'ОВ: монтаж венткамер и воздуховодов',    itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'ОВ', costPrice: ei('Монтаж венткамер и воздуховодов').unitPrice,         coef: 1.15 },
    { parentId: sectionRef.ov.id, name: 'ОВ: оборудование вентиляции',            itemType: 'EQUIPMENT', category: 'EQUIPMENT',  unit: 'компл',qty: 1,   mark: 'ОВ', costPrice: 22_600_000,                                            coef: 1.11 },
    { parentId: sectionRef.ov.id, name: 'ОВ: автоматика и диспетчеризация',       itemType: 'EQUIPMENT', category: 'EQUIPMENT',  unit: 'компл',qty: 1,   mark: 'ОВ', costPrice: 5_800_000,                                             coef: 1.15 },
    { parentId: sectionRef.vk.id, name: 'ВК: монтаж стояков и магистралей',       itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'ВК', costPrice: ei('Монтаж ВК (стояки и магистрали)').unitPrice,         coef: 1.14 },
    { parentId: sectionRef.vk.id, name: 'ВК: сантехнические материалы',           itemType: 'MATERIALS', category: 'MATERIALS',  unit: 'компл',qty: 1,   mark: 'ВК', costPrice: 7_600_000,                                             coef: 1.10 },
    { parentId: sectionRef.vk.id, name: 'ВК: насосное оборудование',              itemType: 'EQUIPMENT', category: 'EQUIPMENT',  unit: 'компл',qty: 1,   mark: 'ВК', costPrice: 4_200_000,                                             coef: 1.14 },
    { parentId: sectionRef.ss.id, name: 'СС: монтаж слаботочных систем',          itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'СС', costPrice: 9_800_000,                                             coef: 1.14 },
    { parentId: sectionRef.ss.id, name: 'СС: кабельные трассы и коммутация',      itemType: 'MATERIALS', category: 'MATERIALS',  unit: 'компл',qty: 1,   mark: 'СС', costPrice: ei('Кабельные линии СС и слаботочка').unitPrice,         coef: 1.13 },
    { parentId: sectionRef.ss.id, name: 'СС: серверный шкаф и активное оборудование',itemType:'EQUIPMENT',category:'EQUIPMENT',  unit: 'компл',qty: 1,   mark: 'СС', costPrice: 3_600_000,                                             coef: 1.16 },
    { parentId: sectionRef.kj.id, name: 'КЖ: поставка арматуры А500С',            itemType: 'MATERIALS', category: 'MATERIALS',  unit: 'т',    qty: 1320, mark: 'КЖ', costPrice: ei('Поставка арматуры А500С').unitPrice,                coef: 1.08 },
    { parentId: sectionRef.kj.id, name: 'КЖ: бетонные смеси и расходники',        itemType: 'MATERIALS', category: 'MATERIALS',  unit: 'м³',   qty: 6800, mark: 'КЖ', costPrice: 9_200,                                                 coef: 1.10 },
    { parentId: sectionRef.km.id, name: 'КМ: монтаж металлоконструкций',          itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'т',    qty: 1450, mark: 'КМ', costPrice: ei('Монтаж металлоконструкций КМ').unitPrice,            coef: 1.11 },
    { parentId: sectionRef.km.id, name: 'КМ: огнезащитная обработка металла',     itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'м²',   qty: 54000,mark: 'КМ', costPrice: 380,                                                   coef: 1.16 },
    { parentId: sectionRef.pb.id, name: 'ПБ: система АПС',                        itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'ПБ', costPrice: ei('Система пожарной сигнализации АПС').unitPrice,       coef: 1.17 },
    { parentId: sectionRef.pb.id, name: 'ПБ: СОУЭ и пусконаладка',               itemType: 'WORKS',     category: 'SUBCONTRACT',unit: 'компл',qty: 1,   mark: 'ПБ', costPrice: 7_100_000,                                             coef: 1.13 },
    { parentId: sectionRef.eo.id, name: 'ЭО: авторский надзор ЭО',               itemType: 'OVERHEAD',  category: 'OVERHEAD',   unit: 'мес',  qty: 14,   mark: 'ЭО', costPrice: 210_000,                                               coef: 1.0  },
  ];

  const createdPositions = [];
  await safeStep('Создание позиций бюджета', async () => {
    for (const [i, pos] of positionsPlan.entries()) {
      const estimatePrice = money(toNumber(pos.costPrice, 0) * Math.max(pos.coef + 0.15, 1.20));
      const created = await post(`/budgets/${budget.id}/items`, {
        parentId: pos.parentId, section: false, itemType: pos.itemType, category: pos.category,
        name: pos.name, quantity: pos.qty, unit: pos.unit,
        costPrice: pos.costPrice, estimatePrice,
        coefficient: pos.coef, vatRate: 20,
        plannedAmount: pa(pos.costPrice, pos.qty, pos.coef),
        disciplineMark: pos.mark, sequence: (i + 1) * 10,
      });
      createdPositions.push(created);
    }
  });

  await safeStep('Активация бюджета', async () => {
    await post(`/budgets/${budget.id}/approve`);
    await post(`/budgets/${budget.id}/activate`);
  });

  // 5. CLIENT CONTRACT (ГЕНПОДРЯД)
  const totalContractorAmount = createdPositions.reduce((s, p) => s + toNumber(p.plannedAmount, 0), 0);
  const clientContractAmount = money(totalContractorAmount * 1.28);

  const clientContract = await safeStep('Создание клиентского договора (ГК)', () => post('/contracts', {
    name: 'Генеральный подряд с АО Заказчик Девелопмент',
    contractDate: `${NEXT_YEAR}-02-01`,
    partnerName: 'АО Заказчик Девелопмент',
    projectId: project.id,
    direction: 'CLIENT',
    typeId: null,
    amount: clientContractAmount,
    vatRate: 20,
    paymentTerms: 'Оплата по этапам, 15 банковских дней',
    plannedStartDate: `${NEXT_YEAR}-03-01`,
    plannedEndDate: `${NEXT_YEAR}-12-31`,
    retentionPercent: 0,
    notes: `Генподрядный договор seed ${RUN_ID}`,
  }));

  await safeStep('Активация клиентского договора', () => ensureContractActivated(clientContract.id));

  // 6. CONTRACTOR CONTRACTS (СУБПОДРЯДЫ + ПОСТАВКИ)
  const contractorPlans = [
    { name: 'Поставка кабельной продукции (ч.1)',           partner: 'ООО КабельТорг+',          pos: 2,  share: 0.5 },
    { name: 'Поставка кабельной продукции (ч.2)',           partner: 'ООО ЭнергоСнаб Групп',     pos: 2,  share: 0.5 },
    { name: 'Субподряд — Электромонтажные работы',          partner: 'ООО ЭлектроМонтаж-СК',    pos: 3,  share: 1.0 },
    { name: 'Субподряд — ОВ монтаж венткамер',             partner: 'ООО ТеплоСтрой',           pos: 5,  share: 1.0 },
    { name: 'Поставка оборудования вентиляции',             partner: 'ООО ИнженерСистем',        pos: 6,  share: 1.0 },
    { name: 'Субподряд — ВК монтаж стояков',               partner: 'ООО ВК Плюс',              pos: 8,  share: 1.0 },
    { name: 'Поставка сантехнических материалов',           partner: 'ООО СнабМастер',           pos: 9,  share: 1.0 },
    { name: 'Субподряд — Слаботочные системы',              partner: 'ООО Система ПБ',           pos: 11, share: 1.0 },
    { name: 'Поставка арматуры и металлопроката',           partner: 'ООО МеталлТрейд',          pos: 14, share: 1.0 },
    { name: 'Субподряд — Монтаж металлоконструкций КМ',    partner: 'ООО МонолитСтрой',         pos: 16, share: 1.0 },
  ];

  const contracts = [];
  await safeStep('Создание подрядных договоров', async () => {
    for (const [i, plan] of contractorPlans.entries()) {
      const pos = createdPositions[plan.pos - 1];
      const amount = money(toNumber(pos?.plannedAmount, 0) * plan.share);
      const contract = await post('/contracts', {
        name: plan.name,
        contractDate: `${NEXT_YEAR}-02-${String((i % 20) + 1).padStart(2, '0')}`,
        partnerName: plan.partner,
        projectId: project.id,
        budgetItemId: pos?.id ?? undefined,
        direction: 'CONTRACTOR',
        typeId: null,
        amount,
        vatRate: 20,
        paymentTerms: 'Аванс 30%, закрытие по КС-2/КС-3',
        plannedStartDate: `${NEXT_YEAR}-03-01`,
        plannedEndDate: `${NEXT_YEAR}-12-20`,
        retentionPercent: 5,
        notes: `Seed ${RUN_ID}`,
      });
      contracts.push({ ...contract, pos, share: plan.share });
    }
  });

  // Link budget items to contracts
  await safeStep('Привязка бюджетных позиций к договорам', async () => {
    for (const c of contracts) {
      if (!c.pos) continue;
      try {
        await post(`/contracts/${c.id}/budget-items`, {
          items: [{
            budgetItemId: c.pos.id,
            allocatedQuantity: Number((toNumber(c.pos.quantity, 1) * c.share).toFixed(3)),
            allocatedAmount: money(toNumber(c.pos.plannedAmount, 0) * c.share),
            notes: 'Seed link',
          }],
        });
      } catch { /* might already be linked */ }
    }
  });

  // Contract lifecycle: first 3 → paid, next 3 → invoiced, next 2 → active, last 2 → signed
  const paidContracts = contracts.slice(0, 3);
  const invoicedContracts = contracts.slice(3, 6);
  const activeContracts = contracts.slice(6, 8);
  const signedContracts = contracts.slice(8, 10);

  await safeStep('Подписание/активация договоров', async () => {
    for (const c of [...paidContracts, ...activeContracts]) { await ensureContractActivated(c.id); }
    for (const c of [...invoicedContracts, ...signedContracts]) { await moveContractToSigned(c.id); }
  });

  // 7. SUPPLIER INVOICES (RECEIVED)
  const receivedInvoices = [];
  await safeStep('Создание счетов от поставщиков', async () => {
    const invoiceTargets = [
      ...paidContracts.map((c, i) => ({ contract: c, subtotal: 7_800_000 + i * 1_250_000, mode: 'full' })),
      ...invoicedContracts.map((c, i) => ({ contract: c, subtotal: 6_500_000 + i * 980_000, mode: 'partial' })),
    ];

    for (const { contract, subtotal, mode } of invoiceTargets) {
      const totals = withVat(subtotal, 20);
      const invoice = await post('/invoices', {
        invoiceDate: TODAY, dueDate: DUE_30,
        projectId: project.id, contractId: contract.id,
        invoiceType: 'RECEIVED',
        subtotal: totals.subtotal, vatRate: totals.vatRate, totalAmount: totals.total,
        notes: `Счет поставщика по договору ${contract.number}`,
      });

      await post(`/invoices/${invoice.id}/lines`, {
        sequence: 10,
        name: contract.pos?.name ?? `Выполнение работ по договору ${contract.number}`,
        quantity: 1, unitPrice: totals.subtotal, unitOfMeasure: 'компл',
      });
      await post(`/invoices/${invoice.id}/send`);

      if (mode === 'full') {
        await post(`/invoices/${invoice.id}/register-payment`, { amount: totals.total });
      } else {
        await post(`/invoices/${invoice.id}/register-payment`, { amount: money(totals.total * 0.55) });
      }
      receivedInvoices.push(invoice);
    }
  });

  // 8. CLIENT INVOICES (ISSUED)
  await safeStep('Создание счетов заказчику', async () => {
    const inv1Totals = withVat(18_500_000, 20);
    const inv1 = await post('/invoices', {
      invoiceDate: TODAY, dueDate: DUE_30,
      projectId: project.id, contractId: clientContract.id,
      invoiceType: 'ISSUED',
      subtotal: inv1Totals.subtotal, vatRate: inv1Totals.vatRate, totalAmount: inv1Totals.total,
      partnerName: 'АО Заказчик Девелопмент',
      notes: `Счет заказчику #1 — Этап 1 (${RUN_ID})`,
    });
    await post(`/invoices/${inv1.id}/lines`, {
      sequence: 10, name: 'Выполнение работ по этапу 1', quantity: 1,
      unitPrice: inv1Totals.subtotal, unitOfMeasure: 'этап',
    });
    await post(`/invoices/${inv1.id}/send`);
    await post(`/invoices/${inv1.id}/register-payment`, { amount: inv1Totals.total });

    const inv2Totals = withVat(13_400_000, 20);
    const inv2 = await post('/invoices', {
      invoiceDate: TODAY, dueDate: DUE_30,
      projectId: project.id, contractId: clientContract.id,
      invoiceType: 'ISSUED',
      subtotal: inv2Totals.subtotal, vatRate: inv2Totals.vatRate, totalAmount: inv2Totals.total,
      partnerName: 'АО Заказчик Девелопмент',
      notes: `Счет заказчику #2 — Этап 2 (${RUN_ID})`,
    });
    await post(`/invoices/${inv2.id}/lines`, {
      sequence: 10, name: 'Выполнение работ по этапу 2', quantity: 1,
      unitPrice: inv2Totals.subtotal, unitOfMeasure: 'этап',
    });
    await post(`/invoices/${inv2.id}/send`);
    await post(`/invoices/${inv2.id}/register-payment`, { amount: money(inv2Totals.total * 0.6) });
  });

  // 9. PAYMENTS
  await safeStep('Создание платёжных документов', async () => {
    await post('/payments', {
      paymentDate: TODAY, projectId: project.id,
      contractId: paidContracts[0]?.id ?? null,
      partnerName: paidContracts[0]?.partnerName ?? 'ООО КабельТорг+',
      paymentType: 'OUTGOING', amount: 4_500_000, vatAmount: 750_000,
      purpose: 'Оплата поставщику — кабельная продукция этап 1',
      bankAccount: '40702810900000000001', notes: `Seed ${RUN_ID} outgoing`,
    });
    await post('/payments', {
      paymentDate: TODAY, projectId: project.id,
      contractId: clientContract.id,
      partnerName: 'АО Заказчик Девелопмент',
      paymentType: 'INCOMING', amount: 5_900_000, vatAmount: 983_333,
      purpose: 'Поступление от заказчика — этап 1',
      bankAccount: '40702810900000000099', notes: `Seed ${RUN_ID} incoming`,
    });
    await post('/payments', {
      paymentDate: TODAY, projectId: project.id,
      contractId: paidContracts[1]?.id ?? null,
      partnerName: paidContracts[1]?.partnerName ?? 'ООО ЭнергоСнаб Групп',
      paymentType: 'OUTGOING', amount: 3_200_000, vatAmount: 533_333,
      purpose: 'Оплата поставщику — ч.2 кабельной продукции',
      bankAccount: '40702810900000000002', notes: `Seed ${RUN_ID} outgoing-2`,
    });
    await post('/payments', {
      paymentDate: TODAY, projectId: project.id,
      contractId: clientContract.id,
      partnerName: 'АО Заказчик Девелопмент',
      paymentType: 'INCOMING', amount: 12_200_000, vatAmount: 2_033_333,
      purpose: 'Поступление от заказчика — этап 2 (частично)',
      bankAccount: '40702810900000000099', notes: `Seed ${RUN_ID} incoming-2`,
    });
  });

  // 10. COMMERCIAL PROPOSAL
  await safeStep('Создание коммерческого предложения / КП', async () => {
    try {
      const proposal = await post('/commercial-proposals', {
        budgetId: budget.id,
        name: `КП — ЖК Олимп (${RUN_ID})`,
        notes: `Коммерческое предложение + себестоимость (${RUN_ID})`,
      });

      await post(`/commercial-proposals/${proposal.id}/status`, { status: 'IN_REVIEW' });

      const materialItems = await get(`/commercial-proposals/${proposal.id}/items/materials`) ?? [];
      const workItems = await get(`/commercial-proposals/${proposal.id}/items/works`) ?? [];

      for (const item of [...materialItems, ...workItems]) {
        try { await post(`/commercial-proposals/${proposal.id}/items/${item.id}/approve`); } catch { /* ok */ }
      }

      try { await post(`/commercial-proposals/${proposal.id}/confirm-all`); } catch { /* ok */ }
      await post(`/commercial-proposals/${proposal.id}/status`, { status: 'APPROVED' });
      await post(`/commercial-proposals/${proposal.id}/status`, { status: 'ACTIVE' });
    } catch (err) {
      process.stdout.write(`  ⚠ КП пропущено: ${err.message}\n`);
    }
  });

  return { project, budget, specification, estimate, clientContract, contracts };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  PRIVOD ERP — Reset + Full Seed`);
  console.log(`  Run: ${RUN_ID}`);
  console.log(`  API: ${API_ROOT}`);
  console.log(`${'='.repeat(60)}`);

  // Auth
  const loginData = await safeStep('Авторизация', () => post('/auth/login', { email: EMAIL, password: PASSWORD }));
  ACCESS_TOKEN = loginData.accessToken;
  if (!ACCESS_TOKEN) throw new Error('Не получен accessToken');

  // Cleanup
  await cleanupAll();

  // Seed fresh data
  const { project, budget, specification, estimate, clientContract, contracts } = await seed();

  console.log('\n' + '='.repeat(60));
  console.log('  ✅ Готово!');
  console.log(`  Проект: ${project.name} (${project.id})`);
  console.log(`  Бюджет: ${budget.id}`);
  console.log(`  Договор ГК: ${clientContract.number} — ${clientContract.partnerName}`);
  console.log(`  Договоров подрядных: ${contracts.length}`);
  console.log(`  Спецификация: ${specification.id}`);
  console.log(`  Смета: ${estimate.id}`);
  console.log('\n  Откройте в браузере:');
  console.log(`  http://localhost:5173/projects`);
  console.log('='.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});
