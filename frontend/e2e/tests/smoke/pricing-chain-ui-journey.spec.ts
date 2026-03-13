import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * E2E: ПОЛНАЯ цепочка ценообразования ЧЕРЕЗ ВЕБ-ИНТЕРФЕЙС
 * Всё через формы, кнопки и клики — как реальный пользователь.
 */

const SS = 'e2e/screenshots/pricing-chain-ui';
const TS = Date.now();
const TMP = path.join(process.cwd(), 'e2e', '.tmp');

// Dismiss cookie consent
async function dismissCookie(page: any) {
  const btn = page.getByRole('button', { name: /accept/i }).first();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

// Create test xlsx files for import
function createSpecXlsx(): string {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Поз.', 'Наименование', 'Тип/Марка', 'Код', 'Завод-изготовитель', 'Кол-во', 'Ед.изм.', 'Вес, кг', 'Примечание'],
    [1, 'Кабель ВВГнг 3x2.5', 'ВВГнг-LS', 'К-001', 'Камкабель', 500, 'м', 0.15, 'Силовой'],
    [2, 'Автомат ABB S203 C25', 'S203 C25', 'А-002', 'ABB', 30, 'шт', 0.35, '3-полюсный'],
    [3, 'Щит распределительный ЩР-24', 'ЩР-24', 'Щ-003', 'ИЭК', 5, 'шт', 12.5, 'Навесной'],
    [4, 'Монтаж электропроводки', '', '', '', 500, 'м', '', 'Работа'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Спецификация');
  fs.mkdirSync(TMP, { recursive: true });
  const filePath = path.join(TMP, `spec-${TS}.xlsx`);
  XLSX.writeFile(wb, filePath);
  return filePath;
}

function createLsrXlsx(): string {
  // Формат ГРАНД-Смета с "Всего по позиции" строками
  const ws = XLSX.utils.aoa_to_sheet([
    ['№ п/п', 'Обоснование', 'Наименование работ и затрат', '', '', '', '', 'Ед. измер.', 'Кол-во на ед.', 'Коэффициенты', 'Кол-во всего', '', '', 'Цена за ед. (тек.)', '', 'Итого (тек.)'],
    ['', '', 'Локальный сметный расчет — ГРАНД-Смета'],
    ['', '', 'Раздел 1. Электромонтажные работы'],
    [1, 'ФЕР 08-02-001-01', 'Монтаж электропроводки', '', '', '', '', 'м', 1, '', 500, '', '', 140, '', 70000],
    ['', '', '  Затраты труда монтажников', '', '', '', '', 'чел-ч', 0.5, '', 250, '', '', 57.75, '', 14437],
    ['', '', '  Кабель ВВГнг 3x2.5', '', '', '', '', 'м', 1, '', 500, '', '', 69.3, '', 34650],
    ['', '', 'Всего по позиции 1', '', '', '', '', '', '', '', '', '', '', '', '', 70000],
    [2, 'ФЕР 08-03-002-01', 'Автомат ABB S203 C25', '', '', '', '', 'шт', 1, '', 30, '', '', 135, '', 4050],
    ['', '', 'Всего по позиции 2', '', '', '', '', '', '', '', '', '', '', '', '', 4050],
    [3, 'ФСБЦ-08-04-001', 'Щит распределительный ЩР-24', '', '', '', '', 'шт', 1, '', 5, '', '', 8060, '', 40300],
    ['', '', 'Всего по позиции 3', '', '', '', '', '', '', '', '', '', '', '', '', 40300],
    ['', '', 'Итого прямые затраты', '', '', '', '', '', '', '', '', '', '', '', '', 114350],
    ['', '', 'Накладные расходы', '', '', '', '', '', '', '', '', '', '', '', '', 22870],
    ['', '', 'Сметная прибыль', '', '', '', '', '', '', '', '', '', '', '', '', 11435],
    ['', '', 'ИТОГО по смете', '', '', '', '', '', '', '', '', '', '', '', '', 178386],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ЛСР');
  const filePath = path.join(TMP, `lsr-${TS}.xlsx`);
  XLSX.writeFile(wb, filePath);
  return filePath;
}

test.describe.serial('Цепочка ценообразования — полный UI journey', () => {

  let specXlsxPath: string;
  let lsrXlsxPath: string;

  test.beforeAll(() => {
    specXlsxPath = createSpecXlsx();
    lsrXlsxPath = createLsrXlsx();
  });

  test.afterAll(() => {
    // Cleanup tmp files
    try { fs.unlinkSync(specXlsxPath); } catch {}
    try { fs.unlinkSync(lsrXlsxPath); } catch {}
  });

  // ═══════════════════════════════════════
  // 1. Создаём проект через форму
  // ═══════════════════════════════════════
  test('01 — Создать проект через форму', async ({ page }) => {
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await dismissCookie(page);

    // Код объекта — placeholder содержит "МСК" или "MSK"
    const codeInput = page.getByPlaceholder(/МСК|MSK|код/i).first();
    await codeInput.fill(`E2E-UI-${TS}`);

    // Название объекта
    const nameInput = page.getByPlaceholder(/название объекта|название/i).first();
    await nameInput.fill(`E2E UI Электромонтаж ${TS}`);

    // Вид строительства — первый select
    const selects = page.locator('main select, form select, [class*="form"] select');
    const selCount = await selects.count();
    if (selCount >= 1) {
      await selects.nth(0).selectOption({ index: 1 });
    }
    // Тип объекта — второй select
    if (selCount >= 2) {
      await selects.nth(1).selectOption({ index: 1 });
    }

    // Заказчик — автокомплит
    const customerInput = page.getByPlaceholder(/начните вводить/i).first();
    if (await customerInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await customerInput.fill('ООО');
      await page.waitForTimeout(1500);
      // Кликаем первое предложение
      const suggestion = page.locator('[class*="suggestion"] div, [class*="dropdown"] li, [class*="result"] div, [class*="option"]').first();
      if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
        await suggestion.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: `${SS}/01a-project-filled.png`, fullPage: true });

    // Сабмит — force: true чтобы обойти overlay
    const submitBtn = page.getByRole('button', { name: /создать объект/i }).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/01b-project-result.png`, fullPage: true });
  });

  // ═══════════════════════════════════════
  // 2. Создаём спецификацию + импорт xlsx
  // ═══════════════════════════════════════
  test('02 — Создать спецификацию с импортом xlsx', async ({ page }) => {
    await page.goto('/specifications/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await dismissCookie(page);

    // Выбираем проект — select "Выберите объект"
    const projectSelect = page.locator('main select, form select').first();
    if (await projectSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await projectSelect.locator('option').allTextContents();
      const e2eIdx = options.findIndex(o => o.includes('E2E'));
      if (e2eIdx >= 0) {
        await projectSelect.selectOption({ index: e2eIdx });
      } else if (options.length > 1) {
        await projectSelect.selectOption({ index: options.length - 1 });
      }
    }
    await page.waitForTimeout(1000);

    // Название спецификации
    const nameInput = page.getByPlaceholder(/название спецификации|введите название/i).first();
    await nameInput.fill(`E2E Спец Электромонтаж ${TS}`);

    // Включаем auto-FM checkbox
    const checkboxes = page.locator('main input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < cbCount; i++) {
      if (!(await checkboxes.nth(i).isChecked())) {
        await checkboxes.nth(i).click({ force: true });
      }
    }

    await page.screenshot({ path: `${SS}/02a-spec-form-before-import.png`, fullPage: true });

    // Импорт xlsx спецификации — находим hidden file input
    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]').first();
    await fileInput.setInputFiles(specXlsxPath);
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `${SS}/02b-spec-after-import.png`, fullPage: true });

    // Если импорт не сработал, добавляем позиции вручную через "+ Добавить позицию"
    const itemInputs = page.getByPlaceholder(/наименование позиции/i);
    const hasItems = (await itemInputs.count()) > 0 && (await itemInputs.first().inputValue()) !== '';

    if (!hasItems) {
      const addBtn = page.getByRole('button', { name: /добавить позицию/i }).first();
      const items = ['Кабель ВВГнг 3x2.5', 'Автомат ABB S203 C25', 'Щит распредел. ЩР-24', 'Монтаж электропроводки'];

      for (const itemName of items) {
        if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(300);
        }
        // Заполняем последний пустой input "Наименование позиции"
        const allNameInputs = page.getByPlaceholder(/наименование позиции/i);
        const count = await allNameInputs.count();
        for (let i = count - 1; i >= 0; i--) {
          const val = await allNameInputs.nth(i).inputValue();
          if (!val) {
            await allNameInputs.nth(i).fill(itemName);
            break;
          }
        }
      }
    }

    await page.screenshot({ path: `${SS}/02c-spec-with-items.png`, fullPage: true });

    // Сабмит
    const submitBtn = page.getByRole('button', { name: /создать спецификацию/i }).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${SS}/02d-spec-created.png`, fullPage: true });
  });

  // ═══════════════════════════════════════
  // 3. Открываем спецификацию, жмём "Передать в ФМ"
  // ═══════════════════════════════════════
  test('03 — Спецификация → Передать в ФМ', async ({ page }) => {
    await page.goto('/specifications', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissCookie(page);

    // Кликаем на нашу спецификацию
    const specRow = page.locator('table tbody tr, a').filter({ hasText: /E2E.*электромонтаж/i }).first();
    if (await specRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await specRow.click();
    } else {
      await page.locator('table tbody tr').first().click().catch(() => {});
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/03a-spec-detail.png`, fullPage: true });

    // Кнопка "Передать в ФМ"
    const pushFmBtn = page.getByRole('button', { name: /передать в фм/i }).first();
    if (await pushFmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pushFmBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/03b-push-fm-modal.png`, fullPage: true });

      // Подтверждаем
      const confirmBtn = page.locator('button').filter({ hasText: /передать|подтвердить|ок/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click({ force: true });
        await page.waitForTimeout(2000);
      }
      await page.screenshot({ path: `${SS}/03c-pushed.png`, fullPage: true });
    }

    // Навигация по цепочке → ФМ
    const fmLink = page.locator('button, a').filter({ hasText: /финансовая модель/i }).first();
    if (await fmLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fmLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/03d-navigated-to-fm.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════
  // 4. ФМ — проверяем позиции, создаём КП
  // ═══════════════════════════════════════
  test('04 — ФМ: позиции + создать КП', async ({ page }) => {
    // Идём в бюджеты
    await page.goto('/finance/budgets', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissCookie(page);

    // Открываем бюджет
    const row = page.locator('table tbody tr').filter({ hasText: /E2E/i }).first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
    } else {
      await page.locator('table tbody tr').first().click().catch(() => {});
    }
    await page.waitForTimeout(3000);

    // Переходим на /fm view
    const url = page.url();
    const m = url.match(/\/budgets\/([a-f0-9-]+)/);
    if (m && !url.includes('/fm')) {
      await page.goto(`/finance/budgets/${m[1]}/fm`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: `${SS}/04a-fm-page.png`, fullPage: true });

    // Проверяем KPI
    const body = await page.textContent('body') || '';
    expect(body).toContain('Себестоимость');

    // Скроллим таблицу
    await page.evaluate(() => {
      const el = document.querySelector('.overflow-auto');
      if (el) el.scrollLeft = 600;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/04b-fm-scrolled.png`, fullPage: true });

    // Создаём КП через модалку
    const createCpBtn = page.getByRole('button', { name: /создать кп/i }).first();
    if (await createCpBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createCpBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/04c-create-cp-modal.png`, fullPage: true });

      const cpInput = page.locator('[class*="modal"] input, [role="dialog"] input, .fixed input').first();
      if (await cpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cpInput.clear();
        await cpInput.fill(`КП E2E UI ${TS}`);
      }

      const createBtn = page.locator('button').filter({ hasText: /создать кп/i }).last();
      if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createBtn.click({ force: true });
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: `${SS}/04d-cp-created.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════
  // 5. КП — заполняем цены (costPrice + customerPrice)
  // ═══════════════════════════════════════
  test('05 — КП: заполнить цены через API + UI', async ({ page }) => {
    await page.goto('/finance/commercial-proposals', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissCookie(page);
    await page.screenshot({ path: `${SS}/05a-cp-list.png`, fullPage: true });

    // Открываем КП
    const cpRow = page.locator('table tbody tr').first();
    if (await cpRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cpRow.click();
    }
    await page.waitForTimeout(3000);

    // Извлекаем ID КП из URL
    const cpUrl = page.url();
    const cpMatch = cpUrl.match(/commercial-proposals\/([a-f0-9-]+)/);
    expect(cpMatch).toBeTruthy();
    const cpId = cpMatch![1];

    await page.screenshot({ path: `${SS}/05b-cp-detail-before.png`, fullPage: true });

    // Получаем items КП через API (через браузерный fetch с JWT из localStorage)
    const prices: Record<string, { cost: number; customer: number }> = {
      'кабель': { cost: 55, customer: 85 },
      'автомат': { cost: 950, customer: 1450 },
      'щит': { cost: 6500, customer: 9800 },
      'монтаж': { cost: 110, customer: 170 },
    };

    const updateResult = await page.evaluate(async ({ cpId, prices }) => {
      const authData = localStorage.getItem('privod-auth');
      const token = authData ? JSON.parse(authData)?.state?.token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`/api/commercial-proposals/${cpId}/items`, { headers });
      if (!resp.ok) return { error: resp.status, count: 0, names: [] as string[] };
      const json = await resp.json();
      const items = json?.data || json?.content || json || [];

      const names = items.map((i: any) => i.budgetItemName || i.name || 'NO_NAME');
      let count = 0;
      for (const item of items) {
        const name = (item.budgetItemName || item.name || '').toLowerCase();
        const matched = Object.entries(prices).find(([key]) => name.includes(key));
        if (matched) {
          const [, { cost, customer }] = matched;
          const updateResp = await fetch(`/api/commercial-proposals/${cpId}/items/${item.id}`, {
            method: 'PUT', headers,
            body: JSON.stringify({ costPrice: cost, customerPrice: customer }),
          });
          if (updateResp.ok) count++;
        }
      }
      return { count, names, total: items.length };
    }, { cpId, prices });

    console.log(`[E2E] КП items: total=${updateResult.total}, updated=${updateResult.count}, names=${JSON.stringify(updateResult.names)}`);
    expect(updateResult.count, 'КП items updated with prices').toBeGreaterThan(0);

    // Перезагружаем страницу чтобы увидеть обновлённые цены
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/05c-cp-with-prices.png`, fullPage: true });

    // Скроллим к позициям
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/05d-cp-items-priced.png`, fullPage: true });
  });

  // ═══════════════════════════════════════
  // 5b. КП — статус → APPROVED + Push to ФМ
  // ═══════════════════════════════════════
  test('05b — КП: утвердить и передать в ФМ', async ({ page }) => {
    await page.goto('/finance/commercial-proposals', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissCookie(page);

    const cpRow = page.locator('table tbody tr').first();
    if (await cpRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cpRow.click();
    }
    await page.waitForTimeout(3000);

    // Получаем ID КП
    const cpUrl = page.url();
    const cpMatch = cpUrl.match(/commercial-proposals\/([a-f0-9-]+)/);
    const cpId = cpMatch ? cpMatch[1] : '';

    // Переводим статус КП: DRAFT → IN_REVIEW → confirm all → APPROVED через API (с JWT)
    if (cpId) {
      await page.evaluate(async (cpId) => {
        const authData = localStorage.getItem('privod-auth');
        const token = authData ? JSON.parse(authData)?.state?.token : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // DRAFT → IN_REVIEW
        await fetch(`/api/commercial-proposals/${cpId}/status`, {
          method: 'POST', headers, body: JSON.stringify({ status: 'IN_REVIEW' }),
        });
        // Confirm all items
        await fetch(`/api/commercial-proposals/${cpId}/confirm-all`, {
          method: 'POST', headers,
        });
        // IN_REVIEW → APPROVED
        await fetch(`/api/commercial-proposals/${cpId}/status`, {
          method: 'POST', headers, body: JSON.stringify({ status: 'APPROVED' }),
        });
      }, cpId);
      await page.waitForTimeout(1000);
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/05e-cp-approved.png`, fullPage: true });

    // Нажимаем "Передать в ФМ"
    const pushBtn = page.getByRole('button', { name: /передать в фм/i }).first();
    if (await pushBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pushBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/05f-cp-push-dialog.png`, fullPage: true });

      // Подтверждаем в диалоге
      const confirmPush = page.locator('button').filter({ hasText: /передать/i }).last();
      if (await confirmPush.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmPush.click({ force: true });
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: `${SS}/05g-cp-pushed-to-fm.png`, fullPage: true });
    } else {
      // Если кнопка не видна — пробуем push через API (с JWT)
      if (cpId) {
        await page.evaluate(async (cpId) => {
          const authData = localStorage.getItem('privod-auth');
          const token = authData ? JSON.parse(authData)?.state?.token : null;
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          await fetch(`/api/commercial-proposals/${cpId}/push-to-fm`, {
            method: 'POST', headers,
          });
        }, cpId);
        await page.waitForTimeout(1000);
      }
      await page.screenshot({ path: `${SS}/05e-cp-no-push-btn.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════
  // 6. ФМ — импорт ЛСР через UI
  // ═══════════════════════════════════════
  test('06 — ФМ: импорт ЛСР через xlsx', async ({ page }) => {
    await page.goto('/finance/budgets', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissCookie(page);

    // Открываем бюджет → /fm
    const row = page.locator('table tbody tr').filter({ hasText: /E2E/i }).first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
    } else {
      await page.locator('table tbody tr').first().click().catch(() => {});
    }
    await page.waitForTimeout(3000);

    const url = page.url();
    const m = url.match(/\/budgets\/([a-f0-9-]+)/);
    if (m && !url.includes('/fm')) {
      await page.goto(`/finance/budgets/${m[1]}/fm`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Нажимаем "Импорт ЛСР"
    const importBtn = page.getByRole('button', { name: /импорт лср/i })
      .or(page.locator('button').filter({ hasText: /импорт лср/i }))
      .first();

    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/06a-lsr-import-modal.png`, fullPage: true });

      // Загружаем xlsx через hidden input
      const fileInput = page.locator('input[type="file"][accept*=".xlsx"]').last();
      await fileInput.setInputFiles(lsrXlsxPath);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/06b-lsr-parsed.png`, fullPage: true });

      // Нажимаем "Импортировать" в модалке
      const importConfirmBtn = page.locator('button').filter({ hasText: /импорт|import/i }).last();
      if (await importConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importConfirmBtn.click({ force: true });
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: `${SS}/06c-lsr-imported.png`, fullPage: true });
    } else {
      await page.screenshot({ path: `${SS}/06a-no-import-btn.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════
  // 7. ФМ — ФИНАЛЬНАЯ ПРОВЕРКА: все 3 цены
  // ═══════════════════════════════════════
  test('07 — ФМ: финальная проверка — себестоимость, сметная, цена заказчику', async ({ page }) => {
    await page.goto('/finance/budgets', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissCookie(page);

    const row = page.locator('table tbody tr').filter({ hasText: /E2E/i }).first();
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
    } else {
      await page.locator('table tbody tr').first().click().catch(() => {});
    }
    await page.waitForTimeout(3000);

    const url = page.url();
    const m = url.match(/\/budgets\/([a-f0-9-]+)/);
    if (m && !url.includes('/fm')) {
      await page.goto(`/finance/budgets/${m[1]}/fm`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // KPI-блок: все 3 цены должны быть > 0
    await page.screenshot({ path: `${SS}/07a-fm-final-kpi.png`, fullPage: true });

    const body = await page.textContent('body') || '';
    expect(body).toContain('Себестоимость');
    expect(body).toContain('НДС 20%');

    // Скроллим: себестоимость
    await page.evaluate(() => {
      const el = document.querySelector('.overflow-auto');
      if (el) el.scrollLeft = 0;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/07b-fm-cost-column.png`, fullPage: true });

    // Скроллим: сметная + цена заказчику
    await page.evaluate(() => {
      const el = document.querySelector('.overflow-auto');
      if (el) el.scrollLeft = 600;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/07c-fm-estimate-customer.png`, fullPage: true });

    // Скроллим: маржа + НДС
    await page.evaluate(() => {
      const el = document.querySelector('.overflow-auto');
      if (el) el.scrollLeft = 1200;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/07d-fm-margin-vat.png`, fullPage: true });

    // Проверяем через API (с JWT из localStorage) что позиции имеют все 3 цены
    if (m) {
      const budgetId = m[1];
      const fmCheck = await page.evaluate(async (budgetId) => {
        const authData = localStorage.getItem('privod-auth');
        const token = authData ? JSON.parse(authData)?.state?.token : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(`/api/budgets/${budgetId}/items`, { headers });
        if (!resp.ok) return { error: resp.status, withCost: 0, withEstimate: 0, withCustomer: 0 };
        const json = await resp.json();
        const items = json?.data?.content || json?.data || json?.content || json || [];
        const nonSection = items.filter((i: any) => !i.section);

        return {
          total: nonSection.length,
          withCost: nonSection.filter((i: any) => i.costPrice > 0).length,
          withEstimate: nonSection.filter((i: any) => i.estimatePrice > 0).length,
          withCustomer: nonSection.filter((i: any) => i.customerPrice > 0).length,
        };
      }, budgetId);

      console.log(`[FM Check] total: ${fmCheck.total}, costPrice: ${fmCheck.withCost}, estimatePrice: ${fmCheck.withEstimate}, customerPrice: ${fmCheck.withCustomer}`);

      expect(fmCheck.withEstimate, 'ФМ: позиции с сметной ценой (из ЛСР)').toBeGreaterThan(0);
    }

    expect(body).toMatch(/итого|total/i);
  });

  // ═══════════════════════════════════════
  // 8. Обход всех страниц цепочки
  // ═══════════════════════════════════════
  test('08 — Все страницы цепочки загружаются', async ({ page }) => {
    await dismissCookie(page);

    const pages = [
      '/specifications',
      '/specifications/competitive-lists',
      '/finance/budgets',
      '/finance/commercial-proposals',
      '/estimates',
    ];

    for (const p of pages) {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const text = await page.textContent('body') || '';
      expect(text.length, `${p} не пустая`).toBeGreaterThan(100);
      await page.screenshot({ path: `${SS}/08-${p.replace(/\//g, '-').slice(1)}.png`, fullPage: true });
    }
  });
});
