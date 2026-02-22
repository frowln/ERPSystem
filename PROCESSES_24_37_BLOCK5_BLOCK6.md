# Construction Processes #24-37: Block 5 (Construction Execution) + Block 6 (Supply Chain & Logistics)

> Research date: 2026-02-18
> Sources: Industry standards, Russian regulatory documents, AIA/AGC standards, ISO standards

---

## BLOCK 5: CONSTRUCTION EXECUTION

---

### Process #24: Daily Work Logs (Daily Logs)

**1. Process Description**

A daily work log (daily log, general journal) is a chronological record maintained throughout a construction project documenting all activities, conditions, events, and personnel on site each day. In Russia, this is the "Общий журнал работ" governed by RD-11-05-2007 (superseded by Minstroi Order 1026/pr from 01.09.2023). In the US/international context, it serves both as project documentation and OSHA compliance evidence.

The daily log matters because it is the single most important document in dispute resolution, delay claims, progress verification, and regulatory compliance. It creates an immutable timeline of construction events that can serve as legal evidence.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Site superintendent / foreman | Primary author; records all daily events |
| Project manager | Reviews and approves log entries |
| Quality control engineer | Adds QC inspection notes |
| Safety officer | Adds safety observations, incidents |
| Subcontractor foremen | Report their scope of work completed |
| Owner's representative | Reviews for acceptance; may add comments |
| Stroy-kontrol (RU) / building inspector | Signs off per regulatory requirements |

**3. Input Data**

- Planned schedule for the day (from CPM schedule)
- Weather forecast and actual conditions
- Crew rosters and headcount per trade
- Equipment mobilized on site
- Material deliveries received
- Work orders and task assignments
- Safety toolbox talk records
- Previous day's log (for continuity)

**4. Output Data / Documents**

- **Russia**: Общий журнал работ (General Work Journal per RD-11-05-2007 / Приказ Минстроя 1026/пр); Специальные журналы (бетонирование, сварка, монтаж и т.д.); Форма КС-6а (журнал учета выполненных работ)
- **USA/Global**: Daily construction report; OSHA 300 log entries; superintendent's daily report; foreman's daily report
- Photo/video documentation linked to log entries
- Weather records with timestamps

**5. Typical Pain Points**

- Logs filled in retrospectively (end of week) rather than daily, losing accuracy
- Paper-based logs that get lost, damaged, or are illegible
- No connection between daily log entries and schedule/budget systems
- Inconsistent formatting across subcontractors
- Missing weather data that becomes critical during delay claims
- Difficulty aggregating data across multiple sites
- No photo linkage to specific log entries
- Time-consuming manual data entry after a full day of field work

**6. Ideal ERP Functions**

- Mobile-first daily log entry with offline capability
- Auto-population of weather data from weather APIs (temperature, precipitation, wind)
- Crew headcount entry by trade with integration to HR/timesheet module
- Equipment usage logging linked to fleet management module
- Photo capture with GPS coordinates and automatic timestamp
- Voice-to-text entry for field conditions
- Template-based entries with customizable sections
- Auto-linking to CPM schedule activities
- Digital signature workflow (foreman -> PM -> owner rep)
- Automatic generation of КС-6а from daily log data
- Dashboard showing log completion rates across all projects
- Full-text search across all historical logs
- Export to regulatory-compliant formats (RD-11-05 / Minstroi 1026)

**7. Russia-Specific**

- **РД-11-05-2007** (replaced by Приказ Минстроя РФ от 02.12.2022 N 1026/ПР effective 01.09.2023): Defines the form and procedure for maintaining the General Work Journal
- **СП 48.13330.2019** "Организация строительства": Requires daily logging as part of construction control; updated by Изменение N2 (21.04.2025) which delegates строительный контроль to СП 543.1325800.2024
- Journal must be numbered, laced, and sealed (прошнурован и пронумерован)
- The General Work Journal consists of 7 sections: title page, list of engineering-technical personnel, weather conditions, work performed, building control notes, supervision notes, inspection records
- Specialized journals required for: concrete work, welding, pile driving, anti-corrosion work, and others
- Journal must be presented upon request to Rostechnadzor inspectors
- Digital journal keeping is now permitted under the new Minstroi 1026/pr form

**8. Global Market**

- **OSHA Daily Logs (USA)**: OSHA Forms 300, 300A, 301 for injury/illness recording; electronic submission required for firms with 100+ employees in high-hazard industries (effective 2024). Penalties for non-compliance: up to $16,500 per serious violation, $165,000+ for willful violations (2025 rates)
- **AIA Document G704**: Certificate of Substantial Completion references daily log data
- **AGC Forms**: Superintendent's daily report form
- **UK CDM Regulations 2015**: Construction phase plan requires daily progress records
- **Australia (WHS Act)**: Principal contractor must maintain daily records of persons on site
- Best practice: real-time logging with GPS-tagged photos, standardized by ENR (Engineering News-Record) recommendations

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Log completion rate | 100% | Days with completed logs / Total workdays |
| Log submission timeliness | <24 hours | % of logs submitted within 24h of workday |
| Photo documentation rate | >=10 photos/day | Photos attached per daily log |
| Crew utilization rate | >85% | Hours worked / Available hours |
| Weather delay accuracy | 100% match | Claimed weather days vs. actual weather data |
| Log discrepancy rate | <2% | Entries requiring correction / Total entries |

---

### Process #25: Work Volume Tracking and Percent Complete

**1. Process Description**

Work volume tracking measures the physical quantities of construction work completed (cubic meters of concrete, linear meters of pipe, square meters of finishing, etc.) against planned quantities to determine percentage of completion. This data feeds directly into Earned Value Management (EVM), progress billing, schedule updates, and forecasting.

Percent complete can be measured by: physical quantities installed, cost-based proportion, milestone completion, weighted steps, or subjective assessment. Best practice combines multiple methods with physical quantity measurement as the primary driver.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Foreman / site engineer | Measures and records physical quantities daily |
| Surveyor / geodesist | Verifies quantities through measurements |
| QC engineer | Confirms quality of completed volumes |
| Project manager | Reviews and validates percent complete |
| Cost engineer / estimator | Maps volumes to budget line items |
| Scheduler / planner | Updates schedule with actual progress |
| Subcontractor | Submits work-in-place reports |
| Owner's representative | Approves reported quantities |

**3. Input Data**

- WBS (Work Breakdown Structure) with planned quantities
- Contract BOQ (Bill of Quantities) with unit rates
- As-built survey data
- Daily log entries with work performed
- BIM model (for 4D/5D quantity extraction)
- Previous period's cumulative quantities
- Material consumption records (correlation check)
- Quality inspection results (only accepted work counts)

**4. Output Data / Documents**

- Weekly/monthly progress report with percent complete per WBS item
- Earned Value metrics (PV, EV, AC, SPI, CPI, SV, CV, EAC, ETC)
- S-curve diagrams (planned vs. actual vs. earned)
- Updated CPM schedule with actual dates
- **Russia**: КС-6а (Журнал учета выполненных работ) — cumulative register of completed volumes
- **USA**: Schedule of Values updates, Continuation Sheet (G703)
- Progress photos linked to specific work items

**5. Typical Pain Points**

- Subjective "percent complete" estimates by foremen (often inflated at 80-90%, then stuck)
- Disconnect between physical completion and financial completion
- No automated link between quantity surveys and EVM calculations
- Difficulty tracking rework and re-measurement
- Multiple measurement systems (metric/imperial) across international projects
- Lag between actual work and data entry (progress data is stale)
- Subcontractors overstate completion to accelerate billing
- No systematic way to verify quantities against material consumption

**6. Ideal ERP Functions**

- WBS tree with planned quantities at leaf level
- Mobile quantity entry with unit-of-measure conversion
- Automated percent complete calculation from quantities (physical % = actual qty / planned qty)
- EVM dashboard with SPI, CPI, SV, CV calculated in real-time
- S-curve generation (planned, earned, actual) with forecast projection
- Integration with survey/BIM data for automated quantity extraction
- Material consumption cross-check (flag if claimed concrete volume exceeds delivered concrete)
- Weighted percent complete across mixed measurement types
- Historical productivity rates (qty/labor-hour) for forecasting
- Configurable rules: "0/50/100" or "20/80" or continuous percent methods
- Auto-generation of КС-6а from tracked volumes
- Drill-down from project level -> phase -> WBS item -> daily entries

**7. Russia-Specific**

- **Форма КС-6а** (Журнал учета выполненных работ): Cumulative register of all work volumes by estimating line item; basis for КС-2 generation
- **СП 48.13330.2019**: Requires systematic tracking of work volumes as part of construction quality control
- Volumes must align with сметные нормы (estimate norms) from ГЭСН/ФЕР/ТЕР
- Measurement methodology defined in technical regulations for specific work types
- Geodetic verification required for earthwork, pile work, concrete structures
- Physical volumes serve as the basis for material write-off per М-29

**8. Global Market**

- **Earned Value Management (ANSI/EIA-748)**: US Department of Defense standard, widely adopted in construction
- **PMI Practice Standard for Earned Value Management**: Industry framework
- **AIA G703** (Continuation Sheet): Tracks percent complete per schedule of values line item
- **RICS (Royal Institution of Chartered Surveyors)**: Quantity surveying standards for measurement
- **AACE International**: Recommended Practices for progress measurement (RP 27R-03, RP 29R-03)
- **NRM (New Rules of Measurement)** in UK: Standardized measurement methodology
- **ISO 21500**: Guidance on project management including progress monitoring

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Schedule Performance Index (SPI) | >= 1.0 | EV / PV |
| Cost Performance Index (CPI) | >= 1.0 | EV / AC |
| Task Completion Rate | >= 90% | Tasks completed on time / Total planned tasks |
| Estimate at Completion (EAC) | <= Budget | BAC / CPI |
| Variance at Completion (VAC) | >= 0 | BAC - EAC |
| Planned vs. Actual Quantity Variance | < 5% | |Planned qty - Actual qty| / Planned qty |
| Progress Report Timeliness | 100% on time | Reports submitted by deadline / Total reports due |
| Productivity Rate | Per trade norm | Quantity installed / Labor-hours |

---

### Process #26: Hidden/Concealed Work Acts (Акты скрытых работ)

**1. Process Description**

Hidden (concealed) work acts document construction work that will be covered by subsequent layers or structures and cannot be inspected afterward — foundations before backfill, reinforcement before concrete pouring, waterproofing before protection layers, embedded items before enclosure, etc. This is one of the most critical quality assurance documents in construction because it provides the only proof that concealed work was executed correctly.

