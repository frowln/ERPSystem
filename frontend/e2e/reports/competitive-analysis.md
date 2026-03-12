# Competitive Analysis — PRIVOD Construction ERP
## 12 Competitors × 30 Feature Categories × 244 Navigation Items

**Date:** 2026-03-12
**Method:** Web research (official sites, reviews, pricing pages, API docs)
**Scope:** 8 Russian + 4 international competitors

---

## Table of Contents

1. [Competitor Profiles](#competitor-profiles)
2. [Feature Comparison Matrix](#feature-comparison-matrix)
3. [Features Only We Have (USPs)](#1-features-only-we-have-our-advantages)
4. [Features We're Missing](#2-features-competitors-have-that-we-dont-missing)
5. [Features Where Competitors Do It Better](#3-features-where-competitors-do-it-better-improve)
6. [Pricing Analysis](#4-pricing-analysis)
7. [Market Positioning](#5-market-positioning)
8. [Feature Roadmap Recommendation](#6-feature-roadmap-recommendation)
9. [UX/Design Ideas to Implement](#7-uxdesign-ideas-to-implement)

---

## Competitor Profiles

---

### 1. 1С:Управление строительной организацией 2 (1С:УСО 2)

**Website:** https://solutions.1c.ru/catalog/uso2
**Target market:** Medium to large enterprise (50–5000+ users); general contractors, developers, vertically-integrated holdings
**Pricing:**
- Base license: ~779,800 ₽ (one-time)
- Per-seat: from ~8,500 ₽/seat (tiered: 1–1000 seats)
- 500-seat client license: ~5,077,800 ₽
- ITS support subscription: ~68,400 ₽/year (mandatory)
- Implementation: 6–24 months, 3–15M ₽+ typical

**Strengths:**
- Deepest estimate engine in Russia (ГЭСН/ФЕР/ТЕР native, identical to "Смета 3")
- Full КС-2/КС-3/КС-6а generation from work execution documents
- BIM 4D/5D via Renga integration (cost on 3D model, IFC, Aristos 3D mobile viewer)
- Complete regulated accounting + payroll per RF law (integrated 1С:Бухгалтерия)
- Fleet management, real estate, HR/payroll — all native
- Massive partner network (1С:Франчайзи) across all regions
- Dominant market position — most Russian construction companies already have 1С

**Weaknesses:**
- UI/UX significantly behind modern standards ("интерфейс 2005 года")
- Implementation: 6–24 months, very high consulting costs
- Mobile is a thin wrapper over desktop forms — not purpose-built for field use
- No client/contractor portal (requires custom development)
- Safety module is separate product with separate license
- No construction quality/punch list module in base
- Very high TCO for mid-market companies

**Unique features we don't have:**
- [MISSING-HIGH] Full regulated accounting + tax declarations (бух.отчётность, налоговые декларации)
- [MISSING-HIGH] BIM 5D cost estimation tied to Renga 3D model elements
- [MISSING-MEDIUM] Investment management for developer/holding lifecycle
- [MISSING-MEDIUM] Real estate management (rental, meter readings, receipts)
- [MISSING-LOW] Native bank-client integration

**UX ideas to borrow:**
- КС-6а journal of works — daily work registration by foremen (structured format)
- Multi-regional normative base — simultaneous access to ГЭСН/ФЕР/ТЕР for different regions

**Integration ecosystem:**
- 1С ecosystem (Бухгалтерия, ЗУП, ERP Manufacturing)
- Renga BIM (certified compatible)
- ГРАНД-Смета (bidirectional import/export)
- Firebase/Node.js for custom mobile backends

---

### 2. Битрикс24

**Website:** https://www.bitrix24.ru
**Target market:** SMB to mid-market (5–500 users); horizontal CRM/collaboration with construction overlay

**Pricing:**
- Free tier: unlimited users, 5 GB, 100 tasks
- Базовый: 2,490 ₽/month (up to 5 users)
- Стандартный: 6,990 ₽/month (up to 50 users)
- Профессиональный: 13,990 ₽/month (up to 100 users)
- Энтерпрайз: custom pricing (unlimited users)
- On-premise: 159,000–599,000 ₽ (50–500 users)

**Strengths:**
- Best Russian CRM for construction sales pipeline (застройщик templates, 3 funnels)
- Speed of deployment: days, not months
- Free unlimited-user tier
- Mobile app purpose-built for field use (not a desktop wrapper)
- Open REST API with 300+ methods, 1000+ marketplace apps
- All-in-one: CRM + tasks + chat + email + telephony + warehouse
- 2025 AI features for CRM analysis and process optimization

**Weaknesses:**
- Zero construction specifics: no сметы, no КС-2/КС-3, no ФМ, no КЛ
- Reporting is very limited
- Interface overload — cluttered and non-intuitive for non-tech users
- Performance issues with large data volumes
- No regulated accounting/payroll (must integrate with 1С)
- No BIM, no safety management, no construction quality

**Unique features we don't have:**
- [MISSING-HIGH] Built-in IP telephony + video conferencing (no Zoom/Teams needed)
- [MISSING-MEDIUM] 1000+ marketplace apps ecosystem
- [MISSING-MEDIUM] AI assistant for CRM analysis and behavior prediction (2025)
- [MISSING-LOW] Email marketing campaigns and chatbots

**UX ideas to borrow:**
- Activity stream (social-network feed UX) for all project events
- Drag-and-drop Gantt with auto-cascade dependencies
- Visual CRM funnel with deal cards
- Role-based dashboards customizable per user

**Integration ecosystem:**
- REST API (300+ methods, OAuth 2.0, webhooks)
- 1С:Бухгалтерия (bidirectional sync on higher tiers)
- 50+ telephony providers, Google/Yandex ads, SMS gateways
- 1000+ marketplace apps via Albato and native connectors

---

### 3. PlanRadar

**Website:** https://www.planradar.com
**Target market:** Small to enterprise; construction + real estate; 170,000+ users in 75+ countries

**Pricing:**
- Basic: ~$35/user/month
- Starter: ~$119/user/month (multiple PMs, +30 plans/license)
- Pro: ~$179/user/month (+100 plans, +1 BIM model/license)
- Enterprise: custom quote
- 30-day free trial

**Strengths:**
- Best-in-class defect/punch list management (tickets with photos, video, voice, GPS pin on plan)
- Mobile-first with full offline mode (works with zero connectivity)
- BIM viewer with IFC import from any CAD tool + defect pinning in 3D
- Scheduling imports from Primavera P6 / MS Project / ASTA
- Extreme ease of deployment — minutes to first defect
- 200+ no-code integrations via PlanRadar Connect (Workato)
- Digital handover with living asset log
- Strong CIS/Russian market presence

**Weaknesses:**
- No financial management (budgets, invoices, payments)
- No CRM or lead management
- No procurement or warehouse
- No HR/payroll/timesheets
- No Russian regulatory documents (ГЭСН, КС-2/КС-3)
- Reporting limited on Basic plan

**Unique features we don't have:**
- [MISSING-HIGH] Pin-on-plan defect placement (tap location on 2D/3D plan to create ticket)
- [MISSING-HIGH] Full offline mode for ALL features (not just cached data)
- [MISSING-MEDIUM] Voice recording on tickets (fast field capture without typing)
- [MISSING-MEDIUM] Digital handover with living asset log for facility management
- [MISSING-MEDIUM] Scheduling import from P6/MSP/ASTA formats
- [MISSING-LOW] Drag-and-drop report builder from Word/Excel templates

**UX ideas to borrow:**
- Pin-on-plan: tap a location on 2D/3D plan to place a defect — intuitive field-first UX
- Ticket-centric model: everything (defect, task, inspection) is a consistent "ticket" form
- Statistics boards auto-populate from ticket data — no manual dashboard setup
- Mobile-first design: optimized for gloves/outdoor use, large tap targets

**Integration ecosystem:**
- REST API + Webhooks
- PlanRadar Connect (Workato): 200+ apps
- BIM: IFC import from Revit, ArchiCAD, Allplan
- Scheduling: P6, MS Project, ASTA Powerproject

---

### 4. Мегаплан

**Website:** https://megaplan.ru
**Target market:** Russian SMB (all industries including construction)

**Pricing:**
- From ~329 ₽/user/month
- 3-user minimum package: ~992 ₽/month (annual)
- With CRM: ~1,658 ₽/month
- Price increase 7–17% from January 2026
- Box/on-premise version available

**Strengths:**
- Deep 1C integration (bidirectional, native)
- Genuinely Russian: full localization, 152-ФЗ, hosted in Russia
- On-premise/box version for state companies
- Balanced CRM + project management at lower complexity than Битрикс24
- Filter persistence per user (Битрикс24 doesn't have this)
- Affordable for small teams (<20 people)

**Weaknesses:**
- Zero construction-specific modules
- Mobile offline limited
- UI/UX dated by international standards
- Slow and understaffed technical support
- Performance issues (freezes, slowdowns)
- Falling behind in integrations (~100 vs Битрикс24's 500+)
- No field-specific features (no plan pinning, no photo-defect linking)

**Unique features we don't have:**
- [MISSING-MEDIUM] On-premise deployment for data sovereignty (important for government contractors)
- [MISSING-LOW] Built-in video conferencing (post-2022 import substitution)
- [MISSING-LOW] Filter persistence per user across lists

**UX ideas to borrow:**
- Virtual office metaphor: tasks, deals, clients, video calls in one workspace
- Card-based customizable task cards with financial blocks
- Saved filter sets per user — major PM productivity win

**Integration ecosystem:**
- 1C (bidirectional, first-class)
- ~100 integrations (Yandex.Mail, Gmail, Google Calendar, telephony)
- Open API (REST)
- Active Directory support (on-premise)

---

### 5. Планфикс (Planfix)

**Website:** https://planfix.ru
**Target market:** SMB (10–500 users); horizontal platform with construction vertical

**Pricing:**
- Free: up to 5 users
- Paid: ~2–7 €/user/month (tiered by team size)
- Annual: 14 months for price of 12
- Priced in EUR (friction for Russian buyers)

**Strengths:**
- Extreme flexibility — no-code customizable platform with ~400 tools
- Strong automation engine with conditional logic and triggers
- AI agents (Summarizer, Data Miner, Interviewer, Auto-Qualifier — 2025)
- 400+ integrations through partner ecosystem
- Document generation from task/deal data (contracts, invoices, acts)
- Active development cadence (major features monthly)

**Weaknesses:**
- High learning curve — requires specialist integrator for complex processes
- No native construction modules (no КС-2, ГЭСН, BIM, safety)
- CRM module less polished than dedicated CRM systems
- Mobile app still maturing (added 2019)
- Documentation quality poor
- Priced in EUR — currency exposure for Russian customers

**Unique features we don't have:**
- [MISSING-HIGH] AI agents for workflow automation (summarizer, auto-qualifier, data miner)
- [MISSING-MEDIUM] No-code process builder with ~400 configurable tools
- [MISSING-MEDIUM] Document generation from task/deal data (auto-fill templates)
- [MISSING-LOW] Speech analytics on calls integrated into CRM

**UX ideas to borrow:**
- "Transformer" model: universal object customized by fields and templates
- Real-time event chronicle (activity feed) per project/task
- Document generation within task context (no leaving the system)
- Ready-made industry configurations as install-once starting points

**Integration ecosystem:**
- REST API
- 400+ connections via Albato, APIX-Drive
- 1C (via partner integrators)
- amoCRM, Битрикс24 sync, telephony, SMS

---

### 6. HubEx

**Website:** https://hubex.ru
**Target market:** Field service companies with mobile workforces; construction/repair vertical

**Pricing:**
- Minimum: ~6,500 ₽/month for 5 licenses (~1,300 ₽/user/month)
- Professional: ~13,000 ₽/month base
- Corporation: ~34,000 ₽/month base
- Minimum 10 licenses required
- Registered in Russian software registry (Реестр отечественного ПО)

**Strengths:**
- Best-in-class mobile for field workers (fast, offline, GPS, QR scanning)
- GPS tracking of mobile workforce (15m accuracy, route optimization)
- QR-code asset passports with full work history — eliminates paper
- Auto-dispatcher robot (skills/location/load balancing)
- Deep 1C integration (bidirectional: acts → 1С; 1С stock → mobile)
- RD-11−05−2007 compliant digital walk journal
- Floor plan overlays for location-based issue reporting
- Offline cache for 2,000 materials
- Client-facing mobile app for request submission

**Weaknesses:**
- Not a full construction ERP (no estimates, no КС-2/КС-3, no BIM, no HR, no finance)
- Minimum 10-license barrier for small teams
- Initial setup complex, staff training required
- Analytics limited (10 report types only)
- No Gantt, no CRM, no project scheduling
- AI features nascent (config assistant only)

**Unique features we don't have:**
- [MISSING-HIGH] QR-code asset passports with full history (scan → see all work done)
- [MISSING-HIGH] Auto-dispatcher robot (assign work based on skills/location/load)
- [MISSING-HIGH] Offline mobile app with 2,000-item material cache
- [MISSING-MEDIUM] Floor plan-based request submission (pin issues on drawings)
- [MISSING-MEDIUM] RD-11−05−2007 compliant walk journal
- [MISSING-MEDIUM] Client mobile app for direct request submission via QR scan

**UX ideas to borrow:**
- QR code as entry point for both clients and equipment — low friction
- Mobile-first: field worker app is primary surface, web is for managers
- Real-time map view with all field workers visible to dispatcher
- SLA timers visible in all request lists
- Rating system: client rates technician after completion

**Integration ecosystem:**
- 1C (bidirectional: acts/invoices/reports → 1C; 1C stock → mobile)
- Битрикс24 (deal trigger → HubEx request)
- amoCRM
- 195 services via Albato
- REST API + webhooks

---

### 7. СБИС / Saby (Тензор)

**Website:** https://saby.ru (rebranded from СБИС in January 2025)
**Target market:** SMB to enterprise; horizontal platform with construction as one vertical

**Pricing:**
- Modular "pay for what you use":
  - EDO: from 3,000 ₽/year
  - Accounting: from 3,000–6,000 ₽/year
  - HR/Payroll: from 15,000 ₽/year
  - CRM: from 10,000 ₽/year
  - Warehouse: from 3,500 ₽/year
  - Procurement: from 3,500 ₽/year

**Strengths:**
- 50%+ of Russian businesses use as EDO counterparty — massive network effect
- All-in-one: EDO + accounting + HR + CRM + warehouse + projects + reporting
- Deep Russian regulatory compliance (ФНС, ПФР, Росстат accredited)
- Competitive pricing for SMB
- Strong 1C integration
- Construction-specific: estimate creation with federal reference books, КС-2/КС-3 generation
- GosEDO connection (first private operator, early 2025)
- Tender search across 300+ trading platforms (44-ФЗ/223-ФЗ/commercial)
- Auto-generated timesheets from schedules
- 24/7 technical support

**Weaknesses:**
- UI/UX follows "its own logic" — steep learning curve
- Construction features are a layer on general platform, not deep
- Estimate module is project-level cost planning, NOT deep ГЭСН/ФЕР normative base
- No BIM, no defect management, no safety module
- No client portal, no daily logs, no quality checklists
- No dedicated offline-first mobile for field workers
- Updates pushed without notification, breaking workflows

**Unique features we don't have:**
- [MISSING-HIGH] ЭДО operator status with 50%+ network coverage (send КС-2/КС-3 electronically)
- [MISSING-HIGH] Tender/procurement search across 300+ trading platforms
- [MISSING-MEDIUM] GosEDO connection — legally-significant document exchange with government
- [MISSING-MEDIUM] Video surveillance integration (Saby Видеонаблюдение)
- [MISSING-LOW] Gamification in corporate social network

**UX ideas to borrow:**
- Single-window "all in one" design philosophy — reduces context switching
- Module-based pricing makes onboarding incremental
- Mobile-first for HR (leave, schedule, attendance via phone)
- Automated tax form prefill

**Integration ecosystem:**
- 1C (all major configurations 8.2+)
- SAP, Битрикс24
- REST API + JSON-RPC
- Albato marketplace
- KEDO API for HR documents

---

### 8. Контур (SKB Kontur / Diadoc)

**Website:** https://kontur.ru | EDO: https://www.diadoc.ru
**Target market:** SMB to enterprise; compliance/EDO/reporting ecosystem (NOT a construction ERP)

**Pricing:**
- Диадок (EDO): from 2,950 ₽/year for 250 outgoing docs; incoming FREE
- КЭП (electronic signature): 6,000 ₽
- Экстерн (tax reporting): from 2,400 ₽/year
- Закупки (tender search): from ~10,900 ₽/year

**Strengths:**
- Russia's #1 EDO operator by market share (Диадок)
- Electronic exchange of КС-2, КС-3, acts, invoices with КЭП
- GosEDO integration (March 2025)
- Superior procurement intelligence: competitor bid analysis, ФАС risk scores, historical pricing
- Deep 1C/SAP integrations
- Zero cost for incoming EDO documents — network effect

**Weaknesses:**
- NOT a construction management platform at all
- Only TRANSMITS КС-2/КС-3, does not GENERATE them
- No project management, tasks, scheduling, BIM
- No defect, safety, quality, or HR management
- Fragmented product lineup (Диадок + Экстерн + Закупки + Фокус — all separate)

**Unique features we don't have:**
- [MISSING-HIGH] EDO operator integration (send КС-2/КС-3 via Диадок with КЭП)
- [MISSING-HIGH] Competitor bid analysis from historical tenders + ФАС risk scores
- [MISSING-MEDIUM] Counterparty due diligence (Фокус): beneficial owners, litigation, financials
- [MISSING-MEDIUM] Automatic format validation before sending (prevents legal errors)

**UX ideas to borrow:**
- Document status pipeline: sent → received → signed → archived
- Bulk signing: sign hundreds of documents in one click with КЭП
- Saved search templates with email alerts ("tender radar")

**Integration ecosystem:**
- REST API (Диадок)
- 1C (all major configs), SAP, Docsvision, Directum, Oracle, MS Dynamics
- GosEDO interoperability

---

### 9. Procore

**Website:** https://www.procore.com
**Target market:** Medium to enterprise (GCs, specialty contractors, owners; >$10M ACV)

**Pricing:**
- Model: Annual Construction Volume (ACV)-based, NOT per-user
- Unlimited user seats included
- Starting: ~$375–$549/month entry-level
- Typical: $10,000–$60,000+/year depending on modules and ACV
- ACV fee: ~0.1%–0.2% of annual hard construction costs
- Annual renewal increases: 5–14%/year

**Strengths:**
- Unlimited users at no extra cost — enormous TCO advantage
- Best-in-class financial management: lien waivers, subcontractor invoice automation, cash flow forecasting
- AI-native: Procore Helix (RFI Agent, Daily Log Agent, Photo Intelligence, multilingual)
- 500+ marketplace integrations
- Superior customer support (9.0/10 TrustRadius)
- Document management scored 9.1/10 (best in segment)
- Full change event → PCO → CO workflow with real-time financial impact
- Resource Management: unified labor + equipment + materials (Nov 2024)
- Bid management with prequalification (Compass integration)
- Quick Capture voice punch list

**Weaknesses:**
- Pricing is opaque and expensive; 10%+ annual increases
- Steep learning curve
- No native estimating or job costing
- Per-GC instances frustrate subcontractors managing multiple Procores
- No Russian regulatory compliance (КС-2, ГЭСН, 152-ФЗ)

**Unique features we don't have:**
- [MISSING-HIGH] AI agents embedded platform-wide (RFI creation, daily log, photo analysis, voice capture)
- [MISSING-HIGH] Unlimited user licensing model (no per-seat cost)
- [MISSING-HIGH] 500+ integration marketplace with managed governance
- [MISSING-MEDIUM] Procore Construction Network (subcontractor discovery + prequalification database)
- [MISSING-MEDIUM] ISO 19650-compliant document workflows
- [MISSING-MEDIUM] Lien waiver automation
- [MISSING-LOW] Conversations feature (unified threaded messaging across tools)

**UX ideas to borrow:**
- Dashboard-first experience — project health summary on landing
- Contextual AI assistant accessible anywhere in platform
- Map-based project visualization with object labels
- Role-specific onboarding flows
- Quick Capture voice-to-text punch items on mobile

**Integration ecosystem:**
- 500+ marketplace integrations (QuickBooks, Sage, Viewpoint, DocuSign, EarthCam)
- REST API (developers.procore.com)
- Agentic APIs on Datagrid infrastructure (2025)
- Managed Marketplace with partner vetting

---

### 10. Autodesk Build (Autodesk Construction Cloud)

**Website:** https://construction.autodesk.com
**Target market:** Medium to large enterprise; BIM-heavy projects; Autodesk ecosystem users

**Pricing:**
- Model: Per-user/per-seat, annual
- Autodesk Build: ~$500–$800+/user/year
- Full ACC suite: custom quotes
- Volume discounts from 5 users
- Multi-year: 10–15% discount

**Strengths:**
- Unmatched BIM integration (Revit, AutoCAD, Civil 3D, Navisworks native)
- Automatic clash detection (3D model coordination) — industry-leading
- ISO 19650-compliant CDE (Common Data Environment)
- 400+ integrations
- Forma generative design for preconstruction (2025)
- GCPay integration for subcontractor payment applications
- Handover/closeout tool with live links
- Strong multi-step submittal and RFI customization

**Weaknesses:**
- Per-seat pricing expensive at scale (vs Procore unlimited)
- Weak native scheduling (no CPM engine)
- Large BIM model performance issues in web viewer
- No native HR/timesheets
- No native procurement/warehouse
- No native estimating (requires separate Autodesk Takeoff)
- Steep learning curve for non-Autodesk users
- No Russian regulatory compliance

**Unique features we don't have:**
- [MISSING-HIGH] Native BIM clash detection across RVT/DWG/NWC/IFC models
- [MISSING-HIGH] Design-to-Build continuum (Revit → BIM Collaborate → Build — one data lineage)
- [MISSING-MEDIUM] Forma generative site planning with neural CAD
- [MISSING-MEDIUM] Handover package with live links (hyperlinks stay live in exported ZIP)
- [MISSING-MEDIUM] Partner Card tiles in dashboards (third-party data in ACC UI)

**UX ideas to borrow:**
- CDE (Common Data Environment) as organizing principle
- Issues-centric workflow: issues created from any tool link to RFIs/COs/meetings
- Schedule view with 3-week lookahead as default focus
- Sheets overlay/comparison for drawing revision review
- Form mobile navigation with section jumper

**Integration ecosystem:**
- 400+ integrations (Sage Intacct, Oracle ERP, SAP, Microsoft Teams, GCPay)
- Autodesk Platform Services (APS/Forge) — open REST APIs
- Free API access tier (2025)
- ACC Connect middleware

---

### 11. Oracle Primavera P6

**Website:** https://www.oracle.com/construction-engineering/primavera-p6/
**Target market:** Large enterprise ($50M+ projects); construction, oil & gas, government

**Pricing:**
- P6 Professional (perpetual): ~$3,500/user + ~22% annual maintenance
- P6 EPPM (cloud): ~$1,300–$2,000/user/year
- Oracle Primavera Cloud: $2,500–$10,000+/user/year
- Training: $500–$3,000/person

**Strengths:**
- Gold standard for complex scheduling (40+ years, founded 1983)
- Deepest EVM implementation (PV, EV, AC, CPI, SPI, CV, SV, EAC, ETC, VAC, TCPI)
- Critical Path Method (CPM) with float calculation and logic tracing
- Resource leveling across multi-project portfolio
- Monte Carlo simulation (Primavera Risk Analysis add-on)
- S-curves with baseline overlays
- Handles tens of thousands of activities per project
- Government and defense compliance (DCMA 14-Point, ANSI 748)

**Weaknesses:**
- Very steep learning curve (formal training/certification required)
- Complex, dated UI (desktop MDI, not modern web)
- Not a full financial ERP — needs Oracle Unifier for cost management
- Mobile is field update tool only, not desktop replacement
- Overkill and cost-prohibitive for SMB
- No native document management, defect tracking, or safety
- No CRM, no client portal, no warehouse
- No Russian regulatory compliance

**Unique features we don't have:**
- [MISSING-HIGH] Full EVM with dynamic schedule integration (PV, EV, AC, CPI, SPI — live columns)
- [MISSING-HIGH] Resource leveling across multi-project portfolio with priority rules
- [MISSING-HIGH] Monte Carlo risk simulation
- [MISSING-MEDIUM] DCMA 14-Point schedule health check
- [MISSING-MEDIUM] Multiple baselines per project with comparison reports
- [MISSING-LOW] AI-powered predictive delay analysis (CEI module)

**UX ideas to borrow:**
- Activity table with customizable column sets — power user views
- Bottom pane detail with tabs (resources, predecessors, successors, codes)
- Filter/group/sort toolbar for deep schedule analysis
- Primavera Cloud: card-based task views, Kanban boards, cleaner modern UI

**Integration ecosystem:**
- P6 EPPM REST API (CRUD for projects/activities/resources, OAuth 2.0)
- Primavera Gateway middleware (Oracle EBS, SAP, MS Project Server)
- Oracle Analytics (OAC/OTBI)
- XER/XML export for MS Project, Spider Project, Asta

---

### 12. Buildertrend

**Website:** https://buildertrend.com
**Target market:** SMB residential builders, remodelers, specialty contractors

**Pricing:**
- Essential: $199–$499/month (core PM + scheduling + portal)
- Advanced: ~$499/month (+ estimating, budgeting, POs)
- Complete: $799–$1,099/month (full suite including CRM, warranty)
- All plans: unlimited users and projects (flat monthly)
- 30-day trial (demo required)

**Strengths:**
- All-in-one residential: sales → scheduling → client → financials → warranty
- Flat unlimited-user pricing — predictable monthly spend
- Best homeowner-facing client portal in residential segment
- Built-in CRM tightly integrated with project workflow
- Strong QuickBooks/Xero 2-way sync
- Selections workflow: client picks finishes/materials with budget impact
- Warranty module (post-construction service management)
- AI weekly summary from daily logs (2025)
- Native e-signatures (2025)
- Geofenced time clock for field workers

**Weaknesses:**
- Residential/SMB-only focus — not for commercial construction
- No critical path / CPM scheduling (visual Gantt only)
- No EVM, no S-curve, no resource leveling
- No BIM integration
- Estimating tools less sophisticated than commercial tools
- Only one client login per project
- No free plan (demo required)
- No Russian regulatory compliance

**Unique features we don't have:**
- [MISSING-HIGH] Selections workflow (client picks finishes/materials, e-signs, auto-updates budget)
- [MISSING-MEDIUM] Warranty/post-handover claim management linked to original project
- [MISSING-MEDIUM] AI weekly summary generation from daily logs
- [MISSING-MEDIUM] Geofenced time clock (location-verified to prevent buddy punching)
- [MISSING-LOW] Email marketing automation for leads (drip campaigns)

**UX ideas to borrow:**
- Consumer-grade UX — designed for non-software-savvy builders
- Client portal with branded customization (builder's logo and colors)
- Side-by-side bid comparison UI (visual table)
- Change order → one-click approve/reject → auto budget update
- Photo-centric daily logs (photos as primary update method)
- Financial summary KPIs at project level: Original / Revised / Actual vs Variance

---

## Feature Comparison Matrix

| Feature | Privod | 1С:УСО | Б24 | PlanRadar | Мегаплан | Планфикс | HubEx | СБИС | Контур | Procore | Autodesk | Primavera | Buildertrend |
|---------|--------|--------|-----|-----------|----------|----------|-------|------|--------|---------|----------|-----------|-------------|
| **Pre-construction** | | | | | | | | | | | | | |
| Сметы ГЭСН/ФЕР/ТЕР | YES | **YES** | NO | NO | NO | NO | NO | PARTIAL | NO | NO | NO | NO | NO |
| КС-2/КС-3 generation | YES | **YES** | NO | NO | NO | NO | PARTIAL | YES | PARTIAL* | NO | NO | NO | NO |
| Financial model (ФМ) | **YES** | YES | NO | NO | PARTIAL | PARTIAL | NO | NO | NO | YES | YES | PARTIAL | PARTIAL |
| Competitive lists (КЛ) | **YES** | PARTIAL | NO | NO | NO | NO | NO | NO | NO | PARTIAL | PARTIAL | NO | PARTIAL |
| Specifications | **YES** | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Commercial proposals (КП) | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Site assessments | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **Project Management** | | | | | | | | | | | | | |
| Gantt / scheduling | YES | YES | YES | YES | YES | YES | NO | YES | NO | YES | PARTIAL | **YES** | YES |
| Resource planning | YES | YES | NO | NO | NO | NO | NO | NO | NO | **YES** | NO | **YES** | NO |
| Task management (kanban+list+cal) | YES | NO | **YES** | PARTIAL | YES | YES | NO | YES | NO | YES | YES | PARTIAL | YES |
| EVM (CPI/SPI) | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | **YES** | NO |
| Work volumes tracking | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Monte Carlo simulation | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | **YES** | NO |
| **Finance** | | | | | | | | | | | | | |
| Budgets with line items | YES | YES | NO | NO | PARTIAL | PARTIAL | NO | YES | NO | YES | YES | PARTIAL | YES |
| Contracts management | YES | YES | YES | NO | NO | NO | NO | NO | NO | YES | YES | NO | YES |
| Invoices | YES | YES | PARTIAL | NO | NO | NO | NO | YES | NO | YES | YES | NO | YES |
| Payments tracking | YES | YES | NO | NO | NO | NO | NO | YES | NO | YES | YES | NO | YES |
| Cash flow (plan vs fact) | YES | YES | NO | NO | NO | NO | NO | NO | NO | YES | YES | NO | NO |
| БДДС | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| НДС auto-calculation (20%) | **YES** | YES | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO |
| Revenue recognition | YES | YES | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO |
| Cost management (codes) | YES | YES | NO | NO | NO | NO | NO | NO | NO | **YES** | YES | PARTIAL | PARTIAL |
| S-curve cash flow | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | **YES** | NO |
| Tax calendar | YES | NO | NO | NO | NO | NO | NO | YES | YES | NO | NO | NO | NO |
| Factoring calculator | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **Documents** | | | | | | | | | | | | | |
| Document registry + versions | YES | YES | YES | YES | PARTIAL | PARTIAL | NO | YES | YES | **YES** | **YES** | PARTIAL | YES |
| CDE (Common Data Environment) | YES | NO | NO | NO | NO | NO | NO | NO | NO | PARTIAL | **YES** | NO | NO |
| Smart recognition (OCR/AI) | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | YES | NO | NO |
| PTO documents (АОСР, КС-6, ИТД) | **YES** | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| ЭДО integration | PARTIAL | YES | PARTIAL | NO | NO | NO | NO | **YES** | **YES** | NO | NO | NO | NO |
| 1С integration | PARTIAL | **native** | YES | NO | YES | PARTIAL | YES | YES | YES | NO | NO | NO | NO |
| **Construction Operations** | | | | | | | | | | | | | |
| Daily logs | YES | YES | NO | **YES** | NO | PARTIAL | YES | NO | NO | **YES** | YES | NO | YES |
| Work orders | YES | YES | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO | NO |
| Dispatch (delivery) | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Quality checklists | YES | NO | PARTIAL | **YES** | NO | PARTIAL | YES | NO | NO | **YES** | **YES** | NO | PARTIAL |
| Defect management | YES | PARTIAL | PARTIAL | **BETTER** | NO | PARTIAL | YES | NO | NO | YES | YES | NO | PARTIAL |
| Punch lists | YES | NO | NO | YES | NO | NO | NO | NO | NO | **YES** | YES | NO | YES |
| Safety incidents | YES | PARTIAL | NO | PARTIAL | NO | NO | NO | NO | NO | **YES** | YES | NO | NO |
| Safety inspections | YES | NO | NO | YES | NO | NO | PARTIAL | NO | NO | YES | YES | NO | NO |
| PPE tracking | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| SOUT | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **HR** | | | | | | | | | | | | | |
| Employee database | YES | **YES** | PARTIAL | NO | PARTIAL | PARTIAL | NO | YES | NO | NO | NO | NO | NO |
| Timesheets (T-13) | **YES** | YES | PARTIAL | NO | NO | PARTIAL | PARTIAL | YES | NO | PARTIAL | NO | PARTIAL | PARTIAL |
| Crew management | **YES** | PARTIAL | NO | NO | NO | NO | NO | NO | NO | PARTIAL | NO | NO | NO |
| Leave requests | YES | PARTIAL | YES | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO |
| Certification matrix | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Self-employed contractors | **YES** | PARTIAL | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **Warehouse & Procurement** | | | | | | | | | | | | | |
| Purchase requests → PO | YES | YES | NO | NO | NO | NO | NO | YES | NO | PARTIAL | NO | NO | YES |
| Vendor comparison (bid mgmt) | YES | PARTIAL | NO | NO | NO | NO | NO | PARTIAL | NO | **YES** | PARTIAL | NO | YES |
| Material receipt + issue | YES | YES | NO | NO | NO | NO | PARTIAL | YES | NO | NO | NO | NO | NO |
| Stock limits / alerts | YES | YES | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO |
| M-29 report | **YES** | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Limit-fence cards | **YES** | PARTIAL | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Barcode scanning | YES | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO | NO |
| Inter-project transfer | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **Quality & Regulatory** | | | | | | | | | | | | | |
| Quality gates | YES | NO | NO | NO | NO | NO | NO | NO | NO | YES | YES | NO | NO |
| NCR (non-conformance) | YES | NO | NO | PARTIAL | NO | NO | NO | NO | NO | YES | YES | NO | NO |
| Regulatory permits | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| SRO management | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Prescriptions journal | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Reporting calendar | YES | NO | NO | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO |
| **Fleet & Equipment** | | | | | | | | | | | | | |
| Vehicle registry | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Waybills (путевые листы) | **YES** | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| Fuel accounting | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| GPS tracking | PARTIAL | NO | NO | NO | NO | NO | **YES** | NO | NO | NO | NO | NO | NO |
| IoT sensors | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **Technology** | | | | | | | | | | | | | |
| BIM viewer | YES | **YES** | NO | **YES** | NO | NO | NO | NO | NO | PARTIAL | **YES** | PARTIAL | NO |
| AI features | YES | NO | **YES** | NO | NO | **YES** | PARTIAL | NO | NO | **YES** | YES | PARTIAL | YES |
| Mobile app / PWA | YES | NO | YES | **YES** | YES | YES | **YES** | YES | PARTIAL | **YES** | YES | PARTIAL | YES |
| Offline mode | YES | NO | PARTIAL | **YES** | PARTIAL | PARTIAL | **YES** | NO | NO | YES | YES | YES | PARTIAL |
| Push notifications | YES | NO | YES | YES | YES | YES | YES | YES | NO | YES | YES | NO | YES |
| 2FA / security | YES | PARTIAL | YES | YES | PARTIAL | PARTIAL | NO | YES | YES | YES | YES | YES | YES |
| API / webhooks | YES | PARTIAL | **YES** | YES | YES | YES | YES | YES | YES | **YES** | YES | YES | YES |
| Marketplace / plugins | PARTIAL | YES | **YES** | PARTIAL | NO | PARTIAL | NO | PARTIAL | NO | **YES** | YES | NO | PARTIAL |
| **CRM & Portal** | | | | | | | | | | | | | |
| Lead management | YES | YES | **YES** | NO | YES | YES | NO | YES | NO | PARTIAL | NO | NO | YES |
| Counterparty database | YES | YES | YES | NO | YES | YES | NO | YES | YES | NO | NO | NO | NO |
| Client portal | YES | PARTIAL | PARTIAL | PARTIAL | NO | YES | YES | NO | NO | **YES** | PARTIAL | NO | **YES** |
| Contractor portal | **YES** | NO | NO | NO | NO | NO | NO | NO | NO | YES | NO | NO | YES |
| Support / helpdesk | YES | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO | NO |
| **Closeout** | | | | | | | | | | | | | |
| Commissioning checklists | YES | NO | NO | YES | NO | NO | NO | NO | NO | YES | YES | NO | NO |
| Handover packages | YES | NO | NO | **YES** | NO | NO | NO | NO | NO | YES | **YES** | NO | NO |
| Warranty tracking | YES | NO | NO | PARTIAL | NO | NO | NO | NO | NO | PARTIAL | NO | NO | **YES** |
| As-built documentation | YES | NO | NO | NO | NO | NO | NO | NO | NO | YES | YES | NO | NO |
| ЗОС (завершение объекта) | **YES** | PARTIAL | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO | NO |

*Контур Диадок only TRANSMITS КС-2/КС-3 electronically, does not generate them.

**Legend:** YES = fully implemented, PARTIAL = basic/limited, NO = absent, **YES** = best in class, **BETTER** = they do it better than us

---

## 1. Features Only We Have (Our Advantages)

These are features from our 244 navigation items that NO competitor has in this combination. These are our USPs.

### Unique to Privod (no competitor matches):
1. **Full pre-construction chain: Спец → КЛ → ФМ ← ЛСР → КП → Договор** — the complete pricing lifecycle in one system. 1С:УСО has pieces but not this integrated chain. No international competitor has this at all.
2. **КЛ with weighted scoring + auto-ranking** — automatic vendor ranking with weighted criteria (price, delivery, warranty, payment terms). No competitor has this dedicated module.
3. **Торговый коэффициент (trading coefficient)** — markup/discount on estimated prices for КП. Construction-specific pricing mechanism unique to us.
4. **ФМ с тремя ценами**: costPrice (from КЛ) + estimatePrice (from ЛСР) + customerPrice (from КП) — real-time margin visibility per item. No competitor shows all three prices side-by-side.
5. **НДС as violet KPI + column** — domain-specific color coding for VAT (20%), auto-calculated. No one else does this.
6. **M-29 report + Limit-fence cards (лимитно-заборные карты)** — Russian construction warehouse reporting. Only 1С:УСО has M-29; no one has limit-fence cards as a dedicated module.
7. **Prescriptions journal (журнал предписаний)** — regulatory tracking specific to Russian construction. Not found in any competitor.
8. **SRO management** — track СРО licenses and compliance. Not in any competitor.
9. **SOUT (СОУТ)** — special assessment of working conditions. Russian regulatory requirement; not in any competitor as a dedicated module.
10. **Certification matrix** for construction worker qualifications — cross-reference workers × certifications × expiry dates. No competitor has this.
11. **Self-employed contractor management** — Russian-specific (самозанятые). Track 422-ФЗ status, tax receipts. Not in any competitor.
12. **Factoring calculator** — calculate factoring options for receivables. No competitor has this.
13. **ЗОС (завершение объекта строительства)** — Russian closeout document. Not in any competitor except 1С (partially).
14. **PTO documents (АОСР, КС-6, ИТД, скрытые работы)** — full set of Russian executive documentation. Only 1С:УСО partially covers this.
15. **Contractor portal with КС-2 and Russian acts** — like Procore's portal but with Russian document chain. No competitor combines portal + Russian docs.

### Strong differentiators (1-2 competitors have something similar, but we do it better):
16. **Portfolio health with 7-dim RAG matrix** — richer than Procore's 5-6 dimensions. Dual table+card views.
17. **Waybills (путевые листы)** — dedicated module with ESM format. Only 1С:УСО has this.
18. **T-13 timesheet format** — Russian statutory format. Only 1С:УСО and СБИС have this.
19. **Crew management** — dedicated module for construction crews. No competitor has this as a standalone feature.
20. **Staffing schedule** — штатное расписание. Only 1С:УСО has equivalent depth.

---

## 2. Features Competitors Have That We Don't [MISSING]

### [MISSING-HIGH] — Multiple competitors have it AND critical for market

| # | Feature | Who has it | Why important | Estimated effort |
|---|---------|-----------|---------------|-----------------|
| 1 | **ЭДО integration (Диадок/СБИС)** — electronic document exchange with КЭП | СБИС, Контур, 1С | Legal requirement for large contracts; 50%+ of Russian companies on Диадок. Without this, КС-2/КС-3 must be paper-signed. | L (2-3 weeks, API integration) |
| 2 | **Deep 1C integration** (bidirectional accounting sync) | 1С native, Б24, Мегаплан, СБИС, HubEx | Most Russian construction companies run 1С for accounting. Without this, double data entry is required. | L (3-4 weeks, 1C connector) |
| 3 | **AI agents for workflow automation** (daily log auto-fill, RFI creation, photo analysis) | Procore (Helix), Планфикс (AI agents), Б24, Buildertrend | Market-defining trend in 2025. Reduces admin work by 40%. Every major competitor is shipping AI features. | M (2-3 weeks for first agents) |
| 4 | **Pin-on-plan defect placement** (tap location on 2D/3D plan to place defect) | PlanRadar, Autodesk Build, Procore | #1 requested feature by прорабы. PlanRadar's core competitive advantage. Our defect module exists but lacks spatial context. | M (2 weeks, canvas overlay) |
| 5 | **Full offline mode** for ALL features (not just cached data) | PlanRadar, HubEx, Procore | Construction sites often have zero connectivity. Field workers can't submit defects/logs if offline isn't robust. | L (3-4 weeks, IndexedDB + sync) |
| 6 | **QR-code asset/equipment passports** — scan QR on equipment → see full history | HubEx | Eliminates paper histories. Enables predictive maintenance. Workers love it (one scan instead of searching). | S (1 week) |
| 7 | **BIM clash detection** — automatic clash finding across 3D models | Autodesk Build, Procore (via integrations) | Required for BIM Level 2+ projects. Our BIM viewer shows models but doesn't detect clashes. | L (4+ weeks, IFC parser) |
| 8 | **Tender/procurement search** — search 300+ trading platforms for relevant tenders | СБИС, Контур | Companies need to find tenders to bid on. This is how they get new projects. | M (2 weeks, API aggregation) |

### [MISSING-MEDIUM] — 1-2 competitors have it, valuable but not urgent

| # | Feature | Who has it | Why important |
|---|---------|-----------|---------------|
| 9 | Built-in IP telephony + video conferencing | Б24, Мегаплан | Post-2022 import substitution; eliminates Zoom/Teams dependency |
| 10 | Voice recording on tickets/defects | PlanRadar | Fast field capture without typing on cold days with gloves |
| 11 | Scheduling import from P6/MSP formats | PlanRadar | Companies with existing schedules can migrate to our platform |
| 12 | Geofenced time clock (location-verified) | Buildertrend, HubEx | Prevents buddy punching; verifies on-site presence |
| 13 | Auto-dispatcher (assign by skills/location/load) | HubEx | Reduces manual dispatch effort for field service |
| 14 | Subcontractor discovery/prequalification database | Procore (Construction Network) | Find new subcontractors by trade/location/rating |
| 15 | Competitor bid analysis from historical tenders | Контур (Закупки) | Know what competitors bid before; adjust pricing strategy |
| 16 | Digital handover with living asset log | PlanRadar | Lifecycle from build to facility management |
| 17 | Selections workflow (client picks finishes/materials) | Buildertrend | Residential-focused but applicable to fit-out projects |
| 18 | Warranty/post-handover claim management | Buildertrend | Service tickets linked to original project |
| 19 | Counterparty due diligence (beneficial owners, litigation) | Контур (Фокус) | Risk assessment before signing contracts |
| 20 | On-premise deployment option | Мегаплан, Б24, 1С | Required for government contractors and state companies |

### [MISSING-LOW] — Niche features, low demand

| # | Feature | Who has it |
|---|---------|-----------|
| 21 | Email marketing automation | Б24, Buildertrend |
| 22 | Gamification in corporate social network | СБИС |
| 23 | Video surveillance integration | СБИС |
| 24 | Speech analytics on CRM calls | Планфикс |
| 25 | Lien waiver automation | Procore (US-specific) |
| 26 | Generative site planning (AI) | Autodesk (Forma) |
| 27 | Real estate management (rental, meter readings) | 1С:УСО |

---

## 3. Features Where Competitors Do It Better [IMPROVE]

### [IMPROVE-HIGH] — Our version is noticeably worse

| # | Feature | Best competitor | What they do better | What we should fix |
|---|---------|----------------|--------------------|--------------------|
| 1 | **Defect management** | PlanRadar | Photo pinned to floor plan, voice recording, offline, statistics boards auto-populate | Add plan overlay for defects, voice capture, auto-statistics |
| 2 | **Mobile experience** | PlanRadar, HubEx, Procore | Purpose-built mobile-first design with large tap targets, glove-friendly, full offline, GPS | Our PWA works but isn't optimized for construction field use |
| 3 | **CRM / lead management** | Б24 | Visual funnels, telephony integration, chatbots, AI predictions, email campaigns | Our CRM is basic — needs visual pipeline, call integration |
| 4 | **1C integration** | 1С (native), HubEx | Bidirectional sync of accounting, materials, HR. HubEx: acts → 1C, 1C stock → mobile | We have PARTIAL — need deep bidirectional connector |
| 5 | **Integration marketplace** | Procore (500+), Б24 (1000+) | Managed marketplace with vetting, governance, partner tiles in dashboard | We have API/webhooks but no marketplace or partner ecosystem |

### [IMPROVE-MEDIUM] — Minor UX improvements needed

| # | Feature | Best competitor | What they do better |
|---|---------|----------------|--------------------|
| 6 | **Document management** | Procore (9.1/10), Autodesk Build | OCR-powered drawing splitting, auto revision control, ISO 19650 CDE |
| 7 | **Daily logs** | Procore, PlanRadar | One-click PDF generation, digital signature on mobile, weather auto-fill |
| 8 | **Change order management** | Procore | Full change event → PCO → CO workflow with real-time financial impact view |
| 9 | **Scheduling / Gantt** | Primavera (CPM), Procore (UX) | We have Gantt but no critical path, no resource leveling, no float calculation |
| 10 | **Client portal UX** | Buildertrend, Procore | Branded customization (logo/colors), online payments, progress photos timeline |
| 11 | **Reporting** | 1С (СКД), Procore | Custom report builder, export to multiple formats, scheduled email delivery |
| 12 | **BIM viewer** | Autodesk Build | Our viewer works but no clash detection, no Navisworks/Revit native support |

### [IMPROVE-LOW] — Cosmetic differences

| # | Feature | Best competitor | What they do better |
|---|---------|----------------|--------------------|
| 13 | Onboarding flow | Procore, Buildertrend | Role-specific onboarding, guided tours, contextual help |
| 14 | Empty states | Buildertrend, PlanRadar | Guide user to next step ("Create a spec first to populate budget") |
| 15 | AI assistant UX | Procore (Helix) | Contextual AI accessible anywhere, voice input, multilingual |

---

## 4. Pricing Analysis

### Market Pricing Comparison

| Competitor | Model | Monthly cost (10 users) | Annual cost (10 users) | Includes |
|-----------|-------|------------------------|----------------------|----------|
| Б24 Free | Per-company | 0 ₽ | 0 ₽ | Unlimited users, 5GB, limited |
| Мегаплан | Per-user | ~3,290 ₽ | ~39,480 ₽ | CRM + tasks |
| Б24 Стандартный | Per-company | 6,990 ₽ | ~83,880 ₽ | 50 users, full CRM |
| HubEx Min | Per-company | ~6,500 ₽ | ~78,000 ₽ | 5 licenses, FSM |
| Планфикс | Per-user | ~4,500 ₽ (€50) | ~54,000 ₽ | All features |
| СБИС Bundle | Modular | ~5,000–15,000 ₽ | ~60,000–180,000 ₽ | Selected modules |
| Контур (EDO) | Per-document | ~1,000–5,000 ₽ | ~12,000–60,000 ₽ | EDO only |
| PlanRadar Basic | Per-user | ~$350 (~35,000 ₽) | ~$4,200 (~420,000 ₽) | Defects + quality |
| Buildertrend | Flat | ~$499 (~50,000 ₽) | ~$6,000 (~600,000 ₽) | Unlimited users |
| Procore | ACV-based | ~$1,000–5,000 | ~$10,000–60,000 | Unlimited users |
| Autodesk Build | Per-seat | ~$500–800/user/yr | ~$5,000–8,000 | Per user, BIM |
| Primavera P6 | Per-seat | ~$1,300–2,000/yr | ~$13,000–20,000 | Scheduling only |
| 1С:УСО | Perpetual+maint | N/A (one-time) | ~850,000 ₽+ | Full ERP, needs implementation |

### Price-to-Feature Ratio Analysis

| Tier | Best value | Feature count | Notes |
|------|-----------|--------------|-------|
| Free | Б24 | ~30 features | CRM + tasks, no construction |
| Budget (<100K ₽/yr) | Мегаплан, СБИС | ~40 features | Generic PM + accounting |
| Mid-range (100-500K ₽/yr) | **PRIVOD target zone** | **244 features** | Best value if priced here |
| Premium (500K-1M ₽/yr) | PlanRadar, Buildertrend | ~50-80 features | Specialized, fewer features |
| Enterprise (1M+ ₽/yr) | 1С:УСО, Procore | ~100-150 features | Full ERP, high implementation |

### Recommended Pricing Strategy for PRIVOD

**Position: Mid-range premium (best value per feature)**

| Tier | Price | Target | Features |
|------|-------|--------|----------|
| **Starter** | 4,990 ₽/month (up to 10 users) | Small contractors | Core modules: projects, specs, FM, КЛ, КП, basic finance |
| **Professional** | 14,990 ₽/month (up to 50 users) | Mid-market GCs | All modules + portal + safety + quality + HR |
| **Enterprise** | 29,990 ₽/month (unlimited users) | Large builders | Everything + AI + BIM + API + priority support |
| **Free trial** | 0 ₽ for 30 days | Everyone | Full Professional tier |

**Why this works:**
- Cheaper than PlanRadar ($35/user = 3,500 ₽/user) for teams >5 people
- 10x more features than Б24 Стандартный at 2x the price
- 95% cheaper than 1С:УСО implementation with comparable construction features
- Unlimited users on Enterprise matches Procore model

---

## 5. Market Positioning

### Direct Competitors by Segment

| Segment | Primary competitor | Our advantage | Their advantage |
|---------|-------------------|---------------|----------------|
| **Large builders (500+ people)** | 1С:УСО | Modern UX, fast deployment, portal | Deeper accounting, BIM 5D, partner network |
| **Mid-market GCs (50-500)** | PlanRadar + СБИС combo | All-in-one (they need 2 products), ФМ, КП, КЛ | PlanRadar: better mobile; СБИС: EDO network |
| **Small contractors (<50)** | Б24 + Excel | Construction depth (they have zero) | Free tier, CRM, telephony |
| **International benchmark** | Procore | Russian compliance, КС-2/ГЭСН, pricing | AI, marketplace, unlimited users, brand |

### Our Unique Positioning

> **PRIVOD — единственная ERP-система для строительства, объединяющая полную финансовую цепочку (Спец→КЛ→ФМ←ЛСР→КП→Договор), российские нормативные документы (КС-2, КС-3, ГЭСН, Т-13, М-29), и современный UX в одном продукте.**

### Recommended Marketing Messages

| Audience | Message | Against competitor |
|----------|---------|-------------------|
| **Директор** | "Маржа по каждой позиции — за 30 секунд, не за 3 часа в 1С" | 1С:УСО |
| **Прораб** | "Дефекты, журнал работ и табель — с телефона за 2 минуты" | PlanRadar + СБИС combo |
| **Бухгалтер** | "КС-2, КС-3, НДС — правильно и сразу, без программиста 1С" | 1С:УСО |
| **Снабженец** | "Конкурентный лист → автоматический ранжинг → цена в ФМ за 3 клика" | Excel |
| **Сметчик** | "ЛСР → ФМ → КП — без копирования между Excel-файлами" | ГРАНД-Смета + Excel |
| **IT-директор** | "SaaS за 15К/мес вместо 1С-внедрения за 5 млн и полгода" | 1С:УСО |

---

## 6. Feature Roadmap Recommendation

Based on competitive analysis, prioritized by market impact:

| Priority | Feature | Why | Effort | Impact | Competitors |
|----------|---------|-----|--------|--------|------------|
| **P0** | ЭДО integration (Диадок/СБИС API) | Legal requirement for large contracts; 50%+ companies need it | L (3 weeks) | CRITICAL | СБИС, Контур, 1С |
| **P0** | Deep 1C connector (bidirectional sync) | #1 integration request; removes double data entry | L (4 weeks) | CRITICAL | 1С, Б24, Мегаплан, СБИС, HubEx |
| **P1** | Pin-on-plan defect placement | #1 field feature request; PlanRadar's killer feature | M (2 weeks) | HIGH | PlanRadar, Autodesk, Procore |
| **P1** | AI agents (daily log auto-fill, photo analysis) | Market-defining 2025 trend; reduces admin by 40% | M (3 weeks) | HIGH | Procore, Планфикс, Б24 |
| **P1** | Full offline mode for field features | Construction sites have zero connectivity | L (3 weeks) | HIGH | PlanRadar, HubEx, Procore |
| **P2** | QR-code equipment passports | Quick win; field workers love it; HubEx differentiator | S (1 week) | MEDIUM | HubEx |
| **P2** | Geofenced time clock | Prevents buddy punching; verifies on-site presence | S (1 week) | MEDIUM | Buildertrend, HubEx |
| **P2** | Voice capture on defects/logs | Hands-free field entry; cold weather use case | S (1 week) | MEDIUM | PlanRadar, Procore |
| **P2** | Scheduling import (P6/MSP) | Companies migrating from legacy tools | M (2 weeks) | MEDIUM | PlanRadar |
| **P2** | Client portal branding (logo, colors) | Professional look for homeowner/investor | S (3 days) | MEDIUM | Buildertrend, Procore |
| **P3** | Integration marketplace (public API + partner directory) | Ecosystem play; attracts developers | L (4 weeks) | MEDIUM | Procore (500+), Б24 (1000+) |
| **P3** | BIM clash detection | Required for BIM Level 2+ projects | L (4+ weeks) | MEDIUM | Autodesk Build |
| **P3** | Tender search aggregation | Find new projects across trading platforms | M (2 weeks) | MEDIUM | СБИС, Контур |
| **P3** | Resource leveling + CPM scheduling | Match Primavera P6 scheduling depth | L (4 weeks) | LOW-MEDIUM | Primavera, Procore |
| **P3** | Built-in video conferencing | Import substitution; no Zoom dependency | L (4 weeks) | LOW | Б24, Мегаплан |

### Effort Legend
- **S** = Small (1 week or less)
- **M** = Medium (2-3 weeks)
- **L** = Large (3+ weeks)

### Recommended Sprint Plan

**Sprint 1 (weeks 1-4): Integration Foundation**
- ЭДО connector (Диадок API)
- 1C bidirectional sync module
- Total: 2 P0 items resolved

**Sprint 2 (weeks 5-8): Field Excellence**
- Pin-on-plan defects (canvas overlay)
- Offline mode hardening (full IndexedDB sync)
- Voice capture on defects/logs
- Total: 2 P1 + 1 P2

**Sprint 3 (weeks 9-12): AI + Smart Features**
- AI daily log agent (summarize, auto-fill)
- AI photo analysis (detect safety violations, progress)
- QR equipment passports
- Geofenced time clock
- Total: 1 P1 + 2 P2

---

## 7. UX/Design Ideas to Implement

### Navigation & Layout

| Idea | Source | Implementation |
|------|--------|---------------|
| **Module switcher** (quick jump between modules) | Procore | Top bar with module icons for fast navigation |
| **Dashboard-first landing** with project health summary | Procore, Buildertrend | KPI cards + chart widgets on / route |
| **Activity feed** (social-network style event stream) | Б24, Планфикс | Timeline of all project events on dashboard |
| **3-week lookahead** as default schedule view | Autodesk Build | Show current + 3 weeks ahead in Gantt |

### Mobile & Field UX

| Idea | Source | Implementation |
|------|--------|---------------|
| **Large tap targets** for glove-friendly use | PlanRadar | Min 48px touch targets, 16px spacing |
| **Photo-centric daily logs** | Buildertrend, PlanRadar | Camera as primary input, text secondary |
| **QR scan as entry point** | HubEx | Scan QR on equipment → see history → create request |
| **Map view of field workers** | HubEx | Dispatcher sees all crew locations in real-time |
| **Voice input for defects/logs** | PlanRadar, Procore | Microphone button on all field forms |

### Financial UX

| Idea | Source | Implementation |
|------|--------|---------------|
| **Original / Revised / Actual variance** KPI strip | Buildertrend | 3-number comparison on every financial page |
| **Change order → one-click approve → auto budget update** | Buildertrend, Procore | Streamlined approval with instant financial impact |
| **Side-by-side bid comparison** table | Buildertrend, Procore | Visual vendor comparison with colored best/worst |
| **S-curve with baseline overlay** | Primavera | Planned vs actual cost curves on same chart |

### Portal & Client Experience

| Idea | Source | Implementation |
|------|--------|---------------|
| **Branded portal** (client's logo, colors on their view) | Buildertrend | Theme customization per portal tenant |
| **Online payments** from portal (card + bank transfer) | Buildertrend | YooKassa integration in portal invoice view |
| **Progress photo timeline** | Buildertrend | Chronological photo gallery showing construction progress |
| **Client ratings** of service quality | HubEx | Star rating after work completion |

### Onboarding & Empty States

| Idea | Source | Implementation |
|------|--------|---------------|
| **Role-specific onboarding** (show only relevant features) | Procore | First-login wizard based on user role |
| **Guided empty states** ("Create a spec first to populate budget") | Buildertrend, PlanRadar | Contextual help text + action button on empty pages |
| **Contextual AI assistant** anywhere in platform | Procore (Helix) | Floating chat with project-aware AI |
| **Ready-made industry templates** | Планфикс | Pre-configured project templates for common building types |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Competitors analyzed | 12 |
| Feature categories compared | 30 |
| Individual features compared | 90+ |
| PRIVOD unique features (USPs) | 20 |
| [MISSING-HIGH] gaps | 8 |
| [MISSING-MEDIUM] gaps | 12 |
| [MISSING-LOW] gaps | 7 |
| [IMPROVE-HIGH] areas | 5 |
| [IMPROVE-MEDIUM] areas | 7 |
| [IMPROVE-LOW] areas | 3 |
| Recommended P0 features | 2 (ЭДО + 1C integration) |
| Recommended P1 features | 3 (pin-on-plan, AI agents, offline) |
| Recommended P2 features | 5 (QR, geofence, voice, P6 import, branding) |
| Recommended P3 features | 5 (marketplace, BIM clash, tenders, CPM, video) |

---

*Generated by PRIVOD Competitive Analysis Engine — 2026-03-12*
*Source: Web research from official websites, pricing pages, user reviews, API documentation*
