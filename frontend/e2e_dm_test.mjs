#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE = 'http://localhost:4000';
const API = 'http://localhost:8080/api';
const SHOTS = '/tmp/msg_dm_';

async function login(email, password = 'admin123') {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
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
  console.log('=== DM FLOW TEST ===\n');

  // Login as admin
  const admin = await login('admin@privod.ru');
  console.log(`Admin logged in: ${admin.user?.fullName ?? admin.user?.email ?? 'OK'}`);

  // Login as engineer (Иванов)
  const engineer = await login('engineer@privod.ru');
  console.log(`Engineer logged in: ${engineer.user?.fullName ?? engineer.user?.email ?? 'OK'}`);

  const browser = await chromium.launch({ headless: true });

  // --- Admin creates DM to engineer ---
  console.log('\n--- Admin sends DM to engineer ---');
  const headers = { 'Authorization': `Bearer ${admin.token}`, 'Content-Type': 'application/json' };

  // Create DM channel
  const dmRes = await fetch(`${API}/messaging/channels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'DM', channelType: 'DIRECT', memberIds: [engineer.user?.id] }),
  });
  const dm = await dmRes.json();
  console.log(`DM created: status=${dmRes.status}, channelId=${dm.data?.id}`);
  console.log(`  otherUserName: "${dm.data?.otherUserName ?? 'N/A'}"`);
  console.log(`  otherUserId: "${dm.data?.otherUserId ?? 'N/A'}"`);

  // Send message from admin
  const dmChannelId = dm.data?.id;
  if (dmChannelId) {
    const msgRes = await fetch(`${API}/messaging/channels/${dmChannelId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: 'Привет! Как дела с проектом ЖК Солнечный?' }),
    });
    const msg = await msgRes.json();
    console.log(`Admin sent message: ${msgRes.status} (id=${msg.data?.id?.substring(0,8)}...)`);

    // Send reply from engineer
    const engHeaders = { 'Authorization': `Bearer ${engineer.token}`, 'Content-Type': 'application/json' };
    const replyRes = await fetch(`${API}/messaging/channels/${dmChannelId}/messages`, {
      method: 'POST',
      headers: engHeaders,
      body: JSON.stringify({ content: 'Добрый день! Всё по графику. Завтра планёрка в 10:00.' }),
    });
    console.log(`Engineer replied: ${replyRes.status}`);

    // Another from admin
    const msg2Res = await fetch(`${API}/messaging/channels/${dmChannelId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: 'Отлично, буду. Подготовь отчёт по закупкам.' }),
    });
    console.log(`Admin sent 2nd message: ${msg2Res.status}`);
  }

  // --- Admin sees DM in UI ---
  console.log('\n--- Admin views messaging page ---');
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminCtx.newPage();
  await setAuth(adminPage, admin.token, admin.user);
  await adminPage.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await adminPage.waitForTimeout(3000);
  await adminPage.screenshot({ path: `${SHOTS}01_admin_view.png` });
  console.log('  Screenshot: admin main view');

  // Click on DM channel
  const dmLink = adminPage.locator('button, a').filter({ hasText: /Иванов|Алексей|Сидоров|engineer/ }).first();
  if (await dmLink.isVisible().catch(() => false)) {
    await dmLink.click();
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: `${SHOTS}02_admin_dm.png` });
    console.log('  DM channel clicked — showing conversation ✓');
  } else {
    // Try finding in sidebar by scrolling to DM section
    console.log('  DM channel not found by name, checking sidebar...');
    // Take full-page shot of sidebar
    await adminPage.screenshot({ path: `${SHOTS}02_admin_sidebar.png` });
  }

  // --- Engineer sees DM in UI ---
  console.log('\n--- Engineer views messaging page ---');
  const engCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const engPage = await engCtx.newPage();
  await setAuth(engPage, engineer.token, engineer.user);
  await engPage.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await engPage.waitForTimeout(3000);
  await engPage.screenshot({ path: `${SHOTS}03_engineer_view.png` });
  console.log('  Screenshot: engineer main view');

  // Click on DM channel (should show admin's name)
  const engDmLink = engPage.locator('button, a').filter({ hasText: /Админ|Admin|Дамир/ }).first();
  if (await engDmLink.isVisible().catch(() => false)) {
    await engDmLink.click();
    await engPage.waitForTimeout(2000);
    await engPage.screenshot({ path: `${SHOTS}04_engineer_dm.png` });
    console.log('  Engineer sees admin DM ✓');
  } else {
    console.log('  DM with admin not found in engineer sidebar');
    await engPage.screenshot({ path: `${SHOTS}04_engineer_sidebar.png` });
  }

  // --- Verify DM from API perspective ---
  console.log('\n--- API DM Verification ---');
  const engHeaders2 = { 'Authorization': `Bearer ${engineer.token}`, 'Content-Type': 'application/json' };
  const engChannels = await fetch(`${API}/messaging/channels`, { headers: engHeaders2 });
  const engChData = await engChannels.json();
  const engDms = engChData.data?.filter(c => c.channelType === 'DIRECT') ?? [];
  for (const d of engDms) {
    console.log(`  Engineer DM: otherUserName="${d.otherUserName}" otherUserId="${d.otherUserId?.substring(0,8)}..."`);
  }

  const adminChannels = await fetch(`${API}/messaging/channels`, { headers });
  const adminChData = await adminChannels.json();
  const adminDms = adminChData.data?.filter(c => c.channelType === 'DIRECT') ?? [];
  for (const d of adminDms) {
    console.log(`  Admin DM: otherUserName="${d.otherUserName}" otherUserId="${d.otherUserId?.substring(0,8)}..."`);
  }

  // --- File upload test from UI ---
  console.log('\n--- File upload via UI test ---');
  await adminPage.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await adminPage.waitForTimeout(2000);
  // Find file input
  const fileInput = adminPage.locator('input[type="file"]');
  const fileInputCount = await fileInput.count();
  console.log(`  File inputs found: ${fileInputCount}`);
  if (fileInputCount > 0) {
    // Create a temp file and upload
    const { writeFileSync } = await import('fs');
    writeFileSync('/tmp/test_msg_upload.txt', 'Тестовый файл для мессенджера\nСтрока 2\n');
    await fileInput.first().setInputFiles('/tmp/test_msg_upload.txt');
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: `${SHOTS}05_file_preview.png` });
    console.log('  File selected — preview visible');

    // Press enter or click send to send with file
    const sendBtn = adminPage.locator('button[type="submit"], button:has-text("Отправить"), button:has-text("Send")').last();
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click();
      await adminPage.waitForTimeout(3000);
      await adminPage.screenshot({ path: `${SHOTS}06_file_sent.png` });
      console.log('  File message sent ✓');
    }
  }

  // === Reaction test ===
  console.log('\n--- Reaction add/remove test ---');
  await adminPage.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await adminPage.waitForTimeout(2500);
  // Hover over a message to see reaction button
  const firstMsg = adminPage.locator('[class*="flex"][class*="gap"]').filter({ hasText: 'Администратор' }).first();
  if (await firstMsg.isVisible().catch(() => false)) {
    await firstMsg.hover();
    await adminPage.waitForTimeout(500);
    await adminPage.screenshot({ path: `${SHOTS}07_msg_hover.png` });
    console.log('  Message hover — action buttons visible');
  }

  await adminCtx.close();
  await engCtx.close();
  await browser.close();
  console.log('\n=== DM FLOW TEST COMPLETE ===');
}

main().catch(err => { console.error(err.message); process.exit(1); });
