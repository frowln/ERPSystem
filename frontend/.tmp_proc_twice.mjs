import { chromium } from "@playwright/test";
const token = process.env.TOKEN;
const user = { id: "61130180-7545-4272-b172-82c9125bb31c", email: "admin@privod.com", firstName: "Admin", lastName: "Admin", fullName: "Admin Admin", enabled: true, roles: ["ADMIN"], role: "ADMIN" };
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((payload) => {
  localStorage.setItem("privod-auth", JSON.stringify({ state: payload, version: 0 }));
  localStorage.setItem("privod_locale", "ru");
}, { user, token, refreshToken: "", isAuthenticated: true });
const page = await context.newPage();

for (const route of ["/procurement", "/projects", "/procurement"]) {
  const errs = [];
  const onResp = (r) => {
    if (r.url().includes(/api/) && r.status() >= 400) errs.push(`${r.request().method()} ${r.status()} ${r.url().replace("http://localhost:3000", "")}`);
  };
  page.on(response, onResp);
  await page.goto(`http://localhost:3000${route}`, { waitUntil: domcontentloaded, timeout: 60000 });
  await page.waitForTimeout(2500);
  page.off(response, onResp);
  console.log(`ROUTE ${route}`);
  if (errs.length) {
    for (const err of errs) console.log(`  ${err}`);
  } else {
    console.log(