In Russia, this is strictly regulated under RD-11-02-2006 (Appendix 3 — Акт освидетельствования скрытых работ). Internationally, the concept exists as "inspection before cover-up" or "hold point inspection."

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Contractor's authorized representative | Presents work for inspection, signs act |
| Site engineer / foreman | Prepares the work area and documentation |
| Owner's technical supervision (технадзор) | Inspects and approves the concealed work |
| Design supervision (авторский надзор) | Verifies compliance with design drawings |
| Stroy-kontrol representative | Independent verification |
| Rostechnadzor inspector (for critical structures) | State supervision sign-off |
| QC engineer | Performs measurements and tests |
| Lab technician | Provides test results (concrete strength, soil compaction, etc.) |

**3. Input Data**

- Project drawings (рабочая документация) for the specific element
- Work execution technology (ППР — Project for Work Execution)
- Quality control plan with hold points
- Material certificates and test results
- Geodetic survey data (as-built positions, elevations)
- Results of intermediate inspections
- Notification to inspection parties (minimum 3 days advance per RD-11-02-2006)
- Previous related concealed work acts

**4. Output Data / Documents**

- **Акт освидетельствования скрытых работ** (Act of Inspection of Concealed Work) per RD-11-02-2006, Appendix 3
- Supporting attachments: as-built drawings, lab test protocols, geodetic certificates
- Photo documentation of the concealed elements before covering
- Entry in the General Work Journal
- **International**: Inspection report; quality hold-point release; ITP (Inspection and Test Plan) sign-off

**5. Typical Pain Points**

- 3-day notification requirement causes schedule delays when inspectors are unavailable
- Multiple signature collection from geographically distributed parties
- Work sometimes covered before the act is signed (violation requiring re-opening)
- Paper acts get lost or damaged on site
- No traceability between concealed work acts and the specific drawing revision
- Massive volume of acts on large projects (hundreds to thousands)
- Difficulty retrieving specific acts during commissioning or warranty claims
- Inconsistent documentation quality across subcontractors

**6. Ideal ERP Functions**

- Digital concealed work act creation with structured form per RD-11-02-2006 Appendix 3
- Automated notification system (3-day advance) to all required signatories
- Electronic signature workflow with role-based routing
- Mandatory photo attachment (before cover-up) with GPS and timestamp
- Link to specific drawing revision and BIM model element
- Link to related lab test results and material certificates
- Calendar/scheduling integration showing inspection windows
- Status tracking: Draft -> Notification Sent -> Inspection Scheduled -> Inspected -> Signed -> Archived
- QR code on physical act linking to digital record
- Batch generation for repetitive work (e.g., floor-by-floor reinforcement)
- Search and filter by work type, date, location, status
- Export to regulatory-compliant PDF format
- Dashboard: acts pending, overdue, completed per section/floor

**7. Russia-Specific**

- **РД-11-02-2006** (Приказ Ростехнадзора от 26.12.2006 г. №1128): Primary regulatory document defining the form and requirements for concealed work acts
- **СП 48.13330.2019**: Establishes that the list of concealed works requiring inspection is defined by project documentation
- **Gradostroitelny Kodeks (ГрК РФ), Article 53**: Legal basis for construction supervision including concealed work inspection
- Mandatory advance notification: minimum 3 working days before the work is ready for inspection
- If the inspector doesn't appear within the notification period, work may proceed with the contractor's own documentation
- Acts must be signed before the next stage of work can begin (hold point)
- For particularly dangerous/technically complex objects: Rostechnadzor representative must participate
- The list of concealed works is typically defined in the Quality Control Plan (Программа контроля качества) or the ITP (ПКК — Программа контрольных карт)
- Digital acts now increasingly accepted with qualified electronic signatures (КЭП)

**8. Global Market**

- **ITP (Inspection and Test Plan)**: International standard document defining hold points, witness points, and review points for concealed work
- **ACI 311.4R**: Guide for Concrete Inspection — includes requirements for pre-pour inspections
- **ASTM E329**: Standard Specification for Agencies Engaged in Construction Inspection
- **BS 8000 Series** (UK): Workmanship on building sites — defines inspection requirements before cover-up
- **AS 2870 (Australia)**: Footing design requires inspection before concrete pour
- **FIDIC Contracts (Red Book, cl. 7.3)**: Contractor must give notice before covering work; Engineer has right to inspect
- **ISO 19650** (BIM): Digital twin concept provides digital record of concealed elements
- Common international practice: "pre-cover" or "pre-pour" inspection check; "hold point release"

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Act completion rate | 100% | Acts completed / Acts required per ITP |
| On-time notification rate | 100% | Notifications sent >=3 days prior / Total acts |
| Inspection delay (avg) | < 1 day | Avg time between readiness and inspection |
| Defects found at inspection | < 5% | Acts with defects / Total acts inspected |
| Re-opening rate | 0% | Cases where covered work was re-opened / Total |
| Digital documentation rate | 100% | Acts with photo+geodetic data / Total acts |
| Signature collection time | < 48 hours | Avg time from inspection to all signatures collected |

---

### Process #27: KS-2, KS-3 Formation (Russia) / AIA G702-G703 (USA)

**1. Process Description**

This is the formal process of documenting completed construction work for payment. In Russia, it involves generating КС-2 (Акт о приемке выполненных работ — Act of Acceptance of Completed Work) and КС-3 (Справка о стоимости выполненных работ и затрат — Certificate of Cost of Completed Work and Expenses). In the USA, the equivalent is the AIA G702 (Application and Certificate for Payment) with G703 (Continuation Sheet).

These documents serve as the contractual basis for progress payments from the owner to the contractor and from the contractor to subcontractors. They represent the financial translation of physical work completion.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| **Russia** | |
| Contractor's estimator (сметчик) | Prepares КС-2 based on КС-6а data |
| Contractor's project manager | Reviews and signs КС-2 |
| Owner's technical supervision | Verifies volumes and signs КС-2 |
| Owner's authorized representative | Signs КС-3 |
| **USA** | |
| Contractor / subcontractor | Prepares G702/G703 |
| Architect / engineer | Reviews and certifies payment amount on G702 |
| Owner | Approves and makes payment |

**3. Input Data**

- **Russia**: КС-6а (Journal of Completed Work) with cumulative volumes; contract estimate (договорная смета); price indices (индексы пересчёта); agreed unit rates
- **USA**: Schedule of Values (SOV) from contract; previous payment applications; current percent complete per line item; stored materials documentation
- Physical measurement data / survey results
- Quality acceptance documentation (concealed work acts, test results)
- Change orders affecting contract sum
- Retainage terms from contract

**4. Output Data / Documents**

- **Russia**: Форма КС-2 (per line item with quantities, rates, amounts); Форма КС-3 (summary certificate with cumulative totals, current period, and remaining); Реестр актов (register of acts)
- **USA**: AIA G702 (cover page: contract sum, total completed, retainage, previous payments, current due); AIA G703 (continuation sheet: line-by-line breakdown with columns A through I)
- Supporting documentation: measurement records, photos, material certificates
- Invoice/payment request based on certified amounts

**5. Typical Pain Points**

- Manual data re-entry from field measurements into estimate formats
- Price index application errors (Russia: monthly index updates from Minstroi)
- Disputes over measured quantities between contractor and owner
- Long approval cycles (multiple rounds of review and correction)
- Discrepancies between КС-2 line items and contract estimate
- Change orders not properly reflected in payment documents
- Retainage calculation errors
- No automated connection between daily log volumes and КС-2 generation
- Paper-based sign-off requiring physical presence
- Version control issues when acts go through multiple revisions

**6. Ideal ERP Functions**

- Auto-generation of КС-2 from КС-6а journal data with one click
- Built-in сметная база (estimate database): ГЭСН, ФЕР, ТЕР with current price indices
- Automatic price index application from Minstroi data feeds
- Configurable templates for both Russian (КС-2/КС-3) and international (G702/G703) formats
- Line-item drill-down to supporting daily logs and measurements
- Retainage calculation (standard: 5-10% in US; varies in Russia)
- Change order integration: auto-update contract sum and add new line items
- Digital approval workflow with electronic signatures
- Comparison view: previous period vs. current period vs. cumulative
- Automatic reconciliation with budget/forecast
- PDF export in official format with all required fields
- Batch processing for multiple subcontractor acts
- Audit trail showing all changes and approvals
- Integration with accounting module for payment processing

**7. Russia-Specific**

- **Постановление Госкомстата от 11.11.1999 N 100**: Original approval of КС-2 and КС-3 unified forms
- **КС-2** includes: work description per estimate line, unit of measurement, quantity, unit rate, amount; must match the contract estimate structure
- **КС-3** includes: contract name, reporting period, cumulative from start, completed in current period, including change orders
- КС-2 has legal force only when accompanied by КС-3
- Since 2013 (ФЗ-402), forms are not strictly mandatory but remain de facto standard and are expected by tax authorities
- Electronic КС-2/КС-3 via EDI (ЭДО) platforms: Diadoc, СБИС, Контур — becoming standard practice
- Price indices: applied from quarterly/monthly letters of Minstroi Russia or regional centers for pricing (РЦКС)
- For government contracts (44-ФЗ, 223-ФЗ): strict compliance with estimate norms required
- **ЕИС (Единая информационная система)**: Government procurement system integration for public projects

**8. Global Market**

- **AIA G702-1992** (Application and Certificate for Payment): Industry standard cover page; requires notarization of contractor's signature
- **AIA G703-1992** (Continuation Sheet): Columns: Item Number, Description, Scheduled Value, Work Completed (Previous/This Period), Materials Stored, Total Completed & Stored, %, Balance to Finish, Retainage
- **AIA A201-2017**, Sections 9.3-9.6: Defines the payment application process, architect's certification authority
- **AGC Forms**: Alternative payment application forms for AGC-based contracts
- **FIDIC (Red Book, cl. 14.3)**: Interim Payment Certificates (IPC) — similar concept
- **NEC4 (UK), cl. 50-51**: Assessment of amount due
- **JCT (UK)**: Interim valuation and certificates
- **CCDC (Canada)**: Progress Payment Certificate
- Standard retainage: 5-10% (varies by jurisdiction; some US states cap retainage by law)

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Payment cycle time | < 30 days | Date payment received - Date act submitted |
| First-pass approval rate | > 80% | Acts approved without revision / Total acts submitted |
| Billing accuracy | > 98% | Acts without pricing errors / Total acts |
| Retainage tracking accuracy | 100% | System retainage balance vs. Contract retainage |
| Certification gap | < 5% | (Applied amount - Certified amount) / Applied amount |
| Cumulative billing vs. Schedule | Within 5% | Billed to date / Planned billing to date |
| Outstanding receivables age | < 45 days | Avg days from certification to payment |

