import { chromium } from '@playwright/test';

const token = process.env.TOKEN;
const route = process.env.ROUTE || '/';
const screenshotName = process.env.SCREENSHOT_NAME || 'route-check.png';

if (!token) {
  // eslint-disable-next-line no-console
  console.error('TOKEN env var is required');
  process.exit(1);
}

const user = {
  id: '61130180-7545-4272-b172-82c9125bb31c',
  email: 'admin@privod.com',
  firstName: 'Admin',
  lastName: 'Admin',
  fullName: 'Admin Admin',
  enabled: true,
  roles: ['ADMIN'],
  role: 'ADMIN',
};

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

await context.addInitScript((payload) => {
  localStorage.setItem('privod-auth', JSON.stringify({ state: payload, version: 0 }));
}, { user, token, refreshToken: '', isAuthenticated: true });

const page = await context.newPage();
const errors = [];

page.on('response', async (response) => {
  if (response.status() < 400 || !response.url().includes('/api/')) return;
  let body = '';
  try {
    body = (await response.text()).slice(0, 200).replace(/\n/g, ' ');
  } catch {
    body = '';
  }
  errors.push({
    status: response.status(),
    url: response.url().replace('http://localhost:3000', ''),
    body,
  });
});

await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

await page.screenshot({
  path: `/app/ui_audit/runtime_screenshots_2026-02-16/${screenshotName}`,
  fullPage: true,
});

const text = (await page.locator('body').innerText()).slice(0, 1000).replace(/\n/g, ' | ');

// eslint-disable-next-line no-console
console.log(`ROUTE ${route}`);
// eslint-disable-next-line no-console
console.log(`TEXT ${text}`);
// eslint-disable-next-line no-console
console.log(`ERRORS ${JSON.stringify(errors, null, 2)}`);

await browser.close();
