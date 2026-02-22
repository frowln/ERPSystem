/**
 * Seed script — заполняет один проект тестовыми данными:
 * бюджет с позициями (с правильным НДС 22%), счета, платежи.
 *
 * Использование:
 *   API_BASE=http://localhost:8080 TOKEN=<jwt_token> node scripts/seed-test-data.mjs
 */

const API_BASE = process.env.API_BASE ?? 'http://localhost:8080';
const TOKEN = process.env.TOKEN ?? '';

if (!TOKEN) {
  console.error('❌  Укажите TOKEN=<jwt_token>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

const post = async (path, body) => {
  const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(`POST ${path}: ${r.status} ${JSON.stringify(data)}`);
  return data;
};

const get = async (path) => {
  const r = await fetch(`${API_BASE}${path}`, { headers });
  const data = await r.json();
  if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
  return data;
};

// VAT rate
const VAT = 0.22;

// Build notes metadata for budget items
const meta = (costPrice, coefficient, unit, quantity, docStatus = 'PLANNED', isSection = false, parentId = null) =>
  JSON.stringify({ costPrice, coefficient, unit, quantity, docStatus, isSection, parentId });

const totalWithVat = (costPrice, coefficient, quantity) =>
  Math.round(costPrice * coefficient * (1 + VAT) * quantity);

async function main() {
  console.log('🔍  Fetching projects list...');
  const projects = await get('/api/projects?size=5');
  const projectList = projects.content ?? [];

  if (projectList.length === 0) {
    console.log('⚠️  No projects found. Creating a test project...');
    // Create test project
    const project = await post('/api/projects', {
      name: 'ЖК «Привод Тест» — корпус 1',
      code: 'TEST-001',
      type: 'RESIDENTIAL',
      status: 'IN_PROGRESS',
      startDate: '2025-03-01',
      endDate: '2026-12-31',
    });
    projectList.push(project);
  }

  const project = projectList[0];
  console.log(`\n✅  Using project: "${project.name}" (${project.id})\n`);

  // ── Create Budget ─────────────────────────────────────────────────────────
  console.log('📊  Creating budget...');
  const budget = await post('/api/budgets', {
    name: 'Бюджет 2026 — Q1-Q2',
    projectId: project.id,
    plannedRevenue: 250_000_000 * 1.22,  // 250M + НДС
    plannedCost: 185_000_000 * 1.22,
    plannedMargin: 65_000_000 * 1.22,
    notes: 'Основной бюджет строительства корпуса 1. НДС 22% с 01.01.2026.',
  });
  console.log(`   ✓ Budget: ${budget.name} (${budget.id})`);

  // ── Section 1: Монолитные работы ─────────────────────────────────────────
  console.log('\n📋  Adding budget sections and items...');
  const secMonolit = await post(`/api/budgets/${budget.id}/items`, {
    category: 'SUBCONTRACT',
    name: '1. Монолитные работы',
    plannedAmount: 0,
    notes: meta(0, 1, '', 1, 'PLANNED', true, null),
  });

  const items1 = [
    { name: 'Бетон В-25 (фундаментная плита)', category: 'MATERIALS', cp: 8_500, coef: 1.18, unit: 'м³', qty: 1200, doc: 'CONTRACTED' },
    { name: 'Арматура А500С Ø12-32', category: 'MATERIALS', cp: 72_000, coef: 1.15, unit: 'т', qty: 280, doc: 'CONTRACTED' },
    { name: 'Опалубка (аренда Peri)', category: 'EQUIPMENT', cp: 1_200, coef: 1.12, unit: 'м²/мес', qty: 4500, doc: 'PLANNED' },
    { name: 'Работы по бетонированию', category: 'SUBCONTRACT', cp: 3_200, coef: 1.20, unit: 'м³', qty: 1200, doc: 'ACT_SIGNED' },
  ];

  for (const it of items1) {
    const planned = totalWithVat(it.cp, it.coef, it.qty);
    await post(`/api/budgets/${budget.id}/items`, {
      category: it.category,
      name: it.name,
      plannedAmount: planned,
      notes: meta(it.cp, it.coef, it.unit, it.qty, it.doc, false, secMonolit.id),
    });
    console.log(`   ✓ ${it.name}: ${(planned / 1_000_000).toFixed(2)} млн ₽ (с НДС)`);
  }

  // ── Section 2: Инженерные системы ────────────────────────────────────────
  const secEng = await post(`/api/budgets/${budget.id}/items`, {
    category: 'SUBCONTRACT',
    name: '2. Инженерные системы',
    plannedAmount: 0,
    notes: meta(0, 1, '', 1, 'PLANNED', true, null),
  });

  const items2 = [
    { name: 'Электроснабжение (монтаж)', category: 'SUBCONTRACT', cp: 18_500_000, coef: 1.15, unit: 'компл.', qty: 1, doc: 'CONTRACTED' },
    { name: 'Вентиляция и кондиционирование', category: 'SUBCONTRACT', cp: 12_800_000, coef: 1.18, unit: 'компл.', qty: 1, doc: 'PLANNED' },
    { name: 'Отопление и теплоснабжение', category: 'SUBCONTRACT', cp: 9_400_000, coef: 1.15, unit: 'компл.', qty: 1, doc: 'PLANNED' },
    { name: 'Водоснабжение и канализация', category: 'SUBCONTRACT', cp: 7_200_000, coef: 1.12, unit: 'компл.', qty: 1, doc: 'PLANNED' },
  ];

  for (const it of items2) {
    const planned = totalWithVat(it.cp, it.coef, it.qty);
    await post(`/api/budgets/${budget.id}/items`, {
      category: it.category,
      name: it.name,
      plannedAmount: planned,
      notes: meta(it.cp, it.coef, it.unit, it.qty, it.doc, false, secEng.id),
    });
    console.log(`   ✓ ${it.name}: ${(planned / 1_000_000).toFixed(2)} млн ₽`);
  }

  // ── Section 3: Отделочные работы ─────────────────────────────────────────
  const secFinish = await post(`/api/budgets/${budget.id}/items`, {
    category: 'SUBCONTRACT',
    name: '3. Отделочные работы',
    plannedAmount: 0,
    notes: meta(0, 1, '', 1, 'PLANNED', true, null),
  });

  const items3 = [
    { name: 'Штукатурка машинная (квартиры)', category: 'SUBCONTRACT', cp: 580, coef: 1.22, unit: 'м²', qty: 18000, doc: 'PLANNED' },
    { name: 'Плитка керамическая (МОП)', category: 'MATERIALS', cp: 1_200, coef: 1.20, unit: 'м²', qty: 3500, doc: 'PLANNED' },
    { name: 'Краска интерьерная Tikkurila', category: 'MATERIALS', cp: 420, coef: 1.18, unit: 'м²', qty: 22000, doc: 'PLANNED' },
  ];

  for (const it of items3) {
    const planned = totalWithVat(it.cp, it.coef, it.qty);
    await post(`/api/budgets/${budget.id}/items`, {
      category: it.category,
      name: it.name,
      plannedAmount: planned,
      notes: meta(it.cp, it.coef, it.unit, it.qty, it.doc, false, secFinish.id),
    });
    console.log(`   ✓ ${it.name}: ${(planned / 1_000_000).toFixed(2)} млн ₽`);
  }

  // ── Section 4: Накладные расходы ─────────────────────────────────────────
  const secOverhead = await post(`/api/budgets/${budget.id}/items`, {
    category: 'OVERHEAD',
    name: '4. Накладные расходы',
    plannedAmount: 0,
    notes: meta(0, 1, '', 1, 'PLANNED', true, null),
  });

  const items4 = [
    { name: 'ФОТ ИТР (технадзор, ПТО, прораб)', category: 'LABOR', cp: 850_000, coef: 1.00, unit: 'мес', qty: 18, doc: 'PLANNED' },
    { name: 'Временные здания и сооружения', category: 'OVERHEAD', cp: 3_500_000, coef: 1.00, unit: 'компл.', qty: 1, doc: 'PLANNED' },
    { name: 'Охрана труда и ТБ', category: 'OVERHEAD', cp: 180_000, coef: 1.00, unit: 'мес', qty: 18, doc: 'PLANNED' },
  ];

  for (const it of items4) {
    const planned = totalWithVat(it.cp, it.coef, it.qty);
    await post(`/api/budgets/${budget.id}/items`, {
      category: it.category,
      name: it.name,
      plannedAmount: planned,
      notes: meta(it.cp, it.coef, it.unit, it.qty, it.doc, false, secOverhead.id),
    });
    console.log(`   ✓ ${it.name}: ${(planned / 1_000_000).toFixed(2)} млн ₽`);
  }

  // ── Create invoices ───────────────────────────────────────────────────────
  console.log('\n🧾  Creating test invoices...');

  const today = new Date().toISOString().slice(0, 10);
  const due30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const inv1Subtotal = 12_450_000;
  const inv1 = await post('/api/invoices', {
    invoiceDate: today,
    dueDate: due30,
    projectId: project.id,
    invoiceType: 'OUTGOING',
    subtotal: inv1Subtotal,
    vatRate: 22,
    totalAmount: Math.round(inv1Subtotal * 1.22),
    notes: 'Выставлен заказчику за выполненные монолитные работы (КС-3 №1)',
  });
  console.log(`   ✓ Исходящий счёт #1: ${(inv1.totalAmount / 1_000_000).toFixed(2)} млн ₽ (с НДС)`);

  const inv2Subtotal = 8_200_000;
  const inv2 = await post('/api/invoices', {
    invoiceDate: today,
    dueDate: due30,
    projectId: project.id,
    invoiceType: 'INCOMING',
    subtotal: inv2Subtotal,
    vatRate: 22,
    totalAmount: Math.round(inv2Subtotal * 1.22),
    notes: 'Счёт от субподрядчика ООО "СтройМонолит" за бетонирование',
  });
  console.log(`   ✓ Входящий счёт #1: ${(inv2.totalAmount / 1_000_000).toFixed(2)} млн ₽ (с НДС)`);

  // ── Create payment ────────────────────────────────────────────────────────
  console.log('\n💳  Creating test payment...');
  const payment = await post('/api/payments', {
    paymentDate: today,
    projectId: project.id,
    paymentType: 'INCOMING',
    amount: Math.round(inv1Subtotal * 1.22),
    purpose: 'Оплата по договору генподряда, КС-3 №1',
    notes: 'Поступление от заказчика',
  });
  console.log(`   ✓ Платёж: ${(payment.amount / 1_000_000).toFixed(2)} млн ₽`);

  console.log(`
✅  Seed complete!
   Project:  ${project.name}
   Budget:   ${budget.name} (${budget.id})

   Open: http://localhost:3000/budgets/${budget.id}
   Or via project: http://localhost:3000/projects/${project.id}
  `);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
