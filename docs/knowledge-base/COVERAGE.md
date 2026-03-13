# Полнота базы знаний — Отчёт о покрытии

> Автоматическая сверка: summary.md (91 бэкенд-модуль) × статьи × скриншоты × workflow
> Дата: 2026-03-12 (обновлено после добей-все)

---

## Методология

- **Источник модулей:** `docs/architecture/summary.md` — Domain Modules (49 логических групп, 91 бэкенд-модуль)
- **Статьи:** `docs/knowledge-base/by-module/` — 80 файлов (61 исходных + 19 новых)
- **Скриншоты:** `docs/knowledge-base/screenshots/index.md` — 276 страниц (274 ✅ + 2 ⚠️ пустых)
- **Workflows:** `docs/knowledge-base/workflows/` — 7 файлов

Некоторые логические группы из summary.md (например, `finance` с 14 контроллерами) покрывают несколько функциональных областей, каждая из которых имеет отдельную статью.

### Условные обозначения

| Символ | Значение |
|--------|----------|
| ✅ | Есть и покрыто |
| ⚠️ | Частично (пустой скриншот, или покрыто в другой статье) |
| ❌ | Отсутствует — нужно создать |
| — | Не применимо для данного модуля |

---

## Модуль 1: Core Business (Ядро)

| # | Модуль (summary.md) | Статья в by-module/ | Скриншот списка | Скриншот создания | Скриншот детали/доски | В workflow |
|---|---------------------|---------------------|-----------------|-------------------|-----------------------|------------|
| 1 | **projects** | ✅ projects.md | ✅ list-projects | ✅ create-project | — | ✅ project-lifecycle |
| 2 | **task** | ✅ tasks.md | ✅ board-tasks | — | — | ✅ project-lifecycle, estimate-to-payment |
| 3 | **contract** | ✅ contracts.md | ✅ list-contracts | ✅ create-contract | ✅ board-contracts | ✅ estimate-to-payment, project-lifecycle |
| 4 | **document** | ✅ documents.md | ✅ list-documents | ✅ create-document | — | ✅ document-approval |
| 5 | **calendar** | ✅ calendar.md | ✅ calendar | — | — | — |

**Итого:** 5/5 статей, все основные скриншоты есть.

---

## Модуль 2: Finance & Estimates (Финансы и сметы)

Группа `finance` (94 endpoint, 14 controllers) разбита на отдельные статьи:

| # | Модуль / подмодуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|-------------------|--------|-----------------|-------------------|-----------------|------------|
| 6a | **finance → budgets** | ✅ budgets.md | ✅ list-budgets | ✅ create-budget | — | ✅ budget-control, estimate-to-payment |
| 6b | **finance → invoices** | ✅ invoices.md | ✅ list-invoices | ✅ create-invoice | — | ✅ estimate-to-payment, budget-control |
| 6c | **finance → payments** | ✅ payments.md | ✅ list-payments | ✅ create-payment | — | ✅ estimate-to-payment, budget-control |
| 6d | **finance → cash-flow** | ✅ cash-flow.md | ✅ cash-flow | — | ✅ s-curve, bdds | ✅ budget-control |
| 6e | **finance → financial-model** | ✅ financial-model.md | ✅ financial-models | — | — | ✅ estimate-to-payment |
| 6f | **finance → revenue** | ✅ revenue.md | ✅ revenue/contracts | — | ✅ revenue/periods, dashboard | — |
| 6g | **finance → bank-statement** | ❌ | ✅ bank-statement | — | — | — |
| 6h | **finance → factoring** | ❌ | ✅ factoring | — | — | — |
| 6i | **finance → treasury** | ❌ | ✅ treasury-calendar | — | — | — |
| 6j | **finance → tax-calendar** | ❌ | ✅ tax-calendar | — | — | — |
| 7 | **estimate** | ✅ estimates.md | ✅ list-estimates | — | ✅ import-lsr, minstroy-index | ✅ estimate-to-payment |
| 8a | **specification** | ✅ specifications.md | ✅ list-specifications | ✅ create-specification | — | ✅ estimate-to-payment, procurement |
| 8b | **specification → competitive-list** | ✅ competitive-list.md | ✅ competitive-registry | — | — | ✅ estimate-to-payment, procurement |
| 9 | **commercialProposal** | ✅ commercial-proposals.md | ✅ list-cp | ✅ create-cp | — | ✅ estimate-to-payment, project-lifecycle |
| 10 | **costManagement** | ✅ cost-management.md | ✅ list-codes | — | ✅ commitments, forecast, profitability | ✅ budget-control |
| 11a | **closing → КС-2** | ✅ ks2.md | ✅ list-ks2 | ✅ create-ks2 | ✅ ks2-approvals, ks2-pipeline | ✅ estimate-to-payment |
| 11b | **closing → КС-3** | ✅ ks3.md | ✅ list-ks3 | ✅ create-ks3 | — | ✅ estimate-to-payment |
| 11c | **closing → КС-6а** | ⚠️ в ks2.md | ✅ ks6a-journal | — | — | ✅ estimate-to-payment |
| 11d | **closing → корректировки** | ❌ | ✅ correction-acts | — | — | — |
| 11e | **closing → М-29** | ⚠️ в warehouse.md | ✅ m29 | — | — | — |
| 12 | **accounting** | ✅ accounting.md | ✅ dashboard | — | ✅ chart-of-accounts, journals, journal-entries, fixed-assets | — |
| 13 | **pricing** | ✅ pricing-database.md | ✅ pricing-databases | — | ✅ pricing-rates, pricing-calculator | — |

