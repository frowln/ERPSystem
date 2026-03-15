#!/usr/bin/env node
/**
 * PRIVOD Platform — Volume Seed Script
 * =====================================
 * Generates realistic data volume for load/performance testing:
 *   - 100 projects
 *   - 500 employees (via departments + users)
 *   - 10,000 tasks
 *   - 50,000 documents (metadata records)
 *   - 100,000 audit log entries (direct SQL)
 *   - 1,000 estimates × 50 lines each
 *
 * Usage:
 *   node scripts/seed-volume-test.mjs
 *   node scripts/seed-volume-test.mjs --api http://localhost:8080 --email admin@privod.ru --password admin123
 *
 * Prerequisites:
 *   - Backend running at http://localhost:8080
 *   - Admin user exists (admin@privod.ru / admin123)
 *   - PostgreSQL accessible at localhost:15432 (for bulk SQL inserts)
 *
 * WARNING: Creates ~161,000+ records. Run on dev/staging only.
 */

const API_BASE = process.argv.includes('--api')
  ? process.argv[process.argv.indexOf('--api') + 1]
  : (process.env.API_BASE || 'http://localhost:8080');
const API = `${API_BASE}/api`;

const EMAIL = process.argv.includes('--email')
  ? process.argv[process.argv.indexOf('--email') + 1]
  : (process.env.PRIVOD_EMAIL || 'admin@privod.ru');
const PASSWORD = process.argv.includes('--password')
  ? process.argv[process.argv.indexOf('--password') + 1]
  : (process.env.PRIVOD_PASSWORD || 'admin123');

let TOKEN = '';
let ORG_ID = '';
let USER_ID = '';

// ─── Counters ──────────────────────────────────────────────────────
const counts = {
  projects: 0,
  departments: 0,
  employees: 0,
  tasks: 0,
  documents: 0,
  estimates: 0,
  estimateLines: 0,
  budgets: 0,
  errors: 0,
};

const timings = {};

// ─── HTTP Helpers ──────────────────────────────────────────────────
async function request(method, path, body, retries = 2) {
  const url = `${API}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1000;
        console.warn(`  429 rate-limited on ${path}, waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      if (res.status === 409) {
        return null; // Duplicate — skip
      }
      if (!res.ok && res.status >= 500) {
        counts.errors++;
        if (attempt < retries) {
          await sleep(500);
          continue;
        }
        return null;
      }
      const json = await res.json().catch(() => ({}));
      return json.data ?? json;
    } catch (err) {
      if (attempt === retries) {
        counts.errors++;
        return null;
      }
      await sleep(500);
    }
  }
  return null;
}

const post = (path, body) => request('POST', path, body);
const get = (path) => request('GET', path);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function uuid() {
  return crypto.randomUUID();
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack, daysForward = 0) {
  const now = Date.now();
  const from = now - daysBack * 86400000;
  const to = now + daysForward * 86400000;
  return new Date(from + Math.random() * (to - from)).toISOString().slice(0, 10);
}

function timer(label) {
  const start = performance.now();
  return () => {
    const ms = performance.now() - start;
    timings[label] = ms;
    return ms;
  };
}

// ─── Auth ──────────────────────────────────────────────────────────
async function login() {
  console.log(`\nLogging in as ${EMAIL}...`);
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  const data = json.data || json;
  TOKEN = data.accessToken;
  USER_ID = data.userId || data.user?.id || '';
  if (!TOKEN) {
    console.error('Login failed:', json);
    process.exit(1);
  }

  // Get org context
  const profile = await get('/users/me');
  ORG_ID = profile?.organizationId || profile?.organization?.id || '';
  console.log(`  OK — userId=${USER_ID}, orgId=${ORG_ID}`);
}

// ─── 1. Projects (100) ────────────────────────────────────────────
async function seedProjects() {
  console.log('\n═══ Seeding 100 Projects ═══');
  const end = timer('projects');
  const statuses = ['DRAFT', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
  const types = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION'];
  const cities = [
    'Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань',
    'Нижний Новгород', 'Самара', 'Ростов-на-Дону', 'Краснодар', 'Воронеж',
  ];

  const projectIds = [];

  // Batch in groups of 10 to avoid overwhelming the server
  for (let batch = 0; batch < 10; batch++) {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const idx = batch * 10 + i + 1;
      promises.push(
        post('/projects', {
          name: `VOL-ТЕСТ-Проект-${String(idx).padStart(3, '0')}`,
          code: `VOL-${String(idx).padStart(3, '0')}`,
          description: `Нагрузочный тест — проект #${idx} (${randomItem(types)})`,
          status: randomItem(statuses),
          constructionType: randomItem(types),
          location: randomItem(cities),
          startDate: randomDate(365),
          endDate: randomDate(0, 365),
          budget: Math.round(1000000 + Math.random() * 99000000),
        }).then((res) => {
          if (res?.id) {
            projectIds.push(res.id);
            counts.projects++;
          }
        }),
      );
    }
    await Promise.all(promises);
    process.stdout.write(`  ${counts.projects}/100 projects\r`);
  }

  console.log(`  Created: ${counts.projects} projects (${end().toFixed(0)}ms)`);
  return projectIds;
}

