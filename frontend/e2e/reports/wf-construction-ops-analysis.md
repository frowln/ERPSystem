# WF: Construction Operations — Business Analysis
## Прораб Иванов А.С. — ЖК "Солнечный квартал"

**Date**: 2026-03-12
**Persona**: Site Foreman (Прораб), 18 years experience, 4-person electrical crew
**Scenario**: Full working day — morning planning, daytime execution, defect discovery, evening reporting

---

## 1. Day of a Foreman: Can Everything Be Done in the System?

| Time | Activity | System Support | Verdict |
|------|----------|---------------|---------|
| 07:00 | Morning overview (active orders, crew, defects) | `/operations/dashboard` | Exists but may lack consolidated view |
| 07:30 | Create work orders for the day | `/operations/work-orders` + API | Works via API; UI creation needs testing |
| 08:00 | Start work — change order status | API status change | Works; UI needs quick-action buttons |
| 10:00 | Write off materials to work order | `/warehouse/movements` | Requires complex API payload |
| 12:00 | Update progress (70%) | API update | Works |
| 14:00 | Report defect (bad weld on floor 2) | `/defects` + API | Works; missing photo upload and plan pinning |
| 15:00 | Fix defect, update status | API status workflow | Works; role separation unclear |
| 17:00 | Fill daily log | `/operations/daily-logs` + API | Works; missing structured workforce entry |
| 17:30 | Attach photos to report | Daily log detail | MISSING — no photo attachment |
| 18:00 | Record crew hours (timesheets) | `/timesheets` + API | Works; no overtime validation (>12h) |
| 18:30 | Complete work orders (100%) | API update | Works |

**Overall**: 8 of 11 operations work. 3 gaps (photos, overtime validation, structured workforce entry).

---

## 2. Timing Analysis (Targets vs. Reality)

| Operation | Target | API Performance | UI Estimate | Verdict |
|-----------|--------|-----------------|-------------|---------|
| Create work order | <3 min | <1s (API) | ~2-3 min (form fill) | OK |
| Report defect | <1 min | <1s (API) | ~1-2 min (no photo) | BORDERLINE |
| Fill daily log | <2 min | <1s (API) | ~3-5 min (plain text) | SLOW |
| Write off material | <1 min | Complex payload | ~2-3 min | SLOW |
| Change status | 1 click | <0.5s (API) | Unknown (need quick buttons) | NEEDS UX |

**Conclusion**: API layer is fast. UI layer adds friction. Daily log is the biggest pain point — every day, for every project.

---

## 3. "WhatsApp Test"

> Is it faster for the foreman to send a voice message or fill a form?

| Action | WhatsApp | PRIVOD | Winner |
|--------|----------|--------|--------|
| Report defect | Voice: "Шов на этаже 2 плохой, Петренко переваривай" — 10 sec | Form: title + description + location + severity + assignee — ~90 sec | WhatsApp |
| Daily report | Voice: "Лотки сделали, кабель 80 из 120, Козлов болел" — 15 sec | Form: date + project + weather + work desc + issues + hours — ~180 sec | WhatsApp |
| Material request | Voice: "Нужно 50 крепежей для лотков, этаж 3" — 8 sec | Form: navigate warehouse + find material + enter qty — ~120 sec | WhatsApp |
| Start work order | Voice: N/A (needs system tracking) | 1-click button (if exists) — <5 sec | PRIVOD |
| Record hours | Voice: "Все 8 часов, Морозов 4 часа" — 8 sec | 5 entries × form — ~60 sec | WhatsApp |

**Verdict**: PRIVOD loses on speed for ad-hoc reporting. Solutions:
1. Voice-to-text input for descriptions (AI transcription)
2. Quick templates for daily logs (pre-fill from yesterday)
3. "Quick defect" button: photo → auto-fill location from GPS → voice description
4. Batch timesheet entry (one screen for whole crew)

---

## 4. Comparison with PlanRadar (Defect Management Leader)

### PlanRadar
- Defect = photo + pin on floor plan — **30 seconds**
- Offline-first: works in basement without connection
- Annotations directly on drawings
- Auto-status tracking with SLA timers
- Mobile-first: optimized for one-handed phone use

### PRIVOD
- Defect = text form with fields — **~90 seconds**
- No plan pinning (MISSING)
- No photo upload in defect form (MISSING)
- Status workflow exists (OPEN → IN_PROGRESS → FIXED → VERIFIED)
- Desktop-first design