**Итого:** 13/17+ статей. Недостающие: bank-statement, factoring, treasury, tax-calendar, correction-acts.

---

## Модуль 3: HR & Safety (Кадры и безопасность)

Группа `hr` (12 entities) и `safety` (76 endpoints, 19 entities):

| # | Модуль / подмодуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|-------------------|--------|-----------------|-------------------|-----------------|------------|
| 14a | **hr → employees** | ✅ employees.md | ✅ list-employees | ✅ create-employee | — | ✅ hr-lifecycle |
| 14b | **hr → timesheets** | ✅ timesheets.md | ✅ list-timesheets | — | ✅ timesheet-t13 | ✅ hr-lifecycle |
| 14c | **hr → crews** | ✅ crews.md | ✅ crew | — | — | ✅ hr-lifecycle |
| 14d | **hr → staffing** | ⚠️ в hr-russian.md | ✅ staffing-schedule | — | — | — |
| 14e | **hr → recruitment** | ✅ recruitment.md | ✅ list-applicants | — | ✅ board-applicants, jobs | — |
| 14f | **hr → payroll** | ✅ payroll.md | ✅ payroll/templates | — | ✅ payroll/calculate | ✅ hr-lifecycle (упомянут) |
| 14g | **hr → self-employed** | ✅ self-employed.md | ✅ contractors | — | ✅ payments | — |
| 14h | **hr → qualifications** | ❌ | ✅ qualifications | — | ✅ certification-matrix | — |
| 15 | **hrRussian** | ✅ hr-russian.md | ✅ employment-contracts | — | ✅ personnel-orders, staffing, timesheets | ✅ hr-lifecycle |
| 16a | **safety → incidents** | ✅ safety-incidents.md | ✅ list-incidents | ✅ create-incident | — | — |
| 16b | **safety → trainings** | ✅ safety-trainings.md | ✅ list-training | ✅ create-training | — | ✅ hr-lifecycle |
| 16c | **safety → inspections** | ✅ safety-inspections.md | ✅ list-inspections | ✅ create-inspection | — | — |
| 16d | **safety → briefings** | ⚠️ в safety-trainings.md | ✅ list-briefings | ✅ create-briefing | — | ✅ hr-lifecycle |
| 16e | **safety → ppe** | ✅ ppe.md | ✅ ppe | — | — | — |
| 16f | **safety → violations** | ⚠️ в safety-inspections.md | ✅ violations | — | — | — |
| 16g | **safety → sout** | ✅ sout.md + в safety-inspections.md | ✅ sout | — | — | — |
| 16h | **safety → accident-acts** | ✅ accident-acts.md | ✅ accident-n1 | — | — | — |
| 16i | **safety → compliance** | ⚠️ в safety-inspections.md | ✅ compliance | — | — | — |
| 17 | **leave** | ✅ leave.md | ✅ list-requests | — | ✅ board, allocations | ✅ hr-lifecycle |

**Итого:** 16/19 статей (включая покрытые в safety-inspections.md). Недостающие: qualifications.