---

### Process #28: Photo Documentation of Progress Linked to Plan

**1. Process Description**

Construction photo documentation systematically captures visual evidence of project progress, conditions, and quality at defined intervals and milestones. Modern practice links photos to specific locations on floor plans, WBS items, BIM model elements, or GPS coordinates, creating a searchable visual history of the project.

This process has evolved from simple camera snapshots to structured 360-degree capture, drone photography, and AI-powered progress comparison against 4D BIM models.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Site engineer / superintendent | Captures daily progress photos |
| QC engineer | Captures quality inspection photos |
| Safety officer | Captures safety condition photos |
| Drone operator | Captures aerial progress photos |
| BIM coordinator | Links photos to BIM model elements |
| Project manager | Reviews photo reports |
| Owner / client | Views progress through photo reports |

**3. Input Data**

- Floor plans / site plans with location reference grid
- BIM model (for 4D comparison)
- Photo capture schedule (daily, weekly, milestone-based)
- Camera/device with GPS capability
- Previous period photos (for comparison)
- WBS structure for photo categorization
- Specific inspection requirements (concealed work, quality checks)

**4. Output Data / Documents**

- Geo-tagged, timestamped photos organized by location and date
- 360-degree panoramic captures of rooms/areas
- Drone orthophotos and aerial progress images
- Before/after comparison views
- Photo-linked progress reports
- Time-lapse compilations
- Annotated photos with markup and notes
- Attachments to daily logs, concealed work acts, quality reports

**5. Typical Pain Points**

- Photos taken but not organized — thousands of unnamed files on hard drives
- No linkage between photos and specific plan locations or work items
- Camera timestamps often incorrect, reducing evidentiary value
- Inconsistent photo quality and angles making comparison difficult
- No standardized naming convention across team members
- Photos stored locally on phones, not backed up or shared
- Difficulty finding specific photos months later during disputes
- Time-consuming to create visual progress reports manually
- No automated comparison between planned 4D model and actual photos

**6. Ideal ERP Functions**

- Mobile photo capture with automatic GPS, timestamp, and compass heading
- Floor plan / site plan overlay: tap location to attach photo
- BIM model integration: link photo to specific 3D element
- 360-degree photo capture and viewing
- Side-by-side comparison tool (same location, different dates)
- Auto-categorization by work type, location, date
- Structured photo assignments (required photos per inspection type)
- Annotation tools (markup, dimensions, notes on photos)
- Time-lapse generation from recurring captures
- AI-powered progress detection (compare photo to 4D BIM planned state)
- Drone photo integration with site map overlay
- Photo report generator with templates
- Offline capture with automatic sync when connectivity restored
- Unlimited storage with smart compression
- Full-text search of photo annotations and metadata

**7. Russia-Specific**

- **РД-11-02-2006**: Photo documentation is a recommended (but not mandatory) supplement to concealed work acts and other executive documentation
- **СП 48.13330.2019**: Encourages use of modern documentation methods including photographic records
- Photos serve as supporting evidence for акты скрытых работ, акты освидетельствования конструкций
- For court proceedings and arbitration, photos must have reliable timestamps and metadata to be admissible
- Some Заказчики (owners) contractually require regular photo reports (often weekly)
- Drone usage requires permits from air authorities (Росавиация) and compliance with ФЗ-462 on unmanned aircraft

**8. Global Market**

- **4D BIM Progress Tracking**: Linking site photos to 4D BIM models for automated progress detection (tools like OpenSpace, Cupix, Imerso, HoloBuilder)
- **360-degree capture**: Structured walkthroughs using 360 cameras (Ricoh Theta, Insta360) mapped to floor plans
- **Drone regulations**: FAA Part 107 (USA), EASA regulations (EU) for commercial drone operations on construction sites
- **ASTM E2018**: Standard Guide for Property Condition Assessments — includes photo documentation requirements
- **AI-powered analysis**: Computer vision algorithms that detect completed elements in photos and compare against BIM models
- **ISO 19650**: Information management using BIM includes photo documentation as part of the Common Data Environment (CDE)
- Standards bodies (RICS, AACE) increasingly recognize structured photo documentation as standard practice

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Photo capture compliance | 100% | Required photos taken / Required photos per schedule |
| Geo-tagging accuracy | 100% | Photos with valid GPS coordinates / Total photos |
| Plan linkage rate | > 90% | Photos linked to floor plan location / Total photos |
| Time-lapse coverage | 100% of key areas | Areas with weekly captures / Total monitored areas |
| Photo report delivery | On schedule | Reports delivered on time / Total reports due |
| Storage utilization | Monitored | GB/month consumption trend |
| Avg photos per daily log | >= 10 | Total photos / Total daily logs |

---

### Process #29: Weather Conditions Tracking and Schedule Impact

**1. Process Description**

Weather tracking in construction documents actual site weather conditions (temperature, precipitation, wind, humidity) and correlates them with schedule impacts. This data serves three purposes: (1) real-time decision-making on work feasibility, (2) contractual basis for weather delay claims, and (3) historical analysis for future project planning.

Weather delays are typically classified as excusable, non-compensable delays — the contractor gets a time extension but no additional cost (per standard AIA/FIDIC contracts). Proper documentation is essential for proving the delay was caused by "abnormal" or "unusually severe" weather beyond what was anticipated.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Site superintendent | Records daily weather conditions in the log |
| Scheduler / planner | Analyzes weather impact on critical path |
| Project manager | Submits weather delay claims |
| Claims analyst | Prepares formal delay claim documentation |
| Owner / engineer | Reviews and approves/denies weather delay claims |
| Meteorological service | Provides historical averages and forecasts |

**3. Input Data**

- Real-time weather data (from on-site weather station or weather API)
- Historical weather averages for the project location (10-year baseline)
- Contract-defined weather thresholds (e.g., "adverse weather" definition)
- CPM schedule with weather-sensitive activities identified
- Activity-specific weather constraints (e.g., concrete: >5C, painting: <85% humidity, crane: <35 km/h wind)
- Construction methodology documents specifying weather limitations

**4. Output Data / Documents**

- Daily weather log (part of the daily construction report)
- Monthly weather summary with comparison to historical averages
- Weather delay analysis report (actual vs. anticipated weather days)
- Time extension request with critical path impact analysis
- Updated schedule reflecting weather delays
- **Russia**: Entry in Общий журнал работ (Section 2 — weather conditions)
- **USA**: Notice of delay claim per contract requirements

**5. Typical Pain Points**

- No standard definition of "abnormal" weather — disputes over thresholds
- Weather recorded inconsistently or not at all
- No connection between weather data and specific schedule activities
- Difficult to prove which activities were actually impacted (critical path analysis required)
- Historical weather baselines not established at project start
- Claims submitted late, past notification deadlines
- Manually correlating weather events with schedule impact
- Weather forecasts not integrated into look-ahead planning

**6. Ideal ERP Functions**

- Automatic weather data ingestion from weather APIs (OpenWeatherMap, Weather Underground, etc.)
- On-site weather station integration (IoT sensors)
- Historical baseline calculation from NOAA/Roshydromet data for project location
- Activity-specific weather constraints in the schedule (auto-flag when conditions exceed thresholds)
- Automatic identification of "lost weather days" (actual exceeds anticipated)
- Weather impact on critical path: auto-analysis showing schedule delay
- Time extension calculation: comparing actual weather days vs. contract baseline
- Alert system: forecast for next 48 hours shows work-stopping conditions
- Monthly weather report generation with graphs and comparisons
- Integration with daily log module (auto-populate weather section)
- Weather delay claim template generator
- Dashboard showing cumulative weather days used vs. allowance

**7. Russia-Specific**

- **СП 48.13330.2019**: Requires recording weather conditions in the General Work Journal
- **СНиП 3.03.01-87** (replaced by СП 70.13330): Defines temperature limits for concrete, masonry, welding, and other work types
- **СП 70.13330.2012**: Specifies weather requirements: concrete placement not below -10C (with additives), masonry not below -10C, welding not below -30C
- Weather delays in Russia are typically governed by contract terms; the standard government contract (44-ФЗ) provisions for force majeure include "abnormal natural phenomena"
- Roshydromet (Росгидромет) provides official weather data for legal/contractual purposes
- Winter construction ("зимнее удорожание") has separate cost coefficients in Russian estimates

**8. Global Market**

- **AIA A201-2017, cl. 8.3.1**: Delays caused by unusual weather conditions may entitle contractor to time extension
- **FIDIC Red Book, cl. 8.4(c)**: "Exceptionally adverse climatic conditions" as a basis for extension of time
- **EJCDC C-700**: Weather is an excusable delay event with specific notification requirements
- Common contract thresholds: precipitation >1.0 inch/24h, snow >2 inches/24h, temperature <32F or >95F, wind gusts >30 mph
- **NOAA (USA)**: Source of historical weather data for baseline establishment
- **SmartPM, Oracle P6**: Schedule analysis tools that integrate weather data for delay analysis
- Best practice: establish the "anticipated weather day" baseline at contract award using 10-year historical average

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Weather data capture rate | 100% | Days with weather data / Total workdays |
| Anticipated vs. actual weather days | Within 10% | Actual weather delays / Anticipated weather days |
| Weather delay notification compliance | 100% | Timely notifications / Total weather delay events |
| Critical path impact rate | Monitored | Weather days impacting CP / Total weather days |
| Schedule recovery after weather | < 5 days lag | Avg days to recover schedule after weather event |
| Forecast accuracy utilization | > 80% | Days with preemptive schedule adjustments / Days with adverse forecast |

---

### Process #30: Punch Lists / Snag Lists (Defect Management)

**1. Process Description**

A punch list (US) or snag list (UK/international) is a comprehensive register of incomplete or defective work items that must be addressed before a project (or phase) can achieve final completion and payment release. It is created after substantial completion and before final acceptance, representing the last barrier to project closeout.

Modern best practice advocates for "rolling punch lists" — continuous defect identification throughout construction rather than a single end-of-project exercise, which reduces the final punch list volume by up to 70%.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Owner / owner's representative | Identifies punch items during walkthrough |
| Architect / designer | Identifies design-related deficiencies |
| General contractor superintendent | Manages punch list resolution |
| Subcontractor foremen | Execute corrections for their scope |
| QC engineer | Verifies corrections meet quality standards |
| Commissioning agent | Identifies systems-level deficiencies |
| Project manager | Tracks overall punch list status and closure |

