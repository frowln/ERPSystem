# CRUD Test Results: CRM Leads, Support Tickets, Counterparties, Portal

## Summary
| Entity | Create | Read | Update | Delete | Validation | Status Flow | Total | Pass | Fail |
|--------|--------|------|--------|--------|------------|------------|-------|------|------|
| CRM Leads | 2 | 5 | 1 | 2 | 3 | 3 | 24 | TBD | TBD |
| Support Tickets | 3 | 6 | 2 | 1 | 3 | 4 | 25 | TBD | TBD |
| Counterparties | 3 | 4 | 2 | 2 | 6 | N/A | 22 | TBD | TBD |
| Portal | 14 | 9 | N/A | N/A | N/A | 5 | 34 | TBD | TBD |
| **Total** | | | | | | | **105** | | |

## CRM Pipeline
| Stage | Transition Tested | Status |
|-------|------------------|--------|
| NEW → QUALIFIED | D1 | TBD |
| QUALIFIED → PROPOSITION | D1 | TBD |
| PROPOSITION → NEGOTIATION | D1 | TBD |
| Any → WON | D2 | TBD |
| Any → LOST (with reason) | D3 | TBD |
| WON → PROJECT_CREATED | G1 | TBD |

## CRM Activities
| Type | Tested | Status |
|------|--------|--------|
| CALL | E1 | TBD |
| SITE_VISIT | E2 | TBD |
| Activity complete | E1 | TBD |
| Activities list | E3 | TBD |

## Support Ticket Status Flow
| Transition | Test | Status |
|------------|------|--------|
| OPEN → ASSIGNED | C2 | TBD |
| ASSIGNED → IN_PROGRESS | D1 | TBD |
| IN_PROGRESS → RESOLVED | D2 | TBD |
| RESOLVED → CLOSED | D3 | TBD |
| Full flow (fresh ticket) | D4 | TBD |

## Counterparty Validation
| Rule | Tested | Status |
|------|--------|--------|
| Name required | D1 | TBD |
| ИНН 10 or 12 digits | D2 | TBD |
| ИНН letters rejected | D3 | TBD |
| Duplicate ИНН warning | D4 | TBD |
| БИК 9 digits | D5 | TBD |
| UI requisite fields | D6 | TBD |

## Portal Data Isolation
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Dashboard scoped | scoped | TBD | TBD |
| Projects isolated | isolated | TBD | TBD |
| Documents scoped | scoped | TBD | TBD |
| Claims CRUD | works | TBD | TBD |
| KS-2 draft lifecycle | works | TBD | TBD |
| Signatures | works | TBD | TBD |

## Portal Claim Status Flow
| Transition | Test | Status |
|------------|------|--------|
| SUBMITTED → TRIAGED | B2 | TBD |
| TRIAGED → ASSIGNED | B3 | TBD |
| ASSIGNED → IN_PROGRESS | B4 | TBD |
| IN_PROGRESS → VERIFICATION | B5 | TBD |
| VERIFICATION → CLOSED | B6 | TBD |

## Portal Pages Load Test
| Page | Path | Status |
|------|------|--------|
| Dashboard | /portal | TBD |
| Projects | /portal/projects | TBD |
| Documents | /portal/documents | TBD |
| Messages | /portal/messages | TBD |
| Contracts | /portal/contracts | TBD |
| Invoices | /portal/invoices | TBD |
| Tasks | /portal/tasks | TBD |
| KS-2 Drafts | /portal/ks2-drafts | TBD |
| Schedule | /portal/schedule | TBD |
| RFIs | /portal/rfis | TBD |
| Defects | /portal/defects | TBD |
| Signatures | /portal/signatures | TBD |
| Photos | /portal/photos | TBD |
| Daily Reports | /portal/daily-reports | TBD |
| Admin | /portal/admin | TBD |

## Persona Checks
| Persona | Module | Check | Status |
|---------|--------|-------|--------|
| Директор | CRM | Pipeline revenue visible | TBD |
| Директор | Support | Dashboard metrics | TBD |
| Директор | Portal | KPI summary | TBD |
| Директор | Counterparty | Diversity check | TBD |
| Бухгалтер | CRM | Lead sources for ROI | TBD |
| Бухгалтер | Counterparty | All requisites visible | TBD |
| Бухгалтер | Portal | Invoice amounts + НДС | TBD |
| Прораб | Support | Quick create button | TBD |
| Прораб | Portal | Dashboard actionable | TBD |
| Снабженец | Counterparty | Role filters | TBD |
| Снабженец | Portal | RFI creation | TBD |
| Сметчик | Support | Category filter | TBD |

## Issues Found
| # | Entity | Operation | Issue | Severity | Expected | Actual |
|---|--------|-----------|-------|----------|----------|--------|
| | (Run tests to populate) | | | | | |

---

*Generated: 2026-03-12*
*Session: 2.7 — CRM Leads, Support Tickets, Counterparties, Portal*
*Tests: 105 total across 4 entities*