// ─── 2. Departments + Employees (500) ─────────────────────────────
async function seedEmployees() {
  console.log('\n═══ Seeding 50 Departments + 500 Employees ═══');
  const end = timer('employees');

  const deptNames = [
    'ПТО', 'Бухгалтерия', 'ОТиТБ', 'Склад', 'Снабжение', 'Кадры', 'ИТ',
    'Юридический', 'Сметный', 'Проектный', 'СМР', 'ОКС', 'Энергетики',
    'Механизация', 'Геодезия', 'Лаборатория', 'Диспетчерская', 'АХО',
    'Маркетинг', 'Финансы', 'Тендерный', 'Контроль качества', 'Логистика',
    'Экология', 'Транспорт',
  ];

  const deptIds = [];
  // Create 50 departments (2 batches of 25)
  for (let batch = 0; batch < 2; batch++) {
    const promises = [];
    for (let i = 0; i < 25; i++) {
      const idx = batch * 25 + i;
      promises.push(
        post('/departments', {
          name: `${deptNames[idx % deptNames.length]}-${idx + 1}`,
          code: `DEPT-VOL-${String(idx + 1).padStart(3, '0')}`,
        }).then((res) => {
          if (res?.id) {
            deptIds.push(res.id);
            counts.departments++;
          }
        }),
      );
    }
    await Promise.all(promises);
  }
  console.log(`  Departments: ${counts.departments}`);

  // Create 500 employees in batches of 50
  const firstNames = ['Иван', 'Пётр', 'Алексей', 'Дмитрий', 'Сергей', 'Андрей', 'Михаил', 'Николай', 'Олег', 'Виктор'];
  const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Зайцев', 'Соловьёв', 'Кузнецов'];
  const positions = ['Инженер', 'Прораб', 'Мастер', 'Геодезист', 'Сметчик', 'Снабженец', 'Монтажник', 'Сварщик', 'Бетонщик', 'Электрик'];

  for (let batch = 0; batch < 10; batch++) {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const idx = batch * 50 + i + 1;
      promises.push(
        post('/employees', {
          firstName: randomItem(firstNames),
          lastName: `${randomItem(lastNames)}-${idx}`,
          email: `vol-emp-${idx}@test.privod.ru`,
          position: randomItem(positions),
          departmentId: deptIds.length > 0 ? randomItem(deptIds) : undefined,
          hireDate: randomDate(1095),
          phone: `+7${String(9000000000 + idx)}`,
        }).then((res) => {
          if (res?.id) counts.employees++;
        }),
      );
    }
    await Promise.all(promises);
    process.stdout.write(`  ${counts.employees}/500 employees\r`);
  }

  console.log(`  Created: ${counts.employees} employees (${end().toFixed(0)}ms)`);
  return deptIds;
}

// ─── 3. Tasks (10,000) ────────────────────────────────────────────
async function seedTasks(projectIds) {
  console.log('\n═══ Seeding 10,000 Tasks ═══');
  const end = timer('tasks');
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  // 10,000 tasks in batches of 100
  for (let batch = 0; batch < 100; batch++) {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      const idx = batch * 100 + i + 1;
      promises.push(
        post('/tasks', {
          title: `VOL-Задача-${String(idx).padStart(5, '0')}`,
          description: `Нагрузочный тест — задача #${idx}`,
          priority: randomItem(priorities),
          status: randomItem(statuses),
          projectId: projectIds.length > 0 ? randomItem(projectIds) : undefined,
          dueDate: randomDate(0, 90),
        }).then((res) => {
          if (res?.id) counts.tasks++;
        }),
      );
    }
    await Promise.all(promises);
    if (batch % 10 === 0) {
      process.stdout.write(`  ${counts.tasks}/10000 tasks\r`);
    }
    // Small delay between batches to avoid 429
    if (batch % 20 === 19) await sleep(200);
  }

  console.log(`  Created: ${counts.tasks} tasks (${end().toFixed(0)}ms)          `);
}

