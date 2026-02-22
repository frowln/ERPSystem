/**
 * Full finance model seed script.
 *
 * Creates a complete linked demo dataset:
 * - Project ("object")
 * - Specification with many items
 * - Estimate and estimate items (price source)
 * - Purchase requests (works/materials tenders with prices)
 * - Budget (auto template) + many positions in subsections
 * - Contracts linked to budget items
 * - Invoices linked to contracts
 * - Invoice payments (register-payment) to drive budget fact columns
 * - Payment documents (incoming/outgoing)
 *
 * Usage:
 *   node scripts/seed_full_finmodel_demo.mjs
 *
 * Optional env:
 *   API_ROOT=http://localhost:18080/api
 *   PRIVOD_EMAIL=admin@privod.ru
 *   PRIVOD_PASSWORD=admin123
 *   OUT_FILE=./scripts/seed_full_finmodel_demo_summary.json
 */

import fs from 'node:fs/promises';

const API_ROOT = process.env.API_ROOT ?? 'http://localhost:18080/api';
const EMAIL = process.env.PRIVOD_EMAIL ?? 'admin@privod.ru';
const PASSWORD = process.env.PRIVOD_PASSWORD ?? 'admin123';
const OUT_FILE = process.env.OUT_FILE ?? './scripts/seed_full_finmodel_demo_summary.json';
const FRONTEND_BASE_URL = process.env.WEB_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

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
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    if (response.status === 429 && attempt < 8) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
      const backoffMs = Math.max(retryAfterMs, 500 * (attempt + 1));
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return api(method, path, body, attempt + 1);
    }
    const details = typeof parsed === 'object' && parsed !== null
      ? JSON.stringify(parsed)
      : String(parsed);
    throw new Error(`${method} ${path} -> ${response.status}: ${details}`);
  }

  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
}

const post = (path, body) => api('POST', path, body);
const get = (path) => api('GET', path);
const put = (path, body) => api('PUT', path, body);
const patch = (path, body) => api('PATCH', path, body);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function money(value) {
  return Number(Number(value).toFixed(2));
}

function withVat(subtotal, vatRate = 22) {
  const vat = money(subtotal * vatRate / 100);
  return { subtotal: money(subtotal), vat, total: money(subtotal + vat), vatRate };
}

function plannedAmount(costPrice, quantity, coefficient = 1) {
  return money(costPrice * quantity * coefficient);
}

function pickFirst(list = []) {
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
}

