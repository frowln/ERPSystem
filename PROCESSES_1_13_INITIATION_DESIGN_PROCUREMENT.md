# Process Cards: Block 1 (Project Initiation & Permits) and Block 2 (Design & Procurement)

> **Version:** 1.0 | **Date:** 2026-02-18 | **Author:** Senior Construction Business Analyst
> **Scope:** Processes 1--13 covering the full lifecycle from feasibility through contract execution.

---

## Table of Contents

- [Block 1: Project Initiation and Permits](#block-1-project-initiation-and-permits)
  - [Process 1: Feasibility Study (TEO) and Business Case](#process-1-feasibility-study-teo-and-business-case)
  - [Process 2: Land Plot Selection and Due Diligence](#process-2-land-plot-selection-and-due-diligence)
  - [Process 3: GPZU (Urban Planning Land Plot Plan)](#process-3-gpzu-urban-planning-land-plot-plan)
  - [Process 4: Project Documentation and State Expertise](#process-4-project-documentation-and-state-expertise)
  - [Process 5: Construction Permit](#process-5-construction-permit)
  - [Process 6: BIM Modeling and Coordination](#process-6-bim-modeling-and-coordination)
  - [Process 7: Change Management (RFI, Submittals)](#process-7-change-management-rfi-submittals)
- [Block 2: Design and Procurement](#block-2-design-and-procurement)
  - [Process 8: Design Phase Management](#process-8-design-phase-management)
  - [Process 9: Contractor and Subcontractor Prequalification](#process-9-contractor-and-subcontractor-prequalification)
  - [Process 10: Tender Documentation Preparation](#process-10-tender-documentation-preparation)
  - [Process 11: Bid Leveling (Comparing Proposals)](#process-11-bid-leveling-comparing-proposals)
  - [Process 12: Contract Management (Creation, Amendments, Closing)](#process-12-contract-management-creation-amendments-closing)
  - [Process 13: Insurance and Guarantees Management](#process-13-insurance-and-guarantees-management)
- [Summary Table](#summary-table)
- [Key Regulatory Reference Table](#key-regulatory-reference-table)
- [Sources](#sources)

---

# Block 1: Project Initiation and Permits

---

## Process 1: Feasibility Study (TEO) and Business Case

### 1.1 Process Description

The Feasibility Study (ТЭО -- технико-экономическое обоснование) is the foundational pre-project stage that determines whether a construction project should proceed. It combines technical analysis (site constraints, engineering complexity, utility availability) with economic modeling (capital expenditure, operational costs, revenue projections, financing structures). The output is a go/no-go investment decision supported by quantitative evidence.

The process begins with an initial concept note from the investor or developer, followed by market analysis, site reconnaissance, preliminary engineering assessment, environmental screening, and financial modeling. In Russia, the ТЭО is being formalized as a mandatory pre-design stage under proposed amendments to Article 48 of the Urban Planning Code (ГрК РФ). The ТЭО defines the key technical and economic indicators (ТЭП -- технико-экономические показатели), selects the optimal architectural concept, and estimates construction material requirements.

Internationally, this maps to the Business Case document in PRINCE2/PRINCE2 Agile, the Project Charter in PMI/PMBOK, and RIBA Plan of Work Stage 0 (Strategic Definition).

### 1.2 Participants

| Role | Responsibility |
|------|---------------|
| Investor / Developer | Initiates the project, defines financial expectations, approves the TEO |
| Project Director | Coordinates TEO preparation, ensures alignment with strategic goals |
| Chief Architect | Develops preliminary spatial concepts, validates site capacity |
| Chief Engineer | Assesses engineering feasibility (structural, MEP, utilities) |
| Financial Analyst / Economist | Builds financial models (NPV, IRR, payback), sensitivity analysis |
| Legal Counsel | Reviews land rights, zoning compliance, regulatory risks |
| Environmental Consultant | Conducts preliminary environmental screening (OVOS) |
| Market Analyst | Performs demand analysis, competitive landscape review |
| Urban Planner | Checks compliance with territorial planning, PZZ, genplan |

### 1.3 Input Data

- Investor's brief / concept note with target parameters
- Territorial planning documents (Genplan, PZZ -- Правила землепользования и застройки)
- Preliminary site survey data (topography, geology overview)
- Market research data (demand, pricing, absorption rates)
- Utility availability statements (ТУ -- технические условия) -- preliminary
- Regulatory constraints map (sanitary zones, heritage buffer zones, flood zones)
- Comparable project cost databases (FSNB -- Федеральные сметные нормативы)
- Financing term sheets or preliminary credit offers

### 1.4 Output Data / Documents

- ТЭО report with ТЭП (технико-экономические показатели)
- Financial model with NPV, IRR, payback period, DSCR calculations
- Sensitivity analysis and Monte Carlo simulation results
- Risk register (preliminary)
- Concept design sketches (эскизный проект)
- Environmental screening report (preliminary OVOS)
- Go / No-Go recommendation with executive summary
- Investment memorandum for stakeholders

### 1.5 Typical Pain Points

- Overly optimistic revenue assumptions without independent market validation
- Underestimation of utility connection costs (ТУ often arrive late or with surprises)
- Missing environmental or heritage constraints discovered only after investment decision
- Siloed preparation -- architect, engineer, and economist work independently without coordination
- Lack of version control on financial models leading to decision-making on stale data
- No structured review gate -- TEO "approved" informally without documented sign-off
- Confusion between TEO and full project documentation (ПД) scope

### 1.6 Ideal ERP Functions

- **Investment project card** with structured fields for ТЭП, financial indicators, status
- **Financial modeling module** with NPV/IRR/payback calculators and scenario comparison
- **Document management** with version control for TEO drafts and approvals
- **Approval workflow** with digital signatures and audit trail (go/no-go gate)
- **Risk register module** linked to project card with probability/impact matrix
- **GIS integration** for site constraint visualization (zones, boundaries, utilities)
- **Template library** for TEO sections per PP RF No. 87 structure
- **Dashboard** showing all active TEO projects with status, deadline, responsible person
- **Notification engine** for overdue tasks and pending approvals

### 1.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГрК РФ ст. 48 | Architectural-construction design; proposed amendments add TEO as a mandatory pre-design stage |
| ПП РФ от 16.02.2008 No. 87 | Composition of project documentation sections and requirements for their content |
| СНиП 11-01-95 | Methodological guidance on TEO preparation for construction (historical, referenced in practice) |
| ГОСТ Р ИСО 21502-2024 | Guidance on project management (identical to ISO 21502:2020) |
| ФЗ-39 от 25.02.1999 | On investment activity in the RF carried out in the form of capital investments |
| ФЗ-174 от 23.11.1995 | On ecological expertise (for projects requiring state environmental review) |
| СП 47.13330.2016 | Engineering surveys for construction -- basic provisions |

### 1.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| RIBA Plan of Work 2020, Stage 0 | Strategic Definition -- feasibility, business case, project brief |
| ISO 21502:2020 | Project, programme and portfolio management -- guidance on project management |
| PRINCE2 -- Business Case | Structured business case required before project initiation |
| PMI PMBOK 7th Ed. | Project Charter, benefits management plan |
| AACE 18R-97 | Cost Estimate Classification System -- Class 5 (concept screening, 0-2% definition) |
| FIDIC Red Book 2017 | Clause 1.1 -- defines Employer's Requirements which originate from feasibility |
| IFC Performance Standards | Environmental and social framework for project finance feasibility |

### 1.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| TEO preparation cycle time | <= 45 calendar days | From concept note to approved TEO |
| Financial model accuracy (vs actual) | Variance <= ±15% | Post-completion comparison of projected vs actual capex |
| NPV > 0 threshold compliance | 100% of approved projects | All projects passing gate must have positive NPV |
| IRR vs WACC spread | IRR >= WACC + 3pp | Internal rate of return exceeds weighted average cost of capital |
| Payback period | <= 7 years (commercial) / <= 15 years (infrastructure) | Time to recover capital investment |
| Risk items identified at TEO stage | >= 80% of risks found later | Retrospective comparison |
| Stakeholder sign-off within deadline | >= 90% | Percentage of TEOs approved within target cycle time |
| TEO revision count before approval | <= 3 iterations | Number of major revision rounds |

---

## Process 2: Land Plot Selection and Due Diligence

### 2.1 Process Description

Land plot selection and due diligence is the process of identifying, evaluating, and securing the optimal land parcel for a construction project. It encompasses legal due diligence (title verification, encumbrances, easements), physical due diligence (topographic survey, geotechnical investigation, environmental assessment), and regulatory due diligence (zoning compliance, permitted use verification, sanitary/protective zone checks).

In Russia, this process heavily relies on the Unified State Register of Real Estate (ЕГРН -- Единый государственный реестр недвижимости) managed under Federal Law No. 218-FZ. Land categories are governed by the Land Code (Земельный кодекс, ст. 7-8), and transfer between categories requires a separate procedure under Federal Law No. 172-FZ.

The due diligence must confirm: (a) clear title with no disputes, (b) land category and permitted use compatible with intended construction, (c) no overlapping cadastral boundaries, (d) no undisclosed environmental contamination, (e) adequate utility infrastructure proximity, and (f) no restrictive heritage/cultural buffer zones.

### 2.2 Participants

| Role | Responsibility |
|------|---------------|
| Investor / Developer | Defines site selection criteria, approves final site |
| Land Acquisition Manager | Coordinates search, negotiation, and acquisition |
| Legal Counsel (Real Estate) | Conducts title search, reviews encumbrances, drafts purchase/lease agreements |
| Cadastral Engineer | Verifies boundaries, prepares boundary plans (межевой план) |
| Surveyor / Geodesist | Performs topographic survey of candidate sites |
| Geotechnical Engineer | Conducts preliminary geotechnical assessment |
| Environmental Consultant | Screens for contamination, protected areas, sanitary zones |
| Urban Planner | Checks zoning (ПЗЗ), genplan alignment, territorial planning |
| Appraiser | Determines market value and cadastral value comparison |

### 2.3 Input Data

- Approved TEO with target site parameters (area, location, access requirements)
- ЕГРН extracts (выписки из ЕГРН) for candidate parcels
- Public cadastral map data (Росреестр)
- Territorial planning documents (Genplan, PZZ, PPT if available)
- Utility provider infrastructure maps
- Environmental constraint databases (ООПТ, sanitary zones, water protection zones)
- Heritage object registry (Реестр объектов культурного наследия)
- Market comparables for land pricing

### 2.4 Output Data / Documents

- Site selection report with multi-criteria comparison matrix
- ЕГРН extract confirming title, encumbrances, category, permitted use
- Boundary plan (межевой план) or confirmation of existing boundaries
- Topographic survey plan (M 1:500)
- Preliminary geotechnical report
- Environmental screening report
- Legal opinion on title and risks
- Land purchase/lease agreement (draft or executed)
- Due diligence checklist (completed and signed)

### 2.5 Typical Pain Points

- ЕГРН data discrepancies (cadastral boundaries do not match physical boundaries)
- Undisclosed encumbrances or court disputes discovered after advance payment
- Land category incompatible with intended use, requiring lengthy re-categorization (172-FZ)
- Hidden environmental contamination (former industrial sites)
- Utility connection points further than expected, dramatically increasing costs
- Restrictive easements or rights-of-way not visible in basic ЕГРН extract
- Conflicting territorial planning documents (PZZ vs genplan vs PPT)
- Long timelines for inter-agency coordination when multiple authorities are involved

### 2.6 Ideal ERP Functions

- **Site comparison dashboard** with weighted scoring matrix for multiple candidate plots
- **ЕГРН integration** -- automated extract retrieval via Rosreestr API
- **GIS module** with overlay of cadastral boundaries, zones, utilities, constraints
- **Document repository** for all due diligence documents per site with audit trail
- **Checklist engine** with mandatory due diligence steps and completion tracking
- **Risk scoring** for each site based on legal, environmental, engineering factors
- **Notification system** for ЕГРН extract expiry (valid 30 days for transactions)
- **Contract management** for land purchase/lease agreements with milestone tracking
- **Cost tracker** for acquisition costs, fees, taxes linked to project budget

### 2.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| Земельный кодекс РФ, ст. 7-8 | Land categories and their designation; procedure for category assignment |
| ФЗ-218 от 13.07.2015 | On state registration of real estate (ЕГРН) |
| ФЗ-172 от 21.12.2004 | On transfer of lands/land plots from one category to another |
| ФЗ-221 от 24.07.2007 | On cadastral activity |
| ГрК РФ, ст. 30-32 | Rules of land use and development (ПЗЗ), territorial zones |
| СП 47.13330.2016 | Engineering surveys for construction -- basic provisions |
| СП 11-102-97 | Engineering-environmental surveys for construction |
| ФЗ-135 от 29.07.1998 | On appraisal activity in the Russian Federation |

### 2.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| RICS Red Book (2022) | International valuation standards for real property |
| ASTM E1527-21 | Phase I Environmental Site Assessment standard |
| ASTM E1903-19 | Phase II Environmental Site Assessment standard |
| ISO 21502:2020 | Project management guidance -- site selection as part of initiation |
| RIBA Plan of Work 2020, Stage 1 | Preparation and Briefing -- site appraisal |
| IFC Performance Standard 1 | Assessment and management of environmental and social risks |
| FIDIC Red Book 2017, Cl. 2.1 | Employer's obligation to provide access to and possession of the Site |

### 2.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Due diligence completion time | <= 30 calendar days per site | From initiation to final DD report |
| Title defect discovery rate | 0% post-acquisition | Defects found after purchase that were missed |
| Sites evaluated per selection | >= 3 candidate sites | Number of sites formally evaluated before decision |
| DD checklist completion | 100% items checked | All mandatory checklist items verified |
| ЕГРН extract age at decision | <= 15 days | Freshness of registry data at time of go/no-go |
| Environmental risk missed | 0 critical findings post-acquisition | Environmental issues discovered after closing |
| Acquisition cost vs budget | Variance <= ±10% | Actual land cost vs TEO estimate |
| Time from selection to contract | <= 60 calendar days | From site approval to executed agreement |

---

## Process 3: GPZU (Urban Planning Land Plot Plan)

### 3.1 Process Description

The ГПЗУ (Градостроительный план земельного участка) is a critical regulatory document required before commencing architectural-construction design in Russia. Governed by Article 57.3 of the Urban Planning Code (ГрК РФ), the ГПЗУ consolidates all urban planning requirements applicable to a specific land plot into a single document. It specifies: permitted building parameters (height, density, setbacks, building footprint), connection to engineering networks, existing restrictions and encumbrances, cultural heritage zones, environmental constraints, and the boundaries within which construction is permitted.

The ГПЗУ is issued by the local government body (орган местного самоуправления) within 14 working days of application, free of charge. It is valid for 3 years from the date of issuance for purposes of preparing project documentation and obtaining a construction permit. The ГПЗУ draws its data from territorial planning documents, zoning regulations (ПЗЗ), planning documentation (ППТ/ПМТ), ЕГРН, ГИСОГД, and utility connection technical conditions.

This process has no direct equivalent in Western systems but maps conceptually to zoning compliance certificates, planning briefs, or site-specific planning conditions in jurisdictions like the UK (Local Development Order), US (zoning certificate), or EU (Bebauungsplan in Germany).

### 3.2 Participants

| Role | Responsibility |
|------|---------------|
| Developer / Land Owner | Submits application for ГПЗУ; must be the rights holder of the land plot |
| Local Government (Dept. of Architecture/Urban Planning) | Prepares and issues the ГПЗУ within 14 working days |
| МФЦ (Multifunctional Center) | May receive the application on behalf of the local government |
| Cadastral Engineer | Provides boundary verification if needed |
| Utility Providers | Issue technical conditions (ТУ) that are incorporated into ГПЗУ |
| Project Architect | Reviews ГПЗУ parameters to ensure design feasibility |
| Legal Counsel | Verifies completeness and accuracy of issued ГПЗУ |

### 3.3 Input Data

- Application for ГПЗУ from the land plot rights holder
- ЕГРН extract confirming rights to the land plot
- Cadastral passport / boundary plan of the land plot
- Territorial planning documents (Genplan of the municipality)
- Rules of land use and development (ПЗЗ)
- Planning documentation (ППТ -- проект планировки территории, ПМТ -- проект межевания территории)
- ГИСОГД (State Information System for Urban Planning Activity) data
- Technical conditions from utility providers (water, sewer, electricity, gas, heat)

### 3.4 Output Data / Documents

- ГПЗУ document (standard form per Приказ Минстроя России от 25.04.2017 No. 741/пр)
- Graphic section showing building placement boundaries
- Building parameters: max height, max density (плотность застройки), max floor area
- Setback requirements from plot boundaries and existing buildings
- List of all encumbrances and restrictions on the plot
- Technical conditions for utility connections (embedded or referenced)
- Cultural heritage and environmental zone information
- Required parking ratios and green space requirements

### 3.5 Typical Pain Points

- ГПЗУ issuance delayed beyond the statutory 14 working days due to inter-agency coordination failures
- Contradictions between ГПЗУ parameters and developer's concept (e.g., lower permitted height than planned)
- ТУ (technical conditions) not included or incomplete in the ГПЗУ
- ГПЗУ expires before construction permit is obtained (3-year validity period)
- Errors in the graphic section (incorrect building boundaries) requiring re-issuance
- Changes in PZZ or genplan during the 3-year validity period creating legal uncertainty
- No formal appeals process clearly defined for disputing ГПЗУ parameters
- Multiple GПЗУs for adjacent plots with conflicting parameters

### 3.6 Ideal ERP Functions

- **ГПЗУ tracker** with application date, expected issuance date, status, and expiry countdown
- **Parameter comparison tool** matching ГПЗУ constraints vs design concept parameters
- **Document storage** with version tracking for ГПЗУ and all supporting documents
- **Automated alerts** for ГПЗУ expiry (90, 60, 30 days before expiration)
- **ТУ integration** linking technical conditions to cost estimates and design requirements
- **GIS visualization** of ГПЗУ building boundaries overlaid on site plan
- **Approval workflow** for internal review of received ГПЗУ
- **Dependency tracking** -- ГПЗУ linked to downstream construction permit application

### 3.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГрК РФ, ст. 57.3 | ГПЗУ -- issuance procedure, content, validity period |
| ГрК РФ, ст. 30-32 | Rules of land use and development (ПЗЗ) |
| ГрК РФ, ст. 41-46 | Territorial planning documentation (ППТ, ПМТ) |
| Приказ Минстроя No. 741/пр от 25.04.2017 | Approved form of ГПЗУ and procedure for filling it out |
| ФЗ-218 от 13.07.2015 | ЕГРН -- source data for ГПЗУ preparation |
| ПП РФ от 13.02.2006 No. 83 | Rules for determining and providing technical conditions |
| ГрК РФ, ст. 51, п. 7.1 | ГПЗУ as mandatory attachment to construction permit application |

### 3.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| UK Town and Country Planning Act 1990 | Planning permission and Local Development Orders |
| US -- Municipal Zoning Ordinances | Zoning certificates, conditional use permits |
| German BauGB (Baugesetzbuch) | Bebauungsplan (B-Plan) -- binding land use plan |
| FIDIC Red Book 2017, Cl. 1.13 | Compliance with laws -- all parties must comply with applicable planning laws |
| EU Environmental Impact Assessment Directive 2014/52/EU | EIA requirements that may affect ГПЗУ-equivalent documents |

### 3.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| ГПЗУ issuance time | <= 14 working days (statutory) | From application submission to issuance |
| ГПЗУ first-time acceptance | >= 85% | Percentage issued without requiring re-application |
| Parameter-to-concept alignment | >= 90% match | ГПЗУ parameters vs developer's initial concept |
| ГПЗУ expiry utilization | Construction permit obtained within 2 years | Time used of 3-year validity period |
| ТУ completeness in ГПЗУ | 100% utilities covered | All required utility ТУ present in ГПЗУ |
| Inter-agency coordination time | <= 5 working days | Time for utility/heritage/environmental agencies to respond |
| Re-issuance rate | <= 10% | Percentage of ГПЗУs requiring correction and re-issuance |

---

## Process 4: Project Documentation and State Expertise

### 4.1 Process Description

Project Documentation (Проектная документация, ПД) is the comprehensive set of technical documents prepared in accordance with PP RF No. 87 that describes the proposed construction object in sufficient detail for state expertise review and subsequent construction. In Russia, the ПД consists of 12 mandatory sections for non-linear objects (and 10 for linear objects), including the explanatory note, architectural solutions, structural solutions, MEP systems, fire safety measures, energy efficiency, accessibility, and cost estimates (сметная документация).

State Expertise (Государственная экспертиза) is governed by Article 49 of the Urban Planning Code and PP RF No. 145 from 05.03.2007. It is mandatory for objects where budget funds are used, for technically complex or hazardous objects, and for objects where the cost estimate must be verified for accuracy. The expertise verifies compliance with technical regulations, standards, and the accuracy of cost estimates. The standard review period is 42 working days (up to 60 for complex objects).

Non-state expertise (негосударственная экспертиза) is permitted for certain categories of objects and is conducted by accredited organizations.

### 4.2 Participants

| Role | Responsibility |
|------|---------------|
| Developer (Застройщик) | Commissions project documentation, submits for expertise |
| General Designer (Генпроектировщик) | Prepares all sections of project documentation per PP No. 87 |
| Chief Architect of the Project (ГАП) | Leads architectural and planning solutions |
| Chief Engineer of the Project (ГИП) | Leads engineering and structural solutions |
| Cost Estimator (Сметчик) | Prepares cost estimate documentation (сметная документация) |
| State Expertise Body (Главгосэкспертиза / Regional body) | Reviews and approves ПД and engineering survey results |
| Environmental Expertise Body | Conducts state ecological expertise where required (ФЗ-174) |
| Fire Safety Expert | Reviews fire safety section (Meropriyatiya po obespecheniyu pozharnoy bezopasnosti) |
| Survey Organization | Provides engineering survey results for expertise |

### 4.3 Input Data

- ГПЗУ (valid, not expired)
- Technical assignment for design (задание на проектирование)
- Engineering survey results (geological, geodetic, ecological, hydrometeorological)
- Technical conditions from utility providers (ТУ)
- Architectural-planning concept (approved by developer)
- Special technical conditions (СТУ) if applicable
- Results of previous design stages (concept design, P-stage)

### 4.4 Output Data / Documents

- Project documentation (12 sections per PP No. 87):
  1. Explanatory note (Пояснительная записка)
  2. Site plan (Схема планировочной организации земельного участка)
  3. Architectural solutions (Архитектурные решения)
  4. Structural solutions (Конструктивные и объемно-планировочные решения)
  5. MEP systems -- water supply and drainage
  6. MEP systems -- HVAC
  7. MEP systems -- power supply
  8. MEP systems -- communications
  9. Technology solutions (for industrial objects)
  10. Fire safety measures
  11. Accessibility measures
  12. Cost estimates (Смета на строительство)
- Positive conclusion of state expertise (Положительное заключение госэкспертизы)
- Verified cost estimate with accuracy confirmation
- Engineering survey conclusion

### 4.5 Typical Pain Points

- Expertise comments requiring multiple rounds of revision (2-4 iterations typical)
- Inconsistencies between sections prepared by different design subcontractors
- Cost estimate rejected due to non-compliance with current FSNB (Federal cost norms)
- Engineering survey data deemed insufficient, requiring supplementary surveys
- State ecological expertise running in parallel with a different timeline and authority
- Coordination failures between general designer and specialist subcontractors (MEP, structural)
- Changes in regulatory norms during the long documentation preparation cycle
- Difficulty tracking expertise comments and ensuring all are resolved before resubmission

### 4.6 Ideal ERP Functions

- **Section-by-section ПД tracker** with status, responsible designer, deadline per section
- **Expertise submission workflow** with checklist of required attachments
- **Comment tracking module** -- log each expertise remark, assign to responsible engineer, track resolution
- **Cost estimate integration** with FSNB normative databases and auto-validation
- **Document versioning** with diff view between revisions
- **Multi-party collaboration portal** for general designer, subcontractors, and expertise body
- **Deadline calculator** with statutory timelines (42/60 working days) and internal milestones
- **Dashboard** showing expertise status, comment resolution rate, resubmission history
- **Compliance checker** validating ПД sections against PP No. 87 requirements

### 4.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГрК РФ, ст. 48 | Architectural-construction design procedure |
| ГрК РФ, ст. 49 | State expertise of project documentation and engineering survey results |
| ПП РФ от 16.02.2008 No. 87 | Composition of project documentation sections and content requirements |
| ПП РФ от 05.03.2007 No. 145 | Procedure for organizing and conducting state expertise |
| ГОСТ Р 21.101-2020 | SPDS -- basic requirements for project and working documentation |
| ГОСТ Р 21.1101-2013 | SPDS -- basic requirements (predecessor, still referenced) |
| ФЗ-174 от 23.11.1995 | On ecological expertise |
| ФЗ-384 от 30.12.2009 | Technical regulation on safety of buildings and structures |
| СП 47.13330.2016 | Engineering surveys for construction |

### 4.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| RIBA Plan of Work 2020, Stages 2-4 | Concept Design through Technical Design |
| ISO 19650-2:2018 | BIM -- information management during delivery phase |
| AACE 18R-97 | Cost Estimate Classification -- Class 3 (budget authorization, 10-40% definition) |
| AIA A201-2017, Art. 3 | Architect's duties -- preparation of design documents |
| FIDIC Red Book 2017, Cl. 5 | Design -- Employer's and Contractor's design obligations |
| NEC4 ECC, Cl. 21 | Contractor's design -- scope and submission requirements |
| Eurocode (EN 1990-1999) | European structural design standards (comparative reference) |

### 4.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| ПД preparation cycle time | <= 120 calendar days (typical building) | From design start to expertise submission |
| State expertise cycle time | <= 42 working days (statutory) | From submission to conclusion |
| First-time positive conclusion rate | >= 60% | ПД approved without resubmission |
| Expertise comment resolution time | <= 30 calendar days per round | Time to address all comments and resubmit |
| Number of expertise iterations | <= 2 rounds | Total submission-review cycles |
| Section consistency defects | <= 5 per submission | Cross-section contradictions found by expertise |
| Cost estimate accuracy | Variance <= ±10% vs actual | Verified estimate vs construction actuals |
| Engineering survey completeness | 100% required surveys complete | All surveys done before ПД submission |

---

## Process 5: Construction Permit

### 5.1 Process Description

The Construction Permit (Разрешение на строительство) is the regulatory authorization document that confirms the project documentation complies with the ГПЗУ, territorial planning documentation, and applicable building codes, giving the developer the legal right to commence construction or reconstruction. It is governed by Article 51 of the Urban Planning Code (ГрК РФ).

The permit is issued by the local government body (for most objects), the regional authority, or the federal authority depending on the object's significance. The statutory issuance timeline is 5 working days for standard objects (7 working days for linear objects). The application must be accompanied by the ГПЗУ (issued not more than 3 years prior), the positive conclusion of state expertise, confirmed project documentation, and proof of land rights.

The construction permit specifies the object parameters (area, height, number of floors), the validity period (equal to the construction timeline specified in the project organizational plan), and may be extended upon application before expiry.

### 5.2 Participants

| Role | Responsibility |
|------|---------------|
| Developer (Застройщик) | Applies for the construction permit; must hold land rights |
| Local Government (Issuing Authority) | Reviews application, verifies compliance, issues permit within 5 working days |
| State Construction Supervision (Госстройнадзор) | Notified of permit issuance; begins supervision |
| General Designer | Provides certified project documentation package |
| Legal Counsel | Ensures all prerequisite documents are in order |
| Project Manager | Coordinates the permit application process and timeline |

### 5.3 Input Data

- Application for construction permit
- ГПЗУ (valid, issued within last 3 years) -- per ГрК РФ ст. 51, п. 7.1
- Positive conclusion of state (or non-state) expertise
- Project documentation (full set per PP No. 87)
- Documents confirming land rights (ЕГРН extract or lease agreement)
- Deviation permit (if applicable, per ГрК РФ ст. 40)
- Consent of rights holders in case of reconstruction
- СПОЗУ (site plan per approved project documentation)

### 5.4 Output Data / Documents

- Construction Permit (Разрешение на строительство) -- standard form
- Permit number registered in ГИСОГД
- Object parameters specified in permit (building area, height, floors, volume)
- Validity period (matches construction organizational plan timeline)
- Notification to State Construction Supervision (Госстройнадзор)
- ИСОГД (Information System) record for public access

### 5.5 Typical Pain Points

- Refusal due to discrepancies between ПД and ГПЗУ parameters (common: area/height mismatch)
- ГПЗУ expired before permit application filed (3-year validity missed)
- Expertise conclusion referencing an outdated version of project documentation
- Inter-agency verification delays exceeding statutory 5-day timeline
- Missing documents in application package requiring resubmission
- Permit extension requests filed too late (after original permit expires)
- Confusion about which authority is competent (local vs regional vs federal)
- Difficulty tracking permit conditions and compliance requirements during construction

### 5.6 Ideal ERP Functions

- **Permit application checklist** with document completeness validator
- **ГПЗУ-to-ПД compliance checker** -- automated parameter comparison
- **Timeline tracker** with statutory deadlines and automatic escalation
- **Document package assembly** tool pulling together all required attachments
- **Permit registry** with unique numbers, validity dates, and renewal reminders
- **Integration with ГИСОГД** for status checking and electronic submission
- **Госстройнадзор notification** workflow triggered by permit issuance
- **Dependency chain** visualization (TEO -> ГПЗУ -> Expertise -> Permit -> Construction start)

### 5.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГрК РФ, ст. 51 | Construction permit -- procedure, documents, timelines, refusal grounds |
| ГрК РФ, ст. 51, п. 7 | List of documents attached to the construction permit application |
| ГрК РФ, ст. 51, п. 11 | 5 working day issuance deadline |
| ГрК РФ, ст. 51, п. 17 | Cases not requiring a construction permit |
| ГрК РФ, ст. 52 | Construction execution; developer must notify Госстройнадзор |
| ГрК РФ, ст. 54 | State construction supervision during construction |
| ПП РФ от 16.02.2008 No. 87 | Project documentation composition (basis for expertise) |
| ФЗ-384 от 30.12.2009 | Technical regulation on building safety |

### 5.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| UK Building Regulations 2010 (SI 2010/2214) | Building control approval; Full Plans Application |
| US -- IBC (International Building Code) 2024 | Building permit issuance by Authority Having Jurisdiction (AHJ) |
| German BauO (Landesbauordnungen) | Baugenehmigung -- state building permit procedures |
| French Code de l'urbanisme, Art. L421-1 | Permis de construire |
| FIDIC Red Book 2017, Cl. 1.13 | Compliance with applicable permits and regulations |
| EU Construction Products Regulation (305/2011) | CE marking requirements affecting permit conditions |

### 5.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Permit issuance time | <= 5 working days (statutory) | From application to permit issuance |
| First-time approval rate | >= 90% | Permits granted without refusal |
| Refusal resolution time | <= 15 working days | Time to address refusal and reapply |
| Permit-to-construction start | <= 30 calendar days | Time from permit to actual site mobilization |
| Document completeness at submission | 100% | All required documents present at first submission |
| Permit validity utilization | Construction start within 50% of permit period | Avoid permit expiry risk |
| Permit extension requests | <= 1 per project | Number of permit extensions needed |

---

## Process 6: BIM Modeling and Coordination

### 6.1 Process Description

BIM (Building Information Modeling / Информационное моделирование зданий) is the process of creating and managing a digital representation of the physical and functional characteristics of a facility. In construction, BIM serves as the central coordination platform across all disciplines (architecture, structure, MEP, landscape) to detect clashes, optimize constructability, generate quantities, simulate construction sequences (4D), and estimate costs (5D).

In Russia, BIM adoption is driven by a series of national standards (ГОСТ Р 57311-2016, ГОСТ Р 57563-2017, СП 333.1325800.2020) and government mandates requiring BIM for state-funded projects. Internationally, ISO 19650 (Parts 1-5) provides the framework for BIM information management across the asset lifecycle.

The BIM coordination process includes establishing the BIM Execution Plan (BEP), defining Level of Development (LOD) requirements per project phase, setting up the Common Data Environment (CDE), conducting regular clash detection sessions, and managing model federated reviews. The BIM Manager coordinates between discipline leads to ensure model integrity, data exchange standards (IFC format), and compliance with the information requirements.

### 6.2 Participants

| Role | Responsibility |
|------|---------------|
| BIM Manager | Develops BEP, manages CDE, coordinates model integration |
| BIM Coordinator (per discipline) | Maintains discipline model, resolves intra-discipline clashes |
| Project Architect | Authors the architectural model |
| Structural Engineer | Authors the structural model |
| MEP Engineers (HVAC, Plumbing, Electrical) | Author respective MEP models |
| General Contractor (if involved in design) | Reviews for constructability, provides input on sequencing |
| Client / Developer | Defines Employer's Information Requirements (EIR) |
| Quantity Surveyor | Extracts quantities from BIM for cost estimation |
| Facility Manager (future) | Defines operational data requirements (LOD 500 / asset data) |

### 6.3 Input Data

- Employer's Information Requirements (EIR / Требования заказчика к информационной модели)
- BIM Execution Plan (BEP / План реализации информационной модели)
- Discipline-specific models (architecture, structure, MEP)
- Project schedule (for 4D simulation)
- Cost databases (for 5D estimation)
- Standards: LOD specifications (LOD 100-500), classification systems (Uniclass, OmniClass)
- IFC export requirements and model exchange protocols
- Site survey data (point clouds, topographic models)

### 6.4 Output Data / Documents

- Federated BIM model (all disciplines integrated)
- Clash detection reports with categorized issues (critical/major/minor)
- 4D construction sequence simulation
- 5D cost model linked to BIM elements
- Quantity take-off reports extracted from BIM
- Model audit reports (LOD compliance, naming conventions)
- BIM-to-ПД mapping documentation (for state expertise)
- As-built model (updated during/after construction)
- Digital twin handover package (for facility management)

### 6.5 Typical Pain Points

- Discipline models authored in different software with IFC interoperability issues
- Lack of standardized LOD definitions leading to inconsistent model detail
- Clash detection overwhelm -- thousands of clashes with no prioritization framework
- BIM used only for visualization ("pretty pictures") without extracting data value
- Resistance from experienced designers unfamiliar with BIM workflows
- CDE not properly set up -- files stored locally, no version control
- BIM models not accepted by state expertise bodies (require traditional 2D documentation)
- High software licensing costs (Revit, Navisworks, Tekla) without clear ROI measurement
- Model file sizes becoming unmanageable (>1GB federated models)

### 6.6 Ideal ERP Functions

- **CDE integration** with model repository, check-in/check-out, version history
- **Clash detection dashboard** with severity classification, assignment, and resolution tracking
- **BIM viewer** embedded in project portal (no-download, web-based, IFC viewer)
- **Quantity extraction** module linking BIM elements to cost codes and procurement items
- **4D schedule integration** connecting BIM model elements to project schedule activities
- **LOD compliance checker** automated validation of model element detail levels
- **BIM-to-document generator** producing 2D drawings and ПД sections from model
- **Issue tracking** for modeling defects, RFIs, and coordination items linked to model elements
- **Audit trail** for all model changes with user attribution and timestamp
- **Handover module** for packaging as-built model into digital twin for operations

### 6.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГОСТ Р 57311-2016 | Information modeling in construction -- requirements for operational documentation |
| ГОСТ Р 57563-2017 | Information modeling in construction -- basic provisions for BIM standards development |
| СП 333.1325800.2020 | Information modeling in construction -- rules for forming information models at lifecycle stages |
| СП 301.1325800.2017 | Information modeling -- rules for organizing work using BIM |
| ПП РФ от 05.03.2021 No. 331 | Establishing BIM requirements for state-funded construction |
| ГОСТ Р 10.0.03-2019 | BIM -- requirements for machine-readable classification systems |
| ГОСТ Р 10.0.02-2019 | BIM -- terms and definitions |

### 6.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| ISO 19650-1:2018 | BIM -- concepts and principles |
| ISO 19650-2:2018 | BIM -- information management during delivery phase |
| ISO 19650-3:2020 | BIM -- information management during operational phase |
| ISO 19650-5:2020 | BIM -- security-minded approach to information management |
| ISO 16739-1:2024 | IFC (Industry Foundation Classes) data model specification |
| PAS 1192-2:2013 (UK) | Specification for information management for the capital/delivery phase using BIM (predecessor to ISO 19650) |
| LOD Specification (BIMForum) | Level of Development definitions (LOD 100-500) |
| AIA E203-2013 | BIM and Digital Data Exhibit |
| NEC4 ECC, Option X10 | Information modeling requirements |

### 6.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Clash detection rate | >= 95% clashes resolved before construction | Clashes resolved / total clashes detected |
| Clash resolution cycle time | <= 5 working days (critical) | Time from clash detection to confirmed resolution |
| Model accuracy (LOD compliance) | >= 90% elements at required LOD | Audit sampling of model elements |
| BIM-to-field deviation | <= 2% by quantity | Variance between BIM quantities and actual installed |
| CDE adoption rate | 100% project team using CDE | Percentage of team members actively using CDE |
| Model update frequency | Weekly (during active design) | Discipline models updated in CDE weekly |
| IFC validation pass rate | >= 95% | IFC files passing automated validation checks |
| Cost estimation accuracy from BIM | Variance <= ±10% | BIM 5D estimate vs actual tender prices |
| 4D simulation sessions | >= 1 per month during design | Number of 4D reviews conducted |

---

## Process 7: Change Management (RFI, Submittals)

### 7.1 Process Description

Change Management in construction encompasses the formal processes for requesting, reviewing, approving, and implementing changes to the project scope, design, or execution plan. The two primary instruments are RFIs (Requests for Information) and Submittals, complemented by Change Orders (CO) and Construction Change Directives (CCD).

**RFI (Request for Information):** A formal process whereby any project participant (typically the contractor) requests clarification on design intent, resolves ambiguities in drawings/specifications, or identifies conflicts between documents. The RFI is routed to the architect/engineer of record, who must respond within a defined timeframe (typically 7-14 days per contract terms). AIA Document G716-2004 provides the standard RFI form.

**Submittals:** Shop drawings, product data, samples, and other documents submitted by the contractor to demonstrate how they propose to conform to the design intent. The architect reviews submittals for conformance and returns them with a status (Approved, Approved as Noted, Revise and Resubmit, Rejected).

**Change Orders:** Formal modifications to the contract scope, cost, or schedule. Under AIA A201-2017 Article 7, three mechanisms exist: Change Order (signed by Owner, Contractor, Architect), Construction Change Directive (signed by Owner and Architect), and Minor Changes (Architect's written order not affecting cost or time).

In Russia, changes to project documentation during construction are managed through the general designer issuing revised documentation, with significant changes potentially requiring re-expertise (повторная экспертиза) under ГрК РФ ст. 49.

### 7.2 Participants

| Role | Responsibility |
|------|---------------|
| Contractor (General/Sub) | Initiates RFIs, prepares submittals, requests changes |
| Architect / Engineer of Record | Responds to RFIs, reviews submittals, evaluates change impact |
| Project Manager (Owner's Rep) | Manages change workflow, approves cost/schedule impacts |
| BIM Coordinator | Updates model to reflect approved changes |
| Cost Estimator / QS | Evaluates cost impact of proposed changes |
| Scheduler | Evaluates schedule impact and critical path effects |
| General Designer (Russia) | Issues revised project/working documentation (изменения в РД) |
| State Expertise Body (Russia) | Re-reviews if changes are substantive (повторная экспертиза) |
| Contract Administrator | Processes formal Change Orders, updates contract values |

### 7.3 Input Data

- Original contract documents (drawings, specifications, schedules)
- RFI form with specific question, reference to document/drawing, urgency level
- Submittal package (shop drawings, product data, samples, calculations)
- Change request with scope description, cost estimate, schedule impact
- BIM model (current version for clash/coordination reference)
- Contract terms defining change order procedures and pricing methods
- Submittal schedule (required submittal list by specification section)

### 7.4 Output Data / Documents

- RFI response (written clarification with referenced drawing/spec section)
- RFI log (numbered, dated, status tracked)
- Submittal review response (Approved / Approved as Noted / Revise & Resubmit / Rejected)
- Submittal log with status tracking
- Change Order (executed, with adjusted contract sum and time)
- Construction Change Directive (interim directive pending CO execution)
- Revised drawings/specifications incorporating approved changes
- Updated BIM model reflecting changes
- Cost adjustment documentation
- Schedule update with approved time extensions

### 7.5 Typical Pain Points

- RFI response delays (industry average 6-10 days; some exceed 30 days)
- Excessive RFIs used as a claims strategy rather than genuine information requests
- Submittals returned as "Revise and Resubmit" multiple times without clear feedback
- No centralized tracking -- RFIs and submittals managed via email and spreadsheets
- Cost and schedule impact of changes not evaluated before approval
- Informal verbal changes made on-site without documentation (leading to disputes)
- Re-expertise requirements in Russia adding 30-60 days for substantive design changes
- Ball-in-court delays -- unclear who currently owns the action item
- Loss of change documentation during long projects (5+ years)

### 7.6 Ideal ERP Functions

- **RFI workflow** with numbered log, auto-routing, response deadline tracking, escalation
- **Submittal tracking** with specification-linked submittal schedule, status lifecycle, ball-in-court indicator
- **Change Order management** with cost/schedule impact analysis, approval workflow, contract sum adjustment
- **Digital markup tools** for reviewing submittals and annotating drawings
- **Dashboard** with RFI aging report, submittal status summary, pending COs
- **Integration with BIM** to link RFIs/submittals to specific model elements
- **Mobile access** for field-initiated RFIs with photo/video attachments
- **Automated notifications** for approaching and overdue response deadlines
- **Audit trail** preserving complete history of all changes for claims and dispute resolution
- **Analytics** showing RFI trends by discipline, response time distribution, cost impact of changes

### 7.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГрК РФ, ст. 49 (п. 3.5, 3.8) | Re-expertise requirements for substantive changes to approved ПД |
| ГОСТ Р 21.101-2020, разд. 7 | Rules for making changes to project and working documentation |
| ПП РФ от 16.02.2008 No. 87 | Changes must maintain compliance with approved ПД section composition |
| ГрК РФ, ст. 52 | Construction execution; duty to build per approved ПД |
| СП 48.13330.2019 | Organization of construction; change management during execution |
| ГОСТ 21.110-2013 | Specification of equipment, products and materials (submittal reference) |

### 7.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| AIA A201-2017, Art. 7 | Changes in the Work -- Change Orders, CCDs, Minor Changes |
| AIA G716-2004 | Request for Information (RFI) standard form |
| AIA G810-2001 | Transmittal Letter (submittal transmittal form) |
| FIDIC Red Book 2017, Cl. 13 | Variations and Adjustments |
| FIDIC Red Book 2017, Cl. 20 | Employer's and Contractor's Claims |
| NEC4 ECC, Cl. 60-65 | Compensation Events (NEC's change mechanism) |
| ISO 19650-2:2018, Cl. 5.6 | Information model delivery and change management |
| RIBA Plan of Work 2020, Stage 5 | Construction -- change and information management |
| CSI MasterFormat (2018) | Specification sections linked to submittal requirements |

### 7.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Average RFI response time | <= 7 calendar days | From RFI issuance to response |
| RFI overdue rate | <= 5% | RFIs exceeding contractual response period |
| Submittal first-approval rate | >= 70% | Submittals approved or approved-as-noted on first review |
| Submittal review cycle time | <= 10 working days | From submittal receipt to response |
| Change order processing time | <= 14 calendar days | From CO request to executed CO |
| Total RFIs per project | Benchmark: 1-2 per $100K contract value | Industry benchmark comparison |
| Cost of changes vs original contract | <= 5% of original contract value | Total CO value / original contract sum |
| Schedule impact of changes | <= 3% of original duration | Total time extensions / original contract duration |
| Ball-in-court clarity | 100% items have clear owner | All RFIs/submittals have assigned responsible party |

---

# Block 2: Design and Procurement

---

## Process 8: Design Phase Management

### 8.1 Process Description

Design Phase Management encompasses the planning, execution, coordination, and control of all design activities from concept through detailed (working) documentation. It bridges the gap between the approved TEO/ГПЗУ and the construction-ready working documentation (Рабочая документация, РД). The process manages the progressive elaboration of design from preliminary concept to fully detailed construction documents.

In Russia, design phases typically follow: Concept Design (Эскизный проект) -> Project Documentation (Проектная документация, ПД per PP No. 87) -> Working Documentation (Рабочая документация, РД per ГОСТ Р 21.101-2020). Internationally, these map to RIBA Stages 2-4 (Concept Design, Spatial Coordination, Technical Design), or AIA phases (Schematic Design, Design Development, Construction Documents).

Key activities include: managing the design schedule, coordinating multi-discipline design teams, conducting design reviews at key milestones (design gates), managing design freeze points to prevent scope creep, tracking deliverable production, and ensuring regulatory compliance. The Design Manager must balance creative design quality with budget constraints, schedule deadlines, and regulatory requirements.

### 8.2 Participants

| Role | Responsibility |
|------|---------------|
| Design Manager | Plans and controls the design process, manages design schedule |
| General Designer (Генпроектировщик) | Leads overall design effort, ensures cross-discipline coordination |
| Chief Architect (ГАП) | Architectural design leadership, concept development |
| Chief Project Engineer (ГИП) | Engineering design leadership, technical decisions |
| Discipline Leads (Structural, MEP, Civil) | Manage discipline-specific design deliverables |
| BIM Manager | Coordinates digital model integration across disciplines |
| Client / Developer | Provides brief, approves design at review gates |
| Cost Consultant / QS | Provides cost feedback at each design stage |
| Planning Consultant | Ensures design complies with ГПЗУ and planning requirements |
| Specialist Consultants (Fire, Acoustics, Sustainability) | Provide specialist input at appropriate stages |

### 8.3 Input Data

- Approved TEO and investment decision
- ГПЗУ with building parameters
- Client's brief (Задание на проектирование)
- Engineering survey results
- Technical conditions from utility providers (ТУ)
- Budget allocation for design and construction
- Project master schedule with design milestones
- Applicable building codes and standards
- BIM Execution Plan (BEP) and information requirements

### 8.4 Output Data / Documents

- Concept Design package (Эскизный проект) with visualizations
- Project Documentation (ПД) -- 12 sections per PP No. 87
- Working Documentation (РД) per ГОСТ Р 21.101-2020
- Design review meeting minutes at each gate
- Design change log with approved modifications
- BIM model at appropriate LOD for each phase
- Specification documents
- Cost estimates updated at each design stage (AACE Class 5 -> 3 -> 2)
- Design program / schedule (updated monthly)
- Value engineering proposals

### 8.5 Typical Pain Points

- Design scope creep -- client requests changes without recognizing cost/schedule impact
- Poor coordination between disciplines leading to clashes discovered during construction
- Design schedule delays cascading into procurement and construction delays
- Insufficient design reviews allowing errors to propagate to later stages
- "Design by procurement" -- specifications left vague, hoping contractor will resolve
- Value engineering applied too late (during construction instead of during design)
- Disconnection between ПД (for expertise) and РД (for construction) -- inconsistencies between the two
- Design team turnover losing institutional knowledge mid-project
- Lack of formal design freeze, causing endless iterations

### 8.6 Ideal ERP Functions

- **Design program manager** with Gantt chart of deliverables, milestones, and dependencies
- **Design gate workflow** with formal review, approval, and gate pass/fail decisions
- **Deliverable tracker** listing each drawing/document, its status, responsible designer, deadline
- **Design change management** module linked to cost and schedule impact assessment
- **Multi-discipline coordination** calendar with scheduled review sessions
- **BIM integration** for design coordination and clash detection status
- **Cost tracking** showing cost estimate evolution from concept to detail design
- **Value engineering module** for proposing, evaluating, and tracking VE ideas
- **Design freeze control** with formal lock/unlock workflow for design packages
- **KPI dashboard** showing design progress (% complete), quality (defects), and schedule adherence

### 8.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГрК РФ, ст. 48 | Architectural-construction design -- general provisions |
| ПП РФ от 16.02.2008 No. 87 | Composition of project documentation sections (ПД) |
| ГОСТ Р 21.101-2020 | SPDS -- basic requirements for project and working documentation |
| ГОСТ Р 21.501-2018 | SPDS -- rules for architectural and structural drawings |
| СП 48.13330.2019 | Organization of construction (design-to-construction interface) |
| ФЗ-315 от 01.12.2007 | On self-regulatory organizations (SRO membership for designers) |
| ГОСТ Р 57563-2017 | BIM -- basic provisions for BIM standards |
| СП 333.1325800.2020 | BIM -- rules for information model formation |

### 8.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| RIBA Plan of Work 2020, Stages 1-4 | Preparation/Briefing through Technical Design |
| AIA B101-2017 | Standard Form of Agreement Between Owner and Architect |
| AIA A201-2017, Art. 3-4 | Architect's and Owner's duties during design |
| ISO 19650-1:2018 & -2:2018 | BIM information management concepts and delivery phase |
| FIDIC White Book (2017) | Client/Consultant Model Services Agreement |
| NEC4 PSC | Professional Service Contract -- design consultant engagement |
| CIC Scope of Services (2007) | UK -- detailed scope of architectural services |
| AACE 18R-97 | Cost estimate classification system aligned to design maturity |

### 8.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Design program adherence (SPI) | SPI >= 0.95 | Earned value of design deliverables vs planned |
| Design gate pass rate | >= 80% first pass | Percentage of gates passed without major rework |
| Drawing/document production rate | Per project baseline | Actual deliverables produced vs planned per week |
| Design change requests after freeze | <= 3 per design package | Number of changes after formal design freeze |
| Cross-discipline clash count | Decreasing trend per review | Clashes detected in BIM federated review |
| Cost estimate evolution | Variance <= ±15% from Stage 2 to Stage 4 | Cost estimate stability across design phases |
| Design defects found during construction | <= 1 per 100 drawings | RFIs attributable to design errors |
| Value engineering savings | >= 5% of construction budget | Cost savings from VE proposals adopted |
| Client satisfaction at design gates | >= 4/5 rating | Structured feedback at each review |

---

## Process 9: Contractor and Subcontractor Prequalification

### 9.1 Process Description

Prequalification is the structured process of evaluating potential contractors and subcontractors before inviting them to tender, ensuring only technically, financially, and legally qualified firms participate in the bidding process. This reduces procurement risk, improves tender quality, and shortens evaluation timelines.

The prequalification assessment typically covers: (a) legal capacity and corporate standing, (b) financial stability (audited accounts, credit rating, insurance levels), (c) technical capability (equipment, technology, methodology), (d) relevant experience (similar projects completed), (e) personnel qualifications (key staff CVs, certifications), (f) health and safety record (incident rates, safety management systems), (g) quality management (ISO 9001 certification), and (h) SRO membership in Russia.

In Russia, for government-funded projects under 44-FZ, prequalification is formalized through PP RF No. 2571 (29.12.2021), which establishes mandatory additional requirements for procurement participants in construction. Participants must demonstrate completed contracts of comparable scope, adequate financial resources, equipment, and qualified personnel. SRO membership (per ФЗ-315) with a valid certificate of admission to work is a fundamental prerequisite.

For private-sector projects and those under 223-FZ, each client may establish their own prequalification criteria and procedures.

### 9.2 Participants

| Role | Responsibility |
|------|---------------|
| Procurement Manager | Designs PQ criteria, manages the PQ process |
| Technical Evaluation Committee | Assesses technical capability and experience |
| Financial Analyst | Reviews financial statements, insurance, bonding capacity |
| HSE Manager | Evaluates safety records, certifications, safety management systems |
| Legal Counsel | Verifies legal standing, litigation history, SRO membership |
| Project Manager | Defines project-specific PQ requirements |
| Contractor / Applicant | Submits PQ documentation package |
| SRO (Russia) | Confirms valid membership and admission to work certificate |

### 9.3 Input Data

- PQ questionnaire (issued to potential contractors)
- Contractor's corporate profile and legal documents
- Audited financial statements (minimum 3 years)
- List of completed projects with references
- Key personnel CVs with professional certifications
- Equipment and machinery register
- ISO 9001, ISO 14001, ISO 45001 certificates
- Insurance certificates (liability, workers' comp)
- SRO membership certificate with admission scope (Russia)
- Safety record (EMR/TRIR for 3-5 years)
- Litigation and arbitration history
- Bank references and bonding capacity letters

### 9.4 Output Data / Documents

- PQ evaluation report with scored rankings
- Approved vendors list (prequalified contractors register)
- PQ score cards per contractor with detailed assessments
- Notification letters to applicants (qualified / not qualified)
- Prequalified bidders list for specific tender
- Risk assessment for each prequalified contractor
- PQ database for future project reference
- Due diligence summary for each contractor

### 9.5 Typical Pain Points

- PQ process too bureaucratic, discouraging smaller but capable firms
- Financial data submitted is outdated or manipulated
- Reference checking is superficial or skipped entirely
- SRO membership verified but actual capacity not validated
- No systematic database -- PQ repeated from scratch each project
- Subjective scoring without documented criteria or weighting
- Prequalified contractors still submit non-responsive bids
- PQ criteria not aligned with actual project requirements (generic template)
- Time pressure leads to skipping PQ and going straight to open tender

### 9.6 Ideal ERP Functions

- **Contractor registry** with comprehensive profiles, historical performance, and PQ status
- **PQ questionnaire builder** with customizable criteria and weighting per project type
- **Automated scoring engine** with weighted multi-criteria evaluation
- **Document management** for PQ submissions with version tracking and expiry alerts
- **Financial analysis module** with ratio calculations (liquidity, solvency, profitability)
- **Reference verification workflow** with structured feedback forms
- **SRO verification integration** (Russia) -- automated check against SRO registries
- **Blacklist management** for debarred or non-performing contractors
- **PQ expiry tracking** with renewal reminders (typically annual)
- **Analytics dashboard** showing PQ pipeline, approval rates, and contractor pool health

### 9.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ФЗ-44 от 05.04.2013, ст. 31 | Uniform and additional requirements for procurement participants |
| ФЗ-44, ст. 31, ч. 2, 2.1 | Additional requirements and universal prequalification |
| ПП РФ от 29.12.2021 No. 2571 | Requirements for participants in procurement of goods, works, services for state/municipal needs |
| ФЗ-223 от 18.07.2011 | Procurement by certain types of legal entities (private-sector flexibility) |
| ФЗ-315 от 01.12.2007 | On self-regulatory organizations (SRO) |
| ГрК РФ, ст. 55.8 | Admission to work affecting safety of capital construction objects |
| ГрК РФ, ст. 55.16 | Compensation fund of SRO |
| ФЗ-44, ст. 32 | Evaluation criteria for procurement participant bids |

### 9.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| ISO 10845-1:2020 | Construction procurement -- Part 1: Processes, methods, and procedures |
| ISO 10845-2:2020 | Construction procurement -- Part 2: Formatting procurement documentation |
| ISO 10845-3:2021 | Construction procurement -- Part 3: Standard conditions of tender |
| World Bank Procurement Framework (2016) | Standard Prequalification Documents for Works |
| FIDIC Red Book 2017, Cl. 4.1 | Contractor's general obligations and qualifications |
| NEC4 ECC, Cl. 26 | Subcontracting -- approval of subcontractors |
| ISO 9001:2015 | Quality management systems -- certification requirement |
| ISO 45001:2018 | Occupational health and safety management -- certification requirement |
| OSHA 29 CFR 1926 | Construction safety standards (US reference for safety PQ criteria) |

### 9.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| PQ process cycle time | <= 30 calendar days | From PQ launch to approved bidders list |
| PQ response rate | >= 60% | Percentage of invited firms submitting PQ packages |
| PQ pass rate | 40-70% (indicates appropriate criteria) | Percentage of applicants qualifying |
| Prequalified contractor performance | >= 85% satisfactory rating | Post-project performance review of PQ'd contractors |
| PQ database currency | 100% profiles updated within 12 months | Freshness of contractor data |
| SRO verification completion | 100% | All contractors' SRO status verified |
| Financial stability screening | 0 contractor insolvencies during contract | No PQ'd contractors going bankrupt mid-project |
| Safety record threshold | TRIR <= 2.0 (or EMR <= 1.0) | Safety performance metric for PQ eligibility |
| Reference check completion | >= 90% of references contacted | Actual reference calls made vs listed references |

---

## Process 10: Tender Documentation Preparation

### 10.1 Process Description

Tender Documentation Preparation is the process of assembling the complete set of documents that will be issued to prequalified bidders to enable them to prepare responsive and comparable bids. The tender documentation package must be sufficiently detailed and unambiguous to ensure fair competition and meaningful price/quality comparison.

A typical tender package includes: Instructions to Tenderers, Form of Tender, Conditions of Contract (General and Particular), Technical Specifications, Drawings, Bill of Quantities (BOQ) or Activity Schedule, Employer's Requirements, Evaluation Criteria, and Required Insurances/Guarantees. The quality of tender documentation directly impacts bid quality, the number of clarifications during tendering, the potential for claims during execution, and the fairness of the procurement process.

In Russia, for public procurement under 44-FZ, tender documentation must comply with strict formatting and content requirements established by the law and implementing regulations. For private-sector procurement, FIDIC-based or NEC4-based documentation is increasingly common for large projects.

### 10.2 Participants

| Role | Responsibility |
|------|---------------|
| Procurement Manager | Coordinates tender documentation preparation, sets procurement strategy |
| Contracts Manager | Drafts contract conditions (General and Particular) |
| Quantity Surveyor / Cost Estimator | Prepares BOQ / Activity Schedule and cost estimate |
| Technical Manager / Project Engineer | Prepares technical specifications and scope of work |
| Design Team | Provides drawings and design documentation |
| Legal Counsel | Reviews contract terms, ensures regulatory compliance |
| HSE Manager | Defines safety requirements for tender |
| Commercial Manager | Sets evaluation criteria and weighting |
| BIM Manager | Prepares BIM requirements for contractors (EIR) |

### 10.3 Input Data

- Approved project documentation (ПД) and working documentation (РД)
- Cost estimate from design phase (for cost benchmark / budget)
- Prequalified bidders list
- Contract strategy decision (lump sum, unit rate, cost-plus, target cost)
- Standard contract forms (FIDIC, NEC4, AIA, or Russian standard forms)
- Technical specifications from design team
- BIM model and Employer's Information Requirements (EIR)
- HSE requirements and site-specific safety rules
- Insurance and guarantee requirements
- Procurement schedule with tender timeline

### 10.4 Output Data / Documents

- Invitation to Tender letter
- Instructions to Tenderers (ITT)
- Form of Tender / Bid Form
- Conditions of Contract (General Conditions + Particular Conditions)
- Technical Specifications (by discipline / work package)
- Drawings package
- Bill of Quantities (BOQ) or Activity Schedule
- Employer's Requirements document
- Evaluation criteria and methodology
- Tender schedule (submission deadline, clarification period, award date)
- Pre-bid meeting agenda and site visit arrangements
- Clarification log template
- BIM requirements (Employer's Information Requirements)

### 10.5 Typical Pain Points

- BOQ incomplete or inconsistent with drawings and specifications
- Contradictions between general conditions and particular conditions
- Evaluation criteria not clearly defined, leading to subjective assessment
- Specifications overly prescriptive (limiting competition) or too vague (inviting claims)
- Insufficient time for bidders to prepare quality proposals
- Last-minute changes to tender documents after issuance
- Technical specifications copy-pasted from different projects without adaptation
- Tender documentation in mixed languages (Russian/English) with translation inconsistencies
- Missing or incorrect site information (survey data, existing conditions)

### 10.6 Ideal ERP Functions

- **Tender package builder** with document assembly checklist and completeness validation
- **BOQ management** with linked quantities from BIM model and cost database
- **Specification library** with standard spec sections and project-specific customization
- **Contract template manager** with clause library (FIDIC, NEC4, Russian standard forms)
- **Evaluation criteria configurator** with weighting calculator
- **Tender portal** for electronic issuance, clarification management, and bid submission
- **Version control** for all tender documents with change tracking
- **Internal review workflow** for tender documentation approval before issuance
- **Comparison tool** highlighting differences between tender docs and approved project documentation
- **Analytics** on tender issuance statistics, clarification volume, and bid response rates

### 10.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ФЗ-44, ст. 33 | Rules for describing procurement objects |
| ФЗ-44, ст. 34 | Contract conditions in procurement documentation |
| ФЗ-44, ст. 50 | Documentation for open competition in electronic form |
| ФЗ-223, ст. 4 | Information disclosure in procurement (private-sector) |
| ПП РФ от 16.02.2008 No. 87 | Project documentation composition (basis for specifications) |
| МДС 81-35.2004 | Methodology for determining construction cost (basis for BOQ) |
| ФСНБ (Federal сметные нормативы) | Federal cost norm base for cost estimation |
| ГОСТ Р 21.101-2020 | Requirements for project and working documentation format |

### 10.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| ISO 10845-2:2020 | Construction procurement -- formatting and compilation of procurement documentation |
| ISO 10845-3:2021 | Construction procurement -- standard conditions of tender |
| FIDIC Red Book (2017) | Conditions of Contract for Construction (employer-designed) |
| FIDIC Yellow Book (2017) | Conditions of Contract for Plant and Design-Build |
| NEC4 ECC (2017) | Engineering and Construction Contract (Options A-F) |
| AIA A101-2017 | Standard Form of Agreement -- Stipulated Sum |
| AIA A201-2017 | General Conditions of the Contract for Construction |
| RICS NRM2 (2021) | New Rules of Measurement -- detailed measurement for building works |
| CSI MasterFormat (2018) | Specification organization system (50 divisions) |
| World Bank Standard Bidding Documents | Procurement of Works (multilateral standard) |

### 10.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Tender documentation preparation time | <= 30 calendar days | From decision to tender to issuance |
| Document completeness at issuance | >= 95% | Pre-issuance checklist completion |
| Clarifications received per tender | <= 20 | Number of formal clarifications from bidders |
| Tender document amendments after issuance | <= 2 | Addenda issued during tender period |
| BOQ-to-drawing consistency | >= 98% | Automated reconciliation of BOQ items vs drawings |
| Bid response rate | >= 70% of invitees | Number of bids received / number of invitations |
| Internal review cycle time | <= 5 working days | Time for legal/commercial/technical review |
| Post-award claims attributable to tender docs | <= 1% of contract value | Claims caused by tender documentation ambiguity |

---

## Process 11: Bid Leveling (Comparing Proposals)

### 11.1 Process Description

Bid Leveling (also called Bid Analysis, Bid Tabulation, or Commercial/Technical Evaluation) is the systematic process of normalizing, comparing, and ranking received tender proposals to identify the Most Economically Advantageous Tender (MEAT). The process ensures apples-to-apples comparison by adjusting for scope inclusions/exclusions, qualification differences, conditional pricing, and alternative proposals.

The process typically involves two parallel streams: (a) Technical Evaluation -- assessing methodology, program, team, quality plan, safety plan, BIM capability, and (b) Commercial Evaluation -- analyzing pricing, payment terms, qualifications/exclusions, alternative proposals, and lifecycle costs.

A weighted evaluation matrix combines technical and commercial scores. Common weighting approaches include 60/40 (technical/commercial), 70/30 for complex projects, or 30/70 for commodity work. The evaluation must be conducted by a multi-disciplinary panel to prevent bias.

In Russia, for public procurement under 44-FZ (Art. 32), evaluation criteria are prescribed by law and must include price as a mandatory criterion. For private procurement, greater flexibility exists.

### 11.2 Participants

| Role | Responsibility |
|------|---------------|
| Procurement Manager / Chairman | Leads the evaluation panel, ensures process fairness |
| Technical Evaluators (Engineers) | Score technical proposals against criteria |
| Commercial Evaluator (QS / Cost Manager) | Analyze pricing, normalize bids, identify gaps |
| HSE Evaluator | Score safety management plans and records |
| Legal Advisor | Reviews contractual qualifications and exceptions |
| Project Manager | Provides project-specific evaluation context |
| Financial Analyst | Assesses bidder financial stability (if not done at PQ stage) |
| Independent Observer (for public procurement) | Ensures transparency and compliance |

### 11.3 Input Data

- Received tender submissions (commercial and technical envelopes)
- Evaluation criteria and weighting from tender documentation
- Internal cost estimate (Engineer's Estimate / Control Budget)
- Prequalification data for shortlisted bidders
- Clarification responses and addenda issued during tender period
- Standard scoring matrix template
- Market price benchmarks for key items
- Bidder presentations and interview notes (if applicable)

### 11.4 Output Data / Documents

- Bid tabulation spreadsheet (commercial comparison)
- Technical evaluation score sheets (per evaluator)
- Moderated consensus scores (technical and commercial)
- Bid leveling report with scope normalization adjustments
- Recommended award letter with justification
- Debrief documentation for unsuccessful bidders
- Negotiation strategy for preferred bidder (if applicable)
- Evaluation panel minutes with documented decisions
- Final award recommendation report for approval

### 11.5 Typical Pain Points

- Bids not truly comparable due to different scope interpretations
- Lowest-price bias overriding quality and capability assessment
- Evaluators not trained in structured scoring methodology
- Hidden costs in alternative proposals not properly adjusted
- Time pressure leading to superficial evaluation
- Lack of documentation making award decisions vulnerable to challenge
- Conflicts of interest not declared by evaluation panel members
- Significant price spread (>30%) indicating specification ambiguity
- Preferred bidder's qualifications/exclusions discovered too late (after award)

### 11.6 Ideal ERP Functions

- **Bid tabulation tool** with automated commercial comparison and normalization
- **Scoring matrix engine** with configurable criteria, weighting, and multi-evaluator support
- **Scope gap analyzer** highlighting inclusions/exclusions across bids
- **Price benchmarking** comparing bids against internal estimate and market data
- **Panel management** with evaluator assignment, conflict-of-interest declaration
- **Moderation workflow** for consensus building on scores
- **Automatic ranking** based on combined technical and commercial scores
- **Report generator** producing evaluation summary, recommendation, and debrief letters
- **Audit trail** preserving all scores, discussions, and decisions
- **Scenario analysis** -- "what-if" tool showing ranking changes with different criteria weights

### 11.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ФЗ-44, ст. 32 | Evaluation criteria for procurement bids (price mandatory, plus quality, experience, etc.) |
| ФЗ-44, ст. 32, ч. 1 | Criteria: price, lifecycle costs, quality/functional characteristics, qualification |
| ФЗ-44, ст. 51-52 | Open competition procedures (electronic form) |
| ПП РФ от 31.12.2021 No. 2604 | Rules for evaluating bids under 44-FZ |
| ФЗ-223, ст. 3 | Procurement principles (efficiency, cost-effectiveness, equal access) |
| ФЗ-135 от 26.07.2006 | On protection of competition (anti-monopoly compliance) |

### 11.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| ISO 10845-4:2021 | Construction procurement -- Part 4: Standard conditions for the calling for expressions of interest |
| FIDIC Red Book 2017, Appendix to Tender | Tender submission requirements and evaluation basis |
| World Bank Procurement Guidance (2023/2025) | Evaluating Bids and Proposals with Rated Criteria |
| EU Directive 2014/24/EU | Public procurement -- MEAT (Most Economically Advantageous Tender) |
| NEC4 ECC, Option W1/W2 | Dispute resolution (linked to fair evaluation) |
| AACE 59R-10 | Development of Factored Cost Estimates -- as applied to bid analysis |
| RICS Guidance on Tendering Strategies (2014) | Best practice for tender evaluation |

### 11.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Bid evaluation cycle time | <= 20 calendar days | From bid opening to award recommendation |
| Number of compliant bids | >= 3 per tender | Bids meeting minimum requirements |
| Price spread (max/min) | <= 25% | Indicates specification clarity |
| Technical score spread | <= 30 points (on 100-point scale) | Indicates PQ effectiveness |
| Awarded price vs engineer's estimate | Within ±10% | Market alignment of winning bid |
| Evaluation panel consensus | >= 80% agreement before moderation | Initial score alignment across evaluators |
| Challenge/protest rate | <= 5% of awards | Formal challenges from unsuccessful bidders |
| Post-award negotiation savings | 2-5% of bid price | Savings achieved in post-tender negotiation |
| Debrief completion rate | 100% for all unsuccessful bidders | Debriefs offered and conducted |

---

## Process 12: Contract Management (Creation, Amendments, Closing)

### 12.1 Process Description

Contract Management in construction covers the entire lifecycle of contractual relationships from initial contract creation through execution, amendments (variations), and final close-out. It is the process ensuring that all parties fulfill their obligations, changes are properly documented and priced, disputes are managed, and contracts are formally closed upon completion.

**Contract Creation** involves selecting the appropriate contract form (lump sum, unit rate, cost-plus, target cost, GMP), negotiating terms with the selected contractor, incorporating particular conditions, and executing the agreement. In Russia, construction contracts are governed by the Civil Code (ГК РФ, Глава 37 "Подряд") and, for public contracts, by 44-FZ.

**Contract Amendments** cover formal variations, additional works, omissions, and changes in law. Under FIDIC Red Book 2017 (Cl. 13), variations may be initiated by the Engineer's instruction or the Contractor's proposal. Under NEC4 ECC (Cl. 60-65), changes are processed as Compensation Events.

**Contract Close-Out** involves: completion of all works, defect identification and rectification, final account agreement, release of retentions, return of performance bonds, issuance of the Completion Certificate (Акт приемки в эксплуатацию in Russia), and the Defects Notification Period (гарантийный срок).

### 12.2 Participants

| Role | Responsibility |
|------|---------------|
| Contracts Manager | Drafts, negotiates, and administers the contract |
| Project Director | Approves contract terms, authorizes variations |
| Legal Counsel | Reviews legal aspects, dispute resolution clauses |
| Quantity Surveyor / Cost Manager | Manages valuations, interim payments, variations, final account |
| Project Manager | Day-to-day contract administration on site |
| Engineer (FIDIC role) | Administers the contract as an independent professional |
| Contractor's Representative | Signs contract, manages contractor's obligations |
| Subcontract Manager | Administers back-to-back subcontracts |
| Financial Controller | Approves payment certificates, manages retentions |
| Claims Manager | Handles claims preparation and defense |

### 12.3 Input Data

- Tender documentation and winning bid (including all clarifications)
- Selected contract form (FIDIC, NEC4, AIA, Russian standard, or bespoke)
- Negotiation outcomes and agreed particular conditions
- Performance bond / bank guarantee
- Insurance certificates
- Project baseline (schedule, budget, scope)
- Payment terms and schedule of values
- Dispute resolution mechanism selection (arbitration, DAB, litigation)

### 12.4 Output Data / Documents

- Executed contract agreement with all annexes
- Contract register entry
- Performance bond / bank guarantee (on file)
- Interim payment certificates (monthly)
- Variation orders / Change orders (numbered and logged)
- Claim notifications and assessments
- Extension of time (EOT) determinations
- Completion Certificate / Taking-Over Certificate (FIDIC Cl. 10.1)
- Defects list (snag list) and rectification confirmation
- Final Payment Certificate (FIDIC Cl. 14.13)
- Final account agreement
- Performance Guarantee release confirmation
- Retention release documentation
- Lessons learned report

### 12.5 Typical Pain Points

- Contracts executed with unresolved commercial issues ("agree later" syndrome)
- Variations processed informally (verbal instructions) without proper documentation
- Payment delays exceeding contractual terms, damaging supply chain
- Claims accumulating without timely notification (FIDIC Cl. 20.2 requires 28-day notice)
- Subcontracts not back-to-back with main contract, creating liability gaps
- Final account negotiations lasting months or years after project completion
- Retention release delayed or disputed beyond defects notification period
- Poor document management making it impossible to reconstruct the contractual position
- Dispute escalation to arbitration due to failed early resolution mechanisms

### 12.6 Ideal ERP Functions

- **Contract creation wizard** with template selection, clause library, and risk flagging
- **Contract register** with all active contracts, key dates, values, and status
- **Variation management** with initiation, costing, approval workflow, and contract sum adjustment
- **Interim payment processing** with automated certificate generation per schedule of values
- **Claims management module** with notification tracker, time bars, assessment workflow
- **Extension of Time tracker** with critical path delay analysis integration
- **Final account module** with reconciliation against all variations, claims, and provisional sums
- **Retention tracker** with half-release at practical completion and full release after defects period
- **Guarantee/bond registry** with expiry tracking and renewal alerts
- **Document management** with clause-level search and audit trail
- **Subcontract management** with back-to-back compliance checker
- **KPI dashboard** showing contract health, payment status, claims exposure, and variations trend

### 12.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГК РФ, Глава 37 (ст. 702-768) | Contract for work (подряд), including construction contract (строительный подряд, ст. 740-757) |
| ГК РФ, ст. 743 | Technical documentation and cost estimate (основания для подряда) |
| ГК РФ, ст. 744 | Amendments to technical documentation (изменения в ТД) |
| ГК РФ, ст. 753 | Acceptance of work performed (Сдача и приемка работ) |
| ФЗ-44, ст. 34 | Contract conditions for government procurement |
| ФЗ-44, ст. 95 | Amendment and termination of government contracts |
| ФЗ-44, ст. 96 | Performance guarantee for government contracts |
| МДС 12-9.2001 | Information on cost of construction (basis for contract pricing) |

### 12.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| FIDIC Red Book 2017 | Conditions of Contract for Construction (employer-designed) -- full suite |
| FIDIC Yellow Book 2017 | Conditions of Contract for Plant and Design-Build |
| FIDIC Silver Book 2017 | Conditions of Contract for EPC/Turnkey Projects |
| NEC4 ECC (2017), Options A-F | Engineering and Construction Contract with 6 pricing options |
| AIA A101-2017 | Owner-Contractor Agreement, Stipulated Sum |
| AIA A201-2017 | General Conditions of the Contract for Construction |
| JCT Design and Build Contract (2024) | UK standard form contract |
| ICC Arbitration Rules (2021) | Dispute resolution rules frequently referenced in international contracts |
| DIAC Arbitration Rules (2007) | Dubai arbitration rules for Middle East construction disputes |

### 12.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Contract execution time | <= 14 calendar days from award | From award letter to signed contract |
| Interim payment cycle time | <= 28 days from application | Contractor application to payment |
| Variation order processing time | <= 14 calendar days | From VO request to executed VO |
| Total variations vs original contract | <= 10% of original contract value | Sum of all VOs / original contract sum |
| Claims resolution within contractual period | >= 80% | Claims resolved within time bar period |
| Final account agreement time | <= 6 months from practical completion | Time to agree final account |
| Retention release on time | >= 95% | Retentions released within contractual period |
| Contract close-out completion | <= 12 months from completion | All close-out items completed |
| Dispute escalation rate | <= 5% of claims | Claims escalated to formal dispute resolution |
| Payment on time rate | >= 90% | Payments made within contractual terms |

---

## Process 13: Insurance and Guarantees Management

### 13.1 Process Description

Insurance and Guarantees Management is the process of identifying, procuring, administering, and monitoring all insurance policies and financial guarantees required for a construction project. This process mitigates financial risk for all project participants -- developer, contractor, subcontractors, and third parties.

**Insurance** in construction typically includes: (a) Construction All Risks (CAR) / Erection All Risks (EAR) -- covering physical damage to the works, (b) Third-Party Liability (TPL) -- covering injury/damage to third parties, (c) Professional Indemnity (PI) -- covering design errors, (d) Workers' Compensation -- covering employee injuries, (e) Builder's Risk -- covering the building under construction, and (f) Delay in Start-Up (DSU/ALOP) -- covering financial losses from delayed completion.

In Russia, construction and installation risk insurance (Страхование строительно-монтажных рисков, СМР) is regulated by Chapter 48 of the Civil Code (ГК РФ, ст. 742 specifically for construction contracts). For government contracts under 44-FZ, performance guarantees (банковская гарантия) are mandatory (Art. 96) and must be issued by banks meeting specific criteria.

**Guarantees** include: Performance Bonds / Bank Guarantees (обеспечение исполнения контракта), Advance Payment Guarantees, Retention Guarantees, Warranty Period Guarantees, and Parent Company Guarantees. Under FIDIC Red Book 2017, performance security is addressed in Cl. 4.2, and insurance in Cl. 18-19.

### 13.2 Participants

| Role | Responsibility |
|------|---------------|
| Risk Manager | Identifies insurable risks, determines coverage requirements |
| Insurance Broker | Procures policies, negotiates terms and premiums |
| Contracts Manager | Defines insurance and guarantee requirements in contract |
| Financial Controller | Manages premium payments, guarantee costs, and reserve funds |
| Legal Counsel | Reviews policy terms, exclusions, and claims provisions |
| Contractor | Procures contractor-side insurance and provides guarantees |
| Bank / Surety Company | Issues bank guarantees and performance bonds |
| Insurance Company | Underwrites and issues insurance policies |
| Claims Adjuster (Loss Adjuster) | Manages insurance claims when incidents occur |
| Project Manager | Monitors compliance with insurance requirements during execution |

### 13.3 Input Data

- Risk register with identified insurable risks
- Contract requirements for insurance and guarantees (per FIDIC Cl. 18-19 or contract terms)
- Construction value for CAR/EAR coverage calculation
- Contract value for performance guarantee calculation
- Professional fee base for PI insurance calculation
- Site conditions and hazard assessment
- Historical loss data for similar projects
- Regulatory requirements (44-FZ Art. 96 for government contracts)
- Advance payment schedule (for advance payment guarantee sizing)
- Defects notification period (for warranty guarantee duration)

### 13.4 Output Data / Documents

- Insurance program summary (all policies, coverage, limits, deductibles)
- CAR/EAR policy document
- TPL policy document
- PI policy document (designer)
- Workers' compensation policy
- DSU/ALOP policy (if required)
- Performance bond / bank guarantee (банковская гарантия)
- Advance payment guarantee
- Retention guarantee / bond
- Warranty period guarantee
- Insurance certificates for contract compliance
- Premium payment schedule
- Guarantee fee payment records
- Claims register and claims documentation
- Guarantee release/return documentation

### 13.5 Typical Pain Points

- Insurance coverage gaps discovered only when a claim is filed
- Policies expiring mid-project without renewal, leaving the project uninsured
- Guarantee issuance delays holding up contract execution or advance payments
- Premium costs not budgeted adequately in project cost estimate
- Complex claims process with lengthy adjuster investigations and delayed payouts
- Bank guarantee terms not matching contract requirements (duration, amount, conditions)
- Subcontractor insurance inadequate, creating liability gaps for the main contractor
- Difficulty tracking multiple policies and guarantees across a multi-contract project
- Performance guarantee amount not reduced as work progresses (opportunity cost)
- Insurance exclusions too broad (e.g., excluding design defects, ground conditions)

### 13.6 Ideal ERP Functions

- **Insurance registry** with all policies, coverage limits, deductibles, premiums, and expiry dates
- **Guarantee registry** with all bonds/guarantees, amounts, issuers, expiry dates, and release conditions
- **Automated expiry alerts** (90, 60, 30 days before policy/guarantee expiry)
- **Coverage adequacy checker** comparing contract requirements vs actual coverage
- **Premium cost tracker** linked to project budget
- **Claims management module** for logging incidents, tracking claims, and managing adjuster correspondence
- **Certificate generator** producing insurance compliance certificates for contract submissions
- **Subcontractor insurance tracker** ensuring all subs maintain required coverage
- **Guarantee cost optimizer** tracking guarantee amounts vs work progress for reduction requests
- **Dashboard** showing total project insurance/guarantee exposure, upcoming renewals, and open claims
- **Document repository** for all policies, endorsements, claims correspondence

### 13.7 Russia-Specific Standards

| Standard | Description |
|----------|-------------|
| ГК РФ, ст. 742 | Insurance of construction objects (developer may require contractor to insure) |
| ГК РФ, Глава 48 (ст. 927-970) | Insurance -- general provisions, property and liability insurance |
| ФЗ-44, ст. 45 | Bank guarantee requirements for government procurement |
| ФЗ-44, ст. 96 | Performance guarantee for government contract execution |
| ФЗ-44, ст. 96, ч. 3 | Bank guarantee term must exceed contract period by >= 1 month |
| ФЗ-4015-1 от 27.11.1992 | On organization of insurance business in the Russian Federation |
| ФЗ-214 от 30.12.2004 | Shared construction -- developer liability insurance (for residential) |
| ПП РФ от 08.11.2013 No. 1005 | Bank guarantee requirements for government procurement (additional) |
| ФЗ-315, ст. 13 | SRO compensation fund (as a form of collective guarantee) |

### 13.8 Global Market Standards

| Standard | Description |
|----------|-------------|
| FIDIC Red Book 2017, Cl. 4.2 | Performance Security -- bank guarantee or surety bond requirements |
| FIDIC Red Book 2017, Cl. 18 | Insurance -- general requirements, insurance by Contractor and Employer |
| FIDIC Red Book 2017, Cl. 19 | Force Majeure (risk allocation affecting insurance) |
| NEC4 ECC, Cl. 83-86 | Insurance (Table 1 and 2 -- required insurances) |
| AIA A201-2017, Art. 11 | Insurance and Bonds requirements |
| ISO 31000:2018 | Risk management -- principles and guidelines |
| ICC Uniform Rules for Demand Guarantees (URDG 758) | International rules for bank guarantees |
| Miller Act (US, 40 USC §3131-3134) | Federal performance and payment bond requirements |
| UK Housing Grants, Construction and Regeneration Act 1996 | Security of payment provisions |
| Surety & Fidelity Association of America (SFAA) Guidelines | Bond form standards |

### 13.9 KPIs and Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Insurance coverage compliance | 100% | All required policies in force at all times |
| Guarantee issuance time | <= 10 working days | From request to guarantee document received |
| Policy renewal before expiry | 100% renewed >= 30 days before expiry | No coverage gaps |
| Claims settlement time | <= 90 calendar days | From claim filing to payout |
| Insurance cost vs budget | Variance <= ±5% | Premium costs vs budgeted amount |
| Guarantee cost as % of contract | <= 2-3% of guaranteed amount annually | Bank guarantee fees |
| Subcontractor insurance compliance | 100% | All subcontractors maintaining required coverage |
| Uninsured losses | 0 | Losses falling into coverage gaps |
| Performance guarantee reduction achieved | >= 2 reductions during contract | Guarantee amount reduced as work progresses |
| Claims success rate | >= 80% | Percentage of valid claims paid by insurer |

---

# Summary Table

| # | Process | Block | Criticality | Russia-Specific |
|---|---------|-------|-------------|-----------------|
| 1 | Feasibility Study (TEO) and Business Case | 1 -- Initiation & Permits | Must | Y |
| 2 | Land Plot Selection and Due Diligence | 1 -- Initiation & Permits | Must | Y |
| 3 | GPZU (Urban Planning Land Plot Plan) | 1 -- Initiation & Permits | Must | Y (unique to Russia) |
| 4 | Project Documentation and State Expertise | 1 -- Initiation & Permits | Must | Y |
| 5 | Construction Permit | 1 -- Initiation & Permits | Must | Y |
| 6 | BIM Modeling and Coordination | 1 -- Initiation & Permits | Should | N (global, with RU standards) |
| 7 | Change Management (RFI, Submittals) | 1 -- Initiation & Permits | Must | Partially (RFI is Western; change to ПД is RU) |
| 8 | Design Phase Management | 2 -- Design & Procurement | Must | Partially (PP87 structure is RU-specific) |
| 9 | Contractor and Subcontractor Prequalification | 2 -- Design & Procurement | Must | Y (SRO, PP2571, 44-FZ) |
| 10 | Tender Documentation Preparation | 2 -- Design & Procurement | Must | Y (44-FZ formatting) |
| 11 | Bid Leveling (Comparing Proposals) | 2 -- Design & Procurement | Must | Y (44-FZ Art. 32 criteria) |
| 12 | Contract Management (Creation, Amendments, Closing) | 2 -- Design & Procurement | Must | Partially (ГК РФ + international forms) |
| 13 | Insurance and Guarantees Management | 2 -- Design & Procurement | Must | Y (44-FZ Art. 96, ГК РФ Art. 742) |

---

# Key Regulatory Reference Table

## Russian Federation

| Code / Law | Full Title | Key Articles Referenced |
|------------|-----------|----------------------|
| ГрК РФ (190-ФЗ от 29.12.2004) | Градостроительный кодекс Российской Федерации | ст. 30-32, 41-46, 48, 49, 51, 52, 54, 55.8, 55.16, 57.3 |
| ГК РФ (Часть 2, 14-ФЗ от 26.01.1996) | Гражданский кодекс Российской Федерации | ст. 702-768 (Гл. 37 Подряд), ст. 742, ст. 927-970 (Гл. 48 Страхование) |
| ЗК РФ (136-ФЗ от 25.10.2001) | Земельный кодекс Российской Федерации | ст. 7, 8 |
| ФЗ-44 от 05.04.2013 | О контрактной системе в сфере закупок | ст. 31, 32, 33, 34, 45, 50, 51-52, 95, 96 |
| ФЗ-223 от 18.07.2011 | О закупках товаров, работ, услуг отдельными видами юр. лиц | ст. 3, 4 |
| ФЗ-218 от 13.07.2015 | О государственной регистрации недвижимости (ЕГРН) | Основные положения |
| ФЗ-172 от 21.12.2004 | О переводе земель из одной категории в другую | ст. 2, 7, 8 |
| ФЗ-315 от 01.12.2007 | О саморегулируемых организациях | ст. 13 |
| ФЗ-384 от 30.12.2009 | Технический регламент о безопасности зданий и сооружений | Основные требования |
| ФЗ-174 от 23.11.1995 | Об экологической экспертизе | Основные положения |
| ФЗ-39 от 25.02.1999 | Об инвестиционной деятельности (капитальные вложения) | Основные положения |
| ФЗ-135 от 26.07.2006 | О защите конкуренции | Антимонопольные ограничения |
| ФЗ-221 от 24.07.2007 | О кадастровой деятельности | Кадастровый учет |
| ФЗ-135 от 29.07.1998 | Об оценочной деятельности | Оценка недвижимости |
| ФЗ-4015-1 от 27.11.1992 | Об организации страхового дела в РФ | Страхование |
| ФЗ-214 от 30.12.2004 | Об участии в долевом строительстве | Страхование ответственности |
| ПП РФ от 16.02.2008 No. 87 | О составе разделов проектной документации | 12 разделов ПД |
| ПП РФ от 05.03.2007 No. 145 | О порядке организации и проведения госэкспертизы | Процедура экспертизы |
| ПП РФ от 29.12.2021 No. 2571 | Требования к участникам закупок (предквалификация) | Дополнительные требования |
| ПП РФ от 31.12.2021 No. 2604 | Правила оценки заявок по 44-ФЗ | Критерии и методика |
| ПП РФ от 05.03.2021 No. 331 | Требования BIM для гос. объектов | Информационное моделирование |
| ПП РФ от 13.02.2006 No. 83 | Правила определения и предоставления ТУ | Технические условия |
| ПП РФ от 08.11.2013 No. 1005 | Требования к банковским гарантиям | Банковские гарантии |
| Приказ Минстроя No. 741/пр от 25.04.2017 | Форма ГПЗУ и порядок ее заполнения | Форма ГПЗУ |

## GOSTs and Codes of Practice (СП)

| Standard | Title |
|----------|-------|
| ГОСТ Р 21.101-2020 | СПДС. Основные требования к проектной и рабочей документации |
| ГОСТ Р 21.501-2018 | СПДС. Правила выполнения рабочей документации архитектурных и конструктивных решений |
| ГОСТ 21.110-2013 | СПДС. Спецификации оборудования, изделий и материалов |
| ГОСТ Р 57311-2016 | Информационное моделирование. Требования к эксплуатационной документации |
| ГОСТ Р 57563-2017 | Информационное моделирование. Основные положения |
| ГОСТ Р 10.0.02-2019 | BIM. Термины и определения |
| ГОСТ Р 10.0.03-2019 | BIM. Требования к классификационным системам |
| ГОСТ Р ИСО 21502-2024 | Управление проектами, программами и портфелями. Руководство |
| СП 47.13330.2016 | Инженерные изыскания для строительства |
| СП 48.13330.2019 | Организация строительства |
| СП 333.1325800.2020 | Информационное моделирование. Правила формирования информационной модели |
| СП 301.1325800.2017 | Информационное моделирование. Правила организации работ |
| МДС 81-35.2004 | Методика определения стоимости строительной продукции |

## International Standards

| Standard | Title / Description |
|----------|-------------------|
| **FIDIC Red Book (2017)** | Conditions of Contract for Construction (Employer-designed, 2nd Edition) |
| **FIDIC Yellow Book (2017)** | Conditions of Contract for Plant and Design-Build |
| **FIDIC Silver Book (2017)** | Conditions of Contract for EPC/Turnkey Projects |
| **FIDIC White Book (2017)** | Client/Consultant Model Services Agreement |
| **NEC4 ECC (2017)** | Engineering and Construction Contract (Options A-F) |
| **NEC4 PSC** | Professional Service Contract |
| **AIA A101-2017** | Owner-Contractor Agreement, Stipulated Sum |
| **AIA A201-2017** | General Conditions of the Contract for Construction |
| **AIA B101-2017** | Owner-Architect Agreement |
| **AIA G716-2004** | Request for Information form |
| **ISO 19650-1:2018** | BIM -- Concepts and principles |
| **ISO 19650-2:2018** | BIM -- Delivery phase information management |
| **ISO 19650-3:2020** | BIM -- Operational phase information management |
| **ISO 19650-5:2020** | BIM -- Security-minded approach |
| **ISO 21502:2020** | Project, programme and portfolio management -- Guidance |
| **ISO 10845-1:2020** | Construction procurement -- Processes, methods, procedures |
| **ISO 10845-2:2020** | Construction procurement -- Documentation formatting |
| **ISO 10845-3:2021** | Construction procurement -- Standard conditions of tender |
| **ISO 10845-4:2021** | Construction procurement -- Expressions of interest |
| **ISO 31000:2018** | Risk management -- Principles and guidelines |
| **ISO 9001:2015** | Quality management systems |
| **ISO 45001:2018** | Occupational health and safety management systems |
| **ISO 14001:2015** | Environmental management systems |
| **ISO 16739-1:2024** | IFC data model (BIM interoperability) |
| **AACE 18R-97** | Cost Estimate Classification System |
| **AACE 59R-10** | Development of Factored Cost Estimates |
| **RIBA Plan of Work 2020** | Stages 0-7 covering full building lifecycle |
| **RICS Red Book (2022)** | International Valuation Standards |
| **RICS NRM2 (2021)** | New Rules of Measurement for building works |
| **CSI MasterFormat (2018)** | Specification organization system |
| **ASTM E1527-21** | Phase I Environmental Site Assessment |
| **ASTM E1903-19** | Phase II Environmental Site Assessment |
| **OSHA 29 CFR 1926** | Safety and Health Regulations for Construction |
| **EU Directive 2014/24/EU** | Public procurement (MEAT criteria) |
| **EU Directive 2014/52/EU** | Environmental Impact Assessment |
| **ICC Arbitration Rules (2021)** | International arbitration |
| **ICC URDG 758** | Uniform Rules for Demand Guarantees |
| **World Bank Procurement Framework (2016)** | Standard Prequalification and Bidding Documents |
| **LOD Specification (BIMForum)** | Level of Development for BIM elements |

---

# Sources

## Russian Legislation and Standards

- [ГрК РФ Статья 57.3 -- ГПЗУ (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_51040/fb76ce1fdb5356574b298a9dcdafcfc8fc6c937b/)
- [ГрК РФ Статья 51 -- Разрешение на строительство (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_51040/570afc6feff03328459242886307d6aebe1ccb6b/)
- [ГрК РФ Статья 49 -- Экспертиза проектной документации (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_51040/4ca003dd6b793db91e6027babe790a482edd9b7e/)
- [ПП РФ No. 87 -- Состав разделов проектной документации (docs.cntd.ru)](http://docs.cntd.ru/document/902087949)
- [ПП РФ No. 145 -- Порядок проведения госэкспертизы (docs.cntd.ru)](http://docs.cntd.ru/document/902030917)
- [ПП РФ No. 2571 -- Требования к участникам закупок (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_405718/)
- [ФЗ-44 ст. 32 -- Критерии оценки заявок (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_144624/03015a946c3763c9a1cfe566ae855be7460610fa/)
- [ФЗ-44 ст. 96 -- Обеспечение исполнения контракта (Договор-Юрист.Ру)](https://dogovor-urist.ru/%D0%B7%D0%B0%D0%BA%D0%BE%D0%BD%D1%8B/44-%D1%84%D0%B7/%D1%81%D1%82_96/)
- [ФЗ-172 -- О переводе земель (docs.cntd.ru)](http://docs.cntd.ru/document/901918785)
- [ГК РФ ст. 742 -- Страхование объекта строительства (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_9027/edc304284b4c0cf19fa03a7b5de3ff017c2cb100/)
- [ГОСТ Р 21.101-2020 -- Требования к проектной и рабочей документации (docs.cntd.ru)](https://docs.cntd.ru/document/1200173797)
- [ГОСТ Р 57311-2016 -- Информационное моделирование (docs.cntd.ru)](http://docs.cntd.ru/document/1200142711)
- [СП 47.13330.2016 -- Инженерные изыскания (docs.cntd.ru)](http://docs.cntd.ru/document/456045544)
- [Земельный кодекс РФ (КонсультантПлюс)](https://www.consultant.ru/document/cons_doc_LAW_33773/)
- [Предквалификация по ПП No. 2571 (zakupki.kontur.ru)](https://zakupki.kontur.ru/site/articles/53466-uchastvovat_v_zakupkax_s_doptrebovaniyami_po_44fz)
- [Форма ГПЗУ -- Приказ Минстроя No. 741/пр (docs.cntd.ru)](http://docs.cntd.ru/document/436737371)
- [СРО в строительстве (ФЗ-315)](https://www.reestr-sro.ru/zakon/federalnii-zakon-n-315-fz/)
- [Страхование СМР (Сбербанк Страхование)](https://sberbankins.ru/products/smr/)
- [ГОСТ Р ИСО 21502-2024 (allgosts.ru)](https://allgosts.ru/03/100/gost_r_iso_21502-2024)
- [ТЭО в строительстве (ГГЭ)](https://gge.ru/press-center/massmedia/izbezhat-oshibok-tekhniko-ekonomicheskoe-obosnovanie-stanet-instrumentom-profilaktiki-narusheniy-pri/)
- [ГПЗУ -- порядок получения (rbc.ru)](https://realty.rbc.ru/news/683e21629a79476b8ba3493f)

## International Standards and References

- [FIDIC Red Book 2017 (fidic.org)](https://fidic.org/books/construction-contract-2nd-ed-2017-red-book)
- [ISO 19650-1:2018 -- BIM Concepts (iso.org)](https://www.iso.org/standard/68078.html)
- [ISO 19650-2:2018 -- BIM Delivery Phase (iso.org)](https://www.iso.org/standard/68080.html)
- [ISO 19650-3:2020 -- BIM Operational Phase (iso.org)](https://www.iso.org/standard/75109.html)
- [ISO 10845-2:2020 -- Construction Procurement Documentation (iso.org)](https://www.iso.org/standard/72234.html)
- [ISO 10845-3:2021 -- Standard Conditions of Tender (iso.org)](https://www.iso.org/standard/81170.html)
- [ISO 31000:2018 -- Risk Management (iso.org)](https://www.iso.org/standard/65694.html)
- [AACE 18R-97 -- Cost Estimate Classification (aacei.org)](https://web.aacei.org/docs/default-source/toc/toc_18r-97.pdf)
- [RIBA Plan of Work 2020 (riba.org)](https://www.riba.org/work/insights-and-resources/riba-plan-of-work/)
- [NEC4 ECC (neccontract.com)](https://www.neccontract.com/products/contracts/nec4/engineering-and-construction-contract)
- [AIA A201-2017 Summary (aiacontracts.com)](https://help.aiacontracts.com/hc/en-us/articles/1500010259162-Summary-A201-2017-General-Conditions-of-the-Contract-for-Construction)
- [OSHA 29 CFR 1926 (osha.gov)](https://www.osha.gov/laws-regs/regulations/standardnumber/1926)
- [World Bank Evaluating Bids Guidance 2025 (worldbank.org)](https://thedocs.worldbank.org/en/doc/9dcb7971706bf29b2732779c39922b77-0290012025/original/Evaluating-Bids-and-Proposals-with-Rated-Criteria-Feb-4-2025.pdf)
- [FIDIC Clauses 17-19 Insurance (fidic.org)](https://fidic.org/sites/default/files/FIDIC's%20New%20Suite%20of%20Contracts%20-%20Clauses%2017%20to%2019.pdf)
- [ICC URDG 758 -- Demand Guarantees](https://globalarbitrationreview.com/guide/the-guide-construction-arbitration/sixth-edition/article/bonds-and-guarantees)
- [BIM Standards in Russia (3dbim.pro)](https://3dbim.pro/normativnye-dokumenty-gosty-i-standarty-bim-texnologii-v-rossii/)
- [Bid Evaluation -- Procore Library](https://www.procore.com/library/bid-evaluation)
- [Construction RFI Guide (Procore)](https://www.procore.com/library/rfi-construction)
- [BSI ISO 19650 Guide (bsigroup.com)](https://www.bsigroup.com/en-US/products-and-services/standards/iso-19650-building-information-modeling-bim/)
- [ASTM E1527-21 Phase I ESA (astm.org)](https://www.astm.org/)
- [LOD Specification (BIMForum)](https://bimforum.org/)
- [SPI and CPI Metrics (projectmanagementpathways.com)](https://www.projectmanagementpathways.com/project-management-articles/spi-and-cpi-key-performance-indicators)

---

> **Document ends.** Total: 13 process cards across 2 blocks, covering 9 sections each.
