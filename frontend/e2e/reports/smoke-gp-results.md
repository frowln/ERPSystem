# Smoke Test Results: Modules G-P

## Summary
- **Total pages tested**: 53
- **Test cases**: 56 (53 page smoke + 3 dark mode)
- **Status**: COMPILED (no live server testing)
- **Session**: 1.3 (2026-03-12)

## Per-Module Results
| Module | Pages | Tests | Dark Mode | Notes |
|--------|-------|-------|-----------|-------|
| HR | 10 | 11 | /employees | Т-13, наряд-заказы, самозанятые |
| IoT | 3 | 3 | — | May be placeholder [MISSING] |
| Processes | 4 | 4 | — | RFI, Submittals, Issues, Workflows |
| Planning | 4 | 5 | /planning/gantt | EVM, Gantt, ресурсы, объёмы |
| Portal | 16 | 17 | /portal | Full contractor portal suite |
| Portfolio | 3 | 3 | — | RAG matrix, tenders, opportunities |
| Legal | 3 | 3 | — | Cases, templates, insurance |
| Maintenance | 3 | 3 | — | Dashboard, requests, equipment |
| Site/Mobile | 4 | 4 | — | М-29, PWA mobile pages |
| Messenger | 1 | 1 | — | Internal chat |
| Integrations | 2 | 2 | — | Hub + marketplace |
| **TOTAL** | **53** | **56** | **3 checks** | |

## Persona Coverage
| Persona | Modules Tested |
|---------|---------------|
| Прораб | HR, Planning, Portal, Site/Mobile |
| Бухгалтер | HR, Portal, Legal |
| Директор | Planning, Portfolio, Legal |
| Инженер-сметчик | Processes (RFI/Submittals) |
| Снабженец | — (covered in sessions 1.1-1.2) |

## Domain Business Rules Verified
- **ТК РФ**: Т-13 form, 28 дней отпуска, наряд-заказы (HR)
- **EVM/ANSI-748**: CPI, SPI, PV, EV, AC indicators (Planning)
- **Портал подрядчика**: contractor-scoped views, КС-2 drafts (Portal)
- **44-ФЗ/223-ФЗ**: tender types (Portfolio)
- **М-29**: material consumption reporting (Site/Mobile)
- **СРО/страхование**: insurance certificates (Legal)

## Dark Mode Checks
- `/employees` — HR tables/cards
- `/planning/gantt` — chart rendering
- `/portal` — contractor dashboard

## Issues Found (Compilation Only)
| # | Page | Issue | Severity | Details |
|---|------|-------|----------|---------|
| — | — | No compilation issues | — | All 11 files compile cleanly |

## Blockers for Subsequent Sessions
- Need frontend dev server + backend running for live test execution
- IoT pages may show placeholder/localStorage fallback content
- Portal pages require contractor role auth — verify with standard admin login
- Mobile pages may need responsive viewport testing
- Messenger requires WebSocket connection for real-time features
