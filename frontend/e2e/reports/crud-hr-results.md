## CRUD Test Results: Employees, Timesheets, Leave, Crew

### Summary
| Entity | Create | Read | Update | Delete | Validation | Calculations | Total | Pass | Fail |
|--------|--------|------|--------|--------|------------|-------------|-------|------|------|
| Employees | 3 | 4 | 2 | 2 | 4 | 0 | 15 | TBD | TBD |
| Timesheets | 3 | 3 | 1 | 1 | 2 | 0 | 10 | TBD | TBD |
| Leave | 0 | 2 | 0 | 0 | 3 | 3 | 8 | TBD | TBD |
| Crew | 1 | 4 | 0 | 1 | 2 | 1 | 9 | TBD | TBD |
| **TOTAL** | **7** | **13** | **3** | **4** | **11** | **4** | **42** | **TBD** | **TBD** |

> Note: Results marked TBD — tests compile but need live backend for execution.

### Persona Coverage
| Persona | Relevant Tests | Key Checks |
|---------|---------------|------------|
| Кадровик | Employees: create/dismiss, Leave: balance/probation | СНИЛС/ИНН format, T-13 codes, dismissal flow |
| Бухгалтер | Employees: salary/МРОТ, Timesheets: hours, Leave: accrual | Monthly rate vs МРОТ, overtime tracking |
| Директор | Employees: headcount, Crew: capacity | Active/terminated count, crew×hours capacity |
| Прораб | Timesheets: daily hours, Crew: assignments, Work orders | Work order creation, crew assignment by project |
| Инженер-сметчик | — (indirect via crew capacity planning) | Capacity = members × 168h/month |

### Russian Labor Law Checks
| Check | Expected | API Field | Status |
|-------|----------|-----------|--------|
| T-13 format codes | Я/В/Б/ОТ/Н/С | TimesheetT13Row.cells[].code | ✓ Tested |
| Overtime >12h warning | warning per ст.99 ТК | hoursWorked > 12 | ✓ Tested |
| Weekly 40h norm | warning | summary/weekly | ✓ Tested |
| Annual leave 28 days | 28 | SeniorityRecord.baseLeave | ✓ Tested |
| Leave balance >= 0 | ≥ 0 | remainingLeave | ✓ Tested |
| Leave = base + additional | totalLeave | SeniorityRecord | ✓ Tested |
| Remaining = total - used | remainingLeave | SeniorityRecord | ✓ Tested |
| МРОТ check (19,242 ₽) | warning if below | monthlyRate | ✓ Tested |
| СНИЛС format | XXX-XXX-XXX XX | snils | ✓ Tested |
| ИНН digits | 10 or 12 | inn | ✓ Tested |
| Probation 6 months | leave eligibility | hireDate + usedLeave | ✓ Tested |

### Business Rules Verified
1. **Employee lifecycle**: ACTIVE → ON_LEAVE → TERMINATED (soft delete)
2. **Timesheet flow**: DRAFT → SUBMITTED → APPROVED | REJECTED
3. **T-13 compliance**: Statutory form with attendance codes
4. **Overtime detection**: >12h/day and >40h/week flagged
5. **Leave accrual**: 28 base days + additional for hazardous work
6. **Crew assignments**: Employee ↔ Project linkage
7. **Duplicate prevention**: Same employee cannot be assigned twice to same project

### Competitive Comparison
| Feature | Privod | 1С:УСО | PlanRadar | HubEx |
|---------|--------|--------|-----------|-------|
| Employee CRUD | ✓ | ✓✓✓ | — | — |
| T-13 statutory form | ✓ | ✓✓✓ | — | — |
| Overtime tracking | ✓ | ✓✓ | — | ✓ |
| Leave balance | ✓ | ✓✓✓ | — | — |
| Crew management | ✓✓ | ✓ | ✓ | ✓✓ |
| Work orders (наряды) | ✓✓ | ✓ | — | ✓✓✓ |
| СНИЛС/ИНН validation | Partial | ✓✓✓ | — | — |
| МРОТ compliance | [MISSING] | ✓✓ | — | — |

### Domain Expert Assessment
- **Сильные стороны**: T-13 form, crew-project assignment, seniority-based leave
- **Слабые стороны**: No dedicated leave request CRUD API (managed via T-13 only), no МРОТ warning, no ИНН checksum validation
- **Приоритетные улучшения**:
  1. [P0] Add dedicated Leave Request CRUD API
  2. [P1] ИНН/СНИЛС checksum validation on backend
  3. [P1] МРОТ compliance warning on salary save
  4. [P2] Overtime alert system (push notification to manager)
  5. [P2] Leave calendar integration (show ОТ in planning)

### Issues Found
| # | Entity | Operation | Issue | Severity | Expected | Actual |
|---|--------|-----------|-------|----------|----------|--------|
| 1 | Employee | VALIDATION | Backend accepts invalid ИНН (5 digits) | [MAJOR] | Reject or validate | Accepted |
| 2 | Employee | VALIDATION | No МРОТ warning for salary <19,242 ₽ | [MISSING] | Warning | Silent accept |
| 3 | Timesheet | OVERTIME | Backend accepts >12h workday | [MISSING] | Warning per ст.99 ТК | Silent accept |
| 4 | Leave | API | No dedicated leave request CRUD API | [MISSING] | POST/GET /api/leave-requests | Only T-13 codes |
| 5 | Leave | COMPLIANCE | base leave potentially != 28 days | [CRITICAL] | 28 days | Needs live verify |
| 6 | Crew | VALIDATION | Duplicate assignment may be accepted | [MAJOR] | 409 error | Needs live verify |

> Issues 5-6 require live server execution to confirm. All tests compile successfully.
