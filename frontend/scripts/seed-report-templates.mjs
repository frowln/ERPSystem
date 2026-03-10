/**
 * Seed script — creates Report Builder templates via the API.
 *
 * Usage:
 *   API_BASE=http://localhost:8080 TOKEN=<jwt_token> node scripts/seed-report-templates.mjs
 */

const API_BASE = process.env.API_BASE ?? 'http://localhost:8080';
const TOKEN = process.env.TOKEN ?? '';

if (!TOKEN) {
  console.error('Укажите TOKEN=<jwt_token>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

const post = async (path, body) => {
  const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (r.status === 409) {
    console.log(`  [skip] ${body.name} (already exists)`);
    return null;
  }
  const data = await r.json();
  if (!r.ok) throw new Error(`POST ${path}: ${r.status} ${JSON.stringify(data)}`);
  return data;
};

const templates = [
  {
    name: 'Сводка по проектам',
    description: 'Общий обзор всех активных проектов с ключевыми метриками',
    dataSource: 'PROJECTS',
    chartType: 'BAR',
    isPublic: true,
  },
  {
    name: 'Реестр контрактов',
    description: 'Полный реестр действующих договоров с контрагентами',
    dataSource: 'CONTRACTS',
    chartType: 'NONE',
    isPublic: true,
  },
  {
    name: 'Анализ закупок',
    description: 'Распределение закупок по категориям и поставщикам',
    dataSource: 'PURCHASE_REQUESTS',
    chartType: 'PIE',
    isPublic: false,
  },
  {
    name: 'Отчёт по безопасности',
    description: 'Динамика инцидентов и проверок за период',
    dataSource: 'SAFETY_INCIDENTS',
    chartType: 'LINE',
    isPublic: true,
  },
  {
    name: 'Выполнение работ',
    description: 'Прогресс выполнения задач по объектам',
    dataSource: 'TASKS',
    chartType: 'STACKED_BAR',
    isPublic: false,
  },
];

async function main() {
  console.log('Seeding Report Builder templates...');
  console.log(`API: ${API_BASE}\n`);

  for (const tpl of templates) {
    try {
      const result = await post('/api/analytics/report-builder/templates', tpl);
      if (result) {
        const id = result.data?.id ?? result.id ?? '?';
        console.log(`  [ok] ${tpl.name} (id=${id})`);
      }
    } catch (err) {
      console.error(`  [err] ${tpl.name}: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

main();
