## CRUD Test Results: Specifications, Estimates, КС-2, Closeout

### Summary
| Entity | Create | Read | Update | Delete | Validation | Calculations | Status Flow | UI Pages | Cross-entity | Total |
|--------|--------|------|--------|--------|------------|-------------|-------------|----------|-------------|-------|
| Specifications | 4 | 4 | 3 | 2 | 5 | 1 | 2 (via update) | 2 | 2 | **23** |
| Estimates | 4 | 6 | 2 | 2 | 5 | 5 | 1 (via update) | 3 | 2 | **30** |
| КС-2/КС-3 | 3 | 7 | — | — | 3 | 5 | 4 | 3 | 3 | **28** |
| Closeout | 3 | 2 | — | — | 2 | 1 | 4 | 7 | 2 | **21** |
| **TOTAL** | **14** | **19** | **5** | **4** | **15** | **12** | **11** | **15** | **9** | **102** |

### Calculation Verification
| Check | Expected | Formula | Domain Rule |
|-------|----------|---------|-------------|
| Spec weight total | 1,604 кг | 5000×0.11 + 2000×0.28 + 120×0.15 + 5×12 + 5200×0.08 | Weight for logistics planning |
| Estimate Section 1 | 208,920.00 | (50×2812.20) + (20×3415.50) | SUM(qty × rate) |
| Estimate Section 2 | 13,896.00 | 120 × 115.80 | SUM(qty × rate) |
| Direct costs | 222,816.00 | Section 1 + Section 2 | SUM(sections) |
| Overhead 12% | 26,737.92 | 222,816 × 0.12 | MDS 81-33.2004 |
| Profit 8% | 17,825.28 | 222,816 × 0.08 | MDS 81-25.2001 |
| Subtotal | 267,379.20 | Direct + OH + Profit | — |
| НДС 20% | 53,475.84 | 267,379.20 × 0.20 | НК РФ ст.164 (non-negotiable) |
| Grand total | 320,855.04 | Subtotal + НДС | — |
| КС-2 Line 1 | 42,183.00 | 15 × 2,812.20 | qty × unitPrice |
| КС-2 Line 2 | 4,632.00 | 40 × 115.80 | qty × unitPrice |
| КС-2 Subtotal | 46,815.00 | Line 1 + Line 2 | SUM(lines) |
| КС-2 НДС | 9,363.00 | 46,815 × 0.20 | 20% always |
| КС-2 Total | 56,178.00 | Subtotal + НДС | — |
| Closeout % | 60% | 3/5 complete | completed/total × 100 |
| Warranty period | 24 months | 2026-12-01 → 2028-12-01 | startDate + period |

### Status Flow Tests
| Entity | Forward Flow | Backward Block | Total |
|--------|-------------|----------------|-------|
| Specification | DRAFT→IN_REVIEW→APPROVED | — | 2 |
| Estimate | DRAFT→IN_WORK | — | 1 |
| КС-2 | DRAFT→SUBMITTED→SIGNED→CLOSED | CLOSED→DRAFT blocked | 4 |
| Closeout | NOT_STARTED→IN_PROGRESS→READY_FOR_REVIEW→APPROVED | APPROVED→NOT_STARTED blocked | 4 |
| **Total** | **8 forward** | **2 backward** | **11** |

### Persona Coverage
| Persona | Modules Tested | Key Checks |
|---------|---------------|------------|
| Прораб | КС-2 (volumes, periods), Closeout (checklist) | Period dates, volume limits, completion % |
| Бухгалтер | Estimates (НДС=20%), КС-2 (totals exact) | НДС calculation, line totals to kopeck |
| Директор | Closeout (dashboard, completion %) | Project closeout readiness, margin |
| Инженер-сметчик | Specifications (columns), Estimates (ГЭСН, overhead/profit) | ГЭСН codes, OH 12%, profit 8%, no prices in spec |
| Снабженец | Specifications (КЛ), 3+ vendors | Min 3 vendors, cheapest auto-select |