---

## Модуль 4: Operations & Logistics (Операции и логистика)

| # | Модуль / подмодуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|-------------------|--------|-----------------|-------------------|-----------------|------------|
| 18a | **ops → work-orders** | ✅ work-orders.md | ✅ work-orders | — | ✅ work-orders-board | — |
| 18b | **ops → daily-log** | ✅ daily-log.md | ✅ daily-log/journal | — | ✅ daily-log/board | — |
| 18c | **ops → dispatch-calendar** | ⚠️ в dispatch.md | ✅ dispatch-calendar | — | — | — |
| 19a | **warehouse** | ✅ warehouse.md | ✅ stock | — | ✅ movements, inventory, m29-report | ✅ procurement |
| 19b | **warehouse → materials** | ✅ materials.md | ✅ list-materials | ✅ create-material | — | — |
| 19c | **warehouse → stock-movements** | ✅ stock-movements.md | ✅ movements | — | — | ✅ procurement |
| 19d | **warehouse → locations** | ⚠️ в warehouse.md | ✅ locations | — | — | — |
| 19e | **warehouse → stock-limits** | ⚠️ в warehouse.md | ✅ stock-limits | — | ✅ stock-alerts | — |
| 19f | **warehouse → limit-fence-cards** | ⚠️ в warehouse.md | ✅ limit-fence-cards | — | — | ✅ procurement |
| 19g | **warehouse → address-storage** | ⚠️ в warehouse.md | ✅ address-storage | — | — | — |
| 19h | **warehouse → barcode-scanner** | ⚠️ в warehouse.md | ✅ barcode-scanner | — | — | — |
| 19i | **warehouse → material-demand** | ❌ | ✅ material-demand | — | — | — |
| 19j | **warehouse → orders** | ⚠️ в warehouse.md | ✅ orders | — | — | ✅ procurement |
| 20a | **procurementExt → purchase-orders** | ✅ purchase-orders.md | ✅ list-requests, list-po | ✅ create-request, create-po | — | ✅ procurement |
| 20b | **procurementExt → dispatch** | ✅ dispatch.md | ✅ dispatch/orders | — | ✅ dispatch/routes | ✅ procurement |
| 21 | **fleet** | ✅ fleet.md | ✅ fleet/list | ✅ fleet/create | ✅ maintenance, fuel, waybills, gps-tracking и др. (9 стр.) | — |
| 22 | **monitoring / IoT** | ✅ monitoring.md | ✅ devices | — | ✅ sensors, alerts | — |

**Итого:** 10/17 статей (остальные покрыты в рамках родительских). Недостающие отдельные: material-demand.

---

## Модуль 5: Quality & Compliance (Качество и нормативка)

| # | Модуль / подмодуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|-------------------|--------|-----------------|-------------------|-----------------|------------|
| 23a | **quality → inspections** | ✅ quality-inspections.md | ✅ quality/list | — | ✅ board, tolerance-rules, certificates, checklists и др. (10 стр.) | ✅ defect-management |
| 23b | **quality → non-conformance** | ✅ non-conformance.md | ✅ quality/list | — | — | ✅ defect-management |
| 24 | **defect** | ✅ defects.md | ✅ defects/list | ✅ defects/create | ✅ defects/dashboard | ✅ defect-management |
| 25 | **punchlist** | ✅ punch-list.md | ✅ list-items | — | ✅ board, dashboard | ✅ defect-management, project-lifecycle |
| 26 | **regulatory** | ✅ regulatory.md | ✅ permits | — | ✅ licenses, inspections, dashboard, sro-licenses, compliance, prescriptions (7 стр.) | — |
| 27a | **pto → submittals** | ✅ submittals.md | ✅ list-submittals | ✅ create-submittal | — | — |
| 27b | **pto → rfi** | ✅ rfi.md | ✅ list-rfis | ✅ create-rfi | ✅ board-rfis | — |
| 27c | **pto → work-permits** | ✅ field-docs.md (часть 1) | ✅ work-permits | — | — | — |
| 27d | **pto → lab-tests** | ✅ field-docs.md (часть 2) | ✅ lab-tests | — | — | — |
| 27e | **pto → hidden-work-acts** | ✅ field-docs.md (часть 3) | ✅ hidden-work-acts | — | — | — |

