# WF: Quality + Safety — Business Analysis Report

> Generated: 2026-03-12
> Personas: Инженер по ОТ Сидоров В.М. + Инженер по качеству
> Test file: `e2e/tests/workflows/quality-safety.wf.spec.ts`
> Phases: 6 (A–F), 24 steps, ~300 assertions

---

## Executive Summary

The Quality + Safety workflow tests cover the full lifecycle of a construction site safety engineer and quality engineer. The test validates:

1. **Safety preparedness** (briefings, training, PPE, SOUT)
2. **Safety inspections** (checklists, violations, prescriptions)
3. **Incident management** (registration, investigation, corrective actions)
4. **Quality management** (material inspection, defects, NCR, tolerances, certificates)
5. **Regulatory compliance** (permits, licenses, SRO, ГСН preparation)
6. **Cross-module chains** (incident→training→re-inspection, defect→fix→verification)

---

## Module Coverage

### Safety Module (13 pages verified)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Safety Dashboard | `/safety` | ✅ Renders | KPI cards, tabs, chart |
| Incident List | `/safety/incidents` | ✅ Renders | Tabs, metrics, severity column |
| Incident Detail | `/safety/incidents/:id` | ✅ Renders | Status workflow, timeline |
| Incident Form | `/safety/incidents/new` | ✅ Via API | Full CRUD |
| Inspection List | `/safety/inspections` | ✅ Renders | Score column, tabs |
| Inspection Form | `/safety/inspections/new` | ✅ Via API | Full CRUD |
| Briefing List | `/safety/briefings` | ✅ Renders | Attendee tracking, overdue |
| Training Journal | `/safety/training-journal` | ✅ Renders | Validity tracking |
| PPE Management | `/safety/ppe` | ✅ Renders | Tabs, categories, expiry |
| SOUT Card | `/safety/sout` | ✅ Renders | Condition classes |
| Safety Metrics | `/safety/metrics` | ✅ Renders | LTIFR, TRIR, charts |
| Compliance | `/safety/compliance` | ✅ Renders | Regulatory checklist |
| Violations | `/safety/violations` | ✅ Renders | Tracking, deadlines |
| Accident Acts N-1 | `/safety/accident-acts` | ✅ Renders | Legal form N-1 |
| Certification Matrix | `/safety/certification-matrix` | ✅ Renders | Employee×cert grid |
| Worker Certs | `/safety/worker-certs` | ✅ Renders | Expiry tracking |

### Quality Module (9 pages verified)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Quality List | `/quality` | ✅ Renders | Tabs, metrics |
| Material Inspection | `/quality/material-inspection` | ✅ Renders | Incoming QC |
| Defect Register | `/quality/defect-register` | ✅ Renders | Unified defect list |
| Supervision Journal | `/quality/supervision-journal` | ✅ Renders | Author oversight |
| Tolerance Rules | `/quality/tolerance-rules` | ✅ Renders | Quality thresholds |
| Tolerance Checks | `/quality/tolerance-checks` | ✅ Renders | Verification results |
| Certificates | `/quality/certificates` | ✅ Renders | Material cert storage |
| Punchlist | `/punchlist/items` | ✅ Renders | Pre-handover items |

### Regulatory Module (8 pages verified)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Regulatory Dashboard | `/regulatory/dashboard` | ✅ Renders | Status overview |
| Permits | `/regulatory/permits` | ✅ Renders | Construction permits |
| Licenses | `/regulatory/licenses` | ✅ Renders | Company licenses |
| SRO Licenses | `/regulatory/sro-licenses` | ✅ Renders | SRO membership |
| Compliance | `/regulatory/compliance` | ✅ Renders | Requirements checklist |
| Inspection Prep | `/regulatory/inspection-prep` | ✅ Renders | ГСН preparation |
| Inspection History | `/regulatory/inspection-history` | ✅ Renders | Past inspections |
| Prescriptions Journal | `/regulatory/prescriptions-journal` | ✅ Renders | Prescription tracking |
| Prescriptions | `/regulatory/prescriptions` | ✅ Renders | CRUD |

---

## Business Logic Validation

### 1. Безопасность: обязательные журналы

| Журнал | Статус | Примечание |
|--------|--------|------------|
| Журнал инструктажей | ✅ | 5 видов: вводный, первичный, повторный, внеплановый, целевой |
| Журнал обучения | ✅ | Срок действия, протокол |
| Журнал выдачи СИЗ | ✅ | Категории, сроки носки, состояние |
| Журнал инцидентов | ✅ | Серьёзность, расследование, корректирующие меры |
| Журнал проверок | ✅ | Чек-лист, баллы, замечания |

### 2. Качество: цепочка входной контроль → дефекты → устранение → повторная проверка

- **Входной контроль материалов**: ✅ Страница есть, решение допущен/отклонён
- **Реестр дефектов**: ✅ Единый список с фильтрами
- **Устранение**: ⚠️ Статусная модель есть, но re-inspection workflow не формализован
- **Повторная проверка**: ⚠️ Нет формального требования повторной проверки перед закрытием дефекта

### 3. Регуляторика: готовность к проверке ГСН

- **Разрешение на строительство**: ✅ Страница permits
- **Лицензии**: ✅ Отдельная страница
- **СРО**: ✅ Реестр членства
- **Подготовка к проверке**: ✅ Чек-лист подготовки
- **История проверок**: ✅ Архив
- **Журнал предписаний**: ✅ Отслеживание

