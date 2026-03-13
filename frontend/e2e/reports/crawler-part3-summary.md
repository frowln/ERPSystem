# Element Crawler Part 3 — Results Summary

> Generated: 2026-03-12T19:24:12.330Z
> Pages: Groups 26–37 (Detail pages, create forms, boards, advanced)

## Overview

| Metric | Count |
|--------|-------|
| Pages crawled | 24 |
| Total elements interacted | 590 |
| OK (no errors) | 204 (34.6%) |
| JS errors | 6 |
| Click failures | 380 |
| Dead buttons (nothing) | 130 |
| Modals opened | 3 |
| Navigations | 45 |
| Dropdowns opened | 0 |
| Tab switches | 0 |
| Toggles | 26 |

## Per-Group Summary

| Group | Pages | Elements | Errors | Dead |
|-------|-------|----------|--------|------|
| Create-Projects | 9 | 249 | 2 | 63 |
| Create-Finance | 13 | 301 | 2 | 57 |
| Create-Ops | 2 | 40 | 2 | 10 |

## Issue Classification

| Severity | Count | Description |
|----------|-------|-------------|
| [CRITICAL] | 6 | JS errors, page load failures |
| [MAJOR] | 380 | Elements that could not be clicked |
| [MINOR] | 130 | Buttons/elements with no visible effect |
| [UX] | 0 | Empty pages, slow loads |

## [CRITICAL] Issues — JS Errors & Load Failures

- JS error on `/portfolio/opportunities/new` → `button:Чем могу помочь?`: /portfolio/opportunities
- JS error on `/portfolio/tenders/new` → `button:Чем могу помочь?`: /portfolio/tenders
- JS error on `/price-coefficients/new` → `button:Clear chat`: /price-coefficients
- JS error on `/monte-carlo/new` → `button:Назад`: /monte-carlo
- JS error on `/employees/new` → `button:AI-ассистент`: /employees
- JS error on `/operations/daily-logs/new` → `button:15`: /operations/daily-logs

## [MAJOR] Issues — Click Failures