// ─── 4. Documents (50,000) ────────────────────────────────────────
async function seedDocuments(projectIds) {
  console.log('\n═══ Seeding 50,000 Documents ═══');
  const end = timer('documents');
  const docTypes = ['DRAWING', 'SPECIFICATION', 'REPORT', 'PERMIT', 'CONTRACT', 'PHOTO', 'CORRESPONDENCE', 'CALCULATION', 'ACT', 'PROTOCOL'];
  const statuses = ['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED'];

  // 50,000 documents in batches of 200
  for (let batch = 0; batch < 250; batch++) {
    const promises = [];
    for (let i = 0; i < 200; i++) {
      const idx = batch * 200 + i + 1;
      promises.push(
        post('/documents', {
          title: `VOL-Документ-${String(idx).padStart(6, '0')}`,
          documentType: randomItem(docTypes),
          status: randomItem(statuses),
          projectId: projectIds.length > 0 ? randomItem(projectIds) : undefined,
          description: `Нагрузочный тест — документ #${idx}`,
          fileName: `vol-doc-${idx}.pdf`,
          fileSize: Math.round(10000 + Math.random() * 5000000),
        }).then((res) => {
          if (res?.id) counts.documents++;
        }),
      );
    }
    await Promise.all(promises);
    if (batch % 25 === 0) {
      process.stdout.write(`  ${counts.documents}/50000 documents\r`);
    }
    // Throttle
    if (batch % 50 === 49) await sleep(300);
  }

  console.log(`  Created: ${counts.documents} documents (${end().toFixed(0)}ms)          `);
}

// ─── 5. Estimates (1,000 × 50 lines) ─────────────────────────────
async function seedEstimates(projectIds) {
  console.log('\n═══ Seeding 1,000 Estimates × 50 Lines ═══');
  const end = timer('estimates');

  const units = ['м3', 'м2', 'т', 'шт', 'м.п.', 'компл.', 'км', 'л', 'кг'];
  const workTypes = [
    'Земляные работы', 'Бетонирование', 'Армирование', 'Кладка', 'Штукатурка',
    'Монтаж металлоконструкций', 'Электромонтаж', 'Сантехника', 'Кровельные работы',
    'Отделка', 'Остекление', 'Гидроизоляция', 'Теплоизоляция', 'Благоустройство',
    'Демонтаж', 'Свайные работы', 'Дорожные работы', 'Вентиляция', 'Пожарная сигнализация',
    'Слаботочные системы',
  ];

  for (let batch = 0; batch < 50; batch++) {
    const promises = [];
    for (let e = 0; e < 20; e++) {
      const idx = batch * 20 + e + 1;
      promises.push(
        (async () => {
          // Create estimate
          const est = await post('/estimates/local', {
            name: `VOL-ЛСР-${String(idx).padStart(4, '0')}`,
            code: `VOL-LSR-${idx}`,
            projectId: projectIds.length > 0 ? randomItem(projectIds) : undefined,
            baseDate: randomDate(365),
          });
          if (!est?.id) return;
          counts.estimates++;

          // Create 50 lines per estimate
          for (let line = 0; line < 50; line++) {
            const qty = Math.round(10 + Math.random() * 990);
            const unitPrice = Math.round(100 + Math.random() * 9900);
            await post(`/estimates/local/${est.id}/lines`, {
              lineNumber: line + 1,
              name: `${randomItem(workTypes)} (поз. ${line + 1})`,
              unit: randomItem(units),
              quantity: qty,
              unitPrice: unitPrice,
              totalPrice: qty * unitPrice,
              code: `ГЭСН-${String(batch + 1).padStart(2, '0')}-${String(line + 1).padStart(3, '0')}`,
            });
            counts.estimateLines++;
          }
        })(),
      );
    }
    await Promise.all(promises);
    process.stdout.write(`  ${counts.estimates}/1000 estimates, ${counts.estimateLines} lines\r`);
    if (batch % 10 === 9) await sleep(500);
  }

  console.log(`  Created: ${counts.estimates} estimates, ${counts.estimateLines} lines (${end().toFixed(0)}ms)          `);
}