### 4. Сравнение с конкурентами

| Возможность | PlanRadar | HubEx | 1С | PRIVOD | Вердикт |
|-------------|-----------|-------|-----|--------|---------|
| Дефекты с фото на плане | ++++ | ++ | — | + | GAP: нужна привязка к плану |
| Мобильные инспекции | ++++ | +++ | — | + | GAP: нужен mobile-first |
| LTIFR/TRIR расчёт | ++ | — | + | +++ | WIN: мы лучше |
| Акт Н-1 | — | — | +++ | ++ | OK: есть, но нужна выгрузка |
| Инструктажи журнал | — | — | +++ | +++ | OK: на уровне 1С |
| СИЗ учёт | — | — | +++ | ++ | OK: есть, нужны уведомления |
| ISO 9001 NCR | + | — | + | + | Стартовая реализация |
| Входной контроль | — | — | ++ | ++ | OK: основная функциональность |

### 5. Опасные пробелы (обязательное для РФ, НЕ реализовано)

1. **Автоматическое уведомление ГИТ** при тяжёлом НС — система должна формировать уведомление
2. **Акт Н-1 PDF-генерация** — юридический документ, должен выгружаться по стандартной форме
3. **Привязка дефектов к плану этажа** — PlanRadar лидер, у нас пока нет
4. **Повторная проверка при закрытии дефекта** — формализованный workflow
5. **Просроченные СИЗ → автоматическая блокировка допуска** — привязь просрочена = запрет на высотные работы

### 6. Акт Н-1

- Страница `/safety/accident-acts` существует и рендерится
- Форма Н-1 упоминается в UI
- **GAP**: нет кнопки генерации PDF по стандартной форме Н-1

### 7. KPI безопасности

- **LTIFR**: ✅ Отображается на /safety/metrics
- **TRIR**: ✅ Отображается
- **Бенчмарк по отрасли**: ✅ Есть сравнение
- **Тренд-график**: ✅ Визуализация

---

## Issue Severity Distribution (Estimated)

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 1-2 | PPE expiry alerts, incident notification to GIT |
| MAJOR | 3-5 | API creation failures, accountability gaps in violations |
| MINOR | 3-5 | Missing metrics, label issues |
| UX | 8-12 | Missing UI features, information gaps |
| MISSING | 4-6 | GIT notification, Act N-1 PDF, defect→plan linkage, NCR formalization |

---

## Recommendations (Priority Order)

### HIGH Priority
1. **Act N-1 PDF generation** — legally required, add PDF template + download button
2. **GIT notification workflow** — for severe incidents, auto-generate notification form
3. **PPE expiry → access block** — link expired PPE to work access restrictions
4. **Defect re-inspection gate** — require inspector sign-off before defect closure

### MEDIUM Priority
5. **Defects on floor plan** — like PlanRadar, pin defects on uploaded PDF/DWG plans
6. **Mobile safety inspection** — offline-capable checklist on tablets
7. **NCR formalization** — separate NCR entity with ISO 9001 required fields
8. **Cross-module linking** — incident → corrective action → training (with traceability)

### LOW Priority
9. **Consolidated expiry dashboard** — one page showing all expiring documents
10. **SOUT integration** — link SOUT results to employee condition class bonuses
11. **Regulatory calendar** — auto-scheduling for mandatory inspections/trainings
12. **Competitive analysis widget** — show how our safety metrics compare to industry

---

## Test Architecture

```
quality-safety.wf.spec.ts
├── Phase A: Охрана труда — подготовка (Steps 1-5)
│   ├── Safety dashboard → KPI cards, metrics
│   ├── Briefings → вводный + первичный (API create)
│   ├── Training journal → работа на высоте (API create)
│   ├── PPE management → выдача СИЗ
│   └── SOUT → 426-ФЗ compliance
├── Phase B: Проверки (Steps 6-9)
│   ├── Planned inspection → электробезопасность (API create)
│   ├── Violations → prescriptions (2 pages)
│   ├── Safety metrics → LTIFR, TRIR, trends
│   └── Compliance → regulatory requirements
├── Phase C: Инцидент (Steps 10-12)
│   ├── Incident registration → электротравма (API create)
│   ├── Investigation → комиссия, Акт Н-1
│   └── Corrective actions → 4 мероприятия
├── Phase D: Качество (Steps 13-18)
│   ├── Quality dashboard → metrics, pass rate
│   ├── Material inspection → входной контроль
│   ├── Defect register + supervision journal
│   ├── NCR → ISO 9001
│   ├── Tolerance rules + checks
│   └── Material certificates
├── Phase E: Регуляторика (Steps 19-21)
│   ├── Permits + Licenses + SRO
│   ├── Regulatory dashboard + compliance
│   └── Inspection prep + history + prescriptions
├── Phase F: Сквозные проверки (Steps 22-24)
│   ├── Incident → Investigation → Actions → Training → Re-inspection
│   ├── Defect → Prescription → Fix → Re-inspection
│   └── Expired documents consolidated view
└── Cleanup: E2E-* entity deletion + issue summary
```

Total pages visited: ~30
Total API entities created: ~10-15
Total assertions: ~300