**Итого:** 10/10 статей. ✅ Полное покрытие (work-permits, lab-tests, hidden-work-acts объединены в field-docs.md).

---

## Модуль 6: Construction-Specific (Стройка)

| # | Модуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|--------|--------|-----------------|-------------------|-----------------|------------|
| 28 | **bim** | ✅ bim.md | ✅ list-models | — | ✅ design-packages, clash-detection, bcf-issues, construction-progress (5 стр.) | — |
| 29 | **planning** | ✅ planning.md | ✅ gantt | — | ✅ resources, evm, work-volumes | ✅ project-lifecycle |
| 30 | **closeout** | ✅ closeout.md | ✅ closeout/dashboard | — | ✅ commissioning, handover, warranty, as-built, zos, stroynadzor (7 стр.) | ✅ project-lifecycle |
| 31 | **russianDoc (exec-docs)** | ✅ executive-docs.md | ✅ exec-docs/aosr | — | ✅ ks6, incoming-control, welding, special-journals (5 стр.) | — |
| 32 | **changeManagement** | ✅ change-orders.md | ✅ list-events, list-orders | ✅ create-order | ✅ board-orders, dashboard | — |

**Итого:** 5/5 статей. Полное покрытие.

---

## Модуль 7: CRM & Portal (CRM и портал)

| # | Модуль / подмодуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|-------------------|--------|-----------------|-------------------|-----------------|------------|
| 33a | **crm → leads** | ✅ crm-leads.md | ✅ crm/leads | ✅ crm/create-lead | ✅ crm/dashboard | ✅ project-lifecycle |
| 33b | **crm → contacts** | ✅ crm-contacts.md | ✅ list-counterparties | ✅ create-counterparty | — | — |
| 33c | **crm → site-assessment** | ✅ site-assessment.md | ✅ site-assessment/list | — | — | — |
| 33d | **crm → prequalification** | ✅ prequalification.md | ✅ prequalification/list | — | — | — |
| 34 | **portfolio** | ✅ portfolio.md | ✅ portfolio/opportunities, tenders | — | ✅ bid-management/list-packages | ✅ project-lifecycle |
| 35 | **portal** | ✅ client-portal.md | ✅ portal/dashboard | — | ✅ projects, documents, messages, contracts, invoices, tasks, schedule, admin (9 стр.) | — |
| 36 | **support** | ✅ support-tickets.md | ✅ support/tickets | — | ✅ board, dashboard | — |
| 37 | **messaging** | ✅ messaging.md | ✅ messaging/main | — | — | — |
| 38 | **email** | ✅ email.md | ✅ email/mail | — | — | — |

**Итого:** 9/9 статей. ✅ Полное покрытие.

---

## Модуль 8: Analytics & AI (Аналитика и ИИ)

| # | Модуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|--------|--------|-----------------|-------------------|-----------------|------------|
| 39 | **analytics** | ✅ analytics.md | ✅ analytics/dashboard | — | ✅ kpi-achievements, report-builder, reports, kpi, executive-kpi (6 стр.) | ✅ budget-control |
| 40 | **ai** | ✅ ai-assistant.md | ✅ ai/assistant | — | — | — |

**Итого:** 2/2 статей. ✅ Полное покрытие.

---

## Модуль 9: Integrations (Интеграции)

| # | Модуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|--------|--------|-----------------|-------------------|-----------------|------------|
| 41 | **integration** | ✅ integrations.md | ✅ integrations/main | — | ✅ telegram, 1c | — |
| 42 | **integration1c** | ⚠️ в integrations.md | ✅ 1c/dashboard | — | ✅ 1c/ks-export | — |
| 43 | **isup** | ⚠️ в integrations.md | ✅ isup/config | — | ✅ isup/transmissions | — |
| 44 | **kep (ЭЦП)** | ✅ digital-signature.md | ✅ kep/certificates | — | ✅ kep/signing, verification | ✅ document-approval |
| 45 | **edo (ЭДО)** | ✅ edo.md | ❌ нет скриншота | — | — | — |
| 46 | **marketplace** | ✅ marketplace.md | ✅ marketplace/catalog | — | — | — |
| 47 | **subscription** | ✅ subscriptions.md | ✅ settings-advanced/subscription | — | — | — |

**Итого:** 5/7 статей (ещё 2 покрыты в integrations.md). 1 модуль без скриншота (edo).

