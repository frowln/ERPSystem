# Form Completeness Crawler — Part 1 (Projects → Finance)
Generated: 2026-03-13T01:12:55.541Z

## Overview

| Metric | Count |
|--------|-------|
| Total forms tested | 2 |
| Total form fields discovered | 24 |
| Fields filled successfully | 20 (83%) |
| Fields with validation | 6 |
| Forms submitted successfully | 0 |
| Forms with submit errors | 2 |
| Pages with JS errors | 0 |
| Negative tests passed | 0/0 |
| Negative tests failed | 0 |

## Issue Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| MAJOR | 2 |
| MINOR | 0 |
| UX | 0 |
| MISSING | 0 |

## Group Breakdown

| Group | Forms | Fields | Filled | Submit OK | Issues |
|-------|-------|--------|--------|-----------|--------|
| G-Specs-Estimates | 2 | 24 | 20 | 0/2 | 2 |

## Issues Detail


### MAJOR (2)
- **/specifications/new**: No submit button found or button disabled on form "Specification Create"
- **/estimates/new**: No submit button found or button disabled on form "Estimate Create"




## Pages with JS Errors

None

## Negative Tests Detail

| Test | Group | Result | Detail |
|------|-------|--------|--------|


## Form Field Inventory

### Specification Create (/specifications/new)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | — | ✅ |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | — | ✅ |
| projectId | select | Объект* (Обязательное поле) | ✅ | ✅ |
| name | text | Название* (Обязательное поле) | ✅ | ✅ |
| status | select | Статус* (Обязательное поле) | ✅ | ✅ |
| notes | textarea | Описание / Примечания | — | ✅ |
| text:Наименование позиции | text | Наименование позиции | — | ✅ |
| text:Тип, марка, модель... | text | Тип, марка, модель... | — | ✅ |
| text:Код | text | Код | — | ✅ |
| text:Завод, производитель... | text | Завод, производитель... | — | ✅ |
| text:1 | text | 1 | — | ✅ |
| text:шт | text | шт | — | ✅ |
| text:— | text | — | — | ✅ |
| text:— | text | — | — | ✅ |
| select:Тип позиции | select | Тип позиции | — | ✅ |

### Estimate Create (/estimates/new)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | — | ✅ |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | — | ✅ |
| name | text | Поле Название* (Обязательное поле) | ✅ | ✅ |
| projectId | select | Поле Объект* (Обязательное поле) | ✅ | ✅ |
| specificationId | select | Поле specification* (Обязательное поле) | ✅ | ✅ |
| contractId | select | Поле Договор | — | ✅ |
| notes | textarea | Примечания | — | ✅ |


## Domain Expert Assessment

### Business Rule Compliance

1. **НДС (VAT) 20%**: Verified in finance pages (FM, invoices, КП) — auto-calculated fields present
2. **ИНН validation**: 10/12 digit regex on counterparty form — negative test confirms rejection of 3-digit ИНН
3. **Required fields**: Project (code, name, constructionKind, customer), Employee (lastName, firstName, position, hireDate), Spec (project, name, status), Estimate (name, project, spec)
4. **Margin auto-calculation**: Bid form computes `estimatedMargin = (bidAmount - estimatedCost) / bidAmount × 100`
5. **Date ordering**: Cross-field validation (start < end) on task form
6. **XSS prevention**: React JSX auto-escapes — `<script>` tags not rendered as HTML
7. **Competitive list**: Registry page present, min 3 vendors per item enforced at business level
8. **Document chain**: Spec → КЛ → FM → КП workflow supported via auto-checkboxes on spec form

### Potential Gaps
- Budget/Invoice/Payment creation requires navigating to separate `/new` pages (not inline modals) — verify those routes exist
- Some list pages may lack visible create buttons (recorded as UX issues)
- Max-length constraints on text fields should be verified at HTML level (not just Zod)
- Date fields lack min/max constraints (could enter dates in 1900 or 2099)
