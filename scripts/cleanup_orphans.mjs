#!/usr/bin/env node
/**
 * Cleanup script: deletes ALL entities NOT belonging to ЖК Олимп project.
 *
 * Usage: node scripts/cleanup_orphans.mjs
 */

const API = process.env.API_URL || 'http://localhost:8080/api';
const OLIMP_PROJECT_ID = 'd8d7bc98-8aea-4df4-8867-091e7d6366ef';

let TOKEN = '';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@privod.ru', password: 'admin123' }),
  });
  const data = await res.json();
  TOKEN = data.data.accessToken;
  console.log('✅ Logged in');
}

async function apiGet(path) {
  const res = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  const dd = data.data || data;
  if (Array.isArray(dd)) return dd;
  if (dd.content) return dd.content;
  return [dd];
}

async function apiDelete(path) {
  const res = await fetch(`${API}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return res.status;
}

async function cleanupEndpoint(endpoint, label) {
  console.log(`\n--- ${label} (${endpoint}) ---`);
  const items = await apiGet(`${endpoint}?size=1000`);
  const orphans = items.filter(i => i.projectId !== OLIMP_PROJECT_ID);
  const kept = items.filter(i => i.projectId === OLIMP_PROJECT_ID);

  console.log(`  Total: ${items.length}, ЖК Олимп: ${kept.length}, To delete: ${orphans.length}`);

  if (orphans.length === 0) {
    console.log('  Nothing to delete.');
    return { deleted: 0, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;
  for (const item of orphans) {
    const name = item.name || item.number || item.title || item.id.slice(0, 8);
    const status = await apiDelete(`${endpoint}/${item.id}`);
    if (status >= 200 && status < 300) {
      deleted++;
    } else {
      console.log(`  ❌ Failed to delete ${name} (${item.id}): HTTP ${status}`);
      failed++;
    }
  }
  console.log(`  ✅ Deleted: ${deleted}, Failed: ${failed}`);
  return { deleted, failed };
}

async function main() {
  await login();

  const results = {};

  // Order matters: delete dependents first (invoices, payments before contracts/budgets)
  const endpoints = [
    ['payments', 'Платежи'],
    ['invoices', 'Счета'],
    ['contracts', 'Договоры'],
    ['specifications', 'Спецификации'],
    ['estimates', 'Сметы'],
    ['budgets', 'Бюджеты'],
    ['commercial-proposals', 'Коммерческие предложения'],
    ['purchase-requests', 'Заявки на закупку'],
  ];

  for (const [ep, label] of endpoints) {
    try {
      results[ep] = await cleanupEndpoint(ep, label);
    } catch (err) {
      console.log(`  ⚠️ ${label}: ${err.message}`);
      results[ep] = { deleted: 0, failed: 0, error: err.message };
    }
  }

  // Summary
  console.log('\n========== SUMMARY ==========');
  let totalDeleted = 0;
  let totalFailed = 0;
  for (const [ep, r] of Object.entries(results)) {
    console.log(`  ${ep}: deleted=${r.deleted}, failed=${r.failed}${r.error ? ` (${r.error})` : ''}`);
    totalDeleted += r.deleted || 0;
    totalFailed += r.failed || 0;
  }
  console.log(`\n  TOTAL: ${totalDeleted} deleted, ${totalFailed} failed`);

  // Verify
  console.log('\n========== VERIFICATION ==========');
  for (const [ep, label] of endpoints) {
    try {
      const items = await apiGet(`${ep}?size=1000`);
      const orphans = items.filter(i => i.projectId !== OLIMP_PROJECT_ID);
      console.log(`  ${label}: ${items.length} total, ${orphans.length} orphans remaining`);
    } catch (err) {
      console.log(`  ${label}: verify error — ${err.message}`);
    }
  }
}

main().catch(console.error);