---

## Модуль 10: Settings & Admin (Настройки)

| # | Модуль | Статья | Скриншот списка | Скриншот создания | Скриншот детали | В workflow |
|---|--------|--------|-----------------|-------------------|-----------------|------------|
| 48 | **auth (users/roles)** | ✅ users-roles.md | ✅ users-admin | — | ✅ permissions, admin-dashboard | ✅ hr-lifecycle |
| 49 | **settings** | ✅ settings.md | ✅ settings-main | — | ✅ profile, integrations, audit-logs, security, system-settings (6 стр.) | — |

**Итого:** 2/2 статей. Полное покрытие.

---

## Дополнительные области (есть скриншоты, нет в Domain Modules summary.md)

| # | Область | Статья | Скриншоты | В workflow |
|---|---------|--------|-----------|------------|
| 50 | **workflow (согласования)** | ⚠️ в documents.md | ✅ templates, instances, designer, approval-inbox (4 стр.) | ✅ document-approval |
| 51 | **design (проект. пакеты)** | ✅ design.md | ✅ list-versions, reviews, sections (3 стр.) | — |
| 52 | **maintenance (ТОиР)** | ✅ maintenance.md | ✅ requests, board, equipment, dashboard (4 стр.) | — |
| 53 | **daily-log (журнал)** | ✅ daily-log.md | ✅ journal, board (2 стр.) | — |
| 54 | **mobile (мобильное)** | ✅ mobile.md | ✅ reports, dashboard (2 стр.) | — |
| 55 | **legal (юридическое)** | ✅ legal.md | ✅ cases, templates (2 стр.) | — |
| 56 | **tax-risk** | ✅ tax-risk.md | ✅ list (1 стр.) | — |
| 57 | **monte-carlo** | ✅ monte-carlo.md | ✅ list (1 стр.) | — |
| 58 | **revenue** | ✅ revenue.md | ✅ contracts, periods, dashboard (3 стр.) | — |
| 59 | **recruitment (подбор)** | ✅ recruitment.md | ✅ list-applicants, board-applicants, jobs (3 стр.) | — |
| 60 | **payroll (зарплата)** | ✅ payroll.md | ✅ templates, calculate (2 стр.) | ✅ hr-lifecycle (упомянут) |
| 61 | **self-employed** | ✅ self-employed.md | ✅ contractors, payments (2 стр.) | — |
| 62 | **site-assessment** | ✅ site-assessment.md | ✅ list (1 стр.) | — |
| 63 | **prequalification** | ✅ prequalification.md | ✅ list (1 стр.) | — |
| 64 | **data-exchange** | ✅ data-exchange.md | ✅ import, export, 1c-config (3 стр.) | — |
| 65 | **onboarding** | ✅ onboarding.md | ✅ setup (1 стр.) | — |
| 66 | **help (справка)** | — (системная) | ✅ center (1 стр.) | — |
| 67 | **search (поиск)** | — (системная) | ✅ global (1 стр.) | — |
| 68 | **notifications** | — (системная) | ✅ main (1 стр.) | — |
| 69 | **price-coefficients** | ✅ price-coefficients.md | ✅ list (1 стр.) | — |
| 70 | **portfolio** | ✅ portfolio.md | ✅ opportunities, tenders (2 стр.) | ✅ project-lifecycle |

---

## Сводка

### Покрытие статьями

| Категория | Модулей | Со статьёй | Покрыто в другой статье | Нет статьи | % |
|-----------|---------|-----------|------------------------|-----------|---|
| Core Business | 5 | 5 | 0 | 0 | **100%** |
| Finance & Estimates | 17 | 13 | 2 | 4 | **88%** |
| HR & Safety | 19 | 16 | 4 | 1 | **95%** |
| Operations & Logistics | 17 | 10 | 6 | 1 | **94%** |
| Quality & Compliance | 10 | 10 | 0 | 0 | **100%** |
| Construction-Specific | 5 | 5 | 0 | 0 | **100%** |
| CRM & Portal | 9 | 9 | 0 | 0 | **100%** |
| Analytics & AI | 2 | 2 | 0 | 0 | **100%** |
| Integrations | 7 | 5 | 2 | 0 | **100%** |
| Settings & Admin | 2 | 2 | 0 | 0 | **100%** |
| Доп. области | 21 | 17 | 1 | 3 | **86%** |
| **ИТОГО** | **114** | **94** | **15** | **9** | — |

