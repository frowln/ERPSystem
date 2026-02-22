import { chromium } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const baseURL = process.env.BASE_URL || 'http://localhost:13000';
const runDate = new Date().toISOString().slice(0, 10);
const outputDir = path.resolve('/app/ui_audit', `runtime_screenshots_${runDate}`);

const roles = [
  {
    id: 'director',
    user: {
      id: 'u-dir-1',
      email: 'director@privod.ru',
      firstName: 'Генеральный',
      lastName: 'Директор',
      role: 'ADMIN',
      roles: ['ADMIN', 'MANAGER'],
    },
    routes: ['/', '/projects', '/analytics', '/payments', '/reports'],
  },
  {
    id: 'pto',
    user: {
      id: 'u-pto-1',
      email: 'pto@privod.ru',
      firstName: 'Инженер',
      lastName: 'ПТО',
      role: 'ENGINEER',
      roles: ['ENGINEER', 'DOCUMENT_CONTROLLER'],
    },
    routes: ['/projects', '/contracts', '/pto/documents', '/russian-docs/ks2', '/pto/ks6-calendar'],
  },
  {
    id: 'supply',
    user: {
      id: 'u-supply-1',
      email: 'supply@privod.ru',
      firstName: 'Менеджер',
      lastName: 'Снабжения',
      role: 'SUPPLY_MANAGER',
      roles: ['SUPPLY_MANAGER', 'WAREHOUSE_MANAGER'],
    },
    routes: ['/procurement', '/warehouse/stock', '/warehouse/movements', '/dispatch/orders', '/warehouse/stock-alerts'],
  },
  {
    id: 'foreman',
    user: {
      id: 'u-foreman-1',
      email: 'foreman@privod.ru',
      firstName: 'Прораб',
      lastName: 'Старший',
      role: 'FOREMAN',
      roles: ['FOREMAN'],
    },
    routes: ['/tasks', '/operations/daily-logs', '/operations/work-orders', '/mobile/reports/new', '/quality/inspections'],
  },
  {
    id: 'accountant',
    user: {
      id: 'u-acc-1',
      email: 'accounting@privod.ru',
      firstName: 'Главный',
      lastName: 'Бухгалтер',
      role: 'ACCOUNTANT',
      roles: ['ACCOUNTANT', 'FINANCE_MANAGER'],
    },
    routes: ['/invoices', '/payments', '/cash-flow', '/accounting/journal', '/revenue/dashboard'],
  },
];

const safeName = (value) => value.replace(/[^a-zA-Z0-9-_/.]/g, '_').replace(/\//g, '__');

async function captureLogin(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(outputDir, 'public-login-desktop-1440.png'),
    fullPage: true,
  });
  await context.close();
}

async function captureRoleRoutes(browser, roleConfig) {
  const authState = {
    user: roleConfig.user,
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIiwiZXhwIjo0MDc5OTk5OTk5fQ.sig',
    refreshToken: 'demo-refresh-token',
    isAuthenticated: true,
  };

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript((state) => {
    localStorage.setItem('privod-auth', JSON.stringify({ state, version: 0 }));
    localStorage.setItem('privod-locale', 'ru');
    localStorage.setItem('privod-lang', 'ru');
  }, authState);

  const page = await context.newPage();
  page.on('pageerror', (error) => {
    // eslint-disable-next-line no-console
    console.error(`pageerror [${roleConfig.id}]: ${error.message}`);
  });

  for (const routePath of roleConfig.routes) {
    const routeLabel = safeName(routePath === '/' ? 'dashboard' : routePath.slice(1));
    const fileName = `${roleConfig.id}-${routeLabel}-desktop-1440.png`;
    const target = `${baseURL}${routePath}`;
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(outputDir, fileName),
        fullPage: true,
      });
      // eslint-disable-next-line no-console
      console.log(`saved: ${fileName}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`failed: ${fileName} (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  await context.close();
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const fallbackPaths = [
    '/usr/bin/chromium',
    '/root/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
  ];
  let executablePath;
  try {
    for (const candidate of fallbackPaths) {
      try {
        await fs.access(candidate);
        executablePath = candidate;
        break;
      } catch {
        // try next fallback
      }
    }
  } catch {
    // no-op
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  await captureLogin(browser);
  for (const role of roles) {
    await captureRoleRoutes(browser, role);
  }

  await browser.close();

  // eslint-disable-next-line no-console
  console.log(`screenshots_dir=${outputDir}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
