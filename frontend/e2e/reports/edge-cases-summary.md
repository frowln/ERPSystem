# Edge Cases Audit — Stress Testing Report

> Generated: 2026-03-12
> Tests: 7 phases, ~130 test cases across all forms and pages

## Overview

| Phase | Tests | Scope |
|-------|-------|-------|
| 1. Empty Form Submissions | 18 forms | Every create form — empty submit |
| 2. Invalid Data Types | ~15 | XSS, SQL injection, negative numbers, long strings, dates |
| 3. Network Error Handling | ~68 (10 pages × 6 HTTP codes + offline + timeout + malformed) | API failures, offline, slow |
| 4. Concurrent Operations | 4 | Double-click, stale data, nav during save |
| 5. Navigation Edge Cases | ~17 | 404, URL tampering, deep links, back button |
| 6. Data Boundary Tests | ~22 (16 empty states + overflow + unicode + pagination) | 0 records, long names, large numbers |
| 7. Delete Cascade Safety | 7 | Parent-child deletion (6 entities + soft delete) |

---

## Phase 1: Empty Form Submissions

| # | Form | Validation Errors | API Blocked | Russian Errors | Status |
|---|------|-------------------|-------------|----------------|--------|
| 1 | Project create | TBD | TBD | TBD | PENDING |
| 2 | Task create | TBD | TBD | TBD | PENDING |
| 3 | Invoice create | TBD | TBD | TBD | PENDING |
| 4 | Payment create | TBD | TBD | TBD | PENDING |
| 5 | Employee create | TBD | TBD | TBD | PENDING |
| 6 | Material create | TBD | TBD | TBD | PENDING |
| 7 | Safety incident | TBD | TBD | TBD | PENDING |
| 8 | Defect report | TBD | TBD | TBD | PENDING |
| 9 | Purchase request | TBD | TBD | TBD | PENDING |
| 10 | Contract create | TBD | TBD | TBD | PENDING |
| 11 | Budget create | TBD | TBD | TBD | PENDING |
| 12 | Specification create | TBD | TBD | TBD | PENDING |
| 13 | Change order create | TBD | TBD | TBD | PENDING |
| 14 | Support ticket | TBD | TBD | TBD | PENDING |
| 15 | CRM lead create | TBD | TBD | TBD | PENDING |
| 16 | Counterparty create | TBD | TBD | TBD | PENDING |
| 17 | Work permit create | TBD | TBD | TBD | PENDING |
| 18 | Crew create | TBD | TBD | TBD | PENDING |

## Phase 2: Invalid Data Types

| Test | Input | Expected | Status |
|------|-------|----------|--------|
| XSS `<script>` in project name | `<script>alert("xss")</script>` | Escaped/stripped | PENDING |
| XSS `<img onerror>` in project name | `<img src=x onerror=alert(1)>` | Escaped/stripped | PENDING |
| SQL injection in project name | `'; DROP TABLE projects; --` | Escaped/rejected | PENDING |
| SQL UNION injection | `' UNION SELECT * FROM users --` | Escaped/rejected | PENDING |
| 10K character string | `А` × 10000 | Truncated by maxLength | PENDING |
| Negative price in invoice | `-1000` | Rejected | PENDING |
| Text in number field | `abc` | Rejected | PENDING |
| Huge number (14 digits) | `99999999999999` | Rejected/capped | PENDING |
| End date before start date | start=2027, end=2026 | Validation error | PENDING |
| Emoji in project name | `Проект 🏗️ стройка 🧱` | Preserved or stripped | PENDING |
| Russian guillemets and quotes | `«Жилой "Солнечный" — корп. №3»` | Preserved | PENDING |

## Phase 3: Network Error Handling

| Page | 500 | 404 | 403 | 401→login | 422 | 429 | Offline | Timeout |
|------|-----|-----|-----|----------|-----|-----|---------|---------|
| Projects | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Tasks | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| Invoices | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| Budgets | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| Employees | TBD | TBD | TBD | TBD | TBD | TBD | TBD | — |
| Specifications | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| Materials | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| Safety incidents | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| CRM leads | TBD | TBD | TBD | TBD | TBD | TBD | — | — |
| Dashboard | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## Phase 4: Concurrent Operations

| Test | Expected | Status |
|------|----------|--------|
| Project form: triple rapid click | Max 1 API POST | PENDING |
| CRM lead modal: double click | Max 1 API POST | PENDING |
| Two tabs editing same entity | Conflict/optimistic lock | PENDING |
| Navigate away during save | No crash | PENDING |

## Phase 5: Navigation Edge Cases

| Test | Expected | Status |
|------|----------|--------|
| /projects/999999 | 404 or error | PENDING |
| /projects/abc (invalid ID) | 404 or error | PENDING |
| /totally-fake-route | 404 page | PENDING |
| Path traversal (../../etc/passwd) | Blocked | PENDING |
| Invalid status filter | No crash | PENDING |
| Negative page number | No crash | PENDING |
| XSS in URL param | Not executed | PENDING |
| Deep link after logout | Redirect → login | PENDING |
| Back button after submit | No re-submit | PENDING |
| Refresh on partial form | No crash | PENDING |

## Phase 6: Data Boundary Tests

| Test | Expected | Status |
|------|----------|--------|
| 16 pages with 0 records | Empty state shown | PENDING |
| 500-char project name in list | Truncated/wrapped | PENDING |
| 200-char name in breadcrumb | Truncated | PENDING |
| Russian «» and " and — chars | Preserved | PENDING |
| Emoji in displayed text | Preserved | PENDING |
| 1 billion in budget amount | Formatted, not scientific | PENDING |
| Page 9999 direct access | No crash | PENDING |

## Phase 7: Delete Cascade Safety

| Entity | Confirmation Dialog | Mentions Children | Cancel Works | Status |
|--------|--------------------|--------------------|-------------|--------|
| Project | TBD | TBD | TBD | PENDING |
| Employee | TBD | TBD | TBD | PENDING |
| Counterparty | TBD | TBD | TBD | PENDING |
| Specification | TBD | TBD | TBD | PENDING |
| Budget | TBD | TBD | TBD | PENDING |
| Material | TBD | TBD | TBD | PENDING |
| Soft delete filter | TBD | — | — | PENDING |

---

## Issue Summary

> Populated after test execution

### By Severity
- **[CRITICAL]**: 0
- **[MAJOR]**: 0
- **[MINOR]**: 0
- **[UX]**: 0
- **[MISSING]**: 0

### Issue List
_Populated after live execution against running frontend + backend_
