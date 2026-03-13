#!/usr/bin/env node
/**
 * seed_specifications.mjs
 *
 * Seeds the Specifications module with realistic HVAC data
 * (OViK / Building 23k/1 — Volume 5.4.2) and auto-creates a Competitive List.
 *
 * Usage:
 *   node scripts/seed_specifications.mjs [--api=http://localhost:8080]
 *
 * Prerequisites:
 *   - Backend is running
 *   - User admin@privod.ru / admin123 exists
 *   - At least one project exists
 */

const API_BASE =
  process.env.API_BASE ||
  process.argv.find((a) => a.startsWith('--api='))?.split('=')[1] ||
  'http://localhost:8080';
const API = `${API_BASE}/api`;

let TOKEN = '';

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
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    // 409 = already exists — treat as success
    if (res.status === 409) {
      console.log(`  [409] ${method} ${path} — already exists, skipping`);
      return null;
    }
    console.error(
      `  [${res.status}] ${method} ${path}`,
      typeof json === 'string' ? json.slice(0, 200) : JSON.stringify(json).slice(0, 200),
    );
    return null;
  }
  return json?.data ?? json;
}

async function login() {
  const res = await request('POST', '/auth/login', {
    email: 'admin@privod.ru',
    password: 'admin123',
  });
  const token = res?.token || res?.accessToken || res?.data?.accessToken;
  if (!token) {
    console.error('Login failed. Check credentials. Response:', JSON.stringify(res).slice(0, 200));
    process.exit(1);
  }
  TOKEN = token;
  console.log('Logged in as admin@privod.ru');
}

// ── HVAC Spec Data ───────────────────────────────────────────────────────────

const SPEC_TITLE = 'ОВиК Здание 23к/1 — Том 5.4.2';