### GAP Analysis
| Feature | PlanRadar | PRIVOD | Gap | Priority |
|---------|-----------|--------|-----|----------|
| Photo with defect | Yes (camera integration) | No | HIGH | Must-have |
| Pin on floor plan | Yes (core feature) | No | HIGH | Competitive differentiator |
| Offline defect creation | Yes | No (IndexedDB for reports) | MEDIUM | Important for basements/tunnels |
| SLA timer on defect | Yes | Partial (deadline field) | LOW | Nice-to-have |
| Defect statistics (Pareto) | Basic | Yes (/quality/defect-pareto) | N/A | We're ahead |
| Financial model integration | No | Yes | N/A | Our advantage |

**Key Insight**: PlanRadar wins on field UX but has no financial depth. We win on financial chain but lose on field experience. The foreman doesn't care about margins — they care about photos and speed.

---

## 5. Comparison with Buildertrend (Daily Log Leader)

### Buildertrend
- Daily log = template + photo + digital signature — **~45 seconds**
- Pre-filled from schedule (crew auto-populated)
- Weather auto-fetched by location
- Customer portal shows photos to client same day
- PDF export with company branding

### PRIVOD
- Daily log = text fields + manual entry — **~180 seconds**
- No template system (MISSING)
- Manual weather entry
- No customer-visible photo feed
- No signature on reports

### GAP Analysis
| Feature | Buildertrend | PRIVOD | Priority |
|---------|-------------|--------|----------|
| Daily log templates | Yes | No | HIGH — saves 2 min/day |
| Auto weather fetch | Yes (GPS) | No | LOW — nice-to-have |
| Photo gallery in log | Yes | No | HIGH — proof of work |
| Client sees progress photos | Yes (portal) | Partial (portal exists) | MEDIUM |
| Digital signature | Yes | No | MEDIUM — for acceptance acts |
| Pre-filled crew | Yes | No | HIGH — foreman enters same crew daily |

---

## 6. Mobile Adaptation Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Dedicated mobile pages | Exist (/mobile/*) | Functionality needs verification |
| Tablet responsive | Partial | Horizontal scroll issues possible |
| Touch-friendly buttons | Unknown | Need 44px minimum tap targets |
| Offline capability | IndexedDB + sync | Exists for field reports |
| Camera integration | No | Critical for defect photos |
| GPS auto-location | No | Would help with defect location |
| Push notifications | PWA push exists | Notifications for defect SLA |

---

## 7. Offline Scenario

> Foreman in basement without cell signal — what happens?

| Action | Expected | Actual |
|--------|----------|--------|
| View cached data | Should show last-synced | IndexedDB + offline mode exists |
| Create defect | Should queue for sync | Mobile reports: yes. Defects: unknown |
| Take photo | Should save locally | No camera integration |
| Update work order | Should queue | Unknown |
| Sync when online | Auto-sync | Mobile sync exists |

**Verdict**: Offline mode exists for mobile reports but unclear for other modules. Foreman needs offline defect creation at minimum.

---

## Issues Found (Summary)

### CRITICAL (0)
None — basic functionality works.

### MAJOR (potential)
- Timesheet >12h not validated (ТК РФ violation)
- Defect can be closed by reporter (no separation of duties)

### UX (multiple)
- Dashboard missing consolidated morning view
- No quick-start button for work orders
- Daily log form is plain text (no structured workforce entry)
- Material write-off requires complex API structure
- No activity timeline on project detail

### MISSING (multiple)
- Photo upload for defects and daily logs
- Defect pinning on floor plans
- Quality gates (work sequencing enforcement)
- Daily log templates
- Pre-filled crew for timesheets
- Mobile camera integration

---

## Recommendations (Priority Order)

1. **Photo upload for defects** — single most impactful feature for field users. Closes biggest PlanRadar gap.
2. **Daily log templates** — saves 2+ minutes every day. Pre-fill crew, copy yesterday's structure.
3. **Quick defect button** — mobile-first: camera → one-line description → auto-assign → done in 30 sec.
4. **Batch timesheet entry** — one screen: list of crew members, fill hours for all at once.
5. **Quick-action buttons on lists** — "Start" / "Complete" / "Report defect" without opening detail page.
6. **12h overtime validation** — simple backend check, prevents ТК РФ violations.
7. **Floor plan defect pinning** — longer-term but massive competitive advantage.
8. **Activity timeline on project** — auto-aggregated from work orders, defects, daily logs.

---

*Generated by E2E Construction Operations Workflow Test — Session 5.4*
*Persona: Прораб Иванов А.С., 18 лет на стройке*
*"Мне некогда разбираться, должно быть просто как WhatsApp"*
