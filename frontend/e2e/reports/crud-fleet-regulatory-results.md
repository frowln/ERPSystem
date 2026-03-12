## CRUD Test Results: Fleet, Regulatory, Planning, Change Orders

### Session 2.8 — 2026-03-12

### Summary
| Entity | Create | Read | Update | Delete | Validation | Calculations | Status Flow | UI Pages | Total |
|--------|--------|------|--------|--------|------------|-------------|-------------|----------|-------|
| Fleet Vehicles | 2 | 3 | 2 | 1 | 2 | - | - | 5 | 15 |
| Waybills | 1 | 2 | - | - | 1 | 2 | 1 | - | 7 |
| Fuel | 1 | 2 | - | - | - | 1 | - | - | 4 |
| Usage Logs | 1 | 1 | 1 | 1 | - | - | - | - | 4 |
| Compliance | - | 2 | - | - | - | - | - | - | 2 |
| **Fleet Total** | **5** | **10** | **3** | **2** | **3** | **3** | **1** | **5** | **32** |
| Regulatory Permits | 2 | 2 | - | - | 1 | 1 | 1 | 2 | 9 |
| Inspections | 1 | 1 | - | - | 1 | - | 1 | 2 | 6 |
| Prescriptions | 1 | 1 | 1 | 1 | - | 1 | 1 | 2 | 8 |
| SRO/Compliance | 1 | 2 | - | - | - | 1 | - | 3 | 7 |
| Cross-Entity | - | - | - | - | - | - | - | 2 | 2 |
| **Regulatory Total** | **5** | **6** | **1** | **1** | **2** | **3** | **3** | **11** | **32** |
| WBS Nodes | 3 | 2 | 1 | 1 | - | - | - | - | 7 |
| Dependencies | 2 | 1 | - | - | - | - | - | - | 3 |
| Critical Path | - | 1 | - | - | - | 2 | - | - | 3 |
| Baselines | 1 | 1 | - | 1 | - | - | - | - | 3 |
| EVM | 1 | 2 | - | 1 | - | 1 | - | - | 5 |
| Resources | 1 | 1 | - | 1 | - | 1 | - | - | 4 |
| Domain Calcs | - | - | - | - | - | 1 | - | 4 | 5 |
| **Planning Total** | **8** | **8** | **1** | **4** | **0** | **5** | **0** | **4** | **30** |
| Change Events | 1 | 2 | - | 1 | - | - | 1 | 2 | 7 |
| Change Orders | 2 | 2 | 1 | 1 | 1 | - | 3 | 4 | 14 |
| Line Items | 1 | 1 | - | 1 | - | 1 | - | - | 4 |
| Impact Analysis | - | 1 | - | - | - | 2 | - | - | 3 |
| Domain Calcs | - | - | - | - | 1 | 3 | - | - | 4 |
| **Change Total** | **4** | **6** | **1** | **3** | **2** | **6** | **4** | **6** | **32** (incl 1 auth) |
| **GRAND TOTAL** | **22** | **30** | **6** | **10** | **7** | **17** | **8** | **26** | **131** (incl auth) |

### Calculations Verified
| Check | Expected | Formula | Status |
|-------|----------|---------|--------|
| Distance (waybill) | 82 км | 45312 - 45230 | Verified |
| Fuel norm (82km@15l/100km) | 12.30 л | 82 × 15.0 / 100 | Verified |
| Fuel actual | 12.00 л | Given | Verified |
| Fuel deviation | -0.30 л (savings) | 12 - 12.30 | Verified |
| Fuel efficiency | 97.6% | 12 / 12.30 | Verified |
| Fuel cost | 2,500.00 ₽ | 40 × 62.50 | Verified |
| Overload ratio | 280% | 4200 / 1500 | Verified |
| Permit expiry (days) | ~675 | 2028-01-15 - 2026-03-12 | Verified |
| Prescription deadline | 31 days | 2026-04-05 - 2026-03-05 | Verified |
| CPI | 0.889 | 12M / 13.5M | Verified |
| SPI | 0.800 | 12M / 15M | Verified |
| CV (Cost Variance) | -1,500,000 ₽ | 12M - 13.5M | Verified |
| SV (Schedule Variance) | -3,000,000 ₽ | 12M - 15M | Verified |
| EAC (Estimate at Completion) | ~50.6M ₽ | 45M / 0.889 | Verified |
| Project duration | 182 days | 15 + 45 + 122 | Verified |
| Total planned cost | 45,000,000 ₽ | 1.5M + 8.5M + 35M | Verified |
| CO line items total | 350,000 ₽ | 250k + 30k + 70k | Verified |
| Revised contract | 45,870,000 ₽ | 45M + 350k + 520k | Verified |
| Change percentage | 1.93% | 870k / 45M × 100 | Verified |
| Total schedule impact | 13 days | 5 + 8 | Verified |
| Resource capacity | 840 hours | 5 × 8 × 21 | Verified |
| Resource utilization | 85% (714h) | 840 × 0.85 | Verified |

### Domain Rules Verified
| Rule | Module | Check |
|------|--------|-------|
| Fuel norm vs actual (±10%) | Fleet | Actual 12l vs norm 12.30l = -2.4% (within ±10%) |
| Overload warning (cargo > payload) | Fleet | 4200kg > 1500kg → should warn |
| Medical exam + mechanic approval | Fleet | Required by Минтранс приказ №152 |
| Waybill status flow | Fleet | DRAFT → ISSUED → COMPLETED |
| Permit expiry alerts (<30 days) | Regulatory | Calculated days remaining |
| Prescription response deadline (30 days) | Regulatory | 31 days verified |
| SRO membership validity | Regulatory | Active status + days remaining |
| Regulatory body types coverage | Regulatory | 5 bodies: ГИТ, Ростехнадзор, Стройнадзор, МЧС, Роспотребнадзор |
| CPI/SPI interpretation | Planning | CPI 0.889 = over budget, SPI 0.800 = behind schedule |
| Zero float = critical path | Planning | Sequential tasks → all critical |
| Over-allocation check (>100%) | Planning | 85% = OK |
| Change order cost = SUM(line items) | Change | 250k + 30k + 70k = 350k ✓ |
| Revised contract = original + changes | Change | 45M + 870k = 45.87M ✓ |
| Change >10% needs owner approval | Change | 1.93% < 10% → OK |
| Status flow: DRAFT → PENDING → APPROVED → EXECUTED | Change | Full flow tested |

### Personas Coverage
| Persona | Module Tests |
|---------|-------------|
| Прораб | Fleet (waybills, fuel), Planning (Gantt, tasks) |
| Бухгалтер | Fleet (fuel costs), Change Orders (budget impact) |
| Директор | Planning (EVM dashboard, CPI/SPI), Change Orders (impact analysis) |
| Инженер-сметчик | Planning (WBS, baselines, EVM), Change Orders (line items) |
| Снабженец | Fleet (vehicles, maintenance), Regulatory (permits) |
