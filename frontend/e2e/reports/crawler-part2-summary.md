# Element Crawler Part 2 — Results Summary

> Generated: 2026-03-12T18:47:04.670Z
> Pages: Groups 15–25 (Safety → Admin)

## Overview

| Metric | Count |
|--------|-------|
| Pages crawled | 1 |
| Total elements interacted | 35 |
| OK (no errors) | 23 (65.7%) |
| JS errors | 0 |
| Click failures | 12 |
| Dead buttons (nothing) | 9 |
| Modals opened | 0 |
| Navigations | 4 |
| Dropdowns opened | 0 |
| Tab switches | 0 |
| Toggles | 10 |

## Per-Group Summary

| Group | Pages | Elements | Errors | Dead |
|-------|-------|----------|--------|------|
| Safety | 1 | 35 | 0 | 9 |

## Issue Classification

| Severity | Count | Description |
|----------|-------|-------------|
| [CRITICAL] | 0 | JS errors, page load failures |
| [MAJOR] | 12 | Elements that could not be clicked |
| [MINOR] | 9 | Buttons/elements with no visible effect |
| [UX] | 0 | Empty pages, slow loads |
| [MISSING] | 0 | Expected features not found |

## [CRITICAL] Issues — JS Errors & Load Failures

None — all pages clean!

## [MAJOR] Issues — Click Failures

- Click failed on `/safety` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/safety` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/safety` → `button:Провести инструктаж`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(54)[22m

- Click failed on `/safety` → `button:Зарегистрировать инцидент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(55)[22m

- Click failed on `/safety` → `button:Новая проверка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(56)[22m

- Click failed on `/safety` → `button:Проверки (8)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(57)[22m

- Click failed on `/safety` → `button:Нарушения (4)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/safety` → `button:Сохранить текущий вид`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/safety` → `button:Удалить выбранный вид`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/safety` → `button:Сбросить вид`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/safety` → `button:Показать выбор столбцов`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/safety` → `button:Экспортировать таблицу в CSV`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m


## [MINOR] Issues — Dead Buttons

- Dead button on `/safety` → `button:Свернуть боковое меню`
- Dead button on `/safety` → `button:AI-ассистент`
- Dead button on `/safety` → `button:Поддержка`
- Dead button on `/safety` → `button:Clear chat`
- Dead button on `/safety` → `button:Minimize`
- Dead button on `/safety` → `button:Какая статистика по безопасности?`
- Dead button on `/safety` → `button:Explain statuses`
- Dead button on `/safety` → `button:What next`
- Dead button on `/safety` → `select:Текущий вид`

## [UX] Issues — Empty Pages & Slow Loads

None

## Pages with JS Errors

- **Safety Dashboard** (`/safety`): 5 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

## Modals Opened

None

## Navigations Triggered

- `/safety` → `button:Включить тёмную тему` → `/`
- `/safety` → `button:15` → `/safety/briefings`
- `/safety` → `button:ДКДамир` → `/safety/incidents/new`
- `/safety` → `button:Открыть ассистента` → `/safety/inspections/new`

## Domain Expert Assessment

### Safety Module (Группа 15)
- 13 pages covering: incidents, inspections, briefings, training, PPE, SOUT, violations
- **Business rule**: Every active site must have safety manager + current training records
- **Key check**: Training expiry warnings, incident severity notifications

### Quality + Regulatory Module (Группа 16)
- 28 pages covering: defects, punch lists, checklists, quality gates, permits, SRO
- **Business rule**: Open defects > 30 days = quality management failing
- **Key check**: Inspection pass rate, repeat defect detection, regulatory compliance

### Fleet + IoT Module (Группа 17)
- 13 pages covering: vehicles, fuel, maintenance, waybills, GPS, IoT sensors/alerts
- **Business rule**: Equipment downtime tracking, fuel consumption anomalies
- **Key check**: GPS tracking data freshness, maintenance schedule adherence

### Site + BIM Module (Группа 18)
- 14 pages covering: daily logs, BIM models, clash detection, AI photo analysis
- **Business rule**: Daily log must be filed every active construction day
- **Key check**: BIM-field bridge, defect heatmap accuracy, photo analysis coverage

### Closeout Module (Группа 19)
- 11 pages covering: commissioning, handover, warranty, as-built, stroynadzor
- **Business rule**: No handover without complete documentation package
- **Key check**: Warranty obligation tracking, executive schema completeness

### Portal Module (Группа 22)
- 16 pages covering: contractor portal dashboard, projects, docs, tasks, КС-2 drafts
- **Business rule**: Contractor sees only their assigned projects/documents
- **Key check**: Data isolation between contractors, CP approval workflow

### Admin Module (Группа 25)
- 13 pages covering: users, permissions, departments, security, monitoring, API docs
- **Business rule**: RBAC matrix enforced, audit trail for all admin actions
- **Key check**: Permission changes propagate immediately, session management
