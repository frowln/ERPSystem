import { chromium } from "@playwright/test";

const token = process.env.TOKEN;
const user = {
  id: "61130180-7545-4272-b172-82c9125bb31c",
  email: "admin@privod.com",
  firstName: "Admin",
  lastName: "Admin",
  fullName: "Admin Admin",
  enabled: true,
  roles: ["ADMIN"],
  role: "ADMIN",
};

const routes = [
  "/",
  "/projects",
  "/analytics",
  "/procurement",
  "/warehouse/stock",
  "/warehouse/movements",
  "/operations/work-orders",
  "/quality",
  "/quality/inspections",
  "/tasks",
  "/invoices",
  "/payments",
];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((payload) => {
  localStorage.setItem("privod-auth", JSON.stringify({ state: payload, version: 0 }));
  localStorage.setItem("privod_locale", "ru");
}, { user, token, refreshToken: "", isAuthenticated: true });

const page = await context.newPage();

for (const route of routes) {
  const networkErrors = [];
  const responseHandler = async (response) => {
    const status = response.status();
    if (status < 400 || !response.url().includes("/api/")) return;
    const req = response.request();
    networkErrors.push({
      method: req.method(),
      status,
      url: response.url().replace("http://localhost:3000", ""),
    });
  };

  page.on("response", responseHandler);
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  page.off("response", responseHandler);

  const grouped = new Map();
  for (const err of networkErrors) {
    const key = `${err.method} ${err.status} ${err.url}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  console.log(`ROUTE ${route}`);
  if (grouped.size === 0) {
    console.log("  no_api_errors");
  } else {
    for (const [key, count] of grouped.entries()) {
      console.log(`  ${count}x ${key}`);
    }
  }
}

await browser.close();