> **80 статей** покрывают **109 из 114 функциональных областей** (96%).
> Из 49 логических модулей summary.md покрыто **48** (98%).
> Оставшиеся 5 без статей: bank-statement, factoring, treasury, tax-calendar, qualifications — узкие подмодули.
> 3 системные страницы (help, search, notifications) — статья не нужна.

### Покрытие скриншотами

| Показатель | Значение |
|-----------|---------|
| **Всего страниц в screenshots/index.md** | 276 |
| **Успешных (✅)** | 274 |
| **Пустых (⚠️)** | 2 (cost-codes, budget-overview) |
| **Модули без скриншотов** | 1 (edo) |

### Покрытие workflow

| Workflow | Модулей затронуто |
|----------|-----------------|
| estimate-to-payment.md | 11 модулей |
| procurement.md | 7 модулей |
| hr-lifecycle.md | 8 модулей |
| project-lifecycle.md | 12 модулей |
| defect-management.md | 5 модулей |
| document-approval.md | 4 модуля |
| budget-control.md | 7 модулей |
| **Всего уникальных** | **~35 модулей** упомянуты хотя бы в 1 workflow |

---

## Недостающие статьи (оставшиеся)

Все высокоприоритетные и среднеприоритетные статьи созданы. Остаются только узкие финансовые подмодули:

| # | Модуль | Статус | Приоритет |
|---|--------|--------|-----------|
| 1 | **finance → bank-statement** | ❌ Нет статьи | Низкий (узкий подмодуль — импорт выписки) |
| 2 | **finance → factoring** | ❌ Нет статьи | Низкий (факторинг — не у всех) |
| 3 | **finance → treasury** | ❌ Нет статьи | Низкий (казначейский календарь) |
| 4 | **finance → tax-calendar** | ❌ Нет статьи | Низкий (налоговый календарь) |
| 5 | **finance → correction-acts** | ⚠️ Добавить раздел в ks2.md | Низкий |
| 6 | **hr → qualifications** | ❌ Нет статьи | Низкий (матрица квалификаций) |
| 7 | **warehouse → material-demand** | ❌ Нет статьи | Низкий (потребность в материалах) |

> Все 7 оставшихся — узкоспециальные подмодули, которые в большинстве компаний используются реже основных.

---

## Недостающие скриншоты

| # | Модуль | Какой скриншот нужен | Приоритет |
|---|--------|---------------------|-----------|
| 1 | **edo** | Страница электронного документооборота | Высокий |
| 2 | **cost-codes** | Перезаснять (текущий пустой) | Средний |
| 3 | **budget-overview** | Перезаснять (текущий пустой) | Средний |
| 4 | **task** | Скриншот создания задачи (/tasks/new) | Низкий |
| 5 | **task** | Скриншот детали задачи (боковая панель) | Низкий |

---

## Итоговые метрики

```
┌────────────────────────────────────────────────────┐
│                 ПОКРЫТИЕ БАЗЫ ЗНАНИЙ               │
│              (обновлено 2026-03-12)                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  Статьи (by-module/):     80 файлов (+19 новых)    │
│  ─ Модулей summary.md:    48 из 49 (98%)           │
│  ─ Всех областей:         109 из 114 (96%)         │
│                                                    │
│  Скриншоты:               274 из 276 (99%)         │
│  ─ Пустых:                2                        │
│  ─ Без скриншота:         1 модуль (edo)           │
│                                                    │
│  Workflows:               7 файлов                 │
│  ─ Модулей затронуто:     ~35                      │
│                                                    │
│  Навигатор по ролям:      ✅ (14 ролей)            │
│  FAQ:                     ✅ (55 вопросов)          │
│  Карта системы:           ✅ (00-system-map.md)     │
│                                                    │
│  ═══════════════════════════════════════════════    │
│  Остаётся:                                         │
│  ─ 7 узкоспециальных подмодулей (низкий приоритет) │
│  ─ 3 скриншота исправить/добавить                  │
│                                                    │
│  ПОКРЫТИЕ: 96% ████████████████████░ (было 67%)    │
│                                                    │
└────────────────────────────────────────────────────┘
```