**3. Input Data**

- Contract specifications and drawings (basis for conformance)
- Certificate of Substantial Completion (triggers punch list creation)
- Inspection notes from walkthrough
- Quality control checklists
- Commissioning test results
- Photos documenting deficiencies
- Previous punch list items (if rolling punch list)

**4. Output Data / Documents**

- Punch list register with: item #, location, description, responsible party, severity, due date, status
- Photos of each deficiency (before and after correction)
- Marked-up floor plans showing deficiency locations
- Correction verification reports
- Final punch list sign-off (all items resolved)
- **Russia**: Ведомость дефектов (Defect Register); Акт приемки с замечаниями (Acceptance Act with Remarks); Предписания строительного контроля
- **USA**: Certificate of Final Completion (after punch list closure)

**5. Typical Pain Points**

- Massive punch lists at project end because defects weren't tracked earlier
- Ambiguous item descriptions making it unclear what needs to be fixed
- No clear ownership — subcontractors dispute responsibility
- Items "completed" but not verified, requiring re-inspection
- No photo evidence of the deficiency or the correction
- Punch list items lost in email threads and spreadsheets
- Holdback/retainage disputes tied to punch list items
- No priority system — critical items mixed with cosmetic issues
- Difficult to track aging items that remain open for weeks

**6. Ideal ERP Functions**

- Mobile punch list creation with photo, GPS pin on floor plan, voice note
- Floor plan / BIM model-based deficiency placement (tap to drop pin)
- Auto-assignment to responsible subcontractor based on trade/scope mapping
- Priority/severity classification: Critical / Major / Minor / Cosmetic
- Status workflow: Open -> Assigned -> In Progress -> Corrected -> Verified -> Closed
- Before/after photo comparison for verification
- Due date tracking with escalation alerts
- Rolling punch list capability (create items anytime during construction)
- Batch operations (close multiple items, reassign, etc.)
- Dashboard: items by status, by trade, by age, by priority
- Integration with retainage release workflow
- Automated notification to subcontractors when items assigned
- Historical analytics: defect rates by trade, most common defect types
- Export to PDF report grouped by location or trade
- Offline capability for walkthrough inspections

**7. Russia-Specific**

