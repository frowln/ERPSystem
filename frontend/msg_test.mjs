#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE = 'http://localhost:4000';
const API = 'http://localhost:8080/api';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@privod.ru', password: 'admin123' }),
  });
  const json = await res.json();
  return {
    token: json.data?.accessToken ?? json.data?.token,
    user: json.data?.user ?? json.user,
  };
}

async function setAuth(page, token, user) {
  await page.goto(`${BASE}/login`);
  await page.evaluate(({ t, u }) => {
    localStorage.setItem('privod-auth', JSON.stringify({
      state: { user: u, token: t, refreshToken: null, isAuthenticated: true },
      version: 0,
    }));
  }, { t: token, u: user });
}

async function main() {
  const { token, user } = await login();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await setAuth(page, token, user);

  // 1. Main view with messages
  await page.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/tmp/msg_final_01_main.png' });
  console.log('1. Main view');

  // 2. Click channel info to show members
  const infoBtn = page.locator('button').filter({ has: page.locator('svg.lucide-info') }).first();
  if (await infoBtn.isVisible().catch(() => false)) {
    await infoBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/msg_final_02_info.png' });
    console.log('2. Channel info with members');
  }

  // 3. Create channel modal — with member picker
  await page.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const plusBtn = page.locator('button[title*="канал"], button[title*="channel"], button[title*="Создать"]').first();
  if (await plusBtn.isVisible().catch(() => false)) {
    await plusBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/msg_final_03_create.png' });
    console.log('3. Create channel modal');
  }

  // 4. Search with users showing
  await page.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('Алексей');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/msg_final_04_search.png' });
    console.log('4. Search with users');
  }

  // 5. Pinned panel
  await page.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const pinBtn = page.locator('button').filter({ has: page.locator('svg.lucide-pin') }).first();
  if (await pinBtn.isVisible().catch(() => false)) {
    await pinBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/msg_final_05_pinned.png' });
    console.log('5. Pinned messages');
  }

  await ctx.close();
  await browser.close();
  console.log('\nDone!');
}

main().catch(err => { console.error(err.message); process.exit(1); });
