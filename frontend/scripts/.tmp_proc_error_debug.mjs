import { chromium } from '@playwright/test';
const token = process.env.TOKEN;
const user = { id: '61130180-7545-4272-b172-82c9125bb31c', email: 'admin@privod.com', firstName: 'Admin', lastName: 'Admin', fullName: 'Admin Admin', enabled: true, roles: ['ADMIN'], role: 'ADMIN' };
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((payload) => { localStorage.setItem('privod-auth', JSON.stringify({ state: payload, version: 0 })); localStorage.setItem('privod_locale', 'ru'); }, { user, token, refreshToken: '', isAuthenticated: true });
const page = await context.newPage();
page.on('pageerror', (error) => console.log('PAGE_ERROR', error.message));
page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE_ERROR', msg.text()); });
page.on('response', async (res) => {
  if (res.status() >= 400 && res.url().includes('/api/')) {
    console.log('API_ERROR', res.status(), res.url().replace('http://localhost:3000', ''));
  }
});
await page.goto('http://localhost:3000/procurement', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
console.log('TEXT', (await page.locator('body').innerText()).slice(0, 300).replace(/\n/g, ' | '));
await browser.close();