const SECTIONS = [
  {
    sectionName: 'СИСТЕМА ПРИТОЧНОЙ ВЕНТИЛЯЦИИ (П)',
    items: [
      { position: 'П1', name: 'Приточная установка КЦКП-5-С1-У3', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'П2', name: 'Приточная установка КЦКП-12,5-С1-У3', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'П3', name: 'Приточная установка КЦКП-3,15-С1-У3', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'П4', name: 'Приточная установка ОСА300-045/А-45-Н', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
    ],
  },
  {
    sectionName: 'СИСТЕМА ВЫТЯЖНОЙ ВЕНТИЛЯЦИИ (В)',
    items: [
      { position: 'В1', name: 'Канальный вентилятор КАНАЛ-ПКВ-60-35-4-380', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'В2', name: 'Крышный вентилятор ОСА300-050/А-50-Н', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'В3', name: 'Крышный вентилятор ОСА300-045/А-45-Н', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'В4', name: 'Осевой вентилятор Вентс 100К', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'В5', name: 'Радиальный вентилятор ВР 80-75 4', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
    ],
  },
  {
    sectionName: 'АВАРИЙНАЯ ВЕНТИЛЯЦИЯ (АВ)',
    items: [
      { position: 'АВ1', name: 'Канальный вентилятор КАНАЛ-ЕС-100-50-В-380', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { position: 'АВ2/АВ3', name: 'Канальный вентилятор КАНАЛ-ЕС-100-50-6А-380', quantity: 2, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
    ],
  },
  {
    sectionName: 'КОНДИЦИОНИРОВАНИЕ (К)',
    items: [
      { position: 'К1', name: 'Сплит-система DAIKIN FT25/R 25', quantity: 1, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
    ],
  },
  {
    sectionName: 'ВОЗДУШНО-ТЕПЛОВЫЕ ЗАВЕСЫ (ВП)',
    items: [
      { position: 'ВП1-7', name: 'Воздушная завеса Aermax A30 IP 54', quantity: 7, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
    ],
  },
  {
    sectionName: 'ОТОПЛЕНИЕ',
    items: [
      { name: 'Радиатор стальной панельный Kermi FTV 22 500x1000', quantity: 12, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { name: 'Труба стальная ВГП Ду 25', quantity: 180, itemType: 'MATERIAL', unitOfMeasure: 'м.п.' },
      { name: 'Труба стальная ВГП Ду 32', quantity: 85, itemType: 'MATERIAL', unitOfMeasure: 'м.п.' },
      { name: 'Кран шаровой Ду 25', quantity: 24, itemType: 'MATERIAL', unitOfMeasure: 'шт' },
      { name: 'Кран шаровой Ду 32', quantity: 16, itemType: 'MATERIAL', unitOfMeasure: 'шт' },
      { name: 'Клапан балансировочный Danfoss MSV-F2 Ду 25', quantity: 6, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { name: 'Теплоизоляция Energoflex Super 28/9', quantity: 265, itemType: 'MATERIAL', unitOfMeasure: 'м.п.' },
    ],
  },
  {
    sectionName: 'МАТЕРИАЛЫ ВЕНТИЛЯЦИИ',
    items: [
      { name: 'Воздуховод оцинкованный прямоугольный 400x300', quantity: 45, itemType: 'MATERIAL', unitOfMeasure: 'м²' },
      { name: 'Воздуховод оцинкованный круглый Ø250', quantity: 32, itemType: 'MATERIAL', unitOfMeasure: 'м.п.' },
      { name: 'Решетка вентиляционная РВ 300x150', quantity: 18, itemType: 'MATERIAL', unitOfMeasure: 'шт' },
      { name: 'Диффузор приточный ДПУ-М 250', quantity: 14, itemType: 'MATERIAL', unitOfMeasure: 'шт' },
      { name: 'Клапан обратный КОп 315', quantity: 8, itemType: 'MATERIAL', unitOfMeasure: 'шт' },
      { name: 'Клапан огнезадерживающий КПУ-1Н 300x200', quantity: 6, itemType: 'EQUIPMENT', unitOfMeasure: 'шт' },
      { name: 'Гибкая вставка круглая Ø250', quantity: 10, itemType: 'MATERIAL', unitOfMeasure: 'шт' },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeed Specifications — HVAC (${SPEC_TITLE})`);
  console.log(`API: ${API}\n`);

  await login();

  // 1. Get first project
  console.log('\n1. Fetching projects...');
  const projectsPage = await request('GET', '/projects?page=0&size=1');
  const projects = projectsPage?.content ?? projectsPage ?? [];
  if (!projects.length) {
    console.error('No projects found. Please create a project first.');
    process.exit(1);
  }
  const project = projects[0];
  console.log(`   Using project: "${project.name}" (${project.id})`);

  // 2. Create specification
  console.log('\n2. Creating specification...');
  const spec = await request('POST', '/specifications', {
    title: SPEC_TITLE,
    projectId: project.id,
    projectName: project.name,
    status: 'DRAFT',
    notes: 'Раздел 5.4.2 — Отопление, вентиляция и кондиционирование воздуха (ОВиК). Здание 23к/1.',
  });
  if (!spec) {
    console.log('   Specification may already exist. Trying to find it...');
    const existingPage = await request('GET', `/specifications?projectId=${project.id}&page=0&size=50`);
    const existing = (existingPage?.content ?? existingPage ?? []).find(
      (s) => (s.title || s.name) === SPEC_TITLE,
    );
    if (existing) {
      console.log(`   Found existing specification: ${existing.id}`);
      await seedItems(existing.id);
      await seedCompetitiveList(existing.id, SPEC_TITLE);
      return;
    }
    console.error('   Could not create or find specification. Exiting.');
    process.exit(1);
  }
  console.log(`   Created specification: ${spec.id}`);

  // 3. Create spec items
  await seedItems(spec.id);

  // 4. Create competitive list
  await seedCompetitiveList(spec.id, SPEC_TITLE);

  console.log('\nDone! Specification seeded successfully.');
}

async function seedItems(specId) {
  console.log('\n3. Creating spec items...');
  let seq = 1;
  let created = 0;
  let skipped = 0;

  for (const section of SECTIONS) {
    console.log(`   Section: ${section.sectionName}`);
    for (const item of section.items) {
      const payload = {
        name: item.name,
        itemType: item.itemType,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        sectionName: section.sectionName,
        sequence: seq++,
        ...(item.position ? { position: item.position } : {}),
      };
      const result = await request('POST', `/specifications/${specId}/items`, payload);
      if (result) {
        created++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`   Created: ${created}, Skipped (duplicates): ${skipped}`);
}

async function seedCompetitiveList(specId, specTitle) {
  console.log('\n4. Creating competitive list...');
  const cl = await request('POST', '/competitive-lists', {
    specificationId: specId,
    name: `КЛ — ${specTitle}`,
  });
  if (cl) {
    console.log(`   Created competitive list: ${cl.id}`);
  } else {
    console.log('   Competitive list already exists or could not be created.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