- **СП 48.13330.2019**: Defines requirements for acceptance procedures including deficiency documentation
- **Градостроительный кодекс, ст. 55**: Building permit authority inspects for compliance; defects must be resolved before commissioning
- **РД-11-02-2006**: Акт освидетельствования конструкций — may include deficiency notes requiring correction
- Standard practice: "Предписание" (order) issued by технадзор (owner's supervision) requiring correction
- Warranty period: typically 5 years for buildings per ГК РФ ст. 756 (defects discovered during warranty trigger new "Дефектный акт")
- For government contracts: acceptance commissions may include representatives from multiple state agencies
- **Акт приемки по форме КС-11** or **КС-14**: Final acceptance acts that cannot be signed until all defects resolved

**8. Global Market**

- **AIA A201-2017, cl. 9.8**: Substantial Completion defined; architect prepares punch list
- **AIA G704**: Certificate of Substantial Completion — triggers punch list process
- **FIDIC Red Book, cl. 11**: "Defects Notification Period" — defects found after taking-over must be remedied
- **NEC4 (UK), cl. 43-45**: Defect correction period and defects date
- **ASHRAE Guideline 0**: Commissioning process includes punch list for building systems
- **ISO 19650-3**: Asset management phase information requirements include defect tracking
- Best practice tools: Fieldwire, PlanGrid, Procore, BIM 360 — all offer digital punch list modules
- Emerging trend: AI-powered defect detection from 360-degree photos

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Punch list items at substantial completion | < 1 per 1000 sq.ft | Total items / Gross area |
| Avg closure time | < 14 days | Avg days from creation to verified closure |
| First-fix rate | > 85% | Items closed after first correction attempt / Total items |
| Open item aging | < 10% over 30 days | Items open >30 days / Total open items |
| Items by severity | < 5% Critical | Critical items / Total items |
| Rolling punch list adoption | > 70% pre-SC | Items created before Substantial Completion / Total items |
| Verification turnaround | < 48 hours | Avg time from "corrected" to "verified" |
| Defect rate by trade | Monitored | Punch items per trade / Value of trade's work |

---

## BLOCK 6: SUPPLY CHAIN AND LOGISTICS

---

### Process #31: Material Requests and Approval Chain

**1. Process Description**

Material requisition is the formal process by which field teams identify, request, and obtain approval for construction materials needed on site. The process starts with need identification (from the schedule, upcoming work, or stock depletion), flows through approval based on budget authorization levels, and ends with a purchase order issued to a supplier. Proper requisition management prevents unauthorized purchases, controls costs, and ensures material availability aligns with the construction schedule.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Foreman / site engineer | Identifies material need, creates requisition |
| Project manager | First-level approval (within budget authority) |
| Cost engineer / estimator | Verifies quantities against estimate/budget |
| Procurement manager | Processes approved requisition, selects supplier |
| Finance / accounting | Budget verification, payment approval |
| Warehouse manager | Checks existing stock before new purchase |
| Director / VP (for high-value items) | Senior approval for items above threshold |

**3. Input Data**

- Construction schedule (upcoming work requiring materials)
- Bill of Quantities / Bill of Materials from project estimate
- Current stock levels in on-site and central warehouses
- Budget status (remaining budget per cost code)
- Approved supplier list
- Material specifications from design documents
- Lead times for critical materials
- **Russia**: Лимитно-заборная карта (М-8) — defines material limits per work scope

**4. Output Data / Documents**

- Material Requisition Form (MRF) with: item, quantity, specification, delivery date needed, cost code, justification
- Approval trail (digital signatures at each level)
- Purchase Order (PO) to selected supplier
- **Russia**: Форма М-8 (Лимитно-заборная карта); Заявка на материалы; Требование-накладная М-11
- **International**: Material Requisition (MR); Purchase Requisition (PR); Purchase Order (PO)

**5. Typical Pain Points**

- Requisitions submitted too late — materials not available when needed
- No visibility into existing stock (duplicate purchases)
- Long approval chains causing delays on urgent items
- Budget overruns discovered only after purchase is made
- Paper-based requisitions lost or delayed in transit
- No connection between requisition and schedule (can't plan ahead)
- Unauthorized purchases bypassing the system (petty cash purchases at hardware stores)
- Specification errors leading to wrong materials ordered
- No tracking of requisition status (submitted, approved, ordered, delivered)

**6. Ideal ERP Functions**

- Mobile requisition creation from field with photo of needed item
- Auto-suggest from BIM/BOQ: upcoming work -> required materials -> pre-filled requisition
- Stock check: auto-query all warehouses before allowing new purchase
- Tiered approval workflow configurable by: amount threshold, material category, project
- Budget validation: real-time check against cost code remaining balance
- Urgency classification: Normal / Urgent / Emergency (with different approval paths)
- Integration with schedule: auto-generate requisitions for upcoming 2-week look-ahead activities
- Supplier catalog integration: select from approved supplier list with current pricing
- Status tracking dashboard: Drafted -> Submitted -> Approved -> PO Issued -> Shipped -> Delivered
- Requisition analytics: avg processing time, rejection rate, top requesters
- Automated reminders for pending approvals
- Consolidation of similar requisitions across projects for bulk purchasing
- Mobile approval for managers on the go
- Лимитно-заборная карта (М-8) generation and tracking against limits

**7. Russia-Specific**

- **Форма М-8 (Лимитно-заборная карта)**: Tracks material issuance against established limits per work scope; although no longer mandatory since 2013 (ФЗ-402), widely used in practice
- **Форма М-11 (Требование-накладная)**: Used for material movement from warehouse to site
- **44-ФЗ / 223-ФЗ**: Government procurement regulations require competitive bidding above certain thresholds
- Material specifications must comply with ГОСТ standards and project design documentation
- Import materials require certification (Декларация соответствия / Сертификат соответствия) per ТР ТС (Technical Regulations of the Customs Union)
- For budget-funded projects: material procurement must follow the planned procurement schedule (План-график закупок)
- **1С:Бухгалтерия** integration: requisitions must align with accounting chart of accounts and cost centers

**8. Global Market**

- **Procurement workflow standards**: CIPS (Chartered Institute of Procurement & Supply) best practices
- **AIA A201-2017, cl. 3.7**: Contractor responsible for purchasing materials per specifications
- **FIDIC Red Book, cl. 6.5**: Contractor procures materials and equipment; engineer may inspect
- **ISO 44001**: Collaborative business relationships management (supplier-contractor)
- **CSI MasterFormat / UniFormat**: Standardized codes for material categorization
- Best practice: three-way match (PO, delivery receipt, invoice) for payment authorization
- Digital procurement platforms: Procore, ProcurePro, BuildingConnected
- Emerging: AI-powered material forecasting based on schedule and historical consumption

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Requisition-to-PO cycle time | < 3 days (normal), < 24h (urgent) | Avg time from submission to PO issuance |
| Approval turnaround time | < 24 hours per level | Avg time per approval step |
| Stock-check hit rate | > 30% | Requisitions fulfilled from existing stock / Total requisitions |
| Budget compliance rate | > 95% | Requisitions within budget / Total requisitions |
| Unauthorized purchase rate | < 2% | Off-system purchases / Total purchases |
| Requisition accuracy | > 95% | Requisitions without spec/qty errors / Total requisitions |
| Material availability on time | > 95% | Materials available by needed date / Total material needs |

---

### Process #32: Supplier Management

**1. Process Description**

Supplier management encompasses the complete lifecycle of managing construction material and service suppliers: identification, prequalification, evaluation, onboarding, performance monitoring, and relationship management. Effective supplier management ensures reliable material supply, competitive pricing, quality compliance, and contractual risk mitigation.

In construction, supplier management is particularly critical because of the project-based nature of work (new suppliers per project/region), long lead times for specialty materials, quality certification requirements, and the direct impact of supplier failures on project schedule.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Procurement manager | Manages supplier registry, evaluation process |
| Category manager | Specializes in specific material categories |
| QC engineer | Evaluates supplier quality certifications and material test results |
| Project manager | Provides project-specific supplier requirements |
| Legal department | Reviews supplier contracts and risk |
| Finance / accounting | Manages supplier payment terms, credit checks |
| Safety officer | Evaluates supplier safety performance |
| Warehouse manager | Evaluates delivery performance |

**3. Input Data**

- Market research: available suppliers for required materials
- Prequalification questionnaires (PQQs) submitted by suppliers
- Financial statements and credit reports
- Quality certifications (ISO 9001, ISO 14001, ГОСТ certifications)
- Safety records (EMR, OSHA incident rates)
- References from other projects/clients
- Price proposals and commercial terms
- Historical performance data (if existing supplier)
- Supplier diversity requirements (for certain markets/contracts)

**4. Output Data / Documents**

- Approved Supplier List (ASL) / Approved Vendor List (AVL)
- Supplier prequalification score cards
- Supplier contracts with terms and conditions
- Supplier performance evaluation reports (quarterly/annual)
- Supplier audit reports
- Non-conformance reports linked to specific suppliers
- **Russia**: Реестр поставщиков; Протоколы оценки поставщиков; Реестр квалифицированных поставщиков

**5. Typical Pain Points**

- No centralized supplier database — each project manager has their own contact list
- Prequalification data becomes outdated (certifications expire, financial status changes)
- No systematic performance tracking — poor suppliers get rehired
- Supplier evaluation is subjective rather than data-driven
- Long lead times for specialty materials not identified early enough
- No visibility into supplier capacity constraints across multiple projects
- Contract terms inconsistent across projects with the same supplier
- Quality issues discovered only upon delivery (no pre-shipment inspection)
- Difficulty managing supplier compliance documentation

**6. Ideal ERP Functions**

- Centralized supplier registry with full profile (contacts, certifications, categories, history)
- Prequalification workflow: PQQ template -> submission -> scoring -> approval/rejection
- Automated certification expiry tracking with alerts
- Multi-criteria supplier evaluation scoring (quality, delivery, price, safety, responsiveness)
- Performance scorecards auto-calculated from: delivery on-time %, quality rejection %, price competitiveness
- RFQ (Request for Quote) management: send RFQ, receive/compare quotes, award
- Supplier audit scheduling and report management
- Non-conformance reporting linked to supplier profile
- Supplier portal: self-service registration, document upload, PO acknowledgment
- Spend analytics: total spend by supplier, category, project
- Risk assessment: financial health monitoring, single-source dependency alerts
- Capacity tracking: which suppliers are committed on which projects
- Integration with procurement module for seamless PO issuance
- Contract management: standard terms, deviations tracking, renewal alerts

**7. Russia-Specific**

- **44-ФЗ (Government procurement)**: Suppliers must be registered in the Unified Information System (ЕИС); restrictions on certain countries of origin
- **223-ФЗ (State enterprise procurement)**: More flexibility but still requires documented selection process
- **ТР ТС / ТР ЕАЭС**: Materials must have conformity declarations/certificates per Customs Union Technical Regulations
- **ГОСТ ISO 9001**: Quality management certification recognized in Russia
- **SRO (Саморегулируемые организации)**: Some suppliers of engineering services must be SRO members
- Import substitution policies (импортозамещение) may restrict foreign supplier usage on government projects
- Supplier tax compliance check: INN verification, absence from "unreliable suppliers" registry

**8. Global Market**

- **ISO 28000:2022**: Security management systems for supply chain
- **ISO 44001:2017**: Collaborative business relationship management
- **ISO 9001:2015**: Quality management systems (supplier certification)
- **Common Assessment Standard (Build UK)**: Industry benchmark for subcontractor/supplier prequalification in UK
- **ISNetworld, Avetta, BROWZ**: Third-party supplier prequalification platforms
- **Achilles**: Global supplier prequalification network
- **CIPS Standards**: Chartered Institute of Procurement and Supply ethical procurement standards
- **Construction Industry Scheme (CIS)** in UK: Tax verification for construction suppliers
- Emerging trend: ESG (Environmental, Social, Governance) scoring of suppliers; carbon footprint tracking per ISO 14064

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| On-time delivery rate | > 95% | Deliveries on time / Total deliveries |
| Quality rejection rate | < 2% | Rejected deliveries / Total deliveries |
| Supplier evaluation score | > 80/100 | Weighted average of all criteria |
| Approved supplier coverage | > 90% | Spend with approved suppliers / Total procurement spend |
| PQQ processing time | < 14 days | Avg time from PQQ submission to decision |
| Supplier diversity ratio | Per contract req | Diverse supplier spend / Total spend |
| Single-source risk | < 10% of categories | Material categories with only 1 supplier / Total categories |
| Contract compliance rate | > 95% | Compliant deliveries / Total deliveries |

---

### Process #33: Delivery Tracking

**1. Process Description**

Delivery tracking monitors the end-to-end movement of construction materials from supplier to job site: order confirmation, production/fabrication status, shipment, in-transit tracking, site arrival, receiving inspection, and acceptance or rejection. Effective delivery tracking prevents material shortages that cause schedule delays and enables proactive logistics management.

On large construction projects, hundreds of deliveries per week must be coordinated with limited site access, storage space, crane availability, and installation schedules.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Procurement coordinator | Tracks order status with suppliers |
| Logistics coordinator | Schedules delivery windows, coordinates access |
| Warehouse/receiving clerk | Inspects deliveries on arrival |
| Foreman / site engineer | Confirms material matches requirements |
| QC engineer | Inspects material quality on arrival |
| Traffic controller / gate guard | Manages site access for delivery vehicles |
| Supplier | Provides shipment tracking information |

**3. Input Data**

- Purchase orders with expected delivery dates
- Supplier shipment notifications (ASN — Advanced Shipping Notice)
- Carrier tracking numbers / GPS tracking data
- Site logistics plan (access points, crane schedule, storage zones)
- Delivery schedule coordinated with construction schedule
- Material specifications for receiving inspection
- Previous delivery performance data for supplier

**4. Output Data / Documents**

- Delivery schedule / calendar
- In-transit tracking dashboard (GPS positions, ETA)
- Receiving inspection report (quality, quantity, condition)
- Goods received note (GRN)
- Delivery discrepancy report (shortages, damages, wrong items)
- **Russia**: Товарно-транспортная накладная (ТТН); Товарная накладная (ТОРГ-12) or Универсальный передаточный документ (УПД); Акт приемки материалов (М-7)
- Three-way match documentation (PO, GRN, Invoice)

**5. Typical Pain Points**

- No real-time visibility of delivery status — relying on phone calls to suppliers
- Deliveries arriving at wrong time, blocking site access or crane
- No receiving inspection process — defective materials discovered during installation
- Paper delivery notes that get lost
- Quantity discrepancies between PO, delivery note, and actual count
- No coordination between multiple deliveries on the same day
- Long-lead items not tracked separately from standard items
- No link between delivery status and schedule impact analysis
- Damaged goods during transport with unclear liability

**6. Ideal ERP Functions**

- Purchase order tracking with supplier-confirmed dates and live status updates
- Delivery calendar showing all expected deliveries by date, time slot, access point
- GPS tracking integration for in-transit shipments
- Mobile receiving: scan barcode/QR code, enter quantity received, photo of condition
- Automatic comparison: PO quantity vs. delivered quantity with variance alert
- Quality inspection checklist per material type at receiving
- Goods Received Note auto-generation from mobile receiving data
- Discrepancy management: shortage claim, damage claim, return workflow
- Three-way match automation: PO + GRN + Invoice
- Site logistics visualization: delivery slots, crane availability, storage zone capacity
- Long-lead item tracker with milestone notifications (ordered -> fabrication -> QC -> shipped -> on-site)
- Supplier notification system: delivery time slot confirmation, site access instructions
- Integration with warehouse module (auto-update stock on receipt)
- Dashboard: deliveries today, this week, late deliveries, pending inspections

**7. Russia-Specific**

- **Форма М-7 (Акт о приёмке материалов)**: Used when actual delivery differs from supplier's documents (wrong quantity, quality)
- **ТОРГ-12 (Товарная накладная)** or **УПД (Универсальный передаточный документ)**: Primary delivery documentation in Russia; since 2013, electronic УПД via EDI (ЭДО) is widely adopted
- **ТТН (Товарно-транспортная накладная)**: Transport documentation required for logistics
- **Электронная транспортная накладная (ЭТрН)**: Electronic transport waybill, mandatory for certain transportation types
- **Приёмка по количеству и качеству**: Reception by quantity per Инструкция П-6, by quality per Инструкция П-7 (historically); now governed by contract terms
- Imports require customs clearance documentation (ГТД — грузовая таможенная декларация) and conformity certificates

**8. Global Market**

- **RFID / Barcode tracking**: Industry trend for material tracking from fabrication to installation
- **IoT sensors**: Temperature, humidity, shock monitoring for sensitive materials (precast concrete, electronics)
- **ASN (Advanced Shipping Notice)**: EDI standard for supplier-to-buyer shipment notification
- **GS1 standards**: Global barcode/RFID standards for material identification
- **ISO 28000:2022**: Supply chain security management
- **BIM-to-fabrication tracking**: Linking BIM model elements to fabricated components and their delivery status (e.g., structural steel, precast)
- **Just-in-Time (JIT) delivery**: Reducing on-site storage by precise delivery scheduling
- **Last Planner System (LPS)**: Material delivery constraints integrated into weekly work planning
- **Blockchain**: Emerging use for supply chain traceability (provenance, certifications)

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| On-time delivery rate | > 95% | Deliveries within ±1 day of schedule / Total deliveries |
| Receiving inspection pass rate | > 98% | Deliveries accepted without issues / Total deliveries |
| Quantity accuracy | > 99% | Deliveries with correct quantity / Total deliveries |
| Delivery-to-schedule alignment | > 90% | Deliveries within planned installation window / Total |
| Discrepancy resolution time | < 48 hours | Avg time to resolve delivery discrepancies |
| Site access compliance | > 95% | Deliveries within assigned time slot / Total deliveries |
| Long-lead item tracking accuracy | 100% | Items with up-to-date status / Total long-lead items |

---

### Process #34: On-Site Warehouse Management

**1. Process Description**

On-site warehouse management controls the receipt, storage, issuance, and tracking of construction materials at the job site. Unlike traditional warehouse management, construction site warehouses are temporary, space-constrained, exposed to weather, and deal with a wide variety of materials from bulk commodities (sand, gravel) to high-value precision items (electrical panels, HVAC equipment).

Effective site warehouse management prevents material loss/theft, reduces waste, ensures materials are available when needed, and provides accurate data for cost accounting and material write-off.

**3. Participants**

| Role | Responsibility |
|------|---------------|
| Warehouse manager (кладовщик) | Day-to-day warehouse operations, receipt, issuance |
| Material accountant | Tracks material balances, reconciliations |
| Foreman / site engineer | Requests material issuance for daily work |
| QC engineer | Inspects incoming materials for quality |
| Security guard | Controls physical access to warehouse area |
| Safety officer | Ensures proper storage of hazardous materials |
| Project manager | Oversees material budget and consumption |

**3. Input Data**

- Delivery notes / goods received notes (incoming materials)
- Material requisitions from field teams (issuance requests)
- Storage plan (layout of storage areas, zones for different material types)
- Material specifications (storage requirements: temperature, humidity, shelter)
- Safety data sheets (SDS) for hazardous materials
- **Russia**: Приходный ордер (М-4); Лимитно-заборная карта (М-8)

**4. Output Data / Documents**

- Stock ledger / inventory register (карточка складского учета М-17)
- Material issuance records (требование-накладная М-11)
- Inventory reports (current stock levels per material)
- Stock reconciliation report (physical count vs. book balance)
- Material movement journal (all receipts and issuances)
- **Russia**: Карточка учета материалов (М-17); Приходный ордер (М-4); Накладная на отпуск материалов на сторону (М-15); Акт инвентаризации (ИНВ-3)
- **International**: Bin cards, stock reports, cycle count reports

**5. Typical Pain Points**

- Materials issued without proper documentation (informal "borrowing")
- No real-time visibility of stock levels — manual counts only
- Poor storage conditions causing material damage/degradation
- Theft and loss with no accountability
- Materials scattered across multiple storage locations on site
- No integration between warehouse data and project accounting
- Difficulty identifying materials (no labeling system)
- Seasonal challenges: rain, freezing, UV degradation of stored materials
- Space constraints: new deliveries with nowhere to store them
- Materials reserved for one task taken for another

**6. Ideal ERP Functions**

- Digital receiving workflow: scan delivery note -> inspect -> accept/reject -> auto-update stock
- Barcode/QR/RFID labeling for all stored materials
- Location tracking within warehouse (zone, rack, bin)
- Material issuance via mobile: foreman scans QR, enters quantity, system deducts from stock
- Real-time stock dashboard showing all materials across all storage zones
- Automatic alerts for: low stock, expiring materials, materials stored beyond shelf life
- Integration with procurement: auto-trigger requisition when stock hits reorder point
- Integration with cost accounting: issuance auto-debits project cost code
- Reservation system: materials can be reserved for specific upcoming tasks
- Physical inventory (stock-take) support with count sheets and variance reporting
- Storage condition monitoring (IoT sensors for temperature, humidity)
- Photo documentation of received and stored materials
- Multi-site visibility: see stock across all project sites
- Hazardous material tracking with SDS access and regulatory compliance
- Historical consumption analytics for forecasting

**7. Russia-Specific**

- **Форма М-4 (Приходный ордер)**: Receipt order for materials entering warehouse
- **Форма М-8 (Лимитно-заборная карта)**: Controls material issuance within established limits
- **Форма М-11 (Требование-накладная)**: Internal material transfer document
- **Форма М-15 (Накладная на отпуск материалов на сторону)**: For materials issued outside the organization
- **Форма М-17 (Карточка учета материалов)**: Individual material stock card
- **ИНВ-3 (Инвентаризационная опись)**: Physical inventory count form
- **ПБУ 5/01 -> ФСБУ 5/2019 "Запасы"**: Accounting standard for inventory (effective since 2021)
- Material accountable person (МОЛ — материально-ответственное лицо) has personal financial liability for shortages
- Hazardous materials storage regulated by Ростехнадзор (Federal Service for Ecological, Technological, and Nuclear Supervision)

**8. Global Market**

- **RFID/IoT-based tracking**: Real-time material location tracking on construction sites
- **Barcode/QR systems**: Standard for material identification and movement tracking
- **ISO 9001:2015**: Clause 7.1.3 — Infrastructure including storage conditions
- **OSHA 1926.250-252**: Material storage and handling requirements on construction sites
- **Lean Construction**: Just-in-Time delivery minimizing on-site storage needs
- **Last Planner System**: Constraint analysis includes material availability check
- **GS1 standards**: Global identification standards for materials
- **SAP/Oracle ERP**: Warehouse Management (WM) modules adapted for construction
- Procore, Fieldwire: Emerging construction-specific inventory tracking features
- Trend: prefabrication reducing on-site storage by delivering pre-assembled components

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Stock accuracy | > 98% | Items where count = system balance / Total items |
| Material loss/shrinkage rate | < 1% | (Book balance - Physical count) / Book balance |
| Issuance documentation rate | 100% | Documented issuances / Total issuances |
| Stock turnover rate | Industry benchmark | Cost of materials consumed / Avg inventory value |
| Stockout rate | < 2% | Requisitions unfulfilled due to stockout / Total requisitions |
| Receiving processing time | < 4 hours | Avg time from delivery to stock entry |
| Storage condition compliance | 100% | Materials stored per spec / Total materials requiring special storage |
| Inventory count frequency | Monthly | Actual counts / Required counts |

---

### Process #35: Inter-Site Material Transfers

**1. Process Description**

Inter-site material transfer is the process of moving construction materials, tools, or equipment between different project sites within the same organization. This occurs when one site has surplus materials that another site needs, when projects are demobilizing and redistributing assets, or when central warehouses distribute to multiple sites.

Proper inter-site transfer management prevents duplicate purchases, optimizes material utilization across the organization's project portfolio, and maintains accurate accounting records for each project's cost allocation.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Sending site warehouse manager | Prepares materials for transfer, creates outbound documentation |
| Receiving site warehouse manager | Receives and inspects transferred materials |
| Logistics coordinator | Arranges transportation between sites |
| Project managers (both sites) | Approve the transfer (cost implications) |
| Accounting / cost engineer | Manages cost reallocation between project cost codes |
| Transport driver | Physically moves materials |
| Senior management | Approves high-value transfers |

**3. Input Data**

- Surplus inventory report from sending site
- Material requisition / need from receiving site
- Material condition assessment (new, partially used, salvageable)
- Transportation logistics (distance, vehicle type, route)
- Cost allocation rules (transfer price: original cost, depreciated value, or internal rate)
- Approval from both project managers (budget impact)
- Regulatory requirements for transport (hazardous materials, oversized loads)

**4. Output Data / Documents**

- Internal Transfer Request (approved by both PMs)
- Transfer order / inter-site movement note
- Shipping documentation (packing list, transport waybill)
- Receiving inspection report at destination
- Cost reallocation journal entry (debit receiving project, credit sending project)
- **Russia**: Накладная на внутреннее перемещение (М-11 or custom); Форма М-15 (if between legal entities within a group); Транспортная накладная
- **International**: Stock Transfer Order (STO); Inter-company invoice (if between legal entities)

**5. Typical Pain Points**

- No visibility into what surplus materials exist across other sites
- Transfer costs (transport) may exceed purchasing new material
- Transferred materials arrive in poor condition or wrong specification
- Accounting complexities: at what value to transfer? How to handle partially used materials?
- No system for matching surplus from one site to need at another
- Paper-based transfer documentation lost in transit
- No tracking during transit — materials "in limbo" between sites
- Different material coding/naming across sites causing confusion
- Receiving site has no way to verify condition before shipment
- Legal entity complications: VAT implications if transferring between separate companies

**6. Ideal ERP Functions**

- Organization-wide surplus material marketplace: searchable inventory across all sites
- Transfer request workflow: request -> PM approvals (both sites) -> logistics -> execution -> receipt
- Cost allocation engine: configurable transfer pricing rules (at cost, market value, book value)
- In-transit tracking: material status visible in both sending and receiving warehouse systems
- Photo-based condition documentation before and after transfer
- Transportation cost calculation and comparison with new-purchase cost
- Multi-site inventory dashboard: stock levels across all projects with filter/search
- Automatic matching: when a requisition is created, system checks surplus across all sites before creating a PO
- Bar code / QR code continuity: same material ID follows the asset across sites
- Accounting auto-entry: journal entry generated upon confirmed receipt
- Inter-company transfer support: automatic generation of invoices and tax documents for transfers between legal entities
- Analytics: total value of inter-site transfers (cost avoidance metric)

**7. Russia-Specific**

- **Форма М-11 (Требование-накладная)**: Used for material transfer within the same legal entity (between projects/warehouses)
- **Форма М-15 (Накладная на отпуск материалов на сторону)**: For transfers between different legal entities
- **НДС (VAT)**: Inter-company transfers between separate legal entities trigger VAT accounting; within the same entity — no VAT
- **ФСБУ 5/2019 "Запасы"**: Requires proper valuation of transferred inventory
- **ПБУ 6/01 -> ФСБУ 6/2020**: For transfer of fixed assets (equipment) between sites
- Transport documentation: ТТН or Электронная транспортная накладная (ЭТрН)
- Group company transfers require transfer pricing compliance per НК РФ ст. 105.1-105.25 (for related parties)

**8. Global Market**

- **SAP MM / Oracle Inventory**: Stock Transfer Order (STO) functionality between plants/warehouses
- **Inter-company processing**: Standard ERP functionality for multi-entity organizations
- **Lean Construction**: Material sharing across projects as a waste reduction strategy
- **ISO 28000:2022**: Supply chain security applies to inter-site transfers
- **IFRS / IAS 2**: Inventory valuation standards affect transfer pricing
- **Transfer pricing (OECD guidelines)**: For multinational organizations, inter-company material transfers must comply with arm's-length principle
- Multi-project organizations (Skanska, Bouygues, STRABAG) use centralized procurement hubs with distribution to sites

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Inter-site transfer utilization | > 15% of needs | Transfers fulfilled from other sites / Total material needs |
| Transfer processing time | < 5 days | Avg time from request to material receipt |
| Cost avoidance from transfers | Monitored | New-purchase cost - Transfer cost (including transport) |
| Transfer condition compliance | > 95% | Materials received in acceptable condition / Total transferred |
| Accounting accuracy | 100% | Transfers with correct cost allocation / Total transfers |
| Surplus visibility rate | > 90% | Sites with updated surplus data / Total sites |
| In-transit material tracking | 100% | Transfers with live tracking / Total transfers |

---

### Process #36: Material Write-Off Linked to Work Volumes

**1. Process Description**

Material write-off (списание материалов) is the process of deducting materials from inventory and charging them to project costs based on the work volumes actually performed. This process links material consumption to specific construction activities, ensuring that material costs are properly allocated and that actual consumption is compared against normative (estimated) consumption.

In Russia, this is formalized through the М-29 report (Отчёт о расходе основных материалов в строительстве в сопоставлении с расходом, определённым по производственным нормам). The process is critical for cost control, identifying waste/overuse, and preventing theft.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Site engineer / foreman (прораб) | Prepares М-29 report, responsible for material usage |
| Warehouse manager (кладовщик) | Confirms material issuance quantities |
| Estimator (сметчик) | Calculates normative material consumption per work volumes |
| Project manager | Reviews and approves write-off report |
| Chief engineer | Signs off on overages/savings |
| Accounting department | Books material write-off in accounting system |
| QC engineer | Verifies that work volumes match material consumption |

**3. Input Data**

- Completed work volumes (from КС-6а / progress reports)
- Material consumption norms (ГЭСН / ГЕСН, ФЕР / ТЕР, or project-specific norms)
- Warehouse issuance records (М-11, М-8)
- Material receipt records (М-4, delivery notes)
- Current stock levels
- Waste factors and loss coefficients from estimate norms
- Material substitution records (if different material used than specified)

**4. Output Data / Documents**

- **Russia**: Форма М-29 (monthly report comparing actual vs. normative material consumption); Акт списания материалов
- Variance analysis report: overuse (+) or savings (-) per material per work type
- Justification for overuse (if any): technological necessity, design changes, defective materials
- Updated inventory balances (post write-off)
- Cost allocation entries (material costs -> specific WBS/cost codes)
- **International**: Material Usage Report; Cost-to-Complete analysis; Waste report

**5. Typical Pain Points**

- Manual calculation of normative consumption from estimate norms — extremely tedious
- Normative quantities don't match actual conditions (norms are generic, not project-specific)
- Discrepancies between warehouse issuance and actual usage (materials issued but not yet used, or used from a different batch)
- Overuse hidden by spreading it across multiple reporting periods
- No connection between write-off and specific work items (bulk write-off without traceability)
- Time lag: write-off report prepared monthly, but consumption happens daily
- Material substitutions not properly documented, making norm comparison invalid
- No automated link between accepted work volumes (КС-2) and material write-off
- Theft disguised as "technological loss"

**6. Ideal ERP Functions**

- Auto-calculation of normative material consumption from accepted work volumes x estimate norms
- Side-by-side comparison: normative vs. actual vs. variance, per material, per work type
- Automatic М-29 report generation from system data
- Daily/weekly material consumption tracking (not just monthly)
- Variance alerts: flag when actual consumption exceeds normative by configurable threshold (e.g., >5%)
- Justification workflow for overuse: site engineer must explain variance before write-off is approved
- Link to specific work items: each material write-off tied to a WBS item and reporting period
- Material substitution tracking: when material X is used instead of material Y, adjust normative accordingly
- Integration with warehouse module: actual issuance vs. actual consumption tracking
- Historical waste analysis: average waste percentage by material type, by trade, by project
- Automated write-off approval workflow: site engineer -> PM -> chief engineer -> accounting
- Dashboard: materials with highest overuse, cost impact of overuse, trending analysis
- Export to 1С / SAP for accounting integration

**7. Russia-Specific**

- **Форма М-29**: Although the mandatory nature was removed since 01.01.2021 (Приказ 613 lost force), it remains the de facto industry standard for material write-off in construction
- **ГЭСН (Государственные элементные сметные нормы)**: Contain material consumption norms per unit of work
- **ФЕР / ТЕР**: Federal/Territorial estimate rates that include material norms
- **СП 48.13330.2019**: References the need for material consumption control
- М-29 is maintained per object, per year; Section 1 lists norms, Section 2 tracks monthly actual consumption
- Overuse must be justified: commission act, chief engineer's approval
- For government contracts: unjustified overuse is not reimbursable and may constitute contract violation
- Tax implications: only normative material write-off is tax-deductible (НК РФ ст. 254); excess requires separate justification
- **Производственные нормы расхода материалов (ПНРМ)**: Organization's internal norms (may differ from ГЭСН)

**8. Global Market**

- **Material Usage Variance Analysis**: Standard cost accounting practice comparing standard cost vs. actual cost
- **AACE International RP 10S-90**: Cost Engineering Terminology — includes material variance definitions
- **LEED / BREEAM**: Waste tracking requirements for green building certification (construction waste diverted from landfill)
- **ISO 14001**: Environmental management — includes material waste monitoring
- **Lean Construction**: "7 Wastes" includes material waste (overproduction, defects, inventory excess)
- **BIM 5D**: Quantity takeoff from BIM model provides normative material quantities; actual tracked against it
- No direct equivalent of М-29 in Western practice, but material usage reports and waste tracking serve similar functions
- Trend: IoT-based material tracking (weight sensors on concrete batching, rebar counting sensors)

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Material variance rate (overall) | < 3% | (Actual consumption - Normative) / Normative |
| Materials within norm | > 90% | Material line items within ±5% of norm / Total line items |
| Overuse justification rate | 100% | Overuse items with approved justification / Total overuse items |
| Write-off timeliness | Monthly | Write-off reports submitted on time / Total reports due |
| Cost of overuse | Minimized | Sum of (actual - normative) x unit price for all overuse items |
| Waste percentage | < 5% | Waste material value / Total material value consumed |
| Write-off-to-acceptance alignment | > 95% | Write-off amount within 5% of КС-2 material component |

---

### Process #37: Inventory Management and Reorder Points

**1. Process Description**

Inventory management for construction projects involves maintaining optimal stock levels of materials to prevent both stockouts (causing work stoppages) and overstocking (tying up capital and consuming storage space). The reorder point (ROP) system triggers replenishment when stock falls below a calculated threshold, considering lead time, daily consumption rate, and safety stock buffer.

In construction, this is complicated by the project-based nature of work (each project has unique material needs), variable lead times, seasonal demand fluctuations, and the need to balance multiple projects' inventory from a limited budget.

**2. Participants**

| Role | Responsibility |
|------|---------------|
| Warehouse manager | Monitors stock levels, triggers reorder alerts |
| Procurement manager | Executes replenishment orders |
| Project manager | Sets priority for material needs |
| Planner / scheduler | Provides upcoming material demand based on schedule |
| Cost engineer | Monitors inventory budget allocation |
| Finance | Manages cash flow for inventory purchases |
| Category specialist | Sets optimal stock parameters per material type |

**3. Input Data**

- Current stock levels per material (from warehouse system)
- Historical consumption rates (daily/weekly average demand)
- Supplier lead times (days from order to delivery)
- Lead time variability (standard deviation)
- Demand variability (standard deviation)
- Upcoming schedule: materials needed in next 2-8 weeks
- Budget availability
- Storage capacity constraints
- Material shelf life (for perishable/time-sensitive items)
- Market conditions (price trends, supply disruptions)

**4. Output Data / Documents**

- Reorder point settings per material (ROP = Average daily demand x Lead time + Safety stock)
- Safety stock calculations per material
- Economic Order Quantity (EOQ) calculations
- Auto-generated purchase requisitions when stock hits ROP
- Inventory health report: overstocked, understocked, obsolete items
- ABC analysis classification (A: high-value few items; B: moderate; C: low-value many items)
- Demand forecast reports
- **Russia**: Нормы запаса материалов на складе; Плановая потребность в материалах

**5. Typical Pain Points**

- Static reorder points that don't adapt to changing project schedules
- No demand forecasting — reorder points based on gut feeling
- Lead time variability not accounted for (supplier delivers in 3-14 days, ROP based on 5-day average)
- Cash flow constraints prevent ordering at optimal times
- No ABC analysis — same attention paid to $10 items as $10,000 items
- Seasonal materials (winter additives, etc.) not planned ahead
- Obsolete inventory from completed projects sitting in warehouses
- No multi-site optimization — each site manages independently
- Perishable materials (sealants, adhesives) expiring in storage
- Emergency purchases at premium prices when stockout occurs

**6. Ideal ERP Functions**

- Automated ROP calculation: ROP = (Avg daily demand x Lead time) + Safety stock
- Safety stock calculation using statistical methods: SS = Z-score x sqrt(Lead time x Demand variance + Avg demand^2 x Lead time variance)
- EOQ optimization: EOQ = sqrt((2 x Annual demand x Order cost) / Holding cost)
- Dynamic ROP adjustment based on upcoming schedule (increase ROP when heavy concrete work approaching)
- ABC/XYZ analysis: auto-classify materials by value and consumption predictability
- Automated alerts when stock approaches ROP
- Auto-generated purchase requisitions at ROP
- Demand forecasting using schedule data + historical consumption
- Multi-site inventory optimization: consider stock across all sites before ordering
- Shelf-life tracking with FIFO/FEFO issuance enforcement
- Seasonal demand patterns recognition and proactive ordering
- Dashboard: items below ROP, items above max level, days of supply per material
- Budget impact analysis: projected inventory spend vs. budget
- Supplier lead time tracking: auto-update lead times from actual delivery data
- "What-if" scenarios: impact of schedule changes on material demand
- Integration with material write-off: actual consumption drives demand analytics
- Obsolete inventory identification and disposition workflow

**7. Russia-Specific**

- **ФСБУ 5/2019 "Запасы"**: Accounting standard requiring proper inventory measurement and impairment testing
- **Нормы запаса**: Russian construction organizations traditionally set inventory norms based on ГЭСН norms + lead times
- **44-ФЗ / 223-ФЗ**: Government procurement regulations affect order timing (long procurement cycles require larger safety stock)
- **Плановая потребность в материалах**: Material demand plan tied to construction schedule
- Import materials: longer lead times (30-90 days) requiring higher safety stock and earlier reorder points
- Seasonal logistics: winter roads in northern regions, spring floods ("распутица"), and summer construction season affect lead times significantly
- **1С:Управление торговлей / 1С:ERP**: Standard Russian ERP platforms with inventory management modules

**8. Global Market**

- **Economic Order Quantity (EOQ)**: Classic inventory model: EOQ = sqrt((2DS)/H), where D=annual demand, S=order cost, H=holding cost
- **Reorder Point Formula**: ROP = (Average daily usage x Lead time in days) + Safety stock
- **Safety Stock Formula**: SS = Z x sigma_d x sqrt(L) (basic); or King's formula incorporating lead time variability
- **ABC Analysis (Pareto)**: A items (20% of SKUs, 80% of value) get closest monitoring
- **XYZ Analysis**: Classifies items by demand predictability (X=stable, Y=variable, Z=unpredictable)
- **ISO 55001**: Asset management framework applicable to construction inventory
- **APICS / ASCM**: Supply chain management body of knowledge including inventory optimization
- **Lean Construction**: Pull-based material systems, kanban for repetitive materials
- **Min/Max systems**: Simpler alternative to EOQ for construction sites (Max = Order Up To Level; Min = Reorder Point)
- Emerging: AI/ML-based demand forecasting incorporating weather, schedule, and historical patterns

**9. KPIs and Metrics**

| KPI | Target | Formula |
|-----|--------|---------|
| Stockout rate | < 2% | Stockout events / Total material demand events |
| Stock turnover ratio | 6-12x/year | Cost of materials consumed / Avg inventory value |
| Inventory carrying cost | < 25% of avg inventory value | (Storage + Insurance + Depreciation + Opportunity cost) / Avg inventory |
| Days of supply | 14-30 days | Current stock / Avg daily consumption |
| Fill rate | > 98% | Requisitions fulfilled immediately / Total requisitions |
| Emergency purchase rate | < 5% | Emergency/spot buys / Total purchases |
| Obsolete inventory ratio | < 3% | Obsolete inventory value / Total inventory value |
| Forecast accuracy (MAPE) | < 15% | Avg |Actual - Forecast| / Actual |
| ROI on inventory | Monitored | (Revenue from material use - Inventory cost) / Inventory cost |
| ABC-A item availability | 100% | A-class items in stock / Total A-class items |

---

## CROSS-REFERENCE: PROCESS INTEGRATION MAP

| Process | Feeds Into | Receives From |
|---------|-----------|---------------|
| #24 Daily Log | #25 Work Volume, #26 Hidden Work, #28 Photos, #29 Weather | Schedule, Crew assignments |
| #25 Work Volume | #27 KS-2/KS-3/G702, #36 Material Write-off, EVM | #24 Daily Log, Survey data |
| #26 Hidden Work Acts | #27 KS-2 (work acceptance), Quality records | Design documents, Lab tests |
| #27 KS-2/KS-3 / G702-G703 | Finance (invoicing, payment), Accounting | #25 Work Volume, #26 Hidden Work |
| #28 Photo Documentation | #24 Daily Log, #26 Hidden Work, #30 Punch List | BIM model, Floor plans |
| #29 Weather Tracking | #24 Daily Log, Schedule updates, Delay claims | Weather APIs, On-site sensors |
| #30 Punch Lists | Project closeout, Retainage release | #28 Photos, Quality inspections |
| #31 Material Requests | #32 Supplier (PO), #34 Warehouse (stock check) | Schedule, BOQ |
| #32 Supplier Management | #31 Material Requests, #33 Delivery | PQQ submissions, Performance data |
| #33 Delivery Tracking | #34 Warehouse (receiving) | #31 Requests (PO), #32 Supplier |
| #34 Warehouse Management | #35 Transfers, #36 Write-off, #37 Inventory | #33 Delivery, #31 Requests |
| #35 Inter-Site Transfers | #34 Warehouse (receiving site) | #34 Warehouse (sending site) |
| #36 Material Write-off | Cost accounting, #37 Inventory | #25 Work Volume, #34 Warehouse |
| #37 Inventory / Reorder | #31 Material Requests (auto-requisition) | #34 Warehouse, #36 Write-off |

---

## KEY REGULATORY REFERENCE TABLE

| Document | Country | Governs |
|----------|---------|---------|
| РД-11-02-2006 | Russia | Concealed work acts, executive documentation |
| РД-11-05-2007 / Приказ Минстроя 1026/пр | Russia | General Work Journal format and procedure |
| СП 48.13330.2019 (+ Изменение №1, №2) | Russia | Construction organization, quality control |
| СП 543.1325800.2024 | Russia | Construction control and executive documentation (new) |
| Форма КС-2, КС-3 (Постановление Госкомстата 100) | Russia | Work acceptance and payment |
| Форма КС-6а | Russia | Journal of completed work |
| Форма М-4, М-7, М-8, М-11, М-15, М-17, М-29 | Russia | Material accounting and write-off |
| ФСБУ 5/2019 "Запасы" | Russia | Inventory accounting |
| 44-ФЗ, 223-ФЗ | Russia | Government/state procurement |
| AIA G702/G703 | USA | Payment applications |
| AIA A201-2017 | USA | General conditions of the contract |
| OSHA Forms 300/300A/301 | USA | Injury/illness recording |
| FIDIC Red Book | International | Contract conditions (incl. payment, defects) |
| NEC4 | UK | Contract conditions |
| ISO 28000:2022 | International | Supply chain security management |
| ISO 19650 | International | BIM information management |
| ISO 9001:2015 | International | Quality management systems |
| ANSI/EIA-748 | USA | Earned Value Management |

---

## SOURCES

### Russian Standards and Regulations
- [РД-11-02-2006 Requirements for Executive Documentation](https://files.stroyinf.ru/Data1/49/49282/index.htm)
- [РД-11-05-2007 Work Journal Procedure (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_66693/)
- [New General Work Journal Form (Приказ Минстроя 1026/пр)](https://krs-sro.ru/news/otrasl/4181/)
- [СП 48.13330.2019 Organization of Construction](http://docs.cntd.ru/document/564542209)
- [Форма КС-2 (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_26303/d7e7d105e01770fac8296c4832201fd3f313d0b5/)
- [КС-2 and КС-3 Explained](https://gectaro.com/blog/tpost/v9gb81rtf1-chto-takoe-akt-ks-2-i-spravka-ks-3-v-str)
- [Electronic КС-2 and КС-3 in Construction](https://academy.tsus.ru/zakrytie-rabot-v-stroitelstve-kak-oformit-elektronnye-ks-2-i-ks-3/)
- [Форма М-29 Report on Material Consumption](https://assistentus.ru/forma/m-29-otchet-o-rashodah-materialov/)
- [М-29 Procedure (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_101033/17b1cf53a7a3c6ff967a5bf2ddbfbe4ddbd8586f/)
- [How to Fill М-29 in Construction](https://academy.tsus.ru/spravochnik/kak-pravilno-spisyvat-materialy-v-stroitelstve-v-2024-godu/)
- [Лимитно-заборная карта М-8](https://assistentus.ru/forma/m-8-limitno-zabornaya-karta/)
- [М-8 Form (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_32449/d8ccb3b263f40e25d3e7c0e59ccf1fefef9abf05/)
- [Concealed Work Act Form (RD-11-02-2006)](https://stroykadoc.ru/actskritihrabot/post/akt-osvidetelstvovaniya-skrytyh-rabot)

### AIA and US Standards
- [AIA G702 Instructions](https://help.aiacontracts.com/hc/en-us/articles/1500009308242-Instructions-G702-1992-Application-and-Certificate-for-Payment)
- [AIA G702/G703 Complete Filing Guide](https://www.constructioncostaccounting.com/post/construction-application-for-payment-aia-g702-g703-complete-filing-guide)
- [Procore: How to Fill AIA G702](https://www.procore.com/library/aia-g702-application-for-payment)
- [Autodesk Guide to G702 and G703 Forms](https://www.autodesk.com/blogs/construction/g702-g703-forms-aia-billing/)
- [Understanding AIA G702 and G703 Forms](https://www.contractcomplete.com/understanding-the-aia-g702-and-g703-forms/)

### Daily Logs and OSHA
- [What is a Construction Daily Log (2025 Guide)](https://buildlogapp.com/what-is-construction-daily-log.html)
- [OSHA 300 Log Requirements 2025](https://www.safetyservicescompany.com/blog/osha-300-log-requirements-2025/)
- [OSHA 2025 Rules for Construction](https://www.forconstructionpros.com/latest-news/article/22953107/osha30construction-group-oshas-2025-rules-tighten-safety-requirements-why-recordkeeping-software-is-now-essential)

### Punch Lists
- [Construction Punch List Complete Guide (Contractor Foreman)](https://contractorforeman.com/construction-punch-list/)
- [Punch List Best Practices (Fieldwire)](https://www.fieldwire.com/blog/what-is-a-punch-list-best-practices/)
- [Construction Punch Lists Best Practices (Outbuild)](https://www.outbuild.com/blog/construction-punch-lists)

### Supply Chain and Inventory
- [ISO 28000 Supply Chain Security (BSI)](https://www.bsigroup.com/en-US/products-and-services/standards/iso-28000-security-management-for-the-supply-chain/)
- [Construction Inventory Management Best Practices (Sortly)](https://www.sortly.com/blog/inventory-management-best-practices-in-construction/)
- [Construction Inventory Management (NetSuite)](https://www.netsuite.com/portal/resource/articles/inventory-management/inventory-management-construction.shtml)
- [Construction Inventory Management (Procore)](https://www.procore.com/library/inventory-management)
- [EOQ in Construction](https://conwize.io/glossary/economic-order-quantity-eoq-a-cost-optimization-method-for-construction-material-procurement/)

### Weather and Scheduling
- [Weather Delays in Construction (SmartPM)](https://smartpm.com/blog/weather-delays-in-construction)
- [Force Majeure and Abnormal Weather (EJCDC)](https://ejcdc.org/force-majeure-events-abnormal-weather-uncontrollable-delays-construction-project-contributed-kevin-obeirne-pe-vice-chair-ejcdc/)
- [Managing Weather Delay Claims (Hogan Lovells)](https://www.hoganlovells.com/en/publications/managing-extreme-weatherrelated-delay-and-disruption-claims-on-projects)

### EVM and Progress Tracking
- [Earned Value Management in Construction (InEight)](https://ineight.com/blog/construction-earned-value-management/)
- [EVM for Construction (Aimsio)](https://aimsio.com/blog/earned-value-management-for-construction-real-time-project-tracking/)
- [Construction KPIs (Procore)](https://www.procore.com/library/construction-kpis)

### Photo Documentation
- [Digital Construction Progress Monitoring (Desapex)](https://www.desapex.com/blog-posts/digital-construction-progress-monitoring)
- [4D BIM Progress Monitoring (MDPI)](https://www.mdpi.com/2075-5309/13/10/2488)

### Supplier and Delivery Management
- [Prequalification in Construction (RedSkyIT)](https://www.redskyit.com/construction-software-resources/a-guide-to-pre-qualification-questionnaires-in-construction-procurement/)
- [Material Requisition Process (Stampli)](https://www.stampli.com/blog/accounts-payable/requisition-in-construction/)
- [Construction Delivery Management (StruxHub)](https://struxhub.com/blog/a-comprehensive-guide-to-construction-delivery-management-software-for-your-site-logistics-2/)
- [Multi-Project Construction Logistics (Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1080/01446193.2021.2012815)