- Click failed on `/projects/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button cla
- Click failed on `/projects/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/projects/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/projects/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button dis
- Click failed on `/projects/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/projects/new` → `button:Перейти в реестр контрагентов`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(48)[22m

- Click failed on `/projects/new` → `button:Создать объект`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/projects/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/projects/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/projects/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/calendar/events/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(31)[22m
[2m    - locator resolved to <button cla
- Click failed on `/calendar/events/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(32)[22m
[2m    - locator resolved to <button cla
- Click failed on `/calendar/events/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/calendar/events/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/calendar/events/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/calendar/events/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/calendar/events/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/calendar/events/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/calendar/events/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/calendar/events/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(44)[22m
[2m    - locator resolved to <button cla
- Click failed on `/calendar/events/new` → `button:Создать событие`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m
[2m    - locator resolved to <button typ
- Click failed on `/calendar/events/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(46)[22m
[2m    - locator resolved to <button typ
- Click failed on `/calendar/events/new` → `select:Выберите типСовещаниеДедлайнПроверкаПоставкаВехаПр...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').first()[22m
[2m    - loca
- Click failed on `/calendar/events/new` → `select:Без привязки к объектуUI-Audit-1773339899376E2E-Це...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').nth(1)[22m
[2m    - locat
- Click failed on `/calendar/events/new` → `toggle:(unlabeled-input)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[role="switch"]:visible, input[type="checkbox"]:visible').first()[22m

- Click failed on `/calendar/events/new` → `toggle:(unlabeled-input)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[role="switch"]:visible, input[type="checkbox"]:visible').nth(1)[22m

- Click failed on `/calendar/events/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(15)[22m

- Click failed on `/counterparties/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/counterparties/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/counterparties/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/counterparties/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/counterparties/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/counterparties/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/counterparties/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/counterparties/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(43)[22m
[2m    - locator resolved to <button dis
- Click failed on `/counterparties/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(48)[22m

- Click failed on `/counterparties/new` → `button:Найти`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/counterparties/new` → `button:Создать контрагент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/counterparties/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/contracts/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/contracts/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/contracts/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/contracts/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/contracts/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/contracts/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/contracts/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/contracts/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/contracts/new` → `button:Покажи детали договора`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/contracts/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/contracts/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/contracts/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/contracts/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/contracts/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/contracts/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/contracts/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/contracts/new` → `button:Создать договор`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/contracts/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(77)[22m

- Click failed on `/contracts/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/contracts/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/crm/leads/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/crm/leads/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/crm/leads/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/crm/leads/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/crm/leads/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/crm/leads/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/crm/leads/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/crm/leads/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m
[2m    - locator resolved to <button cla
- Click failed on `/crm/leads/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/crm/leads/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/crm/leads/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/crm/leads/new` → `button:Создать лид`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/crm/leads/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(53)[22m

- Click failed on `/crm/leads/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/crm/leads/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/portfolio/opportunities/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/opportunities/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/opportunities/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/opportunities/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/opportunities/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/opportunities/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/opportunities/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/portfolio/opportunities/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(44)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/opportunities/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/opportunities/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(48)[22m

- Click failed on `/portfolio/opportunities/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/portfolio/opportunities/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/portfolio/opportunities/new` → `button:Создать возможность`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/portfolio/opportunities/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/portfolio/opportunities/new` → `select:Выберите стадиюЛидКвалифицированПредложениеПерегов...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').first()[22m
[2m    - loca
- Click failed on `/portfolio/opportunities/new` → `select:Выберите типЖилое строительствоКоммерческоеПромышл...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').nth(1)[22m
[2m    - locat
- Click failed on `/portfolio/opportunities/new` → `link:Коммерческие предложения(commercial-proposals.md)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(11)[22m

- Click failed on `/portfolio/opportunities/new` → `link:Контракты(contracts.md)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(12)[22m

- Click failed on `/portfolio/opportunities/new` → `link:Проекты(projects.md)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(13)[22m

- Click failed on `/portfolio/opportunities/new` → `link:Контрагенты(crm-contacts.md)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(14)[22m

- Click failed on `/portfolio/opportunities/new` → `link:Открыть статью полностью(/help/article/portfolio)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(15)[22m

- Click failed on `/portfolio/opportunities/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(16)[22m

- Click failed on `/portfolio/tenders/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/tenders/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/tenders/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/tenders/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/tenders/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/tenders/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/portfolio/tenders/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/portfolio/tenders/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(44)[22m
[2m    - locator resolved to <button cla
- Click failed on `/portfolio/tenders/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(48)[22m

- Click failed on `/portfolio/tenders/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/portfolio/tenders/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/portfolio/tenders/new` → `button:Создать тендерный пакет`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/portfolio/tenders/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/portfolio/tenders/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/portfolio/tenders/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/site-assessments/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button cla
- Click failed on `/site-assessments/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/site-assessments/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/site-assessments/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button dis
- Click failed on `/site-assessments/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/site-assessments/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/site-assessments/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/prequalifications/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(31)[22m
[2m    - locator resolved to <button cla
- Click failed on `/prequalifications/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(32)[22m
[2m    - locator resolved to <button cla
- Click failed on `/prequalifications/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/prequalifications/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/prequalifications/new` → `button:Какие подрядчики прошли преквалификацию?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/prequalifications/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/prequalifications/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/prequalifications/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/prequalifications/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/prequalifications/new` → `button:Verify`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(42)[22m
[2m    - locator resolved to <button dis
- Click failed on `/budgets/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/budgets/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/budgets/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/budgets/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/budgets/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/budgets/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/budgets/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/budgets/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/budgets/new` → `button:Покажи обзор бюджета`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/budgets/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/budgets/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/budgets/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/budgets/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/budgets/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/budgets/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/budgets/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/budgets/new` → `button:Создать бюджет`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/budgets/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(77)[22m

- Click failed on `/budgets/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/budgets/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/commercial-proposals/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/commercial-proposals/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/commercial-proposals/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/commercial-proposals/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/commercial-proposals/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/commercial-proposals/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/commercial-proposals/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/commercial-proposals/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/commercial-proposals/new` → `button:Покажи позиции коммерческого предложения`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/commercial-proposals/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/commercial-proposals/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/commercial-proposals/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/commercial-proposals/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/commercial-proposals/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/commercial-proposals/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/commercial-proposals/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/commercial-proposals/new` → `button:Создать КП`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/commercial-proposals/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(77)[22m

- Click failed on `/commercial-proposals/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/commercial-proposals/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/invoices/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/invoices/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/invoices/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/invoices/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/invoices/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/invoices/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/invoices/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/invoices/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/invoices/new` → `button:Покажи детали счёта`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/invoices/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/invoices/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/invoices/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/invoices/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/invoices/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/invoices/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/invoices/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/invoices/new` → `button:Добавить позицию`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/invoices/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(77)[22m

- Click failed on `/invoices/new` → `button:Создать счёт-фактуру`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(78)[22m

- Click failed on `/invoices/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(79)[22m

- Click failed on `/invoices/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/invoices/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/payments/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/payments/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/payments/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/payments/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/payments/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/payments/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/payments/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/payments/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/payments/new` → `button:Покажи детали платежа`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/payments/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/payments/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/payments/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/payments/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/payments/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/payments/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/payments/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/payments/new` → `button:Создать платёж`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/payments/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(77)[22m

- Click failed on `/payments/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/payments/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/estimates/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/estimates/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/estimates/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/estimates/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/estimates/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/estimates/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(44)[22m
[2m    - locator resolved to <button cla
- Click failed on `/estimates/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m
[2m    - locator resolved to <button typ
- Click failed on `/estimates/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(46)[22m
[2m    - locator resolved to <button typ
- Click failed on `/estimates/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(47)[22m

- Click failed on `/estimates/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/estimates/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/estimates/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/estimates/new` → `button:Создать смету`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(53)[22m

- Click failed on `/estimates/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(54)[22m

- Click failed on `/estimates/new` → `select:Выберите объектPRJ-00591 — UI-Audit-1773339899376P...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').first()[22m
[2m    - loca
- Click failed on `/estimates/new` → `select:Выберите спецификациюSPEC-00146 — SPEC-00146SPEC-0...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').nth(1)[22m
[2m    - locat
- Click failed on `/estimates/new` → `select:Выберите договорБез договораCTR-00514 — E2E-Догово...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('select:visible, [role="combobox"]:visible').nth(2)[22m
[2m    - locat
- Click failed on `/estimates/new` → `link:Открыть статью полностью(/help/article/estimates)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(17)[22m

- Click failed on `/estimates/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(18)[22m

- Click failed on `/specifications/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/specifications/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/specifications/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/specifications/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/specifications/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/specifications/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(44)[22m
[2m    - locator resolved to <button cla
- Click failed on `/specifications/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m
[2m    - locator resolved to <button typ
- Click failed on `/specifications/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(46)[22m
[2m    - locator resolved to <button typ
- Click failed on `/specifications/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(47)[22m
[2m    - locator resolved to <button typ
- Click failed on `/specifications/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m
[2m    - locator resolved to <button typ
- Click failed on `/specifications/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/specifications/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/specifications/new` → `button:Импорт из PDF`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(53)[22m

- Click failed on `/specifications/new` → `button:Импорт из Excel`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(54)[22m

- Click failed on `/specifications/new` → `button:Добавить позицию`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(55)[22m

- Click failed on `/specifications/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(56)[22m

- Click failed on `/specifications/new` → `button:Создать спецификацию`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(57)[22m

- Click failed on `/specifications/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/specifications/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/specifications/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/procurement/purchase-orders/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(55)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(56)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(57)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Какие заявки на закупку ожидают одобрения?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(71)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Очистить черновик`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(72)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Добавить позицию`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Удалить строку 1`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Создать заказ`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/procurement/purchase-orders/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/procurement/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(55)[22m

- Click failed on `/procurement/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(56)[22m

- Click failed on `/procurement/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(57)[22m

- Click failed on `/procurement/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/procurement/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/procurement/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/procurement/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/procurement/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/procurement/new` → `button:Какие заявки на закупку ожидают одобрения?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/procurement/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/procurement/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/procurement/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/procurement/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/procurement/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/procurement/new` → `button:Добавить позицию`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(71)[22m

- Click failed on `/procurement/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(72)[22m

- Click failed on `/procurement/new` → `button:Создать заявку`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/procurement/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/cost-management/commitments/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/cost-management/commitments/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/cost-management/commitments/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/cost-management/commitments/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/cost-management/commitments/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/cost-management/commitments/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/cost-management/commitments/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/cost-management/commitments/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/cost-management/commitments/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/cost-management/commitments/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/cost-management/commitments/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/cost-management/commitments/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/cost-management/commitments/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/cost-management/commitments/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/cost-management/commitments/new` → `button:Справка по странице`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/cost-management/commitments/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(76)[22m

- Click failed on `/cost-management/commitments/new` → `button:Создать обязательство`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(77)[22m

- Click failed on `/cost-management/commitments/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(78)[22m

- Click failed on `/cost-management/commitments/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').first()[22m
[2m    - locator resolved to <a href="/
- Click failed on `/cost-management/commitments/new` → `link:Открыть базу знаний(/help)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('a[href]:visible').nth(1)[22m
[2m    - locator resolved to <a href="/h
- Click failed on `/tax-risk/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/tax-risk/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/tax-risk/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/tax-risk/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/tax-risk/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/tax-risk/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/tax-risk/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/tax-risk/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/tax-risk/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/tax-risk/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/tax-risk/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(68)[22m

- Click failed on `/tax-risk/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(69)[22m

- Click failed on `/tax-risk/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/tax-risk/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(73)[22m

- Click failed on `/tax-risk/new` → `button:Создать оценку`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(74)[22m

- Click failed on `/tax-risk/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(75)[22m

- Click failed on `/price-coefficients/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/price-coefficients/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/price-coefficients/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/price-coefficients/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/price-coefficients/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/price-coefficients/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m

- Click failed on `/price-coefficients/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(46)[22m

- Click failed on `/price-coefficients/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(47)[22m

- Click failed on `/price-coefficients/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/price-coefficients/new` → `button:Создать коэффициент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/price-coefficients/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/insurance-certificates/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(55)[22m

- Click failed on `/insurance-certificates/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(56)[22m

- Click failed on `/insurance-certificates/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(57)[22m

- Click failed on `/insurance-certificates/new` → `button:Открыть ассистента`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/insurance-certificates/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/insurance-certificates/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m

- Click failed on `/insurance-certificates/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(61)[22m

- Click failed on `/insurance-certificates/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(62)[22m

- Click failed on `/insurance-certificates/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(63)[22m

- Click failed on `/insurance-certificates/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(64)[22m

- Click failed on `/insurance-certificates/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(65)[22m

- Click failed on `/insurance-certificates/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(66)[22m

- Click failed on `/insurance-certificates/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(67)[22m

- Click failed on `/insurance-certificates/new` → `button:Create certificate`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(70)[22m

- Click failed on `/insurance-certificates/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(71)[22m

- Click failed on `/monte-carlo/new` → `button:AI-ассистент`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(31)[22m
[2m    - locator resolved to <button cla
- Click failed on `/monte-carlo/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(32)[22m
[2m    - locator resolved to <button cla
- Click failed on `/monte-carlo/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(33)[22m
[2m    - locator resolved to <button typ
- Click failed on `/monte-carlo/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(34)[22m
[2m    - locator resolved to <button typ
- Click failed on `/monte-carlo/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(35)[22m
[2m    - locator resolved to <button cla
- Click failed on `/monte-carlo/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(36)[22m
[2m    - locator resolved to <button cla
- Click failed on `/monte-carlo/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/monte-carlo/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/monte-carlo/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/employees/new` → `button:Включить тёмную тему`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(37)[22m
[2m    - locator resolved to <button cla
- Click failed on `/employees/new` → `button:15`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(38)[22m
[2m    - locator resolved to <button typ
- Click failed on `/employees/new` → `button:ДКДамир`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(39)[22m
[2m    - locator resolved to <button dis
- Click failed on `/employees/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(45)[22m

- Click failed on `/employees/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(46)[22m

- Click failed on `/employees/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(47)[22m

- Click failed on `/employees/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(48)[22m

- Click failed on `/employees/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/employees/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/employees/new` → `button:Добавить сотрудника`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(53)[22m

- Click failed on `/employees/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(54)[22m

- Click failed on `/operations/daily-logs/new` → `button:Поддержка`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(46)[22m
[2m    - locator resolved to <button dis
- Click failed on `/operations/daily-logs/new` → `button:Clear chat`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(47)[22m

- Click failed on `/operations/daily-logs/new` → `button:Minimize`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(48)[22m

- Click failed on `/operations/daily-logs/new` → `button:Чем могу помочь?`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(49)[22m

- Click failed on `/operations/daily-logs/new` → `button:Explain statuses`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(50)[22m

- Click failed on `/operations/daily-logs/new` → `button:What next`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(51)[22m

- Click failed on `/operations/daily-logs/new` → `button:Слушаю...`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(52)[22m

- Click failed on `/operations/daily-logs/new` → `button:(unlabeled-button)`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(53)[22m

- Click failed on `/operations/daily-logs/new` → `button:Назад`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(57)[22m

- Click failed on `/operations/daily-logs/new` → `button:Добавить участок`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(58)[22m

- Click failed on `/operations/daily-logs/new` → `button:Отмена`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(59)[22m

- Click failed on `/operations/daily-logs/new` → `button:Сохранить`: locator.click: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('button:visible').nth(60)[22m


## [MINOR] Issues — Dead Buttons

- Dead button on `/projects/new` → `button:Свернуть боковое меню`
- Dead button on `/projects/new` → `button:Включить тёмную тему`
- Dead button on `/projects/new` → `button:15`
- Dead button on `/projects/new` → `button:ДКДамир`
- Dead button on `/projects/new` → `button:Открыть ассистента`
- Dead button on `/projects/new` → `button:Справка по странице`
- Dead button on `/projects/new` → `select:Выберите вид строительстваНовое строительствоРекон...`
- Dead button on `/projects/new` → `select:Выберите типЖилой объектКоммерческий объектПромышл...`
- Dead button on `/calendar/events/new` → `button:Свернуть боковое меню`
- Dead button on `/calendar/events/new` → `button:Включить тёмную тему`
- Dead button on `/calendar/events/new` → `button:ДКДамир`
- Dead button on `/calendar/events/new` → `button:Справка по странице`
- Dead button on `/calendar/events/new` → `link:(unlabeled-a)(/kb/screenshots/calendar/calendar.png)`
- Dead button on `/counterparties/new` → `button:Свернуть боковое меню`
- Dead button on `/counterparties/new` → `button:Слушаю...`
- Dead button on `/contracts/new` → `button:Свернуть боковое меню`
- Dead button on `/contracts/new` → `select:Выберите контрагентаE2E-Bad BIK TestE2E-Letters IN...`
- Dead button on `/contracts/new` → `select:Выберите объектUI-Audit-1773339899376E2E-Ценообраз...`
- Dead button on `/contracts/new` → `select:Выберите типГенподрядСубподрядПоставкаПроектирован...`
- Dead button on `/contracts/new` → `select:20%10%0%`
- Dead button on `/contracts/new` → `select:Не указаноС подрядчикамиС заказчиком`
- Dead button on `/contracts/new` → `select:Коммерческий44fz223fzКоммерческий`
- Dead button on `/contracts/new` → `select:—method Открыть tendermethod single ИсточникMethod...`
- Dead button on `/contracts/new` → `select:—Страхование СМРСтроительные рискиПрофессиональная...`
- Dead button on `/crm/leads/new` → `button:Свернуть боковое меню`
- Dead button on `/crm/leads/new` → `button:Слушаю...`
- Dead button on `/crm/leads/new` → `select:НизкийОбычныйВысокий`
- Dead button on `/crm/leads/new` → `select:Не указанСайтРекомендацияХолодный звонокВыставкаТе...`
- Dead button on `/portfolio/opportunities/new` → `button:Свернуть боковое меню`
- Dead button on `/portfolio/opportunities/new` → `button:What next`
- Dead button on `/portfolio/opportunities/new` → `link:(unlabeled-a)(/kb/screenshots/portfolio/opportunities....)`
- Dead button on `/portfolio/opportunities/new` → `link:(unlabeled-a)(/kb/screenshots/portfolio/tenders.png)`
- Dead button on `/portfolio/tenders/new` → `button:Свернуть боковое меню`
- Dead button on `/portfolio/tenders/new` → `button:What next`
- Dead button on `/portfolio/tenders/new` → `button:(unlabeled-button)`
- Dead button on `/portfolio/tenders/new` → `select:Выберите возможностьЖилой комплекс "Звёздный" — вы...`
- Dead button on `/site-assessments/new` → `button:Свернуть боковое меню`
- Dead button on `/site-assessments/new` → `button:Включить тёмную тему`
- Dead button on `/site-assessments/new` → `button:15`
- Dead button on `/site-assessments/new` → `button:ДКДамир`
- Dead button on `/site-assessments/new` → `button:Открыть ассистента`
- Dead button on `/site-assessments/new` → `button:Назад`
- Dead button on `/site-assessments/new` → `button:Справка по странице`
- Dead button on `/site-assessments/new` → `button:(unlabeled-button)`
- Dead button on `/site-assessments/new` → `button:Добавить`
- Dead button on `/site-assessments/new` → `button:Редактировать`
- Dead button on `/site-assessments/new` → `button:Удалить`
- Dead button on `/site-assessments/new` → `button:Редактировать`
- Dead button on `/site-assessments/new` → `button:Удалить`
- Dead button on `/site-assessments/new` → `button:Редактировать`
- Dead button on `/site-assessments/new` → `button:Удалить`
- Dead button on `/site-assessments/new` → `button:Редактировать`
- Dead button on `/site-assessments/new` → `button:Удалить`
- Dead button on `/site-assessments/new` → `button:Редактировать`
- Dead button on `/site-assessments/new` → `button:Удалить`
- Dead button on `/site-assessments/new` → `button:Редактировать`
- Dead button on `/site-assessments/new` → `button:Удалить`
- Dead button on `/site-assessments/new` → `select:Project placeholderUI-Audit-1773339899376E2E-Ценоо...`
- Dead button on `/prequalifications/new` → `button:Свернуть боковое меню`
- Dead button on `/prequalifications/new` → `button:Включить тёмную тему`

... and 70 more

## [UX] Issues — Empty Pages & Slow Loads

None

## Pages with JS Errors

- **New Contract** (`/contracts/new`): 32 error(s)
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`
  - `Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may`

- **New Opportunity** (`/portfolio/opportunities/new`): 1 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

- **New Tender** (`/portfolio/tenders/new`): 1 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

- **New Price Coefficient** (`/price-coefficients/new`): 1 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

- **New Monte Carlo** (`/monte-carlo/new`): 1 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

- **New Employee** (`/employees/new`): 1 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

- **New Daily Log** (`/operations/daily-logs/new`): 1 error(s)
  - `Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asy`

## Modals Opened

- `/calendar/events/new` → `button:15`
- `/prequalifications/new` → `button:15`
- `/monte-carlo/new` → `button:15`

## Navigations Triggered

- `/projects/new` → `button:Расскажи о текущем состоянии проекта` → `/`
- `/projects/new` → `button:What next` → `/`
- `/projects/new` → `button:Слушаю...` → `/projects`
- `/projects/new` → `button:(unlabeled-button)` → `/projects`
- `/projects/new` → `button:Назад` → `/counterparties`
- `/projects/new` → `button:(unlabeled-button)` → `/projects`
- `/calendar/events/new` → `button:Открыть ассистента` → `/settings`
- `/calendar/events/new` → `button:Назад` → `/calendar`
- `/calendar/events/new` → `link:Открыть статью полностью(/help/article/calendar)` → `/help/article/calendar`
- `/counterparties/new` → `button:Minimize` → `/`
- `/counterparties/new` → `button:Чем могу помочь?` → `/counterparties`
- `/counterparties/new` → `button:Explain statuses` → `/counterparties`
- `/counterparties/new` → `button:(unlabeled-button)` → `/counterparties`
- `/crm/leads/new` → `button:Minimize` → `/`
- `/crm/leads/new` → `button:Расскажи о лиде` → `/crm/dashboard`
- `/crm/leads/new` → `button:Explain statuses` → `/crm/leads`
- `/crm/leads/new` → `button:What next` → `/crm/leads`
- `/portfolio/opportunities/new` → `button:Minimize` → `/`
- `/portfolio/opportunities/new` → `button:Explain statuses` → `/portfolio/opportunities`
- `/portfolio/opportunities/new` → `link:CRM: Лиды(crm-leads.md)` → `/portfolio/opportunities/crm-leads.md`
- `/portfolio/tenders/new` → `button:Minimize` → `/`
- `/portfolio/tenders/new` → `button:Explain statuses` → `/portfolio/tenders`
- `/site-assessments/new` → `button:Покажи результаты обследования` → `/`
- `/site-assessments/new` → `button:What next` → `/`
- `/site-assessments/new` → `button:Слушаю...` → `/site-assessments`
- `/site-assessments/new` → `button:(unlabeled-button)` → `/site-assessments`
- `/prequalifications/new` → `button:Открыть ассистента` → `/settings`
- `/prequalifications/new` → `button:Отмена` → `/prequalifications`
- `/estimates/new` → `button:Поддержка` → `/`
- `/estimates/new` → `button:Clear chat` → `/estimates`
- `/estimates/new` → `button:Minimize` → `/estimates`
- `/estimates/new` → `link:Глоссарии(../01-concepts.md)` → `/01-concepts.md`
- `/specifications/new` → `button:Поддержка` → `/`
- `/specifications/new` → `button:Clear chat` → `/specifications`
- `/specifications/new` → `button:Minimize` → `/specifications`
- `/price-coefficients/new` → `button:Поддержка` → `/`
- `/price-coefficients/new` → `button:Minimize` → `/price-coefficients`
- `/price-coefficients/new` → `button:Explain statuses` → `/price-coefficients`
- `/monte-carlo/new` → `button:Открыть ассистента` → `/settings`
- `/monte-carlo/new` → `button:Отмена` → `/monte-carlo`
- `/employees/new` → `button:Открыть ассистента` → `/`
- `/employees/new` → `button:Поддержка` → `/employees`
- `/employees/new` → `button:Minimize` → `/employees`
- `/operations/daily-logs/new` → `button:Включить тёмную тему` → `/operations`
- `/operations/daily-logs/new` → `button:ДКДамир` → `/operations/daily-logs`

## Domain Expert Assessment — Part 3 Specific

### Create/New Form Pages (Groups 26–29)
- ~60 form pages for creating entities across all modules
- **Business rule**: Every form must have required field indicators (*)
- **Business rule**: Reasonable defaults (today's date, current user, current project)
- **Key check**: Form validation fires before submit, error messages are user-friendly
- **Key check**: Back/Cancel returns to list without data loss

### Detail Pages (Groups 30–31)
- ~44 detail pages showing entity data with tabs, actions, related entities
- **Business rule**: Detail page shows all business-critical fields
- **Business rule**: Action buttons respect entity status (can't delete approved items)
- **Key check**: Tabs load content without page reload
- **Key check**: Related entities link correctly (invoice → contract → project)
- **Note**: Using dummy ID "1" — pages may show "not found" gracefully

### Board Views (Group 32)
- 19 Kanban-style board views for visual workflow management
- **Business rule**: Board columns match status transitions (DRAFT→ACTIVE→DONE)
- **Key check**: Cards show summary info, drag-drop columns exist

### Analytics & KPI (Group 33)
- 8 advanced analytics pages: KPI, bonus calculations, predictive, report builder
- **Business rule**: KPIs must show current period data, not stale
- **Key check**: Charts render, filters work, export available

### Settings & Admin (Group 34)
- 14 admin/config pages: API keys, webhooks, audit logs, tenants
- **Business rule**: Admin-only pages must enforce RBAC
- **Key check**: Settings save correctly, audit trail captures changes

### HR Advanced (Group 35)
- 17 HR pages: payroll, recruitment, leave management, crew time tracking
- **Business rule**: Payroll calculations must match Russian labor law
- **Key check**: Leave balance calculations, crew time aggregations

### Estimates Advanced (Group 36)
- 14 pricing/estimate pages: import, export, OCR, analogs, Monte Carlo
- **Business rule**: ЛСР import must match ГЭСН/ФЕР codes correctly
- **Key check**: Import wizard steps, calculation accuracy, export formats

### Misc Routes (Group 37)
- 50+ miscellaneous pages: search, help, KS sub-routes, accounting, workflow
- **Business rule**: Search must find entities across modules
- **Key check**: Breadcrumb navigation, page titles, empty states guide user
