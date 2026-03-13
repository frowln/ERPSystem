# Improvements Report

> Generated: 2026-03-12T18:21:36.117Z
> Suite: 406 tests in 4400.3s

## [CRITICAL] Failed Tests

25 test(s) failed:

### ❌ /admin/permissions — матрица прав
- **File:** `e2e/tests/smoke/admin.smoke.spec.ts`
- **Module:** admin
- **Duration:** 13249ms
- **Error:**
```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('table, [class*="grid"], [class*="matrix"], [class*="permission"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 10000ms[22m
[2m  - waiting for locator('table, [class*="grid"], [class*="matrix"], [class*="permission"]').first()[22m

```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-admin.smoke-Ad-76661--permissions-—-матрица-прав-chromium/test-failed-1.png

### ❌ /ai/photo-analysis — ИИ фотоанализ
- **File:** `e2e/tests/smoke/ai.smoke.spec.ts`
- **Module:** users
- **Duration:** 2859ms
- **Error:**
```
Error: Photo analysis should have upload area or results

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-ai.smoke-AI-—--02408-to-analysis-—-ИИ-фотоанализ-chromium/test-failed-1.png

### ❌ /bim/drawing-overlay — наложение чертежей
- **File:** `e2e/tests/smoke/bim.smoke.spec.ts`
- **Module:** bim
- **Duration:** 11674ms
- **Error:**
```
Error: /bim/drawing-overlay should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m11511[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-bim.smoke-BIM--a84ad-verlay-—-наложение-чертежей-chromium/test-failed-1.png

### ❌ /calendar — календарь
- **File:** `e2e/tests/smoke/calendar.smoke.spec.ts`
- **Module:** calendar
- **Duration:** 2414ms
- **Error:**
```
Error: locator.count: Unexpected token "/" while parsing css selector "button:has-text(/[<>←→◀▶]/), button:has-text(/prev|next|назад|вперёд/i)". Did you mean to CSS.escape it?
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-calendar.smoke-e2db5--Smoke-calendar-—-календарь-chromium/test-failed-1.png

### ❌ /cde/transmittals — трансмиттальные пакеты
- **File:** `e2e/tests/smoke/cde.smoke.spec.ts`
- **Module:** cde
- **Duration:** 5230ms
- **Error:**
```
Error: /cde/transmittals should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5028[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-cde.smoke-CDE--256a2-ls-—-трансмиттальные-пакеты-chromium/test-failed-1.png

### ❌ /closeout/handover — передача объекта
- **File:** `e2e/tests/smoke/closeout.smoke.spec.ts`
- **Module:** closeout
- **Duration:** 7371ms
- **Error:**
```
Error: /closeout/handover should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7181[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-closeout.smoke-fb195-handover-—-передача-объекта-chromium/test-failed-1.png

### ❌ /closeout/warranty — гарантия
- **File:** `e2e/tests/smoke/closeout.smoke.spec.ts`
- **Module:** closeout
- **Duration:** 5300ms
- **Error:**
```
Error: /closeout/warranty should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5105[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-closeout.smoke-a72f5-loseout-warranty-—-гарантия-chromium/test-failed-1.png

### ❌ /closeout/warranty-obligations — гарантийные обязательства
- **File:** `e2e/tests/smoke/closeout.smoke.spec.ts`
- **Module:** closeout
- **Duration:** 7988ms
- **Error:**
```
Error: /closeout/warranty-obligations should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7767[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-closeout.smoke-fc519-—-гарантийные-обязательства-chromium/test-failed-1.png

### ❌ /closeout/warranty-tracking — отслеживание гарантий
- **File:** `e2e/tests/smoke/closeout.smoke.spec.ts`
- **Module:** closeout
- **Duration:** 7387ms
- **Error:**
```
Error: /closeout/warranty-tracking should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7167[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-closeout.smoke-2b329-ing-—-отслеживание-гарантий-chromium/test-failed-1.png

### ❌ /closeout/executive-schemas — исполнительные схемы
- **File:** `e2e/tests/smoke/closeout.smoke.spec.ts`
- **Module:** closeout
- **Duration:** 6993ms
- **Error:**
```
Error: /closeout/executive-schemas should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6814[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-closeout.smoke-ef7b6-emas-—-исполнительные-схемы-chromium/test-failed-1.png

### ❌ /russian-docs/ks3 — справки КС-3
- **File:** `e2e/tests/smoke/closing.smoke.spec.ts`
- **Module:** users
- **Duration:** 7799ms
- **Error:**
```
Error: /russian-docs/ks3 should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7632[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-closing.smoke--a467d-ian-docs-ks3-—-справки-КС-3-chromium/test-failed-1.png

### ❌ /cost-management/cashflow-forecast — прогноз ДДС
- **File:** `e2e/tests/smoke/cost-management.smoke.spec.ts`
- **Module:** cost-management
- **Duration:** 9240ms
- **Error:**
```
Error: /cost-management/cashflow-forecast should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m9039[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-cost-managemen-27493-flow-forecast-—-прогноз-ДДС-chromium/test-failed-1.png

### ❌ /cost-management/profitability — рентабельность
- **File:** `e2e/tests/smoke/cost-management.smoke.spec.ts`
- **Module:** cost-management
- **Duration:** 8709ms
- **Error:**
```
Error: /cost-management/profitability should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m8538[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-cost-managemen-66407-fitability-—-рентабельность-chromium/test-failed-1.png

### ❌ /operations/daily-logs — журнал ежедневных работ
- **File:** `e2e/tests/smoke/daily-logs.smoke.spec.ts`
- **Module:** daily-logs
- **Duration:** 10173ms
- **Error:**
```
Error: /operations/daily-logs should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5761[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-daily-logs.smo-8d7fa-s-—-журнал-ежедневных-работ-chromium/test-failed-1.png

### ❌ /estimates/minstroy — индексы Минстроя
- **File:** `e2e/tests/smoke/estimates.smoke.spec.ts`
- **Module:** estimates
- **Duration:** 61678ms
- **Error:**
```
Error: /estimates/minstroy should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60283[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-estimates.smok-b1f8b-minstroy-—-индексы-Минстроя-chromium/test-failed-1.png

### ❌ /estimates/pivot — сводная таблица анализа
- **File:** `e2e/tests/smoke/estimates.smoke.spec.ts`
- **Module:** estimates
- **Duration:** 61705ms
- **Error:**
```
Error: /estimates/pivot should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60280[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-estimates.smok-9611e-t-—-сводная-таблица-анализа-chromium/test-failed-1.png

### ❌ /estimates/volume-calculator — калькулятор объёмов
- **File:** `e2e/tests/smoke/estimates.smoke.spec.ts`
- **Module:** estimates
- **Duration:** 61699ms
- **Error:**
```
Error: /estimates/volume-calculator should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60271[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-estimates.smok-9cc69-lator-—-калькулятор-объёмов-chromium/test-failed-1.png

### ❌ /estimates/pricing/databases — базы расценок (ГЭСН, ФЕР, ТЕР)
- **File:** `e2e/tests/smoke/estimates.smoke.spec.ts`
- **Module:** estimates
- **Duration:** 61809ms
- **Error:**
```
Error: /estimates/pricing/databases should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60257[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-estimates.smok-bfc39-базы-расценок-ГЭСН-ФЕР-ТЕР--chromium/test-failed-1.png

### ❌ /specifications/competitive-registry — реестр конкурентных листов
- **File:** `e2e/tests/smoke/estimates.smoke.spec.ts`
- **Module:** estimates
- **Duration:** 61820ms
- **Error:**
```
Error: /specifications/competitive-registry should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60232[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-estimates.smok-924bd--реестр-конкурентных-листов-chromium/test-failed-1.png

### ❌ /finance/s-curve-cashflow — S-кривая денежных потоков
- **File:** `e2e/tests/smoke/finance.smoke.spec.ts`
- **Module:** finance
- **Duration:** 6552ms
- **Error:**
```
Error: /finance/s-curve-cashflow should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6369[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-finance.smoke--bf7f8-—-S-кривая-денежных-потоков-chromium/test-failed-1.png

### ❌ /fleet/waybills-esm — путевые листы (форма ЕСМ)
- **File:** `e2e/tests/smoke/fleet.smoke.spec.ts`
- **Module:** fleet
- **Duration:** 1605ms
- **Error:**
```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/undefined|NaN/[39m
Received string:      [31m"[39m
[31m    ПРИВОДГлавнаяЗадачиКалендарьПланированиеПроцессыОбъектыCRM и тендерыДокументыПроектированиеИсполнительная документацияФинансыЦенообразованиеСнабжениеКадрыОхрана трудаКачество и регуляторикаТехника и IoTТранспортТопливоУчёт топливаОбслуживаниеТО и ремонтГрафик ТОПутевые листыЖурнал эксплуатацииGPS
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-fleet.smoke-Fl-79bf0--—-путевые-листы-форма-ЕСМ--chromium/test-failed-1.png

### ❌ /portal/invoices — счета подрядчика
- **File:** `e2e/tests/smoke/portal.smoke.spec.ts`
- **Module:** portal
- **Duration:** 5367ms
- **Error:**
```
Error: /portal/invoices should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5163[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-portal.smoke-P-ece65-invoices-—-счета-подрядчика-chromium/test-failed-1.png

### ❌ /quality/material-inspection — входной контроль материалов
- **File:** `e2e/tests/smoke/quality.smoke.spec.ts`
- **Module:** quality
- **Duration:** 6797ms
- **Error:**
```
Error: /quality/material-inspection should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6570[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-quality.smoke--2b04e-входной-контроль-материалов-chromium/test-failed-1.png

### ❌ /support/tickets — реестр заявок
- **File:** `e2e/tests/smoke/support.smoke.spec.ts`
- **Module:** users
- **Duration:** 62137ms
- **Error:**
```
Error: /support/tickets should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60302[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-support.smoke--88de8-ort-tickets-—-реестр-заявок-chromium/test-failed-1.png

### ❌ /warehouse/quick-confirm — быстрое подтверждение
- **File:** `e2e/tests/smoke/warehouse.smoke.spec.ts`
- **Module:** warehouse
- **Duration:** 6333ms
- **Error:**
```
Error: /warehouse/quick-confirm should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6139[39m
```
- **Screenshots:** /Users/damirkasimov/Desktop/privod2/privod2_next/frontend/test-results/tests-smoke-warehouse.smok-d3453-irm-—-быстрое-подтверждение-chromium/test-failed-1.png


## [MAJOR] Slow Tests (>10s)

30 test(s) exceeded 10s:

| Test | Module | Duration | File |
|------|--------|----------|------|
| /crm/dashboard — CRM дашборд | crm | 2003.2s | `e2e/tests/smoke/crm.smoke.spec.ts` |
| /operations/dashboard — панель управления стройплощадкой | daily-logs | 632.0s | `e2e/tests/smoke/daily-logs.smoke.spec.ts` |
| /support/tickets — реестр заявок | users | 62.1s | `e2e/tests/smoke/support.smoke.spec.ts` |
| /specifications/competitive-registry — реестр конкурентных листов | estimates | 61.8s | `e2e/tests/smoke/estimates.smoke.spec.ts` |
| /estimates/pricing/databases — базы расценок (ГЭСН, ФЕР, ТЕР) | estimates | 61.8s | `e2e/tests/smoke/estimates.smoke.spec.ts` |
| /estimates/pivot — сводная таблица анализа | estimates | 61.7s | `e2e/tests/smoke/estimates.smoke.spec.ts` |
| /estimates/volume-calculator — калькулятор объёмов | estimates | 61.7s | `e2e/tests/smoke/estimates.smoke.spec.ts` |
| /estimates/minstroy — индексы Минстроя | estimates | 61.7s | `e2e/tests/smoke/estimates.smoke.spec.ts` |
| 06 — ФМ: импорт ЛСР через xlsx | pricing | 17.7s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| 04 — ФМ: позиции + создать КП | pricing | 16.1s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| /russian-docs/ks2 — акты КС-2 | users | 14.2s | `e2e/tests/smoke/closing.smoke.spec.ts` |
| /admin/departments — отделы | admin | 13.9s | `e2e/tests/smoke/admin.smoke.spec.ts` |
| /bid-packages — тендерные пакеты | users | 13.4s | `e2e/tests/smoke/bid-management.smoke.spec.ts` |
| /admin/permissions — матрица прав | admin | 13.2s | `e2e/tests/smoke/admin.smoke.spec.ts` |
| /cost-management/budget — бюджет vs факт | cost-management | 13.2s | `e2e/tests/smoke/cost-management.smoke.spec.ts` |
| 05b — КП: утвердить и передать в ФМ | pricing | 12.1s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| /planning/work-volumes — объёмы работ | planning | 12.0s | `e2e/tests/smoke/planning.smoke.spec.ts` |
| /warehouse/inter-site-transfer — межплощадочное перемещение | warehouse | 11.8s | `e2e/tests/smoke/warehouse.smoke.spec.ts` |
| /procurement/tenders — тендеры на закупку | procurement | 11.8s | `e2e/tests/smoke/procurement.smoke.spec.ts` |
| /exec-docs/special-journals — журналы специальных работ | exec-docs | 11.8s | `e2e/tests/smoke/exec-docs.smoke.spec.ts` |
| /quality/gates — quality gates (контрольные точки) | quality | 11.8s | `e2e/tests/smoke/quality.smoke.spec.ts` |
| 07 — ФМ: финальная проверка — себестоимость, сметная, цена заказчику | pricing | 11.8s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| /exec-docs/welding — журнал сварочных работ | exec-docs | 11.7s | `e2e/tests/smoke/exec-docs.smoke.spec.ts` |
| /bim/drawing-overlay — наложение чертежей | bim | 11.7s | `e2e/tests/smoke/bim.smoke.spec.ts` |
| 03 — Спецификация → Передать в ФМ | pricing | 11.6s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| /procurement/prequalification — преквалификация подрядчиков | procurement | 11.6s | `e2e/tests/smoke/procurement.smoke.spec.ts` |
| 08 — Все страницы цепочки загружаются | pricing | 11.3s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| 02 — Создать спецификацию с импортом xlsx | pricing | 11.0s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| 05 — КП: заполнить цены через API + UI | pricing | 10.6s | `e2e/tests/smoke/pricing-chain-ui-journey.spec.ts` |
| /operations/daily-logs — журнал ежедневных работ | daily-logs | 10.2s | `e2e/tests/smoke/daily-logs.smoke.spec.ts` |

## [MINOR] Flaky Tests (passed on retry)

No flaky tests detected. Stability is solid. ✅

## [MISSING] Modules Without Test Coverage

38 module(s) have no E2E tests:

- [ ] **dashboard** — needs at least smoke test
- [ ] **reports** — needs at least smoke test
- [ ] **gantt** — needs at least smoke test
- [ ] **evm** — needs at least smoke test
- [ ] **resources** — needs at least smoke test
- [ ] **rfis** — needs at least smoke test
- [ ] **submittals** — needs at least smoke test
- [ ] **issues** — needs at least smoke test
- [ ] **workflows** — needs at least smoke test
- [ ] **site-assessments** — needs at least smoke test
- [ ] **opportunities** — needs at least smoke test
- [ ] **tenders** — needs at least smoke test
- [ ] **bid-packages** — needs at least smoke test
- [ ] **budgets** — needs at least smoke test
- [ ] **financial-models** — needs at least smoke test
- [ ] **invoices** — needs at least smoke test
- [ ] **payments** — needs at least smoke test
- [ ] **cash-flow** — needs at least smoke test
- [ ] **execution-chain** — needs at least smoke test
- [ ] **revenue** — needs at least smoke test
- [ ] **specifications** — needs at least smoke test
- [ ] **competitive-lists** — needs at least smoke test
- [ ] **operations** — needs at least smoke test
- [ ] **employees** — needs at least smoke test
- [ ] **crew** — needs at least smoke test
- [ ] **timesheets** — needs at least smoke test
- [ ] **leave** — needs at least smoke test
- [ ] **incidents** — needs at least smoke test
- [ ] **training** — needs at least smoke test
- [ ] **commissioning** — needs at least smoke test
- [ ] **warranty** — needs at least smoke test
- [ ] **insurance** — needs at least smoke test
- [ ] **messaging** — needs at least smoke test
- [ ] **mail** — needs at least smoke test
- [ ] **permissions** — needs at least smoke test
- [ ] **support** — needs at least smoke test
- [ ] **settings** — needs at least smoke test
- [ ] **subscription** — needs at least smoke test

## [UX] Console Errors, Layout Issues, Missing i18n

### i18n issues (25)
- **/admin/permissions — матрица прав** (admin): Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('table, [class*="grid"], [class*="matrix"], [class*="permission"]').first()
Expected: visibl
- **/ai/photo-analysis — ИИ фотоанализ** (users): Error: Photo analysis should have upload area or results

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Receiv
- **/bim/drawing-overlay — наложение чертежей** (bim): Error: /bim/drawing-overlay should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m11511[39m
- **/calendar — календарь** (calendar): Error: locator.count: Unexpected token "/" while parsing css selector "button:has-text(/[<>←→◀▶]/), button:has-text(/prev|next|назад|вперёд/i)". Did you mean to CSS.escape it?
- **/cde/transmittals — трансмиттальные пакеты** (cde): Error: /cde/transmittals should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5028[39m
- **/closeout/handover — передача объекта** (closeout): Error: /closeout/handover should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7181[39m
- **/closeout/warranty — гарантия** (closeout): Error: /closeout/warranty should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5105[39m
- **/closeout/warranty-obligations — гарантийные обязательства** (closeout): Error: /closeout/warranty-obligations should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7
- **/closeout/warranty-tracking — отслеживание гарантий** (closeout): Error: /closeout/warranty-tracking should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7167
- **/closeout/executive-schemas — исполнительные схемы** (closeout): Error: /closeout/executive-schemas should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6814
- **/russian-docs/ks3 — справки КС-3** (users): Error: /russian-docs/ks3 should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m7632[39m
- **/cost-management/cashflow-forecast — прогноз ДДС** (cost-management): Error: /cost-management/cashflow-forecast should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [
- **/cost-management/profitability — рентабельность** (cost-management): Error: /cost-management/profitability should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m8
- **/operations/daily-logs — журнал ежедневных работ** (daily-logs): Error: /operations/daily-logs should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5761[39m
- **/estimates/minstroy — индексы Минстроя** (estimates): Error: /estimates/minstroy should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60283[39m
- **/estimates/pivot — сводная таблица анализа** (estimates): Error: /estimates/pivot should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60280[39m
- **/estimates/volume-calculator — калькулятор объёмов** (estimates): Error: /estimates/volume-calculator should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m602
- **/estimates/pricing/databases — базы расценок (ГЭСН, ФЕР, ТЕР)** (estimates): Error: /estimates/pricing/databases should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m602
- **/specifications/competitive-registry — реестр конкурентных листов** (estimates): Error: /specifications/competitive-registry should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   
- **/finance/s-curve-cashflow — S-кривая денежных потоков** (finance): Error: /finance/s-curve-cashflow should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6369[
- **/fleet/waybills-esm — путевые листы (форма ЕСМ)** (fleet): Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/undefined|NaN/[39m
Received string:      [31m"[39m
[31m 
- **/portal/invoices — счета подрядчика** (portal): Error: /portal/invoices should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m5163[39m
- **/quality/material-inspection — входной контроль материалов** (quality): Error: /quality/material-inspection should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m657
- **/support/tickets — реестр заявок** (users): Error: /support/tickets should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m60302[39m
- **/warehouse/quick-confirm — быстрое подтверждение** (warehouse): Error: /warehouse/quick-confirm should load in <5s

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m5000[39m
Received:   [31m6139[3

---

## Summary

| Metric | Count |
|--------|-------|
| Total tests | 406 |
| Passed | 379 |
| Failed | 25 |
| Skipped | 0 |
| Flaky | 0 |
| Untested modules | 38 |
| Slow tests (>10s) | 30 |
| Total duration | 4400.3s |
