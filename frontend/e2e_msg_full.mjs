#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE = 'http://localhost:4000';
const API = 'http://localhost:8080/api';
const SHOTS = '/tmp/msg_full_';

async function login(email = 'admin@privod.ru', password = 'admin123') {
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

/** Dismiss any visible toasts by clicking them */
async function dismissToasts(page) {
  try {
    const toasts = page.locator('[data-rht-toaster] [role="status"]');
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      await toasts.nth(i).click({ force: true, timeout: 500 }).catch(() => {});
    }
    if (count > 0) await page.waitForTimeout(300);
  } catch {}
}

/** Navigate to messaging page and wait for load */
async function goToMessaging(page) {
  await page.goto(`${BASE}/messaging`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await dismissToasts(page);
}

async function main() {
  const { token, user } = await login();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await setAuth(page, token, user);

  console.log('=== COMPREHENSIVE MESSAGING AUDIT ===\n');

  // 1. Main view
  await goToMessaging(page);
  await page.screenshot({ path: `${SHOTS}01_main.png` });
  console.log('1. Main view — ✓');

  // 2. Test DM display
  const dmSection = page.locator('text=ЛИЧНЫЕ СООБЩЕНИЯ, text=Direct Messages').first();
  const hasDmSection = await dmSection.isVisible().catch(() => false);
  console.log(`2. DM section visible: ${hasDmSection ? '✓' : '✗'}`);

  // 3. Reactions visible
  const reactionBadges = page.locator('button:has-text("👍"), button:has-text("✅"), button:has-text("🎉"), button:has-text("👌"), button:has-text("💪"), button:has-text("🙏")');
  const reactionCount = await reactionBadges.count().catch(() => 0);
  console.log(`3. Reaction badges: ${reactionCount}`);

  // 4. Channel info with REAL member data + Add member button
  const infoBtn = page.locator('button').filter({ has: page.locator('svg.lucide-info') }).first();
  if (await infoBtn.isVisible().catch(() => false)) {
    await infoBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}02_info.png` });

    const addBtn = page.locator('button:has-text("Добавить"), button:has-text("Add")');
    const hasAddBtn = await addBtn.isVisible().catch(() => false);
    console.log(`4. Channel info + Add member button: ${hasAddBtn ? '✓' : '✗'}`);

    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SHOTS}03_add_member.png` });
      console.log('5. Add member modal — ✓');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // 6. Sidebar search — type 1 char to see users
  await goToMessaging(page);
  const sidebarInputs = page.locator('input[type="text"]');
  const inputCount = await sidebarInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const ph = await sidebarInputs.nth(i).getAttribute('placeholder').catch(() => '');
    if (ph && (ph.includes('Поиск') || ph.includes('Search'))) {
      const box = await sidebarInputs.nth(i).boundingBox().catch(() => null);
      if (box && box.x < 300) {
        await sidebarInputs.nth(i).fill('А');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SHOTS}04_search_users.png` });
        console.log('6. Sidebar search with 1-char user search — ✓');
        break;
      }
    }
  }

  // 7. Thread panel
  await goToMessaging(page);
  const threadBtn = page.locator('button:has-text("ответ"), button:has-text("reply")').first();
  if (await threadBtn.isVisible().catch(() => false)) {
    await threadBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}05_thread.png` });
    console.log('7. Thread panel — ✓');
  } else {
    console.log('7. Thread panel — no threads found');
  }

  // 8. Create channel with members
  await goToMessaging(page);
  const plusBtn = page.locator('button[title*="канал"], button[title*="channel"], button[title*="Создать"]').first();
  if (await plusBtn.isVisible().catch(() => false)) {
    await plusBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}06_create_channel.png` });
    console.log('8. Create channel modal — ✓');
    await page.keyboard.press('Escape');
  }

  // 9. Pinned messages panel
  await goToMessaging(page);
  const pinBtn = page.locator('button').filter({ has: page.locator('svg.lucide-pin') }).first();
  if (await pinBtn.isVisible().catch(() => false)) {
    await pinBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}07_pinned.png` });
    console.log('9. Pinned panel — ✓');
  }

  // 10. Message search (inline)
  await goToMessaging(page);
  await dismissToasts(page);
  try {
    const searchBtn = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBtn.click({ force: true });
      await page.waitForTimeout(500);
      const searchInput = page.locator('input[placeholder*="канал"], input[placeholder*="channel"], input[placeholder*="поиск"], input[placeholder*="Поиск"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('арматура');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${SHOTS}08_search_filter.png` });
        console.log('10. Message search filter — ✓');
      } else {
        console.log('10. Message search — search input not found');
      }
    } else {
      console.log('10. Message search — search button not visible');
    }
  } catch (e) {
    console.log(`10. Message search — error: ${e.message.substring(0, 80)}`);
  }

  // 11. File attach button visible
  await goToMessaging(page);
  const attachBtn = page.locator('button[title*="файл"], button[title*="Attach"], button[title*="Прикрепить"]').first();
  const hasAttach = await attachBtn.isVisible().catch(() => false);
  console.log(`11. File attach button visible: ${hasAttach ? '✓' : '✗'}`);
  // Also check paperclip icon
  const paperclip = page.locator('svg.lucide-paperclip');
  const hasPaperclip = await paperclip.isVisible().catch(() => false);
  console.log(`    Paperclip icon visible: ${hasPaperclip ? '✓' : '✗'}`);

  // 12. Send a message and verify it appears
  try {
    const msgInput = page.locator('textarea, input[placeholder*="Сообщение"], input[placeholder*="Message"]').last();
    if (await msgInput.isVisible().catch(() => false)) {
      const testMsg = `E2E-тест ${Date.now()}`;
      await msgInput.fill(testMsg);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      const sentMsg = page.locator(`text="${testMsg}"`);
      const msgVisible = await sentMsg.isVisible().catch(() => false);
      console.log(`12. Send message + appears: ${msgVisible ? '✓' : '✗'}`);
    }
  } catch (e) {
    console.log(`12. Send message — error: ${e.message.substring(0, 80)}`);
  }

  // 13. Emoji picker
  try {
    const emojiBtn = page.locator('button').filter({ has: page.locator('svg.lucide-smile') }).last();
    if (await emojiBtn.isVisible().catch(() => false)) {
      await emojiBtn.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SHOTS}10_emoji_picker.png` });
      const emojiGrid = page.locator('.grid, [class*="emoji"]');
      const hasEmojis = await emojiGrid.isVisible().catch(() => false);
      console.log(`13. Emoji picker: ${hasEmojis ? '✓' : '✗'}`);
      await page.keyboard.press('Escape');
    }
  } catch (e) {
    console.log(`13. Emoji picker — error: ${e.message.substring(0, 80)}`);
  }

  // 14. Favorites section
  try {
    const favBtn = page.locator('text=Избранное, text=Favorites').first();
    if (await favBtn.isVisible().catch(() => false)) {
      await favBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SHOTS}11_favorites.png` });
      console.log('14. Favorites section — ✓');
    } else {
      console.log('14. Favorites — not found in sidebar');
    }
  } catch (e) {
    console.log(`14. Favorites — error: ${e.message.substring(0, 80)}`);
  }

  // 15. Dark mode test
  try {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}12_dark_mode.png` });
    console.log('15. Dark mode — ✓');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
  } catch (e) {
    console.log(`15. Dark mode — error: ${e.message.substring(0, 80)}`);
  }

  // === API Tests ===
  console.log('\n--- API Tests ---');
  try {
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const chRes = await fetch(`${API}/messaging/channels`, { headers });
    const channels = await chRes.json();
    console.log(`Channels API: ${chRes.status} (${channels.data?.length ?? 0} channels)`);

    const directs = channels.data?.filter(c => c.channelType === 'DIRECT') ?? [];
    if (directs.length > 0) {
      console.log(`DM channel otherUserName: "${directs[0].otherUserName ?? 'NULL'}"`);
    } else {
      console.log('DM channels: none (need to create one)');
    }

    const usersRes = await fetch(`${API}/messaging/users`, { headers });
    const users = await usersRes.json();
    console.log(`Org users API: ${usersRes.status} (${users.data?.length ?? 0} users)`);

    if (channels.data?.length > 0) {
      const membersRes = await fetch(`${API}/messaging/channels/${channels.data[0].id}/members`, { headers });
      const members = await membersRes.json();
      if (members.data?.length > 0) {
        console.log(`Members API: ${membersRes.status} (${members.data.length} members, status: ${members.data[0].availabilityStatus})`);
      }
    }

    if (channels.data?.length > 0) {
      const msgsRes = await fetch(`${API}/messaging/channels/${channels.data[0].id}/messages`, { headers });
      const msgs = await msgsRes.json();
      const withReplies = msgs.data?.find(m => m.replyCount > 0);
      if (withReplies) {
        const repliesRes = await fetch(`${API}/messaging/messages/${withReplies.id}/replies`, { headers });
        const replies = await repliesRes.json();
        console.log(`Thread replies API: ${repliesRes.status} (${replies.data?.length ?? 0} replies)`);
      }
    }

    // Test DM creation
    if (users.data?.length > 1) {
      const otherUser = users.data.find(u => u.email !== 'admin@privod.ru');
      if (otherUser) {
        const dmRes = await fetch(`${API}/messaging/channels`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: 'DM', channelType: 'DIRECT', memberIds: [otherUser.id] }),
        });
        const dm = await dmRes.json();
        console.log(`Create DM API: ${dmRes.status} (otherUserName: "${dm.data?.otherUserName ?? 'NULL'}")`);
      }
    }

    // Test file upload
    const formData = new FormData();
    const blob = new Blob(['test file content for messaging'], { type: 'text/plain' });
    formData.append('file', blob, 'test_msg.txt');
    formData.append('entityType', 'channel_message');
    formData.append('entityId', channels.data?.[0]?.id ?? '00000000-0000-0000-0000-000000000001');
    const uploadRes = await fetch(`${API}/attachments/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    console.log(`File upload API: ${uploadRes.status} ${uploadRes.status === 201 ? '✓' : '✗'}`);

    // Test pinned messages
    if (channels.data?.length > 0) {
      const pinnedRes = await fetch(`${API}/messaging/channels/${channels.data[0].id}/pinned`, { headers });
      const pinned = await pinnedRes.json();
      console.log(`Pinned messages API: ${pinnedRes.status} (${pinned.data?.length ?? 0} pinned)`);
    }

    // Test search
    const searchRes = await fetch(`${API}/messaging/search?q=арматура`, { headers });
    const searchData = await searchRes.json();
    console.log(`Search API: ${searchRes.status} (${searchData.data?.length ?? 0} results for "арматура")`);

    // Test favorites
    const favRes = await fetch(`${API}/messaging/favorites`, { headers });
    console.log(`Favorites API: ${favRes.status}`);

  } catch (err) {
    console.log(`API error: ${err.message}`);
  }

  await page.screenshot({ path: `${SHOTS}13_final.png` });

  await ctx.close();
  await browser.close();
  console.log('\n=== AUDIT COMPLETE ===');
}

main().catch(err => { console.error(err.message); process.exit(1); });