// ─── 6. Budgets tied to projects ──────────────────────────────────
async function seedBudgets(projectIds) {
  console.log('\n═══ Seeding Budgets for Projects ═══');
  const end = timer('budgets');

  const categories = ['LABOR', 'MATERIALS', 'EQUIPMENT', 'SUBCONTRACTS', 'OVERHEAD', 'OTHER'];

  for (let batch = 0; batch < 10; batch++) {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const idx = batch * 10 + i;
      if (idx >= projectIds.length) break;
      promises.push(
        (async () => {
          const budget = await post('/finance/budgets', {
            name: `VOL-Бюджет-${String(idx + 1).padStart(3, '0')}`,
            projectId: projectIds[idx],
            totalAmount: Math.round(5000000 + Math.random() * 95000000),
          });
          if (!budget?.id) return;
          counts.budgets++;

          // Create 5 budget items per budget
          for (const cat of categories.slice(0, 5)) {
            await post(`/finance/budgets/${budget.id}/items`, {
              name: `${cat}-${idx + 1}`,
              category: cat,
              plannedAmount: Math.round(100000 + Math.random() * 9900000),
            });
          }
        })(),
      );
    }
    await Promise.all(promises);
    process.stdout.write(`  ${counts.budgets} budgets\r`);
  }

  console.log(`  Created: ${counts.budgets} budgets (${end().toFixed(0)}ms)          `);
}

// ─── 7. Audit logs (100,000 — direct insert note) ────────────────
function printAuditLogInstructions() {
  console.log('\n═══ Audit Logs (100,000) ═══');
  console.log('  For 100,000 audit log entries, use direct SQL for performance:');
  console.log('');
  console.log('  psql -h localhost -p 15432 -U privod -d privod2 -c "');
  console.log("  INSERT INTO audit_logs (id, action, entity_type, entity_id, user_id, organization_id, details, created_at)");
  console.log("  SELECT");
  console.log("    gen_random_uuid(),");
  console.log("    (ARRAY['CREATE','UPDATE','DELETE','VIEW','EXPORT'])[1 + floor(random()*5)::int],");
  console.log("    (ARRAY['Project','Task','Document','Estimate','Invoice','Contract'])[1 + floor(random()*6)::int],");
  console.log("    gen_random_uuid()::text,");
  console.log(`    '${USER_ID || '<USER_ID>'}',`);
  console.log(`    '${ORG_ID || '<ORG_ID>'}',`);
  console.log("    '{\"source\":\"volume-test\"}'::jsonb,");
  console.log("    NOW() - (random() * interval '365 days')");
  console.log("  FROM generate_series(1, 100000);");
  console.log('  "');
  console.log('');
  console.log('  Estimated: ~5-15 seconds for 100K rows via SQL.');
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const totalStart = performance.now();

  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  PRIVOD Platform — Volume Seed Script                ║');
  console.log('║  Target: 100 projects, 500 employees, 10K tasks,    ║');
  console.log('║  50K docs, 100K audit logs, 1K estimates × 50 lines ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`  API: ${API}`);

  await login();

  const projectIds = await seedProjects();
  await seedEmployees();
  await seedTasks(projectIds);
  await seedDocuments(projectIds);
  await seedEstimates(projectIds);
  await seedBudgets(projectIds);
  printAuditLogInstructions();

  const totalMs = performance.now() - totalStart;

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Volume Seed — Results                               ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  Projects:        ${String(counts.projects).padStart(8)}                        ║`);
  console.log(`║  Departments:     ${String(counts.departments).padStart(8)}                        ║`);
  console.log(`║  Employees:       ${String(counts.employees).padStart(8)}                        ║`);
  console.log(`║  Tasks:           ${String(counts.tasks).padStart(8)}                        ║`);
  console.log(`║  Documents:       ${String(counts.documents).padStart(8)}                        ║`);
  console.log(`║  Estimates:       ${String(counts.estimates).padStart(8)}                        ║`);
  console.log(`║  Estimate Lines:  ${String(counts.estimateLines).padStart(8)}                        ║`);
  console.log(`║  Budgets:         ${String(counts.budgets).padStart(8)}                        ║`);
  console.log(`║  Errors:          ${String(counts.errors).padStart(8)}                        ║`);
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  Timing per module:                                  ║');
  for (const [label, ms] of Object.entries(timings)) {
    console.log(`║    ${label.padEnd(18)} ${String(Math.round(ms) + 'ms').padStart(10)}                  ║`);
  }
  console.log(`║  Total:            ${String(Math.round(totalMs) + 'ms').padStart(10)}                  ║`);
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  Audit logs: run the SQL command above (100K rows)   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  if (counts.errors > 100) {
    console.error(`\n⚠ High error count (${counts.errors}). Check backend logs.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
