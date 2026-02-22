import { chromium } from '@playwright/test';

const token = process.env.TOKEN;

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

const routes = [
  '/',
  '/projects',
  '/procurement',
  '/cash-flow',
  '/quality/inspections',
  '/warehouse/stock',
  '/analytics',
];

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

for (const route of routes) {
  const errors = [];

  page.removeAllListeners('response');
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status < 400 || !url.includes('/api/')) return;

    let body = '';
    try {
      body = (await response.text()).slice(0, 220).replace(/\n/g, ' ');
    } catch {
      body = '';
    }

    errors.push({
      status,
      url: url.replace('http://localhost:3000', ''),
      body,
    });
  });

  try {
    await page.goto(`http://localhost:3000${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(4000);
  } catch {
    errors.push({
      status: 0,
      url: route,
      body: 'route navigation timeout',
    });
  }

  // eslint-disable-next-line no-console
  console.log(`ROUTE ${route}`);
  if (errors.length === 0) {
    // eslint-disable-next-line no-console
    console.log('  no_api_errors');
  } else {
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.log(`  ${error.status} ${error.url} :: ${error.body}`);
    }
  }
}

await browser.close();
