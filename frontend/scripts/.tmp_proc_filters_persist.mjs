import { chromium } from '@playwright/test';

const token = process.env.TOKEN;
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

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((payload) => {
  localStorage.setItem('privod-auth', JSON.stringify({ state: payload, version: 0 }));
  localStorage.setItem('privod_locale', 'ru');
}, { user, token, refreshToken: '', isAuthenticated: true });

const page = await context.newPage();
await page.goto('http://localhost:3000/procurement', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

const input = page.locator('input[placeholder*="name, project"], input[placeholder*="названию, проекту"]').first();
await input.fill('test persist');
await page.waitForTimeout(600);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const inputAfterReload = page.locator('input[placeholder*="name, project"], input[placeholder*="названию, проекту"]').first();
const value = await inputAfterReload.inputValue();
console.log('SEARCH_VALUE', value);

await browser.close();