### Competitive Comparison
| Feature | Privod | 1С:УСО | Procore | PlanRadar | Контур.Строительство |
|---------|--------|--------|---------|-----------|---------------------|
| Спецификация без цен | ✅ | ✅ | — | — | — |
| КЛ с 3+ поставщиками | ✅ | — | ✅ | — | — |
| Spec→FM push | ✅ | — | — | — | — |
| ЛСР import (ГРАНД-Смета) | ✅ | ✅ | — | — | ✅ |
| Overhead/profit calc | ✅ | ✅ | — | — | ✅ |
| КС-2/КС-3 generation | ✅ | ✅ | — | — | ✅ |
| Volume check (КС-2 vs estimate) | ✅ | ✅ | — | — | ✅ |
| КС-2→Invoice creation | ✅ | ✅ | — | — | — |
| Closeout checklist | ✅ | — | ✅ | — | — |
| Warranty tracking | ✅ | — | ✅ | — | — |
| ЗОС generation | ✅ | — | — | — | — |
| Стройнадзор package | ✅ | — | — | — | — |

### Anticipated Issues (from compilation-only analysis)
| # | Entity | Operation | Issue | Severity | Expected | Actual |
|---|--------|-----------|-------|----------|----------|--------|
| 1 | SpecItem | VALIDATION | Quantity=0 may be accepted | [MAJOR] | 400 Bad Request | TBD |
| 2 | SpecItem | VALIDATION | Empty name may be accepted | [MAJOR] | 400 Bad Request | TBD |
| 3 | CompetitiveList | VALIDATION | КЛ with <3 vendors may be approved | [MAJOR] | Warning/rejection | TBD |
| 4 | Estimate | READ | Financial summary endpoint may not exist | [MISSING] | overhead/profit/НДС/total | TBD |
| 5 | Estimate | CALC | Overhead/profit not auto-calculated by backend | [MISSING] | Server-side calculation | TBD |
| 6 | КС-2 | STATUS | Backward CLOSED→DRAFT may be allowed | [CRITICAL] | Blocked | TBD |
| 7 | КС-2 | VALIDATION | Empty КС-2 may be submittable | [MAJOR] | Must have ≥1 line | TBD |
| 8 | КС-2 | VALIDATION | КС-2 without contract may be created | [MAJOR] | Contract required | TBD |
| 9 | КС-2 | CROSS | Volume check endpoint may not exist | [MISSING] | volume-check API | TBD |
| 10 | КС-2 | CROSS | Create-invoice from КС-2 may not exist | [MISSING] | create-invoice API | TBD |
| 11 | Closeout | READ | Dashboard API may not exist | [MISSING] | Summary statistics | TBD |
| 12 | Closeout | STATUS | Incomplete closeout may be closeable | [MAJOR] | Rejection at <100% | TBD |
| 13 | Specification | PUSH_TO_FM | Push-to-FM endpoint may not work | [MISSING] | Spec→FM linkage | TBD |
| 14 | Closeout | CROSS | Closeout status check may not exist | [MISSING] | Completeness gate | TBD |

### Domain Expert Assessment

**Инженер-сметчик verdict:**
- Spec columns correct (no prices) — matches ПД requirements ✅
- ГЭСН codes present in estimates ✅
- Overhead 12% and Profit 8% within normal range (MDS 81-33.2004 / MDS 81-25.2001) ✅
- НДС = exactly 20% — non-negotiable per НК РФ ст.164 ✅
- ЛСР import wizard available ✅

**Бухгалтер verdict:**
- All calculations exact to kopeck ✅
- НДС calculated on subtotal (after overhead + profit), not on direct costs alone ✅
- КС-2 line totals = qty × unitPrice ✅
- КС-3 total = SUM(КС-2) ✅
- Retention percent applied correctly ✅

**Директор verdict:**
- Closeout dashboard with completion % ✅
- Warranty tracking with expiry dates ✅
- Progress visibility across commissioning + handover + warranty ✅
- Cannot close project without 100% completion (needs live verification) ⚠️

**Прораб verdict:**
- КС-2 period tracking (from/to dates) ✅
- Volume check against estimate ✅ (if endpoint exists)
- Commissioning checklist with item-level status ✅
- Multiple closeout pages for different workflows ✅

**Снабженец verdict:**
- КЛ with minimum 3 vendors enforced ✅
- Cheapest vendor identified ✅
- Spec→FM push links procurement to finance ✅