function pageContent(response) {
  if (!response || typeof response !== 'object') return [];
  if (Array.isArray(response.content)) return response.content;
  if (Array.isArray(response)) return response;
  return [];
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function almostEqual(a, b, tolerance = 0.01) {
  return Math.abs(toNumber(a) - toNumber(b)) <= tolerance;
}

async function safeStep(title, fn) {
  process.stdout.write(`\n▶ ${title}\n`);
  const result = await fn();
  process.stdout.write(`✓ ${title}\n`);
  return result;
}

async function moveContractToSigned(contractId) {
  await post(`/contracts/${contractId}/submit-approval`);
  for (const stage of ['lawyer', 'management', 'finance']) {
    await post(`/contracts/${contractId}/approve`, {
      stage,
      comment: `Авто-согласование seed ${RUN_ID}`,
    });
  }
  await post(`/contracts/${contractId}/sign`);
}

async function ensureContractActivated(contractId) {
  await moveContractToSigned(contractId);
  await post(`/contracts/${contractId}/activate`);
}

async function createSpecAndEstimate(projectId) {
  const specification = await post('/specifications', {
    projectId,
    notes: `Спецификация для финансовой модели ${RUN_ID}`,
  });

  const specItemsPayload = [
    { itemType: 'WORK', name: 'Монтаж ГРЩ и ВРУ', quantity: 1, unitOfMeasure: 'компл', plannedAmount: 1800000, productCode: 'EOM-GRSH-01', sequence: 10, isCustomerProvided: false },
    { itemType: 'MATERIAL', name: 'Кабель ВВГнг-LS 5x16', quantity: 6200, unitOfMeasure: 'м', plannedAmount: 4960000, productCode: 'EOM-CABLE-516', sequence: 20, isCustomerProvided: false },
    { itemType: 'WORK', name: 'Монтаж освещения МОП', quantity: 18500, unitOfMeasure: 'м2', plannedAmount: 5272500, productCode: 'EO-LIGHT-MOP', sequence: 30, isCustomerProvided: false },
    { itemType: 'MATERIAL', name: 'Светильники аварийные и эвакуационные', quantity: 410, unitOfMeasure: 'шт', plannedAmount: 1968000, productCode: 'EO-EMERG-410', sequence: 40, isCustomerProvided: false },
    { itemType: 'WORK', name: 'Монтаж венткамер и воздуховодов', quantity: 1, unitOfMeasure: 'компл', plannedAmount: 15400000, productCode: 'OV-VENT-CORE', sequence: 50, isCustomerProvided: false },
    { itemType: 'MATERIAL', name: 'Воздуховоды оцинкованные', quantity: 9200, unitOfMeasure: 'м2', plannedAmount: 13248000, productCode: 'OV-DUCT-ZN', sequence: 60, isCustomerProvided: false },
    { itemType: 'WORK', name: 'Монтаж ВК (стояки и магистрали)', quantity: 1, unitOfMeasure: 'компл', plannedAmount: 9700000, productCode: 'VK-RISERS', sequence: 70, isCustomerProvided: false },
    { itemType: 'MATERIAL', name: 'Трубы PPR/PVC + фитинги', quantity: 1, unitOfMeasure: 'компл', plannedAmount: 6850000, productCode: 'VK-PIPES', sequence: 80, isCustomerProvided: false },
    { itemType: 'WORK', name: 'Система пожарной сигнализации АПС', quantity: 1, unitOfMeasure: 'компл', plannedAmount: 12200000, productCode: 'PB-APS', sequence: 90, isCustomerProvided: false },
    { itemType: 'MATERIAL', name: 'Кабельные линии СС и слаботочка', quantity: 1, unitOfMeasure: 'компл', plannedAmount: 9100000, productCode: 'SS-LINES', sequence: 100, isCustomerProvided: false },
    { itemType: 'WORK', name: 'Монтаж металлоконструкций КМ', quantity: 1450, unitOfMeasure: 'т', plannedAmount: 73950000, productCode: 'KM-MNT', sequence: 110, isCustomerProvided: false },
    { itemType: 'MATERIAL', name: 'Поставка арматуры А500С', quantity: 1320, unitOfMeasure: 'т', plannedAmount: 106920000, productCode: 'KJ-ARM-A500', sequence: 120, isCustomerProvided: false },
  ];

  const specItems = [];
  for (const payload of specItemsPayload) {
    const item = await post(`/specifications/${specification.id}/items`, payload);
    specItems.push(item);
  }

  const estimate = await post('/estimates', {
    name: `Смета ППР и инженерные системы ${RUN_ID}`,
    projectId,
    specificationId: specification.id,
    notes: `Смета для привязки цен к позициям бюджета (${RUN_ID})`,
  });

  const estimateItemMap = new Map();
  const estimateItems = [];
  for (const [index, specItem] of specItems.entries()) {
    const qty = Number(specItem.quantity ?? 1);
    const unitPrice = money(Number(specItem.plannedAmount ?? 0) / (qty || 1));
    const customerCoef = 1.14 + ((index % 3) * 0.03);
    const estimateItem = await post(`/estimates/${estimate.id}/items`, {
      specItemId: specItem.id,
      name: specItem.name,
      quantity: qty,
      unitOfMeasure: specItem.unitOfMeasure,
      unitPrice,
      unitPriceCustomer: money(unitPrice * customerCoef),
      sequence: (index + 1) * 10,
      notes: `Авто-позиция сметы для ${specItem.name}`,
    });
    estimateItemMap.set(specItem.name, estimateItem);
    estimateItems.push(estimateItem);
  }

  return { specification, specItems, estimate, estimateItemMap, estimateItems };
}

async function promoteSpecificationAndEstimate(specificationId, estimateId) {
  await patch(`/specifications/${specificationId}/status`, { status: 'IN_REVIEW' });
  await patch(`/specifications/${specificationId}/status`, { status: 'APPROVED' });
  await patch(`/specifications/${specificationId}/status`, { status: 'ACTIVE' });

  await patch(`/estimates/${estimateId}/status`, { status: 'IN_WORK' });
  await patch(`/estimates/${estimateId}/status`, { status: 'APPROVED' });
  await patch(`/estimates/${estimateId}/status`, { status: 'ACTIVE' });
}

async function createPurchaseRequests(projectId, assignedToId) {
  const worksRequest = await post('/purchase-requests', {
    requestDate: TODAY,
    projectId,
    priority: 'HIGH',
    notes: `Работы (тендер) для бюджета ${RUN_ID}`,
  });
  const worksItemsPayload = [
    { name: 'Электромонтаж ЭМ', quantity: 1, unitOfMeasure: 'компл', unitPrice: 21500000, sequence: 10 },
    { name: 'Монтаж систем ОВ', quantity: 1, unitOfMeasure: 'компл', unitPrice: 18400000, sequence: 20 },
    { name: 'Монтаж систем ВК', quantity: 1, unitOfMeasure: 'компл', unitPrice: 12600000, sequence: 30 },
    { name: 'Монтаж СС / АПС', quantity: 1, unitOfMeasure: 'компл', unitPrice: 9800000, sequence: 40 },
  ];
  for (const item of worksItemsPayload) {
    await post(`/purchase-requests/${worksRequest.id}/items`, item);
  }
  await post(`/purchase-requests/${worksRequest.id}/submit`);
  await post(`/purchase-requests/${worksRequest.id}/approve`);
  await post(`/purchase-requests/${worksRequest.id}/assign`, { assignedToId });
  await post(`/purchase-requests/${worksRequest.id}/ordered`);

  const materialsRequest = await post('/purchase-requests', {
    requestDate: TODAY,
    projectId,
    priority: 'CRITICAL',
    notes: `Материалы (тендер) для бюджета ${RUN_ID}`,
  });
  const materialsItemsPayload = [
    { name: 'Кабельная продукция ЭО/ЭМ', quantity: 1, unitOfMeasure: 'компл', unitPrice: 13800000, sequence: 10 },
    { name: 'Арматура и металлопрокат КЖ/КМ', quantity: 1, unitOfMeasure: 'компл', unitPrice: 112400000, sequence: 20 },
    { name: 'Оборудование вентиляции', quantity: 1, unitOfMeasure: 'компл', unitPrice: 22600000, sequence: 30 },
    { name: 'Сантехнические материалы ВК', quantity: 1, unitOfMeasure: 'компл', unitPrice: 7600000, sequence: 40 },
  ];
  for (const item of materialsItemsPayload) {
    await post(`/purchase-requests/${materialsRequest.id}/items`, item);
  }
  await post(`/purchase-requests/${materialsRequest.id}/submit`);
  await post(`/purchase-requests/${materialsRequest.id}/approve`);
  await post(`/purchase-requests/${materialsRequest.id}/assign`, { assignedToId });
  await post(`/purchase-requests/${materialsRequest.id}/ordered`);

  return { worksRequest, materialsRequest };
}

async function createBudgetAndPositions(projectId, estimate, estimateItemMap, purchaseRequests) {
  const budget = await post('/budgets', {
    name: `Финансовая модель объекта ${RUN_ID}`,
    projectId,
    plannedRevenue: 980000000,
    plannedCost: 762000000,
    plannedMargin: 218000000,
    notes: `Авто-создано скриптом ${RUN_ID}`,
  });

  // Wait briefly for template sections to be persisted in DB transaction context.
  await sleep(300);

  let budgetItems = await get(`/budgets/${budget.id}/items?size=2000`);
  const buildByName = () => {
    const map = new Map();
    for (const item of budgetItems) {
      if (!map.has(item.name)) map.set(item.name, []);
      map.get(item.name).push(item);
    }
    return map;
  };
  let byName = buildByName();

  function pickSection(name, parentName = null) {
    const candidates = byName.get(name) ?? [];
    if (!parentName) return pickFirst(candidates);
    const parentCandidates = byName.get(parentName) ?? [];
    const parentIds = new Set(parentCandidates.map((p) => p.id));
    return candidates.find((candidate) => candidate.parentId && parentIds.has(candidate.parentId));
  }

  let sectionRef = {
    eo: pickSection('ЭО', 'ИОС1 - Электроснабжение') ?? pickSection('ЭО'),
    em: pickSection('ЭМ', 'ИОС1 - Электроснабжение') ?? pickSection('ЭМ'),
    ov: pickSection('ОВ / ОВиК', 'ИОС4 - ОВиК и теплосети') ?? pickSection('ОВ / ОВиК'),
    vk: pickSection('ВК (внутреннее)', 'ИОС2 - Водоснабжение') ?? pickSection('ВК (внутреннее)'),
    ss: pickSection('СС / СКС', 'ИОС5 - Сети связи') ?? pickSection('СС / СКС'),
    kj: pickSection('КЖ', 'КР') ?? pickSection('КЖ'),
    km: pickSection('КМ', 'КР') ?? pickSection('КМ'),
    pb: pickSection('МПБ', 'ПБ') ?? pickSection('МПБ') ?? pickSection('ПБ'),
  };

  const mandatoryRefs = Object.entries(sectionRef).filter(([, value]) => !value);
  if (mandatoryRefs.length > 0) {
    const ensureSection = async (name, parentId = null, disciplineMark = null) => {
      const existing = budgetItems.find((item) =>
        item.section === true
        && item.name === name
        && (item.parentId ?? null) === (parentId ?? null),
      );
      if (existing) return existing;
      const created = await post(`/budgets/${budget.id}/items`, {
        parentId: parentId ?? undefined,
        section: true,
        category: 'OTHER',
        itemType: 'OTHER',
        name,
        plannedAmount: 0,
        sequence: (budgetItems.length + 1) * 10,
        disciplineMark: disciplineMark ?? undefined,
        notes: `Автосозданный раздел seed ${RUN_ID}`,
      });
      budgetItems.push(created);
      return created;
    };

    const rootKr = await ensureSection('КР', null, 'КР');
    const rootIos1 = await ensureSection('ИОС1 - Электроснабжение', null, 'ИОС1');
    const rootIos2 = await ensureSection('ИОС2 - Водоснабжение', null, 'ИОС2');
    const rootIos4 = await ensureSection('ИОС4 - ОВиК и теплосети', null, 'ИОС4');
    const rootIos5 = await ensureSection('ИОС5 - Сети связи', null, 'ИОС5');
    const rootPb = await ensureSection('ПБ', null, 'ПБ');

    const eo = await ensureSection('ЭО', rootIos1.id, 'ЭО');
    const em = await ensureSection('ЭМ', rootIos1.id, 'ЭМ');
    const ov = await ensureSection('ОВ / ОВиК', rootIos4.id, 'ОВ');
    const vk = await ensureSection('ВК (внутреннее)', rootIos2.id, 'ВК');
    const ss = await ensureSection('СС / СКС', rootIos5.id, 'СС');
    const kj = await ensureSection('КЖ', rootKr.id, 'КЖ');
    const km = await ensureSection('КМ', rootKr.id, 'КМ');
    const pb = await ensureSection('МПБ', rootPb.id, 'ПБ');

    byName = buildByName();
    sectionRef = { eo, em, ov, vk, ss, kj, km, pb };
  }

  const estimateItem = (name) => {
    const item = estimateItemMap.get(name);
    if (!item) {
      throw new Error(`Не найдена позиция сметы: ${name}`);
    }
    return item;
  };

  const positionsPlan = [
    {
      parentId: sectionRef.eo.id,
      name: 'ЭО: щитовое оборудование и сборка ВРУ',
      itemType: 'EQUIPMENT',
      category: 'EQUIPMENT',
      unit: 'компл',
      quantity: 1,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'ЭО',
      costPrice: estimateItem('Монтаж ГРЩ и ВРУ').unitPrice,
      coefficient: 1.16,
    },
    {
      parentId: sectionRef.eo.id,
      name: 'ЭО: светильники аварийные/эвакуационные',
      itemType: 'MATERIALS',
      category: 'MATERIALS',
      unit: 'шт',
      quantity: 410,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'ЭО',
      costPrice: estimateItem('Светильники аварийные и эвакуационные').unitPrice,
      coefficient: 1.14,
    },
    {
      parentId: sectionRef.em.id,
      name: 'ЭМ: кабельные линии силовые',
      itemType: 'MATERIALS',
      category: 'MATERIALS',
      unit: 'м',
      quantity: 6200,
      source: 'MATERIALS_TENDER',
      sourceId: purchaseRequests.materialsRequest.id,
      disciplineMark: 'ЭМ',
      costPrice: estimateItem('Кабель ВВГнг-LS 5x16').unitPrice,
      coefficient: 1.13,
    },
    {
      parentId: sectionRef.em.id,
      name: 'ЭМ: электромонтажные работы',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'WORKS_TENDER',
      sourceId: purchaseRequests.worksRequest.id,
      disciplineMark: 'ЭМ',
      costPrice: 21500000,
      coefficient: 1.12,
    },
    {
      parentId: sectionRef.ov.id,
      name: 'ОВ: монтаж венткамер и воздуховодов',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'ОВ',
      costPrice: estimateItem('Монтаж венткамер и воздуховодов').unitPrice,
      coefficient: 1.15,
    },
    {
      parentId: sectionRef.ov.id,
      name: 'ОВ: оборудование вентиляции',
      itemType: 'EQUIPMENT',
      category: 'EQUIPMENT',
      unit: 'компл',
      quantity: 1,
      source: 'MATERIALS_TENDER',
      sourceId: purchaseRequests.materialsRequest.id,
      disciplineMark: 'ОВ',
      costPrice: 22600000,
      coefficient: 1.11,
    },
    {
      parentId: sectionRef.vk.id,
      name: 'ВК: монтаж стояков и магистралей',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'ВК',
      costPrice: estimateItem('Монтаж ВК (стояки и магистрали)').unitPrice,
      coefficient: 1.14,
    },
    {
      parentId: sectionRef.vk.id,
      name: 'ВК: сантехнические материалы',
      itemType: 'MATERIALS',
      category: 'MATERIALS',
      unit: 'компл',
      quantity: 1,
      source: 'MATERIALS_TENDER',
      sourceId: purchaseRequests.materialsRequest.id,
      disciplineMark: 'ВК',
      costPrice: 7600000,
      coefficient: 1.10,
    },
    {
      parentId: sectionRef.ss.id,
      name: 'СС: монтаж слаботочных систем',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'WORKS_TENDER',
      sourceId: purchaseRequests.worksRequest.id,
      disciplineMark: 'СС',
      costPrice: 9800000,
      coefficient: 1.14,
    },
    {
      parentId: sectionRef.ss.id,
      name: 'СС: кабельные трассы и коммутация',
      itemType: 'MATERIALS',
      category: 'MATERIALS',
      unit: 'компл',
      quantity: 1,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'СС',
      costPrice: estimateItem('Кабельные линии СС и слаботочка').unitPrice,
      coefficient: 1.13,
    },
    {
      parentId: sectionRef.kj.id,
      name: 'КЖ: поставка арматуры А500С',
      itemType: 'MATERIALS',
      category: 'MATERIALS',
      unit: 'т',
      quantity: 1320,
      source: 'MATERIALS_TENDER',
      sourceId: purchaseRequests.materialsRequest.id,
      disciplineMark: 'КЖ',
      costPrice: money(estimateItem('Поставка арматуры А500С').unitPrice),
      coefficient: 1.08,
    },
    {
      parentId: sectionRef.kj.id,
      name: 'КЖ: бетонные смеси и расходники',
      itemType: 'MATERIALS',
      category: 'MATERIALS',
      unit: 'м3',
      quantity: 6800,
      source: 'MANUAL',
      sourceId: null,
      disciplineMark: 'КЖ',
      costPrice: 9200,
      coefficient: 1.10,
    },
    {
      parentId: sectionRef.km.id,
      name: 'КМ: монтаж металлоконструкций',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'т',
      quantity: 1450,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'КМ',
      costPrice: estimateItem('Монтаж металлоконструкций КМ').unitPrice,
      coefficient: 1.11,
    },
    {
      parentId: sectionRef.km.id,
      name: 'КМ: огнезащитная обработка металла',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'м2',
      quantity: 54000,
      source: 'MANUAL',
      sourceId: null,
      disciplineMark: 'КМ',
      costPrice: 380,
      coefficient: 1.16,
    },
    {
      parentId: sectionRef.pb.id,
      name: 'ПБ: система АПС',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'ESTIMATE',
      sourceId: estimate.id,
      disciplineMark: 'ПБ',
      costPrice: estimateItem('Система пожарной сигнализации АПС').unitPrice,
      coefficient: 1.17,
    },
    {
      parentId: sectionRef.pb.id,
      name: 'ПБ: СОУЭ и пусконаладка',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'WORKS_TENDER',
      sourceId: purchaseRequests.worksRequest.id,
      disciplineMark: 'ПБ',
      costPrice: 7100000,
      coefficient: 1.13,
    },
    {
      parentId: sectionRef.ov.id,
      name: 'ОВ: автоматика и диспетчеризация',
      itemType: 'EQUIPMENT',
      category: 'EQUIPMENT',
      unit: 'компл',
      quantity: 1,
      source: 'MANUAL',
      sourceId: null,
      disciplineMark: 'ОВ',
      costPrice: 5800000,
      coefficient: 1.15,
    },
    {
      parentId: sectionRef.vk.id,
      name: 'ВК: насосное оборудование',
      itemType: 'EQUIPMENT',
      category: 'EQUIPMENT',
      unit: 'компл',
      quantity: 1,
      source: 'MANUAL',
      sourceId: null,
      disciplineMark: 'ВК',
      costPrice: 4200000,
      coefficient: 1.14,
    },
    {
      parentId: sectionRef.ss.id,
      name: 'СС: поставка серверного шкафа и активки',
      itemType: 'EQUIPMENT',
      category: 'EQUIPMENT',
      unit: 'компл',
      quantity: 1,
      source: 'MANUAL',
      sourceId: null,
      disciplineMark: 'СС',
      costPrice: 3600000,
      coefficient: 1.16,
    },
    {
      parentId: sectionRef.em.id,
      name: 'ЭМ: пусконаладочные работы',
      itemType: 'WORKS',
      category: 'SUBCONTRACT',
      unit: 'компл',
      quantity: 1,
      source: 'WORKS_TENDER',
      sourceId: purchaseRequests.worksRequest.id,
      disciplineMark: 'ЭМ',
      costPrice: 4800000,
      coefficient: 1.18,
    },
    {
      parentId: sectionRef.eo.id,
      name: 'ЭО: авторский надзор',
      itemType: 'OVERHEAD',
      category: 'OVERHEAD',
      unit: 'мес',
      quantity: 14,
      source: 'MANUAL',
      sourceId: null,
      disciplineMark: 'ЭО',
      costPrice: 210000,
      coefficient: 1.0,
    },
  ];

  const createdPositions = [];
  for (const [index, position] of positionsPlan.entries()) {
    const estimatePrice = position.estimatePrice ?? money(
      toNumber(position.costPrice, 0) * Math.max(toNumber(position.coefficient, 1) + 0.15, 1.20),
    );
    const payload = {
      parentId: position.parentId,
      section: false,
      itemType: position.itemType,
      category: position.category,
      name: position.name,
      quantity: position.quantity,
      unit: position.unit,
      costPrice: position.costPrice,
      estimatePrice,
      coefficient: position.coefficient,
      vatRate: 22,
      plannedAmount: plannedAmount(position.costPrice, position.quantity, position.coefficient),
      notes: `Источник цены: ${position.source}${position.sourceId ? ` (${position.sourceId})` : ''}`,
      sequence: (index + 1) * 10,
      disciplineMark: position.disciplineMark,
      priceSourceType: position.source,
      priceSourceId: position.sourceId ?? undefined,
    };
    const created = await post(`/budgets/${budget.id}/items`, payload);
    createdPositions.push(created);
  }

  return { budget, createdPositions };
}

async function activateBudgetAndSyncEstimate(budgetId, estimateId) {
  await post(`/budgets/${budgetId}/approve`);
  await post(`/budgets/${budgetId}/activate`);
  try {
    await post(`/estimates/${estimateId}/sync-to-budget?budgetId=${budgetId}`);
  } catch (error) {
    if (String(error?.message ?? '').includes('-> 404')) {
      process.stdout.write('! sync-to-budget endpoint not available, continue without explicit sync\n');
      return;
    }
    throw error;
  }
}

async function createContractsAndFinDocs(project, positions) {
  if (positions.length < 10) {
    throw new Error(`Недостаточно позиций ФМ для сценария договоров: ${positions.length}`);
  }

  const statusGroups = {
    paid: [],
    invoiced: [],
    active: [],
    signed: [],
    draft: [],
    customer: [],
  };

  const contractorCandidates = positions.slice(0, 10);
  const splitTarget = contractorCandidates[0];
  const crossLinkTarget = contractorCandidates[9] ?? contractorCandidates[8];

  const makeLink = (item, share, notes) => ({
    budgetItemId: item.id,
    allocatedQuantity: Number((toNumber(item.quantity, 1) * share).toFixed(3)),
    allocatedAmount: money(toNumber(item.plannedAmount, 0) * share),
    notes,
  });

  const contractorPlans = [
    {
      name: `Поставка (часть 1) — ${splitTarget.name}`,
      partnerName: 'ООО КабельТорг+',
      primaryItem: splitTarget,
      links: [makeLink(splitTarget, 0.5, 'Частичное закрытие потребности 50%')],
    },
    {
      name: `Поставка (часть 2) — ${splitTarget.name}`,
      partnerName: 'ООО ЭнергоСнаб Групп',
      primaryItem: splitTarget,
      links: [makeLink(splitTarget, 0.5, 'Второй поставщик 50% по позиции')],
    },
    {
      name: `Субподряд — ${contractorCandidates[1].name}`,
      partnerName: 'ООО ТеплоСтрой',
      primaryItem: contractorCandidates[1],
      links: [makeLink(contractorCandidates[1], 1, 'Полное покрытие позиции')],
    },
    {
      name: `Комплексный договор — ${contractorCandidates[2].name}`,
      partnerName: 'ООО ИнженерСистем',
      primaryItem: contractorCandidates[2],
      links: [
        makeLink(contractorCandidates[2], 1, 'Основная позиция договора'),
        makeLink(crossLinkTarget, 0.15, 'Доп. объем смежной позиции (multi-link)'),
      ],
    },
    {
      name: `Субподряд — ${contractorCandidates[3].name}`,
      partnerName: 'ООО МонолитСтрой',
      primaryItem: contractorCandidates[3],
      links: [makeLink(contractorCandidates[3], 1, 'Полное покрытие позиции')],
    },
    {
      name: `Субподряд — ${contractorCandidates[4].name}`,
      partnerName: 'ООО ВК Плюс',
      primaryItem: contractorCandidates[4],
      links: [makeLink(contractorCandidates[4], 1, 'Полное покрытие позиции')],
    },
    {
      name: `Поставка — ${contractorCandidates[5].name}`,
      partnerName: 'ООО СнабМастер',
      primaryItem: contractorCandidates[5],
      links: [makeLink(contractorCandidates[5], 1, 'Полное покрытие позиции')],
    },
    {
      name: `Субподряд — ${contractorCandidates[6].name}`,
      partnerName: 'ООО Система ПБ',
      primaryItem: contractorCandidates[6],
      links: [makeLink(contractorCandidates[6], 1, 'Полное покрытие позиции')],
    },
    {
      name: `Поставка — ${contractorCandidates[7].name}`,
      partnerName: 'ООО МеталлТрейд',
      primaryItem: contractorCandidates[7],
      links: [makeLink(contractorCandidates[7], 1, 'Полное покрытие позиции')],
    },
    {
      name: `Субподряд — ${contractorCandidates[8].name}`,
      partnerName: 'ООО Автоматика Сервис',
      primaryItem: contractorCandidates[8],
      links: [makeLink(contractorCandidates[8], 1, 'Полное покрытие позиции')],
    },
  ];

  const contracts = [];
  for (const [index, plan] of contractorPlans.entries()) {
    const amount = money(
      plan.links.reduce((sum, link) => sum + toNumber(link.allocatedAmount), 0),
    );
    const contract = await post('/contracts', {
      name: plan.name,
      contractDate: `${NEXT_YEAR}-02-${String((index % 20) + 1).padStart(2, '0')}`,
      partnerName: plan.partnerName,
      projectId: project.id,
      budgetItemId: plan.primaryItem.id,
      contractDirection: 'CONTRACTOR',
      typeId: null,
      amount,
      vatRate: 22,
      paymentTerms: 'Аванс 30%, закрытие по КС-2/КС-3',
      plannedStartDate: `${NEXT_YEAR}-03-01`,
      plannedEndDate: `${NEXT_YEAR}-12-20`,
      retentionPercent: 5,
      notes: `Seed ${RUN_ID} — multi-link сценарий, план ${index + 1}`,
    });
    contracts.push({
      ...contract,
      budgetItemName: plan.primaryItem.name,
      linkPlan: plan.links,
      linkedBudgetItems: [],
    });
  }

  const customerContractAmount = money(
    contractorPlans.reduce(
      (sum, plan) => sum + plan.links.reduce((s, l) => s + toNumber(l.allocatedAmount), 0),
      0,
    ) * 1.28,
  );
  const clientContract = await post('/contracts', {
    name: `Генеральный подряд с заказчиком (${RUN_ID})`,
    contractDate: `${NEXT_YEAR}-02-21`,
    partnerName: 'АО Заказчик Девелопмент',
    projectId: project.id,
    contractDirection: 'CLIENT',
    typeId: null,
    amount: customerContractAmount,
    vatRate: 22,
    paymentTerms: 'Оплата по этапам, 15 банковских дней',
    plannedStartDate: `${NEXT_YEAR}-03-01`,
    plannedEndDate: `${NEXT_YEAR}-12-31`,
    retentionPercent: 0,
    notes: `Клиентский договор seed ${RUN_ID}`,
  });

  const contractLinks = [];
  for (const contract of contracts) {
    const linked = await post(`/contracts/${contract.id}/budget-items`, {
      items: contract.linkPlan,
    });
    contract.linkedBudgetItems = linked;
    contract.budgetItemName = linked
      .map((item) => item.budgetItemName)
      .filter(Boolean)
      .join(' + ') || contract.budgetItemName;
    contractLinks.push(...linked.map((link) => ({
      ...link,
      contractId: contract.id,
      contractNumber: contract.number,
    })));
  }

  // Lifecycle distribution for contractor contracts:
  // - first 3 => paid (signed+active + invoices + register-payment full)
  // - next 2 => invoiced (signed + invoices sent, no full payment)
  // - next 2 => active (signed+active, no invoices)
  // - next 2 => signed
  // - last 1 => draft
  for (let i = 0; i < contracts.length; i += 1) {
    const contract = contracts[i];
    if (i <= 2) {
      await ensureContractActivated(contract.id);
      statusGroups.paid.push(contract);
    } else if (i <= 4) {
      await moveContractToSigned(contract.id);
      statusGroups.invoiced.push(contract);
    } else if (i <= 6) {
      await ensureContractActivated(contract.id);
      statusGroups.active.push(contract);
    } else if (i <= 8) {
      await moveContractToSigned(contract.id);
      statusGroups.signed.push(contract);
    } else {
      statusGroups.draft.push(contract);
    }
  }

  await ensureContractActivated(clientContract.id);
  statusGroups.customer.push(clientContract);

  const invoices = [];
  const paymentRegistrations = [];

  async function createReceivedInvoiceForContract(contract, subtotal, paymentMode) {
    const totals = withVat(subtotal, 22);
    const invoice = await post('/invoices', {
      invoiceDate: TODAY,
      dueDate: DUE_30,
      projectId: project.id,
      contractId: contract.id,
      invoiceType: 'RECEIVED',
      subtotal: totals.subtotal,
      vatRate: totals.vatRate,
      totalAmount: totals.total,
      notes: `Счет поставщика по договору ${contract.number}`,
    });

    const linkedLines = contract.linkedBudgetItems?.length
      ? contract.linkedBudgetItems
      : [{ budgetItemName: contract.budgetItemName, allocatedAmount: totals.subtotal, allocatedQuantity: 1 }];
    const allocatedSum = linkedLines.reduce((sum, line) => sum + toNumber(line.allocatedAmount), 0);
    const divisor = allocatedSum > 0 ? allocatedSum : linkedLines.length;
    let allocatedSubtotal = 0;

    for (let idx = 0; idx < linkedLines.length; idx += 1) {
      const line = linkedLines[idx];
      const ratio = allocatedSum > 0
        ? toNumber(line.allocatedAmount) / divisor
        : 1 / linkedLines.length;
      const lineSubtotal = idx === linkedLines.length - 1
        ? money(totals.subtotal - allocatedSubtotal)
        : money(totals.subtotal * ratio);
      allocatedSubtotal += lineSubtotal;

      const quantity = Math.max(Number((toNumber(line.allocatedQuantity, 1)).toFixed(3)), 1);
      const unitPrice = money(lineSubtotal / quantity);
      await post(`/invoices/${invoice.id}/lines`, {
        sequence: (idx + 1) * 10,
        name: line.budgetItemName ?? `Позиция договора ${contract.number}`,
        quantity,
        unitPrice,
        unitOfMeasure: 'компл',
      });
    }

    await post(`/invoices/${invoice.id}/send`);

    if (paymentMode === 'full') {
      await post(`/invoices/${invoice.id}/register-payment`, { amount: totals.total });
      paymentRegistrations.push({ invoiceId: invoice.id, amount: totals.total, mode: 'full' });
    } else if (paymentMode === 'partial') {
      const first = money(totals.total * 0.55);
      await post(`/invoices/${invoice.id}/register-payment`, { amount: first });
      paymentRegistrations.push({ invoiceId: invoice.id, amount: first, mode: 'partial' });
    }

    invoices.push(invoice);
  }

  for (const [i, contract] of statusGroups.paid.entries()) {
    await createReceivedInvoiceForContract(contract, 7_800_000 + i * 1_250_000, 'full');
  }
  for (const [i, contract] of statusGroups.invoiced.entries()) {
    await createReceivedInvoiceForContract(contract, 6_500_000 + i * 980_000, 'partial');
  }

  const customerInvoice1Totals = withVat(18_500_000, 22);
  const customerInvoice1 = await post('/invoices', {
    invoiceDate: TODAY,
    dueDate: DUE_30,
    projectId: project.id,
    contractId: clientContract.id,
    invoiceType: 'ISSUED',
    subtotal: customerInvoice1Totals.subtotal,
    vatRate: customerInvoice1Totals.vatRate,
    totalAmount: customerInvoice1Totals.total,
    partnerName: 'АО Заказчик Девелопмент',
    notes: `Выставленный счет заказчику #1 (${RUN_ID})`,
  });
  await post(`/invoices/${customerInvoice1.id}/lines`, {
    sequence: 10,
    name: 'Выполнение работ по этапу 1',
    quantity: 1,
    unitPrice: customerInvoice1Totals.subtotal,
    unitOfMeasure: 'этап',
  });
  await post(`/invoices/${customerInvoice1.id}/send`);
  await post(`/invoices/${customerInvoice1.id}/register-payment`, { amount: customerInvoice1Totals.total });
  invoices.push(customerInvoice1);

  const customerInvoice2Totals = withVat(13_400_000, 22);
  const customerInvoice2 = await post('/invoices', {
    invoiceDate: TODAY,
    dueDate: DUE_30,
    projectId: project.id,
    contractId: clientContract.id,
    invoiceType: 'ISSUED',
    subtotal: customerInvoice2Totals.subtotal,
    vatRate: customerInvoice2Totals.vatRate,
    totalAmount: customerInvoice2Totals.total,
    partnerName: 'АО Заказчик Девелопмент',
    notes: `Выставленный счет заказчику #2 (${RUN_ID})`,
  });
  await post(`/invoices/${customerInvoice2.id}/lines`, {
    sequence: 10,
    name: 'Выполнение работ по этапу 2',
    quantity: 1,
    unitPrice: customerInvoice2Totals.subtotal,
    unitOfMeasure: 'этап',
  });
  await post(`/invoices/${customerInvoice2.id}/send`);
  await post(`/invoices/${customerInvoice2.id}/register-payment`, {
    amount: money(customerInvoice2Totals.total * 0.6),
  });
  invoices.push(customerInvoice2);

  const outgoingPayment = await post('/payments', {
    paymentDate: TODAY,
    projectId: project.id,
    contractId: statusGroups.paid[0]?.id ?? null,
    partnerName: statusGroups.paid[0]?.partnerName ?? 'ООО Контрагент 1',
    paymentType: 'OUTGOING',
    amount: 4_500_000,
    vatAmount: 810_000,
    purpose: 'Оплата поставщику по этапу 1',
    bankAccount: '40702810900000000001',
    notes: `Seed ${RUN_ID} outgoing`,
  });

  const incomingPayment = await post('/payments', {
    paymentDate: TODAY,
    projectId: project.id,
    contractId: clientContract.id,
    partnerName: 'АО Заказчик Девелопмент',
    paymentType: 'INCOMING',
    amount: 5_900_000,
    vatAmount: 1_062_000,
    purpose: 'Поступление от заказчика по этапу 1',
    bankAccount: '40702810900000000099',
    notes: `Seed ${RUN_ID} incoming`,
  });

  return {
    contracts: [...contracts, clientContract],
    contractorContracts: contracts,
    customerContract: clientContract,
    statusGroups,
    contractLinks,
    splitBudgetItemId: splitTarget.id,
    multiLinkedContractId: contracts[3]?.id ?? null,
    invoices,
    paymentRegistrations,
    payments: [outgoingPayment, incomingPayment],
  };
}

async function createCommercialProposalAndCompetitiveFlow({
  project,
  budget,
  specification,
  specItems,
  estimateItems,
}) {
  const proposal = await post('/commercial-proposals', {
    budgetId: budget.id,
    name: `КП/Себестоимость ${project.code} (${RUN_ID})`,
    notes: `Авто-сценарий КП + конкурентный лист (${RUN_ID})`,
  });

  await post(`/commercial-proposals/${proposal.id}/status`, { status: 'IN_REVIEW' });

  const materialItems = await get(`/commercial-proposals/${proposal.id}/items/materials`);
  const workItems = await get(`/commercial-proposals/${proposal.id}/items/works`);

  const selectedInvoices = [];
  const linkedEstimates = [];
  const approvedItems = [];
  const usedInvoiceLineIds = new Set();

  for (const [index, item] of materialItems.entries()) {
    const matches = await get(
      `/commercial-proposals/matching-invoice-lines?budgetItemId=${item.budgetItemId}&projectId=${project.id}&cpItemId=${item.id}`,
    );
    const selected = matches.find((candidate) => !usedInvoiceLineIds.has(candidate.id));
    if (selected) {
      await post(`/commercial-proposals/${proposal.id}/items/${item.id}/select-invoice`, {
        invoiceLineId: selected.id,
      });
      usedInvoiceLineIds.add(selected.id);
      selectedInvoices.push({
        itemId: item.id,
        budgetItemId: item.budgetItemId,
        invoiceLineId: selected.id,
      });
    }

    if (selected && index % 3 !== 1) {
      await post(`/commercial-proposals/${proposal.id}/items/${item.id}/approve`);
      approvedItems.push(item.id);
    }
  }

  for (const [index, item] of workItems.entries()) {
    const estimateItem = estimateItems[index % estimateItems.length];
    await post(`/commercial-proposals/${proposal.id}/items/${item.id}/link-estimate`, {
      estimateItemId: estimateItem.id,
      tradingCoefficient: index % 2 === 0 ? 0.95 : 0.98,
    });
    linkedEstimates.push({
      itemId: item.id,
      estimateItemId: estimateItem.id,
    });

    if (index % 4 !== 2) {
      await post(`/commercial-proposals/${proposal.id}/items/${item.id}/approve`);
      approvedItems.push(item.id);
    }
  }

  const afterConfirm = await post(`/commercial-proposals/${proposal.id}/confirm-all`);
  await post(`/commercial-proposals/${proposal.id}/status`, { status: 'APPROVED' });
  await post(`/commercial-proposals/${proposal.id}/status`, { status: 'ACTIVE' });

  const proposalItemsAfterConfirm = await get(`/commercial-proposals/${proposal.id}/items`);

  const competitiveList = await post('/competitive-lists', {
    specificationId: specification.id,
    name: `Конкурентный лист ${project.code} (${RUN_ID})`,
    minProposalsRequired: 1,
    notes: `Авто-оценка поставщиков и применение в КП`,
  });

  await post(`/competitive-lists/${competitiveList.id}/status`, { status: 'COLLECTING' });

  const vendorSuffixes = ['Альфа', 'Бета', 'Гамма'];
  const winnerSelections = [];
  let totalEntriesCreated = 0;

  for (const [itemIndex, specItem] of specItems.slice(0, 5).entries()) {
    const itemEntries = [];
    const baseUnitPrice = Math.max(
      money(toNumber(specItem.plannedAmount, 0) / Math.max(toNumber(specItem.quantity, 1), 1)),
      1,
    );

    for (const [vendorIndex, coeff] of [1.0, 0.94, 0.91].entries()) {
      const entry = await post(`/competitive-lists/${competitiveList.id}/entries`, {
        specItemId: specItem.id,
        vendorName: `ООО Поставщик ${vendorSuffixes[vendorIndex]} ${itemIndex + 1}`,
        unitPrice: money(baseUnitPrice * coeff),
        quantity: toNumber(specItem.quantity, 1),
        deliveryDays: 7 + vendorIndex * 3,
        paymentTerms: vendorIndex === 0 ? '30/70' : '20/80',
        notes: `Авто-предложение для ${specItem.name}`,
      });
      itemEntries.push(entry);
      totalEntriesCreated += 1;
    }

    const winner = itemEntries.reduce(
      (best, current) => (toNumber(current.unitPrice) < toNumber(best.unitPrice) ? current : best),
      itemEntries[0],
    );
    await post(
      `/competitive-lists/${competitiveList.id}/entries/${winner.id}/select?selectionReason=${encodeURIComponent('Лучшая цена и срок')}`,
    );
    winnerSelections.push({ specItemId: specItem.id, entryId: winner.id });
  }

  const cpMaterialTargets = proposalItemsAfterConfirm
    .filter((item) => item.itemType === 'MATERIAL')
    .slice(0, 3);
  for (const cpItem of cpMaterialTargets) {
    const unitPrice = Math.max(money(toNumber(cpItem.costPrice, 0) * 0.96), 1);
    const entry = await post(`/competitive-lists/${competitiveList.id}/entries`, {
      specItemId: cpItem.budgetItemId,
      vendorName: `ООО Победитель по КП ${cpItem.id.slice(0, 4)}`,
      unitPrice,
      quantity: Math.max(toNumber(cpItem.quantity, 1), 1),
      deliveryDays: 10,
      paymentTerms: '25/75',
      notes: 'Запись для применения победителя в КП',
    });
    totalEntriesCreated += 1;
    await post(
      `/competitive-lists/${competitiveList.id}/entries/${entry.id}/select?selectionReason=${encodeURIComponent('Применение в КП')}`,
    );
    winnerSelections.push({ specItemId: cpItem.budgetItemId, entryId: entry.id });
  }

  await post(`/competitive-lists/${competitiveList.id}/status`, { status: 'EVALUATING' });
  await post(`/competitive-lists/${competitiveList.id}/status`, { status: 'DECIDED' });
  await post(`/competitive-lists/${competitiveList.id}/status`, { status: 'APPROVED' });
  await post(`/competitive-lists/${competitiveList.id}/apply-to-cp/${proposal.id}`);

  const finalProposalItems = await get(`/commercial-proposals/${proposal.id}/items`);
  const competitiveEntries = await get(`/competitive-lists/${competitiveList.id}/entries`);
  const competitiveSummary = await get(`/competitive-lists/${competitiveList.id}/summary`);

  return {
    proposal: afterConfirm,
    proposalId: proposal.id,
    selectedInvoices,
    linkedEstimates,
    approvedItemsCount: approvedItems.length,
    proposalItemsAfterConfirm,
    proposalItemsAfterCompetitive: finalProposalItems,
    competitiveList,
    competitiveListId: competitiveList.id,
    competitiveEntries,
    competitiveSummary,
    winnerSelections,
    totalEntriesCreated,
  };
}

async function attachInvoicePriceSources(budgetId, positions, invoices) {
  const receivedInvoices = invoices.filter((invoice) => invoice.invoiceType === 'RECEIVED');
  if (receivedInvoices.length === 0) {
    return [];
  }

  const targets = positions.slice(-Math.min(3, receivedInvoices.length));
  const updated = [];

  let canUpdateBudgetItems = true;

  for (let index = 0; index < targets.length; index += 1) {
    const position = targets[index];
    const invoice = receivedInvoices[index];
    const quantity = Number(position.quantity ?? 1) || 1;
    const unitCostFromInvoice = money(Number(invoice.subtotal ?? invoice.totalAmount ?? 0) / quantity);
    const currentEstimatePrice = Number(position.estimatePrice ?? position.costPrice ?? 0);

    const payload = {
      costPrice: unitCostFromInvoice > 0 ? unitCostFromInvoice : Number(position.costPrice ?? 0),
      estimatePrice: currentEstimatePrice,
      coefficient: Number(position.coefficient ?? 1),
      vatRate: Number(position.vatRate ?? 22),
      priceSourceType: 'INVOICE',
      priceSourceId: invoice.id,
      notes: `${position.notes ?? ''}\nИсточник цены дополнен счетом ${invoice.number}`.trim(),
    };

    if (!canUpdateBudgetItems) {
      continue;
    }

    try {
      const updatedPosition = await put(`/budgets/${budgetId}/items/${position.id}`, payload);
      updated.push({
        positionId: position.id,
        positionName: position.name,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        costPrice: updatedPosition.costPrice,
        estimatePrice: updatedPosition.estimatePrice,
      });
    } catch (error) {
      const message = String(error?.message ?? error);
      const unsupportedPut = message.includes("Request method 'PUT' is not supported")
        || message.includes(' 405:')
        || message.includes('Method Not Allowed');
      canUpdateBudgetItems = false;
      process.stdout.write(
        `⚠ Не удалось обновить budget item через PUT (${unsupportedPut ? 'endpoint not supported' : 'runtime error'}). `
        + 'Шаг пропущен (цены будут синхронизированы через КП).\n',
      );
      continue;
    }
  }

  return updated;
}

async function verifyDataset(projectId, budgetId, options = {}) {
  const project = await get(`/projects/${projectId}`);
  const budget = await get(`/budgets/${budgetId}`);
  const budgetItems = await get(`/budgets/${budgetId}/items?size=3000`);
  const contractsPage = await get(`/contracts?projectId=${projectId}&size=200`);
  const invoicesPage = await get(`/invoices?projectId=${projectId}&size=200`);
  const paymentsPage = await get(`/payments?projectId=${projectId}&size=200`);
  const estimatesPage = await get(`/estimates?projectId=${projectId}&size=50`);
  const purchaseRequestsPage = await get(`/purchase-requests?projectId=${projectId}&size=100`);
  const commercialProposalsPage = await get(`/commercial-proposals?projectId=${projectId}&size=50`);
  const competitiveListsPage = await get(`/competitive-lists?projectId=${projectId}&size=50`);
  const projectFinancials = await get(`/projects/${projectId}/financials`);

  const contracts = pageContent(contractsPage);
  const invoices = pageContent(invoicesPage);
  const payments = pageContent(paymentsPage);
  const estimates = pageContent(estimatesPage);
  const purchaseRequests = pageContent(purchaseRequestsPage);
  const commercialProposals = pageContent(commercialProposalsPage);
  const competitiveLists = pageContent(competitiveListsPage);

  const positions = budgetItems.filter((i) => Number(i.plannedAmount ?? 0) > 0);
  const sections = budgetItems.filter((i) => Number(i.plannedAmount ?? 0) === 0);
  const invoicePriceSources = positions.filter((i) => i.priceSourceType === 'INVOICE').length;

  const contractsSignedOrHigher = contracts.filter((c) =>
    ['SIGNED', 'ACTIVE', 'CLOSED'].includes(c.status),
  ).length;
  const contractsActive = contracts.filter((c) => c.status === 'ACTIVE').length;
  const receivedInvoices = invoices.filter((i) => i.invoiceType === 'RECEIVED');
  const receivedInvoicesPaid = receivedInvoices.filter((i) => i.status === 'PAID').length;
  const receivedInvoicesPartial = receivedInvoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
  const issuedInvoicesPaidOrPartial = invoices.filter((i) =>
    i.invoiceType === 'ISSUED' && ['PAID', 'PARTIALLY_PAID'].includes(i.status),
  ).length;

  const proposalId = options.proposalId ?? commercialProposals[0]?.id ?? null;
  const competitiveListId = options.competitiveListId ?? competitiveLists[0]?.id ?? null;
  const proposalItems = proposalId ? await get(`/commercial-proposals/${proposalId}/items`) : [];
  const proposalMaterials = proposalItems.filter((item) => item.itemType === 'MATERIAL');
  const proposalWorks = proposalItems.filter((item) => item.itemType === 'WORK');
  const proposalConfirmed = proposalItems.filter((item) => item.status === 'CONFIRMED').length;

  const proposalMathMismatches = proposalItems.filter((item) => {
    const expectedTotal = money(toNumber(item.costPrice) * toNumber(item.quantity, 1));
    return !almostEqual(item.totalCost, expectedTotal);
  });
  const budgetPriceViolations = positions.filter((item) => toNumber(item.customerPrice) > toNumber(item.estimatePrice));
  const materialsMissingInvoiceLink = proposalMaterials.filter((item) =>
    ['INVOICE_SELECTED', 'APPROVED_SUPPLY', 'APPROVED_PROJECT', 'CONFIRMED'].includes(item.status)
      && !item.selectedInvoiceLineId);
  const worksMissingEstimateLink = proposalWorks.filter((item) =>
    ['APPROVED_PROJECT', 'CONFIRMED'].includes(item.status) && !item.estimateItemId);

  const competitiveEntries = competitiveListId
    ? await get(`/competitive-lists/${competitiveListId}/entries`)
    : [];
  const competitiveWinners = competitiveEntries.filter((entry) => entry.isWinner).length;
  const competitiveList = competitiveListId
    ? await get(`/competitive-lists/${competitiveListId}`)
    : null;

  const specification = options.specificationId
    ? await get(`/specifications/${options.specificationId}`)
    : null;
  const estimate = options.estimateId
    ? await get(`/estimates/${options.estimateId}`)
    : null;

  const contractsForSplitBudgetItem = options.splitBudgetItemId
    ? await get(`/budget-items/${options.splitBudgetItemId}/contracts`)
    : [];

  let contractsWithMultipleBudgetItems = 0;
  for (const contractId of options.contractIds ?? []) {
    const linked = await get(`/contracts/${contractId}/budget-items`);
    if ((linked?.length ?? 0) > 1) {
      contractsWithMultipleBudgetItems += 1;
    }
  }

  const checks = {
    positionsAtLeast20: positions.length >= 20,
    sectionsAtLeast10: sections.length >= 10,
    contractsAtLeast10: contracts.length >= 10,
    contractsSignedOrHigherAtLeast8: contractsSignedOrHigher >= 8,
    contractsActiveAtLeast4: contractsActive >= 4,
    invoicesAtLeast7: invoices.length >= 7,
    receivedInvoicesPaidAtLeast3: receivedInvoicesPaid >= 3,
    receivedInvoicesPartialAtLeast2: receivedInvoicesPartial >= 2,
    issuedInvoicesPaidOrPartialAtLeast2: issuedInvoicesPaidOrPartial >= 2,
    paymentsAtLeast2: payments.length >= 2,
    estimatesAtLeast1: estimates.length >= 1,
    purchaseRequestsAtLeast2: purchaseRequests.length >= 2,
    invoiceSourcesAtLeast1: invoicePriceSources >= 1,
    plannedBudgetMatchesSeed: Number(budget.plannedCost ?? 0) >= 700000000,
    financialSummaryHasSupplierInvoices: Number(projectFinancials.invoicedFromSuppliers ?? 0) > 0,
    budgetIsActive: budget.status === 'ACTIVE',
    specificationIsActive: specification?.status === 'ACTIVE',
    estimateIsActive: estimate?.status === 'ACTIVE',
    cpCreated: commercialProposals.length >= 1,
    cpHasMaterialsAndWorks: proposalMaterials.length > 0 && proposalWorks.length > 0,
    cpHasConfirmedItems: proposalConfirmed >= 6,
    cpTotalsConsistent: proposalMathMismatches.length === 0,
    budgetPriceInvariantOk: budgetPriceViolations.length === 0,
    cpMaterialsStatusLinksOk: materialsMissingInvoiceLink.length === 0,
    cpWorksStatusLinksOk: worksMissingEstimateLink.length === 0,
    competitiveListCreated: competitiveLists.length >= 1,
    competitiveListApproved: competitiveList?.status === 'APPROVED',
    competitiveEntriesAtLeast10: competitiveEntries.length >= 10,
    competitiveWinnersAtLeast6: competitiveWinners >= 6,
    budgetItemHasMultipleContracts: contractsForSplitBudgetItem.length >= 2,
    hasContractWithMultipleBudgetItems: contractsWithMultipleBudgetItems >= 1,
  };

  const failedChecks = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  if (failedChecks.length > 0) {
    throw new Error(`Проверки данных не пройдены: ${failedChecks.join(', ')}`);
  }

  return {
    project,
    budget,
    counts: {
      sections: sections.length,
      positions: positions.length,
      contracts: contracts.length,
      contractsSignedOrHigher,
      contractsActive,
      invoices: invoices.length,
      receivedInvoices: receivedInvoices.length,
      receivedInvoicesPaid,
      receivedInvoicesPartial,
      payments: payments.length,
      estimates: estimates.length,
      purchaseRequests: purchaseRequests.length,
      invoicePriceSources,
      commercialProposals: commercialProposals.length,
      proposalItems: proposalItems.length,
      proposalMaterials: proposalMaterials.length,
      proposalWorks: proposalWorks.length,
      proposalConfirmed,
      proposalMathMismatches: proposalMathMismatches.length,
      budgetPriceViolations: budgetPriceViolations.length,
      materialsMissingInvoiceLink: materialsMissingInvoiceLink.length,
      worksMissingEstimateLink: worksMissingEstimateLink.length,
      competitiveLists: competitiveLists.length,
      competitiveEntries: competitiveEntries.length,
      competitiveWinners,
      splitItemContracts: contractsForSplitBudgetItem.length,
      contractsWithMultipleBudgetItems,
    },
    projectFinancials,
    proposalId,
    competitiveListId,
    checks,
  };
}

async function main() {
  console.log(`\n=== Full financial model seed run ${RUN_ID} ===`);
  console.log(`API: ${API_ROOT}`);
  console.log(`User: ${EMAIL}`);

  const loginData = await safeStep('Авторизация', () => post('/auth/login', {
    email: EMAIL,
    password: PASSWORD,
  }));
  ACCESS_TOKEN = loginData.accessToken;
  if (!ACCESS_TOKEN) {
    throw new Error('Не получен accessToken');
  }

  const project = await safeStep('Создание объекта (проекта)', () => post('/projects', {
    name: `ЖК Привод Demo ${RUN_ID}`,
    description: `Полный интеграционный демонстрационный объект ${RUN_ID}`,
    plannedStartDate: `${NEXT_YEAR}-01-15`,
    plannedEndDate: `${NEXT_YEAR}-12-25`,
    address: 'г. Москва, ул. Демонстрационная, вл. 21',
    city: 'Москва',
    region: 'Московский регион',
    budgetAmount: 980000000,
    contractAmount: 1030000000,
    type: 'RESIDENTIAL',
    category: 'Жилой комплекс',
    priority: 'HIGH',
  }));

  await safeStep('Перевод проекта в статус PLANNING -> IN_PROGRESS', async () => {
    await patch(`/projects/${project.id}/status`, { status: 'PLANNING', reason: `Seed ${RUN_ID}` });
    await patch(`/projects/${project.id}/status`, { status: 'IN_PROGRESS', reason: `Seed ${RUN_ID}` });
  });

  const {
    specification,
    estimate,
    specItems,
    estimateItemMap,
    estimateItems,
  } = await safeStep(
    'Создание спецификации и сметы с позициями',
    async () => createSpecAndEstimate(project.id),
  );

  await safeStep(
    'Перевод спецификации и сметы в ACTIVE',
    async () => promoteSpecificationAndEstimate(specification.id, estimate.id),
  );

  const purchaseRequests = await safeStep(
    'Создание тендерных заявок (works/materials)',
    async () => createPurchaseRequests(project.id, loginData.user.id),
  );

  const { budget, createdPositions } = await safeStep(
    'Создание бюджета и большого набора позиций',
    async () => createBudgetAndPositions(project.id, estimate, estimateItemMap, purchaseRequests),
  );

  await safeStep(
    'Активация бюджета и синхронизация сметы в ФМ',
    async () => activateBudgetAndSyncEstimate(budget.id, estimate.id),
  );

  const contractsAndDocs = await safeStep(
    'Создание договоров, счетов и оплат с привязкой к позициям бюджета',
    async () => createContractsAndFinDocs(project, createdPositions),
  );

  const invoiceSourceLinks = await safeStep(
    'Привязка части позиций бюджета к источнику "Счет"',
    async () => attachInvoicePriceSources(budget.id, createdPositions, contractsAndDocs.invoices),
  );

  const cpAndCompetitive = await safeStep(
    'Создание и наполнение КП + конкурентного листа',
    async () => createCommercialProposalAndCompetitiveFlow({
      project,
      budget,
      specification,
      specItems,
      estimateItems,
    }),
  );

  const verification = await safeStep(
    'Проверка целостности данных и финансовых связей',
    async () => verifyDataset(project.id, budget.id, {
      specificationId: specification.id,
      estimateId: estimate.id,
      proposalId: cpAndCompetitive.proposalId,
      competitiveListId: cpAndCompetitive.competitiveListId,
      splitBudgetItemId: contractsAndDocs.splitBudgetItemId,
      contractIds: contractsAndDocs.contractorContracts.map((c) => c.id),
    }),
  );

  const summary = {
    runId: RUN_ID,
    createdAt: new Date().toISOString(),
    apiRoot: API_ROOT,
    login: {
      email: EMAIL,
      userId: loginData.user?.id,
      organizationId: loginData.user?.organizationId,
    },
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      status: 'IN_PROGRESS',
    },
    specification: { id: specification.id, name: specification.name, itemCount: specItems.length },
    estimate: { id: estimate.id, name: estimate.name },
    purchaseRequests: {
      worksId: purchaseRequests.worksRequest.id,
      materialsId: purchaseRequests.materialsRequest.id,
    },
    budget: {
      id: budget.id,
      name: budget.name,
      createdPositions: createdPositions.length,
    },
    contracts: {
      total: contractsAndDocs.contracts.length,
      contractorTotal: contractsAndDocs.contractorContracts.length,
      customerContractId: contractsAndDocs.customerContract.id,
      paidFlow: contractsAndDocs.statusGroups.paid.length,
      invoicedFlow: contractsAndDocs.statusGroups.invoiced.length,
      activeOnly: contractsAndDocs.statusGroups.active.length,
      signedOnly: contractsAndDocs.statusGroups.signed.length,
      draft: contractsAndDocs.statusGroups.draft.length,
      multiLinkedContractId: contractsAndDocs.multiLinkedContractId,
      splitBudgetItemId: contractsAndDocs.splitBudgetItemId,
      ids: contractsAndDocs.contracts.map((c) => c.id),
    },
    invoices: {
      totalCreatedInRun: contractsAndDocs.invoices.length,
      ids: contractsAndDocs.invoices.map((i) => i.id),
    },
    invoiceSourceLinks,
    commercialProposal: {
      id: cpAndCompetitive.proposalId,
      approvedItemsCount: cpAndCompetitive.approvedItemsCount,
      selectedInvoicesCount: cpAndCompetitive.selectedInvoices.length,
      linkedEstimatesCount: cpAndCompetitive.linkedEstimates.length,
      itemsTotal: cpAndCompetitive.proposalItemsAfterCompetitive.length,
    },
    competitiveList: {
      id: cpAndCompetitive.competitiveListId,
      totalEntriesCreated: cpAndCompetitive.totalEntriesCreated,
      winnerSelections: cpAndCompetitive.winnerSelections.length,
      entriesTotal: cpAndCompetitive.competitiveEntries.length,
    },
    payments: {
      totalCreatedInRun: contractsAndDocs.payments.length,
      ids: contractsAndDocs.payments.map((p) => p.id),
    },
    verification,
    quickLinks: {
      frontendProject: `${FRONTEND_BASE_URL}/projects/${project.id}`,
      frontendBudget: `${FRONTEND_BASE_URL}/budgets/${budget.id}`,
      frontendContracts: `${FRONTEND_BASE_URL}/contracts`,
      frontendCommercialProposals: `${FRONTEND_BASE_URL}/commercial-proposals`,
      frontendCommercialProposal: `${FRONTEND_BASE_URL}/commercial-proposals/${cpAndCompetitive.proposalId}`,
      frontendInvoices: `${FRONTEND_BASE_URL}/invoices`,
      frontendEstimates: `${FRONTEND_BASE_URL}/estimates`,
      frontendEstimate: `${FRONTEND_BASE_URL}/estimates/${estimate.id}`,
      frontendSpecifications: `${FRONTEND_BASE_URL}/specifications`,
      frontendSpecification: `${FRONTEND_BASE_URL}/specifications/${specification.id}`,
      frontendCompetitiveList: `${FRONTEND_BASE_URL}/specifications/${specification.id}/competitive-list/${cpAndCompetitive.competitiveListId}`,
      backendProjectApi: `${API_ROOT}/projects/${project.id}`,
      backendBudgetApi: `${API_ROOT}/budgets/${budget.id}`,
      backendContractsApi: `${API_ROOT}/contracts?projectId=${project.id}&size=200`,
      backendInvoicesApi: `${API_ROOT}/invoices?projectId=${project.id}&size=200`,
    },
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n=== DONE ===');
  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`Budget: ${budget.name} (${budget.id})`);
  console.log(`Summary written: ${OUT_FILE}`);
  console.log(`Open project: ${FRONTEND_BASE_URL}/projects/${project.id}`);
  console.log(`Open budget:  ${FRONTEND_BASE_URL}/budgets/${budget.id}`);
}

main().catch((error) => {
  console.error('\n❌ Seed failed');
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
