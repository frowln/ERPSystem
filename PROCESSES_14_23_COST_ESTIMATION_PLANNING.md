# Construction Processes #14-23: Cost Estimation/Pricing + Planning

> Research date: 2026-02-18
> Blocks covered: Block 3 (Cost Estimation and Pricing, #14-18) + Block 4 (Planning, #19-23)

---

## BLOCK 3: COST ESTIMATION AND PRICING

---

### Process #14: Estimating Using Government Databases (GESN, FER, TER)

#### 1. Process Description

In Russia, construction cost estimation for projects involving public funds is governed by a rigorous system of state estimate norms and unit rates. The three pillars of this system are:

- **GESN (ГЭСН -- Государственные элементные сметные нормы)**: The primary normative dataset. GESN describes each type of construction work, its composition, and normative consumption of labor, materials, machines, and mechanisms. GESN serves as the foundation from which all other rate databases are derived.
- **FER (ФЕР -- Федеральные единичные расценки)**: Federal unit rates derived from GESN, applied uniformly across Russia. Each FER entry aggregates GESN resource norms with base-year prices (historically 2001, now 2022 under FSNB-2022) to produce a single monetary rate per unit of work.
- **TER (ТЕР -- Территориальные единичные расценки)**: Territorial (regional) unit rates, also derived from GESN but calibrated to the conditions and prices of a specific Russian federal subject (region). TER accounts for local labor markets, material availability, transportation distances, and climate.

The estimating process involves selecting the appropriate normative base, identifying work items from GESN/FER/TER catalogues matching the project's scope, calculating quantities from design drawings, applying overhead and profit norms (per Order 812/pr and 774/pr), and converting base-year prices to current prices using Ministry of Construction (Minstroy) indices.

Since February 2023, Russia has been transitioning to the **resource-index method (RIM)** using the new **FSNB-2022** (Federal Estimate Normative Base 2022), which uses a base price level of January 1, 2022, and no longer includes traditional FER. Smetny (estimate) prices for resources are published in the **FGIS CS** (Federal State Information System for Construction Pricing).

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Estimator (Сметчик)** | Compiles estimate documentation; selects norms; calculates quantities and costs |
| **Design Engineer (Проектировщик)** | Produces design documentation and BOQ (bills of quantities) |
| **Chief Project Engineer (ГИП)** | Reviews and signs off on estimates as part of project documentation |
| **Customer/Developer (Заказчик)** | Commissions and approves estimate documentation; submits for state expertise |
| **State Expertise (Госэкспертиза)** | Verifies the accuracy of estimated costs for publicly funded projects per Art. 49 of the Building Code (ГрК РФ) |
| **Contractor (Подрядчик)** | Uses estimates to prepare bids, plan resources, and negotiate contract price |

#### 3. Input Data

- Design documentation (drawings, specifications, explanatory notes)
- Bills of quantities (ведомости объёмов работ)
- GESN/FER/TER norm catalogues (or FSNB-2022 for RIM)
- Current Minstroy price indices (published quarterly)
- FGIS CS resource price database
- Overhead and profit norms (per Orders 812/pr, 774/pr, 636/pr)
- Transportation cost norms; regional coefficients (climate, remoteness)
- Project organizational and technical conditions (ПОС/ППР)

#### 4. Output Data / Documents

- **Локальная смета (Local Estimate)**: Detailed cost breakdown per work section
- **Объектная смета (Object Estimate)**: Aggregation of local estimates for a single building/structure
- **Сводный сметный расчёт (ССР -- Summary Estimate Calculation)**: Total project cost across all objects, with chapters for site preparation, main construction, utilities, temporary structures, winter works, etc.
- **Ведомость ресурсов (Resource Statement)**: List of all resources with quantities (for resource method)
- **Пояснительная записка (Explanatory Note)**: Methodology description, coefficient justification

#### 5. Typical Pain Points

- **Norm obsolescence**: Base-year norms (2001) require large conversion indices, introducing accumulated error
- **Index lag**: Minstroy publishes indices quarterly, but prices change faster during periods of high inflation or supply disruption
- **Complexity of transition to RIM**: Many regions and organizations are still adapting to FSNB-2022 and FGIS CS; software needs updating
- **Missing norms**: New technologies, materials, or methods may lack published GESN norms, requiring development of individual norms (ИЕР)
- **Data entry errors**: Manual selection from thousands of GESN entries is error-prone
- **Version control**: Multiple estimate revisions during design changes lead to confusion about which version is current
- **Expertise rejection**: Estimates returned by state expertise for non-compliance with current norms, requiring costly rework

#### 6. Ideal ERP Functions

- **Norm database integration**: Built-in or API-connected GESN/FER/TER/FSNB-2022 catalogues with full-text search, filtering by work type, and automatic norm matching to BOQ items
- **Automatic index application**: Quarterly Minstroy indices loaded automatically (via API or manual upload), with automatic recalculation of all active estimates
- **Estimate version control**: Full revision history with diff comparison between estimate versions, approval workflows
- **Export to standard formats**: XML export compatible with state expertise systems, Excel/PDF for contract documentation
- **BOQ-to-estimate linking**: Direct mapping from design BOQ to estimate line items, with quantity change propagation
- **Overhead/profit calculator**: Automatic application of overhead norms (812/pr) and profit norms (774/pr) by work type
- **Multi-method support**: Toggle between base-index, resource, and resource-index methods within the same project
- **Approval workflow**: Digital signature, review/comment cycle, state expertise submission tracking
- **Variance alerts**: Flag when estimated costs deviate significantly from historical benchmarks for similar work

#### 7. Russia-Specific Regulations

| Document | Description |
|----------|-------------|
| **Градостроительный кодекс РФ, ст. 8.3, 49** | Requires accuracy verification of estimates for publicly funded projects |
| **Приказ Минстроя 421/пр (04.08.2020, ред. 23.01.2025)** | Current Methodology for determining estimate cost of construction |
| **МДС 81-35.2004** | Legacy methodology for cost determination (officially replaced but widely referenced) |
| **ФСНБ-2022 (Приказ 1046/пр, 30.12.2021)** | New Federal Estimate Normative Base; 53,309 norms recalculated to 01.01.2022 prices |
| **Приказ Минстроя 812/пр (21.12.2020)** | Methodology for overhead cost norms |
| **Приказ Минстроя 774/пр** | Methodology for estimate profit norms |
| **ФГИС ЦС** | Federal information system publishing monitored resource prices |
| **Quarterly index letters** (e.g., 5170-ИФ/09 from 01.02.2025) | Recommended indices for converting base-year to current prices |

#### 8. Global Market Standards

| Standard / System | Description |
|-------------------|-------------|
| **RSMeans (Gordian, USA)** | North America's leading construction cost database; 92,000+ unit line items updated annually; accepted as impartial industry standard |
| **NRM 1, 2, 3 (RICS, UK)** | New Rules of Measurement: NRM1 for order-of-cost estimating, NRM2 for detailed measurement of building works, NRM3 for maintenance cost planning |
| **AACE 18R-97** | Cost Estimate Classification System -- five classes (5 to 1) from screening to definitive; only level of project definition determines class |
| **Uniformat / MasterFormat (CSI, USA)** | Standard classification systems for organizing construction cost data |
| **BCIS (UK)** | Building Cost Information Service -- benchmarking database by RICS |

#### 9. KPIs and Metrics

| KPI | Formula / Description | Target |
|-----|----------------------|--------|
| **Estimate accuracy** | (Actual cost - Estimated cost) / Estimated cost * 100% | Within +/- 5-10% at detailed design stage |
| **Estimate preparation time** | Calendar days from BOQ receipt to approved estimate | Minimize; benchmark by project type |
| **State expertise pass rate** | % of estimates passing on first submission | > 85% |
| **Norm coverage** | % of BOQ items matched to standard norms vs. individual rates | > 95% |
| **Index freshness** | Days since last Minstroy index update applied | < 15 days after publication |
| **Revision frequency** | Number of estimate revisions per project | Track trend; fewer is better |

---

### Process #15: Resource-Based Cost Estimation

#### 1. Process Description

Resource-based cost estimation (ресурсный метод) calculates construction costs by determining the physical quantities of every resource needed -- labor (person-hours by trade), materials (units), machines and mechanisms (machine-hours), energy -- and pricing each at current market rates. Unlike the base-index method (which applies aggregate indices to base-year unit rates), the resource method provides maximum transparency and accuracy because every cost component is visible and priced in real terms.

Starting from Q3 2023, all new construction projects in Russia funded from public sources must use the **resource-index method (RIM)**, which combines resource quantities from GESN with both monitored prices from FGIS CS and indices for resource groups. This represents a fundamental shift away from the legacy base-index approach.

The process flow is: (1) extract resource requirements from GESN norms for each work item, (2) determine material/labor/equipment quantities based on project volumes, (3) price each resource using current monitored prices (FGIS CS) or market data, (4) add overhead, profit, and other costs per approved methodologies, (5) produce the estimate.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Estimator** | Performs detailed resource extraction and pricing calculations |
| **Procurement Manager** | Provides current material and equipment prices (market quotes) |
| **Site Manager / Superintendent** | Validates labor and equipment productivity assumptions |
| **Design Engineer** | Provides technical specifications and material requirements |
| **Customer** | Approves methodology and price sources |

#### 3. Input Data

- GESN norms (resource consumption rates per unit of work)
- Project design documentation and BOQ
- Current resource prices from FGIS CS
- Supplier quotations / market price surveys
- Labor cost data (regional wage rates by trade)
- Equipment rental/ownership rates
- Transportation distance and cost data
- Regional climate and working condition adjustments

#### 4. Output Data / Documents

- **Ресурсная ведомость (Resource Statement)**: Complete list of all resources with quantities
- **Локальный ресурсный сметный расчёт**: Detailed cost calculation by resource
- **Калькуляция стоимости материалов**: Material cost calculation with delivery
- **Калькуляция стоимости машино-часа**: Equipment hourly cost calculation
- Full estimate documentation in resource or resource-index format

#### 5. Typical Pain Points

- **Extreme labor intensity**: A single building estimate may contain thousands of resource lines, each requiring current pricing
- **Price volatility**: Material prices fluctuate faster than databases update, especially for steel, concrete, lumber
- **Incomplete FGIS CS data**: Not all resources have monitored prices published; estimators must use alternative sources
- **Software transition burden**: Many estimators are trained in base-index workflows; resource method requires new skills and tools
- **Reconciliation difficulty**: Difficult to compare resource estimates against historical base-index estimates for the same work
- **Double pricing risk**: Same resource may appear in multiple work items, requiring careful aggregation to avoid double-counting or inconsistent pricing

#### 6. Ideal ERP Functions

- **Resource extraction engine**: Automatic extraction of resource lists from GESN norms based on selected work items and quantities
- **Price feed integration**: Live connection to FGIS CS for monitored prices; ability to import supplier quotes and market surveys
- **Resource aggregation**: Cross-estimate resource consolidation showing total project demand for each material, labor type, and equipment type
- **What-if pricing**: Simulate cost impact of price changes on specific resources across the entire project
- **Material substitution tracking**: When design changes substitute one material for another, propagate through all affected estimates
- **Labor rate library**: Maintain regional labor rate tables with historical trends
- **Export to procurement**: Generate purchase orders or RFQs directly from aggregated resource lists

#### 7. Russia-Specific

- **ФСНБ-2022**: New base containing only GESN (no FER), specifically designed for resource and resource-index methods
- **ФГИС ЦС (fgiscs.minstroyrf.ru)**: Official source of monitored construction resource prices
- **Приказ Минстроя 421/пр**: Defines the approved methodology including resource method procedures
- **71 regions** completed transition to RIM by end of 2023; all subjects by February 2024
- **Индексы по группам однородных строительных ресурсов**: Under RIM, indices are applied per resource group rather than per work type

#### 8. Global Market Standards

| Standard | Description |
|----------|-------------|
| **RSMeans Detailed Estimates** | Unit-price database allowing resource-level cost buildup (labor, material, equipment per unit of work) |
| **NRM 2 (RICS)** | Detailed rules for measuring quantities of building work, enabling resource-based costing |
| **AACE RP 34R-05** | Recommended Practice for Basis of Estimate -- requires documenting pricing sources and assumptions |
| **RICS Black Book** | Defines methodology for quantity surveying and resource-based cost planning |
| **BIM-based quantity takeoff** | IFC/COBie integration enabling automated resource extraction from 3D models |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Price source coverage** | % of resources priced from official/verified sources (FGIS CS, verified quotes) | > 90% |
| **Resource aggregation accuracy** | Variance between aggregated resource demand and actual procurement | < 8% |
| **Estimate granularity** | Average number of resource lines per 1M RUB of estimate value | Track for benchmarking |
| **Price freshness** | Average age of price data used in active estimates | < 30 days |
| **Resource reuse rate** | % of resources in a new estimate found in the system's price library | > 70% (indicates mature library) |

---

### Process #16: Price Indices and Conversion Coefficients

#### 1. Process Description

Price indices and conversion coefficients are the mathematical bridge between base-year estimated costs and current-year actual costs. In Russia, Minstroy publishes quarterly letters with recommended indices that convert estimates prepared in base-year prices (2001 or 2022) to current price levels. These indices are differentiated by:

- **Region** (each Russian subject has its own indices)
- **Work type** (construction-installation, commissioning, design, survey)
- **Resource group** (under RIM: 14 groups of homogeneous construction resources)

Beyond Minstroy indices, there exist various conversion coefficients for:
- Winter construction conditions (зимнее удорожание)
- Remote/difficult terrain
- Overtime or shift work
- Small-volume work
- Temporary structures and facilities
- Technology-specific adjustments

The process involves: (1) identifying which index applies to each cost element, (2) applying the correct index based on region and quarter, (3) recalculating totals, (4) documenting the source and justification for each index used.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Estimator** | Selects and applies correct indices; documents justification |
| **Chief Estimator / Cost Department Head** | Verifies index selection methodology |
| **State Expertise** | Checks that correct indices were used during cost verification |
| **Minstroy / Regional Authorities** | Publish official indices |
| **Customer / Developer** | Approves index selection for contract pricing |

#### 3. Input Data

- Estimate in base-year prices (2001 or 2022 level)
- Minstroy quarterly index letters (e.g., Letter 5170-ИФ/09 for Q1 2025)
- Resource group indices from FGIS CS (for RIM)
- Regional construction price monitoring data
- Contract terms specifying price adjustment methodology
- Inflation forecasts (for forward-looking estimates)

#### 4. Output Data / Documents

- **Estimated cost in current prices**: Recalculated estimate with applied indices
- **Ведомость индексов (Index Statement)**: Table documenting which index was applied to which cost element
- **Contract price adjustment calculations**: For ongoing contracts with escalation clauses
- **Comparative analysis**: Base-year vs. current-year cost breakdown

#### 5. Typical Pain Points

- **Publication delay**: Minstroy indices for a given quarter are published weeks or months into that quarter, forcing estimators to use prior-quarter data or provisional indices
- **Aggregate vs. granular indices**: Traditional indices are aggregated by work type, which may not accurately reflect price changes for specific materials (e.g., steel prices may surge 40% while the aggregate construction index shows only 8%)
- **Regional inconsistency**: Some regions have better price monitoring than others, leading to indices that may not reflect true local conditions
- **Contract disputes**: Disagreements between customer and contractor over which index applies, especially for work spanning multiple quarters
- **Index stacking errors**: Applying multiple coefficients in the wrong order or double-applying adjustments
- **Forecast uncertainty**: For multi-year projects, estimating future indices introduces significant risk

#### 6. Ideal ERP Functions

- **Auto-index loading**: API or scheduled import of Minstroy quarterly indices upon publication
- **Index applicability engine**: Given project region and estimate structure, automatically determine which index applies to each line item
- **Time-phased recalculation**: For multi-year projects, apply different quarterly indices to work planned for different periods
- **What-if index modeling**: Simulate project cost under different index scenarios (optimistic, baseline, pessimistic)
- **Index audit trail**: Complete log of when indices were applied, by whom, and which version
- **Alert on new publications**: Notify estimators when new Minstroy letters are available
- **Contract escalation calculator**: Automatic contract price adjustment based on agreed escalation formula and published indices
- **Historical index database**: Archive of all published indices for dispute resolution and trend analysis

#### 7. Russia-Specific

| Regulation | Description |
|------------|-------------|
| **Quarterly Minstroy letters** | E.g., Letter 5170-ИФ/09 (01.02.2025) for Q1 2025; Letter 23229-ИФ/09 (21.04.2025) for Q2 2025 |
| **Indices to 2001 base** | Traditional СМР indices (to base-index method) |
| **Indices by resource groups to 2022 base** | New indices for RIM, published per FGIS CS |
| **Regional differentiation** | Each of 85+ Russian subjects has separate index sets |
| **Приказ Минстроя 421/пр, sections on indices** | Defines the methodology for index application in estimates |
| **ФГИС ЦС** | Publishes both monitored prices and resource group indices |

#### 8. Global Market Standards

| Standard | Description |
|----------|-------------|
| **ENR Construction Cost Index (USA)** | Engineering News-Record publishes monthly indices tracking labor and material costs |
| **BCIS Tender Price Index (UK)** | RICS-maintained index reflecting tender price movements |
| **BLS Producer Price Index (USA)** | Bureau of Labor Statistics indices for construction materials |
| **Turner Building Cost Index (USA)** | Quarterly index for commercial/institutional building costs |
| **Eurostat Construction Cost Index (EU)** | Harmonized index across EU member states |
| **AACE RP 58R-10** | Escalation Estimating Using Indices and Monte Carlo Simulation |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Index application accuracy** | % of cost elements with correctly applied, current indices | 100% |
| **Index lag** | Days between Minstroy publication and index loading into ERP | < 5 business days |
| **Estimate recalculation cycle** | Time to recalculate all active estimates after new indices | < 1 business day |
| **Index-related expertise rejections** | % of state expertise returns caused by incorrect indices | 0% |
| **Price prediction accuracy** | Deviation of applied index from actual price movement (measured retrospectively) | < 5% |

---

### Process #17: Estimated vs. Actual Cost Comparison (Plan-Fact Analysis)

#### 1. Process Description

Plan-fact cost analysis (план-факт анализ) is the continuous process of comparing planned/estimated costs against actual expenditures throughout the construction project lifecycle. This process is fundamental to project cost control and incorporates elements of Earned Value Management (EVM).

The core comparison involves three values:
- **Planned Value (PV / BCWS)**: Budgeted cost of work scheduled
- **Earned Value (EV / BCWP)**: Budgeted cost of work performed (what the completed work was worth per the budget)
- **Actual Cost (AC / ACWP)**: What was actually spent on the completed work

From these, key performance indicators are derived:
- **Cost Variance (CV)** = EV - AC (negative means over budget)
- **Schedule Variance (SV)** = EV - PV (negative means behind schedule)
- **Cost Performance Index (CPI)** = EV / AC (below 1.0 means over budget)
- **Schedule Performance Index (SPI)** = EV / PV (below 1.0 means behind schedule)

The analysis is performed at multiple levels: individual cost codes, work packages, objects, and total project. It feeds into forecasting (Estimate at Completion, Estimate to Complete) and management decision-making.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Project Manager** | Reviews plan-fact reports, makes corrective decisions |
| **Cost Engineer / Cost Controller** | Compiles data, calculates variances, produces reports |
| **Estimator** | Provides baseline cost data; assists in re-estimation |
| **Accountant / Finance Department** | Provides actual cost data from accounting systems |
| **Site Manager** | Reports physical progress (% complete by work item) |
| **Customer / Developer** | Receives plan-fact reports; approves corrective measures |

#### 3. Input Data

- Approved budget/estimate baseline (сводный сметный расчёт, cost plan)
- Actual costs from accounting system (by cost code / work item)
- Physical progress reports (% complete, quantities installed)
- Schedule status (planned vs. actual dates)
- Change order register (approved changes affecting budget)
- Procurement data (committed costs, purchase orders)

#### 4. Output Data / Documents

- **Plan-Fact Variance Report**: Table showing planned vs. actual by cost category
- **EVM Performance Report**: CPI, SPI, CV, SV, EAC, ETC calculations
- **S-curve charts**: Planned vs. actual vs. earned value plotted over time
- **Forecast reports**: Estimate at Completion (EAC), Estimate to Complete (ETC)
- **Management action plan**: Corrective measures for cost overruns
- **Акт выполненных работ (КС-2, КС-3)**: Russian standard forms documenting executed work and its cost

#### 5. Typical Pain Points

- **Data lag**: Actual cost data from accounting arrives weeks after work is performed, delaying analysis
- **Progress measurement subjectivity**: % complete estimates are often subjective, especially for partially completed work
- **Misaligned cost structures**: Estimate cost breakdown structure (CBS) does not match accounting chart of accounts, requiring manual mapping
- **Change order integration**: Budget baseline not updated promptly after approved changes, causing false variances
- **Overhead allocation**: Indirect costs are difficult to allocate accurately to specific work items
- **Multiple systems**: Estimate in one tool, accounting in another, schedule in a third -- no single source of truth
- **Currency/inflation effects**: On multi-year projects, planned costs in base-year prices are compared against actuals in current prices without proper normalization

#### 6. Ideal ERP Functions

- **Unified cost structure**: Single CBS used across estimating, budgeting, accounting, and scheduling
- **Automated actual cost capture**: Integration with accounting system (1C, SAP) for automatic actual cost import by cost code
- **Progress tracking module**: Field-level progress input (quantities, % complete) linked to cost codes
- **EVM calculator**: Automatic calculation of PV, EV, AC, CPI, SPI, CV, SV, EAC, ETC with drill-down
- **S-curve dashboard**: Visual comparison of planned, earned, and actual cost curves with forecast projection
- **Variance threshold alerts**: Automatic notifications when CPI or SPI drops below configurable threshold (e.g., < 0.95)
- **Change order integration**: When a change order is approved, budget baseline is automatically adjusted
- **Drill-down analysis**: Click from project-level variance into object, then work package, then line item to identify root cause
- **Reporting templates**: Standard reports for management, customer, and project team with configurable periods
- **Forecast models**: Multiple EAC calculation methods (CPI-based, SPI-based, management estimate)

#### 7. Russia-Specific

- **КС-2 (Акт о приёмке выполненных работ)** and **КС-3 (Справка о стоимости выполненных работ)**: Standard Russian forms used to document executed work and its cost, forming the basis for actual cost tracking
- **Integration with 1С:Бухгалтерия**: Most Russian construction companies use 1C for accounting; plan-fact analysis requires seamless data exchange
- **Сметная vs. фактическая себестоимость**: Russian construction economics distinguishes between estimate cost (сметная стоимость), planned cost (плановая себестоимость), and actual cost (фактическая себестоимость)
- **Градостроительный кодекс**: Requires cost control for publicly funded projects

#### 8. Global Market Standards

| Standard | Description |
|----------|-------------|
| **ANSI/EIA-748 (EVMS)** | 32 guidelines for Earned Value Management Systems; required on US government construction projects |
| **PMI PMBOK, Chapter 7 (Cost Management)** | Defines cost estimating, budgeting, and control processes including EVM |
| **AACE RP 10S-90** | Cost Engineering Terminology including EVM metrics |
| **ISO 21508:2018** | Earned Value Management in project and programme management |
| **RICS Cost Reporting Guidance** | Standards for cost report format and content |
| **Procore / Oracle Aconex / Kahua** | Industry tools providing integrated cost tracking with EVM capabilities |

#### 9. KPIs and Metrics

| KPI | Formula / Description | Target |
|-----|----------------------|--------|
| **Cost Performance Index (CPI)** | EV / AC | >= 1.0 (on or under budget) |
| **Schedule Performance Index (SPI)** | EV / PV | >= 1.0 (on or ahead of schedule) |
| **Cost Variance (CV)** | EV - AC | >= 0 |
| **To-Complete Performance Index (TCPI)** | (BAC - EV) / (BAC - AC) | < 1.1 (achievable recovery) |
| **Variance at Completion (VAC)** | BAC - EAC | >= 0 |
| **Reporting cycle time** | Days from period close to plan-fact report delivery | < 5 business days |
| **% of cost codes with actual data** | Cost codes with both planned and actual data / total codes | > 95% |

---

### Process #18: Change Order Cost Management

#### 1. Process Description

Change order cost management is the process of identifying, evaluating, pricing, approving, and tracking modifications to the original contract scope, schedule, and price in a construction project. Changes arise from design modifications, unforeseen site conditions, regulatory changes, customer requests, errors/omissions in original documents, or value engineering proposals.

The process typically follows these stages:
1. **Change identification**: A potential change event is identified (by any party)
2. **Change request (COR)**: Formal documentation of the proposed change
3. **Impact assessment**: Evaluation of cost, schedule, and quality impacts
4. **Cost estimation**: Detailed pricing of the change using contract-specified rates or negotiated prices
5. **Approval**: Multi-party review and authorization
6. **Contract amendment**: Formal change order execution modifying contract sum and/or time
7. **Implementation tracking**: Monitoring execution and actual cost of changed work
8. **Closeout reconciliation**: Final accounting of all change orders at project completion

The Construction Industry Institute research shows that when more than 6% of planned hours are spent on changes, productivity degrades significantly. Change orders on typical construction projects account for 5-15% of original contract value.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Project Manager** | Coordinates change process; reviews impact assessments |
| **Cost Engineer / Estimator** | Prices the change order; assesses cost impact |
| **Scheduler** | Evaluates schedule impact; performs time impact analysis (TIA) |
| **Design Engineer / Architect** | Issues revised drawings; documents design intent changes |
| **Customer / Owner** | Approves or rejects change orders; authorizes additional funding |
| **Contractor / Subcontractor** | Submits change requests; provides pricing proposals |
| **Contract Administrator** | Manages change order documentation and contract amendments |
| **Legal Counsel** | Reviews contractual implications of significant changes |

#### 3. Input Data

- Original contract documents (scope, price, schedule, terms)
- Change request / change directive document
- Revised design drawings and specifications
- Contract unit rates and markup schedules
- Current schedule (baseline and updated)
- Site condition reports, RFIs, inspection reports
- Historical change order data (for trend analysis)

#### 4. Output Data / Documents

- **Change Order Request (COR)**: Formal proposal including scope description, cost estimate, schedule impact
- **Time Impact Analysis (TIA)**: CPM-based assessment of schedule effect
- **Cost breakdown**: Itemized pricing (labor, material, equipment, overhead, profit, bonds/insurance)
- **Approved Change Order**: Executed contractual modification
- **Change Order Log / Register**: Running summary of all changes with status tracking
- **Budget adjustment**: Updated cost baseline reflecting approved changes
- **Дополнительное соглашение к договору**: Russian contractual supplement documenting the change

#### 5. Typical Pain Points

- **Slow processing**: Average change order takes 30-60 days to process, causing work to proceed "at risk" or to stop entirely
- **Scope creep**: Small, undocumented changes accumulate into significant cost and schedule impacts
- **Markup disputes**: Disagreements over allowable overhead, profit, and indirect cost markups on changed work
- **Cumulative impact**: Multiple concurrent changes degrade overall productivity (loss of efficiency claims), but proving causation is difficult
- **Incomplete documentation**: Changes implemented in the field without proper paperwork, discovered only during cost reconciliation
- **Schedule impact denial**: Owners reluctant to grant time extensions, even when changes clearly affect the critical path
- **Budget fragmentation**: Tracking which changes are approved, pending, or rejected across multiple contracts/subcontracts

#### 6. Ideal ERP Functions

- **Change order workflow engine**: Configurable multi-step approval workflow with role-based routing, escalation rules, and SLA tracking
- **Integrated estimating**: Price change orders using the same normative base and rates as the original estimate
- **Schedule impact module**: Link change orders to CPM schedule activities; automatic TIA calculation
- **Budget impact visualization**: Real-time dashboard showing original budget, approved changes, pending changes, and forecast
- **Change log with full audit trail**: Every status change, comment, attachment, and approval timestamped
- **Subcontractor change pass-through**: When a prime contract change affects subcontractors, automatically generate downstream change requests
- **Trend analysis**: Historical charts of change order volume, value, and causes by project and across portfolio
- **Document linking**: Attach RFIs, revised drawings, photos, and correspondence to each change order
- **Financial integration**: Approved change orders automatically update contract value in accounting system
- **Mobile field capture**: Allow site personnel to initiate change requests from mobile devices with photos and markup

#### 7. Russia-Specific

- **Гражданский кодекс РФ, ст. 709, 743, 744**: Governs price changes and additional work in construction contracts
- **Дополнительное соглашение**: All contract changes require a formal supplementary agreement signed by both parties
- **Актуализация сметной документации**: Changed work must be re-estimated using current norms and indices, then re-approved
- **Федеральный закон 44-ФЗ**: For government contracts, limits on contract price increases (typically 10% ceiling without new procurement)
- **КС-2/КС-3 adjustments**: Changed work volumes reflected in acceptance acts
- **Postановление Правительства 1315**: Rules for price changes in government construction contracts

#### 8. Global Market Standards

| Standard | Description |
|----------|-------------|
| **AACE RP 10S-90** | Defines Change Order Request (COR) and Change Directive terminology |
| **AIA G701 (USA)** | Standard form for Change Order documentation |
| **FIDIC Conditions of Contract** | International standard contract forms with detailed variation (change) procedures |
| **NEC4 Engineering and Construction Contract** | Compensation event mechanism for managing changes |
| **JCT (UK)** | Variation provisions in standard UK construction contracts |
| **ASCE SCL (Society of Construction Law) Delay Protocol** | Guidance on evaluating time impact of changes |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Change order processing time** | Days from COR submission to approval/rejection | < 14 days for standard; < 30 days for complex |
| **Change order cost as % of original contract** | Total approved CO value / original contract sum | < 5-10% (varies by project type) |
| **Change orders by cause** | Distribution across: owner request, design error, unforeseen conditions, regulatory, VE | Track and reduce design-error share |
| **Pending change order value** | Total value of submitted but unapproved COs | Minimize; resolve within 30 days |
| **Overhead/markup consistency** | Actual markup applied vs. contract-specified markup | 100% compliance |
| **Change order hours as % of total** | Hours on CO work / total project hours | < 6% (CII research threshold) |

---

## BLOCK 4: PLANNING

---

### Process #19: Critical Path Method (CPM) Scheduling and Gantt Charts

#### 1. Process Description

The Critical Path Method (CPM) is the foundational scheduling algorithm for construction project management, developed in the late 1950s. CPM calculates the longest sequence of dependent activities (the "critical path") that determines the minimum project duration. Any delay to a critical path activity directly delays the entire project.

The process involves:
1. **Activity definition**: Breaking the project into discrete work activities (typically 500-10,000 for a major construction project)
2. **Logic development**: Defining predecessor/successor relationships (Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish) with optional lags
3. **Duration estimation**: Assigning durations based on productivity rates, crew sizes, and quantities
4. **Forward pass**: Calculating earliest start and finish dates for all activities
5. **Backward pass**: Calculating latest start and finish dates
6. **Float calculation**: Total float = Late Finish - Early Finish; activities with zero total float are on the critical path
7. **Baseline setting**: Locking the approved schedule as the baseline for progress measurement
8. **Schedule updates**: Periodic (typically monthly) updates reflecting actual progress, remaining durations, and logic changes
9. **Delay analysis**: When delays occur, analyzing impact on critical path and contract milestones

Gantt charts provide the visual representation of the CPM schedule, showing activities as horizontal bars against a time axis, with logic relationships depicted as connecting lines.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Project Scheduler / Planner** | Creates and maintains the CPM schedule; performs analysis |
| **Project Manager** | Reviews schedule; makes decisions on priorities and acceleration |
| **Site Superintendent** | Provides field input on progress, remaining durations, and logic |
| **Subcontractor Schedulers** | Provide detailed schedules for their scope; report progress |
| **Customer / Owner** | Reviews and approves baseline schedule; monitors progress |
| **Contract Administrator** | Uses schedule for delay claims and time extension analysis |

#### 3. Input Data

- Work Breakdown Structure (WBS)
- Design documentation and construction sequence plan (ПОС, ППР in Russia)
- Productivity rates and crew compositions
- Resource availability calendars
- Contract milestones and completion dates
- Procurement lead times
- Weather/seasonal constraints
- Permitting and inspection durations
- Subcontractor schedule input

#### 4. Output Data / Documents

- **Baseline CPM schedule** (Primavera P6 .xer, MS Project .mpp, or equivalent)
- **Gantt chart** with critical path highlighted
- **Network logic diagram**
- **Schedule narrative**: Describing methodology, assumptions, and critical path
- **Monthly schedule updates** with progress overlay
- **Delay analysis reports**: As-planned vs. as-built, time impact analysis
- **Look-ahead schedules** (derived from master schedule)
- **Milestone tracking reports**
- **Float analysis reports**

#### 5. Typical Pain Points

- **Schedule quality**: Many CPM schedules have logic errors (open ends, out-of-sequence progress, excessive constraints, unrealistic durations)
- **Critical path instability**: The critical path shifts frequently between updates, making it difficult to focus management attention
- **Resource loading omission**: Many schedules define only time logic without resource loading, making resource conflicts invisible
- **"Scheduler's schedule"**: Schedules maintained only by the scheduler without meaningful input from field teams
- **Update discipline**: Late or inconsistent updates make the schedule unreliable as a management tool
- **Software complexity**: Primavera P6 has a steep learning curve; many stakeholders cannot interpret schedule output
- **Claim-driven scheduling**: On adversarial projects, schedules are maintained primarily for claims purposes rather than as active management tools
- **Near-critical path neglect**: Focus on the critical path ignores near-critical activities that may become critical after minor delays

#### 6. Ideal ERP Functions

- **Schedule creation and editing**: Built-in CPM engine with Gantt chart editor, logic linking, and constraint management
- **Resource loading**: Assign labor, equipment, and materials to activities; automatic resource leveling
- **Progress tracking**: % complete input at activity level with automatic critical path recalculation
- **Baseline comparison**: Visual overlay of baseline vs. current schedule
- **What-if analysis**: Sandbox mode to model schedule acceleration, re-sequencing, or delay scenarios
- **Multi-project scheduling**: Master schedule aggregating multiple projects with shared resource pools
- **Auto-generated look-aheads**: Filter master schedule to produce 3-week rolling look-ahead reports
- **Schedule quality metrics**: Automatic checks for open ends, missing logic, excessive float, date constraints
- **Integration with cost**: Link schedule activities to cost codes for EVM analysis (BCWS, BCWP)
- **Web/mobile access**: Field personnel can view schedule and report progress without desktop software
- **Import/export**: Full compatibility with Primavera P6 (.xer), MS Project (.mpp), and standard exchange formats

#### 7. Russia-Specific

| Document | Description |
|----------|-------------|
| **СП 48.13330.2019** | "Organization of Construction" -- defines requirements for calendar plans (календарный план работ) and network schedules (сетевой график) |
| **ПОС (Проект организации строительства)** | Project organization plan, includes master schedule |
| **ППР (Проект производства работ)** | Work execution plan, includes detailed construction sequence |
| **Постановление Правительства РФ 145** | Requirements for monitoring government construction project progress with schedules |
| **BIM requirements (Приказ Минстроя 926/пр)** | Information modeling may include 4D scheduling |

#### 8. Global Market Standards

| Standard / Tool | Description |
|-----------------|-------------|
| **Oracle Primavera P6** | Industry-standard CPM scheduling tool; required on most large government and private projects worldwide |
| **PMI PMBOK, Chapter 6 (Schedule Management)** | Defines schedule management processes, CPM, and related techniques |
| **AACE RP 29R-03** | Forensic Schedule Analysis -- methods for delay analysis (TIA, as-planned vs. as-built, windows analysis) |
| **AACE RP 37R-06** | Schedule Levels of Detail (LOD) -- classification system analogous to estimate classes |
| **DCMA 14-Point Schedule Assessment** | Defense Contract Management Agency metrics for schedule quality (critical path test, logic density, relationship types, etc.) |
| **ISO 21500** | Guidance on project management including schedule management |
| **Microsoft Project** | Widely used scheduling tool, especially on smaller projects |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Critical path length index (CPLI)** | Critical path duration / total project duration | Close to 1.0; monitor trend |
| **Total float distribution** | Histogram of float values across all activities | Healthy distribution; avoid all-zero or all-high |
| **Logic density** | Relationships / Activities | 1.5 - 2.5 (per DCMA guidance) |
| **% activities with open ends** | Activities missing predecessor or successor | 0% (except project start/finish) |
| **Schedule update frequency** | Days between updates | Monthly or per contract requirement |
| **BEI (Baseline Execution Index)** | Activities completed on time / total activities due | > 0.90 |
| **SPI (Schedule Performance Index)** | EV / PV | >= 1.0 |

---

### Process #20: Resource Planning (People, Equipment, Materials)

#### 1. Process Description

Resource planning in construction determines what people (by trade and skill), equipment (by type and capacity), and materials (by specification and quantity) are needed, when they are needed, and where they will come from. It transforms the CPM schedule into an executable resource plan by loading resources onto activities and resolving conflicts.

The process has three interconnected components:

**Labor planning**: Determining crew sizes, trade mix, mobilization/demobilization timing, labor sourcing (own workforce vs. subcontractors), skill requirements, and certifications. Construction is labor-intensive: labor typically accounts for 40-50% of project cost.

**Equipment planning**: Identifying major equipment needs (cranes, excavators, concrete pumps, scaffolding), sizing based on production requirements, planning procurement (purchase, lease, or rent), scheduling mobilization, and maintaining utilization rates. Equipment is the second-largest cost component on heavy civil and industrial projects.

**Material planning**: Quantifying all materials from design documents, identifying long-lead items, sequencing procurement with construction schedule, coordinating delivery logistics, and managing on-site storage. Materials typically account for 35-55% of project cost.

Resource leveling adjusts the schedule to resolve over-allocations (when resource demand exceeds availability) by shifting non-critical activities within their available float.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Project Planner / Scheduler** | Loads resources onto schedule; performs leveling analysis |
| **Construction Manager** | Approves crew compositions and equipment selection |
| **HR / Labor Relations** | Manages workforce recruitment, training, and certification |
| **Procurement Manager** | Sources and purchases materials and equipment |
| **Equipment Manager** | Manages fleet allocation, maintenance schedules, and utilization |
| **Subcontractor Coordinators** | Manage subcontractor resource commitments |
| **Warehouse / Logistics Manager** | Coordinates material delivery, storage, and distribution |

#### 3. Input Data

- CPM schedule with activity durations and logic
- Design documents with material specifications and quantities
- Productivity rates by trade and work type
- Resource availability (own workforce, equipment fleet, subcontractor capacity)
- Procurement lead times for materials and equipment
- Site constraints (space, access, laydown areas)
- Weather and seasonal restrictions
- Budget constraints

#### 4. Output Data / Documents

- **Resource-loaded schedule**: CPM schedule with labor, equipment, and materials assigned to each activity
- **Resource histograms**: Bar charts showing resource demand over time by trade/type
- **Manpower loading chart (S-curve)**: Cumulative workforce plan
- **Equipment utilization schedule**: Timeline showing each major piece of equipment
- **Material procurement schedule**: Ordering and delivery dates aligned with construction needs
- **Resource leveling report**: Changes made to resolve over-allocations
- **Mobilization/demobilization plan**: Timing of workforce and equipment deployment

#### 5. Typical Pain Points

- **Inaccurate productivity assumptions**: Field productivity varies significantly from planning assumptions due to weather, site conditions, crew learning curves
- **Resource conflicts across projects**: In multi-project organizations, resources are shared but planned independently
- **Late material deliveries**: Supply chain disruptions (especially post-2020) cause schedule delays
- **Subcontractor resource opacity**: Limited visibility into subcontractor workforce and equipment, making coordination difficult
- **Over-reliance on overtime**: When behind schedule, the default response is overtime, which degrades productivity and increases safety risk
- **Skill gaps**: Available workers may lack required certifications or experience for specialized work
- **Equipment downtime**: Unplanned maintenance disrupts resource plans
- **Storage constraints**: Limited laydown areas require just-in-time delivery, which is fragile

#### 6. Ideal ERP Functions

- **Resource database**: Centralized registry of all people (skills, certifications, availability), equipment (type, capacity, location, maintenance status), and material inventory
- **Resource-loaded scheduling**: Assign resources to schedule activities with automatic demand calculation
- **Resource leveling engine**: Automatic and manual leveling with constraint prioritization
- **Multi-project resource pool**: View and resolve resource conflicts across all active projects
- **Procurement integration**: Generate material RFQs and purchase orders from resource-loaded schedule; track delivery status
- **Resource histograms and dashboards**: Visual demand vs. capacity charts by trade, equipment type, and material
- **Equipment tracking**: GPS/IoT integration for real-time equipment location, utilization, and maintenance alerts
- **Workforce management**: Skill matrix, certification expiry alerts, time tracking, and crew composition optimization
- **What-if scenarios**: Model impact of adding/removing crews, changing shift patterns, or equipment substitution
- **Material requirement planning (MRP)**: Net requirements calculation considering inventory, on-order, and demand across projects

#### 7. Russia-Specific

- **СП 48.13330.2019**: Requires a resource plan as part of the construction organization project (ПОС)
- **Трудовой кодекс РФ**: Labor code governing working hours, overtime limits, and shift patterns
- **ЕНиР (Единые нормы и расценки)**: Unified norms for labor productivity used in resource planning
- **Допуск СРО**: Certain work types require SRO admission, which affects which organizations can provide resources
- **ГЭСН resource norms**: Provide normative machine-hours and person-hours per unit of work
- **Seasonal restrictions**: Many Russian regions have extreme winter conditions affecting resource planning (winter break, heated enclosures, reduced productivity)

#### 8. Global Market Standards

| Standard / Tool | Description |
|-----------------|-------------|
| **PMI PMBOK, Chapter 9 (Resource Management)** | Defines resource planning, estimation, acquisition, and control processes |
| **Primavera P6 Resource Management** | Industry-standard tool for resource loading and leveling in construction |
| **AACE RP 22R-01** | Resource Planning and Management |
| **Lean Construction Institute** | Emphasizes pull-based resource planning (only release resources when downstream is ready) |
| **Construction Industry Institute (CII)** | Research on labor productivity, resource management best practices |
| **BIM 4D/5D** | Resource planning integrated with 3D models and schedule |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Labor productivity** | Earned hours / actual hours (by trade) | >= 1.0 (meeting or exceeding plan) |
| **Equipment utilization rate** | Operating hours / available hours | > 70-80% |
| **Material waste rate** | Wasted material value / total material value | < 3-5% (varies by material) |
| **Resource leveling effectiveness** | Peak demand / average demand ratio | Close to 1.0 (flatter is better) |
| **On-time material delivery** | % deliveries arriving on or before planned date | > 95% |
| **Workforce turnover** | Workers leaving / average headcount per period | < 10% per month |
| **Overtime ratio** | Overtime hours / total hours | < 10-15% |

---

### Process #21: Look-Ahead Planning (3-Week Lookahead)

#### 1. Process Description

Look-ahead planning is the bridge between the master CPM schedule and daily field execution. The **3-week lookahead** is the most widely used short-interval planning horizon because it provides enough lead time for stakeholders to prepare (order materials, mobilize crews, coordinate access) while remaining close enough to the present to maintain accuracy.

The process operates on a **rolling weekly cycle**:
1. **Week 1 review**: Evaluate completion of last week's planned activities; measure Percent Plan Complete (PPC)
2. **Constraint analysis**: For activities planned in weeks 2-3, identify and assign ownership of all constraints (materials, equipment, labor, prerequisite work, permits, information)
3. **Constraint removal**: Action items to remove constraints before activities are due to start
4. **Task breakdown**: Decompose master schedule activities into field-level tasks (typically 1-5 day durations)
5. **Commitment**: Foremen and crew leaders make commitments for specific tasks in the upcoming week
6. **Look-ahead update**: Roll the 3-week window forward; add new week 3 from master schedule; remove completed week 1
7. **Coordination meeting**: Weekly meeting (typically Monday morning, 45-60 minutes) with all trades on site

This process is a core element of the **Last Planner System** (see Process #22) and has been shown to significantly improve schedule reliability. The key insight is that planning should be done by the people who will execute the work ("last planners" -- foremen, superintendents, crew leads), not imposed from above.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Superintendent** | Leads look-ahead meetings; coordinates across trades |
| **Foremen / Crew Leaders** | Make weekly commitments; break down tasks; identify constraints |
| **Project Scheduler** | Maintains alignment between look-ahead and master schedule |
| **Project Manager** | Resolves escalated constraints (permits, funding, design decisions) |
| **Subcontractor Foremen** | Participate in coordination meetings; commit to weekly tasks |
| **Procurement / Logistics** | Confirm material availability for upcoming tasks |

#### 3. Input Data

- Master CPM schedule (filtered to relevant time window)
- Previous week's look-ahead with actual completion data
- Constraint log (open items requiring resolution)
- Material delivery schedule and inventory status
- Equipment availability and maintenance schedule
- Workforce availability (absences, new arrivals)
- Weather forecast
- Inspection and permit schedules
- RFI / submittal status for upcoming work areas

#### 4. Output Data / Documents

- **3-Week Look-Ahead Schedule**: Spreadsheet or software printout showing tasks by area/trade for weeks 1-3
- **Constraint log**: List of constraints with owner, due date, and status
- **Weekly work plan**: Committed tasks for the upcoming week (the "will" list)
- **Percent Plan Complete (PPC) report**: Ratio of completed commitments to total commitments
- **Reasons for non-completion**: Categorized reasons when commitments are missed
- **Meeting minutes**: Record of decisions and action items from coordination meeting

#### 5. Typical Pain Points

- **Meeting fatigue**: Poorly run look-ahead meetings become long, unfocused complaint sessions
- **No constraint management**: Listing tasks without actively tracking and removing constraints; tasks are planned but prerequisites are not ready
- **Disconnect from master schedule**: Look-ahead diverges from master schedule, creating two parallel plans
- **Low commitment culture**: Foremen treat the look-ahead as a wish list rather than firm commitments
- **No PPC tracking**: Without measuring plan reliability, teams cannot identify systemic problems
- **Paper-based process**: Many teams use paper or spreadsheets, making version control and analysis difficult
- **Subcontractor resistance**: Subcontractor foremen view the meeting as an imposition rather than a tool
- **No root cause analysis**: Missed commitments are noted but root causes are not analyzed, so the same issues recur

#### 6. Ideal ERP Functions

- **Look-ahead generation**: Auto-filter master schedule to 3-week window; allow manual task additions
- **Constraint tracker**: Linked to each look-ahead task; assign owner, due date, status (open/cleared)
- **Weekly commitment board**: Foremen enter commitments for their teams; track completion in real-time
- **PPC dashboard**: Automatic PPC calculation with trend chart; drill-down to missed commitments by trade/reason
- **Root cause categorization**: Structured reason-for-non-completion categories (material, labor, equipment, prerequisite, weather, information, etc.)
- **Mobile-friendly**: Foremen update task status from phones/tablets in the field
- **Integration with master schedule**: Changes in look-ahead propagate back to master schedule progress; master schedule changes flow forward to look-ahead
- **Coordination meeting support**: Meeting agenda auto-generated from look-ahead; action items tracked
- **Material readiness check**: Automatic flag if materials for a look-ahead task are not in inventory or on confirmed delivery
- **Historical PPC analytics**: PPC trends by trade, project phase, constraint type -- enabling organizational learning

#### 7. Russia-Specific

- **Недельно-суточные графики**: Traditional Russian construction practice uses weekly-daily schedules (недельно-суточное планирование), which serves a similar function to the 3-week look-ahead
- **СП 48.13330.2019**: Requires operational planning as part of construction organization
- **Оперативные совещания**: Standard Russian practice of operational meetings (планёрки) typically held daily or weekly on site
- **Прораб (site foreman)**: The прораб is the traditional "last planner" in Russian construction -- the person closest to the work who makes daily execution decisions
- **Мастер-график vs. Оперативный график**: Distinction between master schedule and operational schedule is well-established in Russian construction practice

#### 8. Global Market Standards

| Standard / Tool | Description |
|-----------------|-------------|
| **Last Planner System (LCI)** | The look-ahead is one of five conversations in LPS; see Process #22 |
| **Outbuild** | Software specifically designed for look-ahead planning and Last Planner |
| **Touchplan** | Collaborative planning software with digital sticky-note interface for pull planning |
| **PMI Practice Standard for Scheduling** | References rolling wave planning concept |
| **Procore** | Includes look-ahead functionality integrated with project management |
| **Smartsheet templates** | Widely used templates for 3-week look-aheads |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Percent Plan Complete (PPC)** | Commitments completed / total commitments | > 80% (correlated with on-time, on-budget projects) |
| **Constraint clearance rate** | Constraints cleared on time / total constraints identified | > 90% |
| **Tasks Made Ready (TMR)** | % of tasks in week 3 that have all constraints cleared by time they reach week 1 | > 85% |
| **PPC trend** | Week-over-week PPC trend | Improving or stable above 80% |
| **Reasons for non-completion distribution** | Pareto chart of missed-commitment causes | Top cause should be decreasing over time |
| **Meeting attendance** | % of required participants present | > 95% |

---

### Process #22: Lean Construction / Last Planner System

#### 1. Process Description

Lean Construction is the application of lean production principles (originally from Toyota Production System) to the construction industry. The **Last Planner System (LPS)**, developed by Glenn Ballard and Greg Howell (founders of the Lean Construction Institute) in the 1990s, is the most widely adopted lean construction methodology.

Traditional project management assumes: "CAN" = "WILL" = "DID" -- what can be done is what will be planned, and what is planned will be done. In reality, only **54% of weekly planned work** is completed on time in traditional projects. LPS addresses this gap.

LPS consists of **five interconnected planning conversations**:

1. **Master Scheduling / Milestone Planning**: Sets up the work in phases; defines when major deliverables should be complete. Focus: SHOULD.
2. **Phase (Pull) Planning**: Working backward from milestones, the team collaboratively defines the hand-offs between trades, creating a phase schedule. Uses "sticky-note" sessions where last planners physically arrange work sequences. Focus: SHOULD.
3. **Make-Ready / Look-Ahead Planning (6-week window)**: Identifies all tasks that should start within the next 6 weeks and systematically removes constraints to make them executable. Focus: CAN.
4. **Weekly Work Planning**: Foremen and crew leaders commit to specific tasks for the coming week, selecting only from "made-ready" activities. Focus: WILL.
5. **Learning / Continuous Improvement**: After each week, measure PPC, analyze reasons for missed commitments, and improve the planning process itself. Focus: DID.

Research shows LPS implementation improves schedule reliability, reduces project duration by 10-30%, improves safety, and tightens cost control.

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Last Planners (Foremen, Crew Leaders)** | The primary planners in LPS -- the people closest to the work |
| **Facilitator / LPS Coach** | Guides pull planning sessions; maintains LPS discipline |
| **Superintendent** | Coordinates across trades; leads weekly planning meetings |
| **Project Manager** | Removes systemic constraints; supports cultural shift |
| **Subcontractor Supervisors** | Participate in pull planning; make and keep weekly commitments |
| **Design Team** | Participates in design phase LPS (LPS for Design) |

#### 3. Input Data

- Project milestones and contract completion dates
- Design documents and construction sequence
- Master CPM schedule (as reference, not command)
- Resource availability and constraints
- Trade-specific knowledge of work sequences, durations, and hand-offs
- Historical PPC data and lessons learned from previous projects

#### 4. Output Data / Documents

- **Phase pull plan**: Collaborative schedule for each project phase (often documented as photos of sticky-note boards or in collaborative planning software)
- **Make-ready plan / Constraint log**: Tracking sheet for constraint identification and removal
- **Weekly work plan**: Committed tasks for the coming week
- **PPC report and trend chart**: Weekly measurement of plan reliability
- **Reasons for variance log**: Categorized root causes of missed commitments
- **Learning reports**: Documented improvements and process changes based on PPC analysis
- **Visual management boards**: Physical or digital Kanban-style boards showing work status

#### 5. Typical Pain Points

- **Cultural resistance**: LPS requires a shift from command-and-control to collaborative planning; many managers struggle with this
- **"Checking the box" implementation**: Going through LPS motions without genuine commitment -- holding meetings but not tracking PPC or analyzing root causes
- **Subcontractor skepticism**: Subcontractors may view LPS as another imposition from the general contractor
- **Inconsistent facilitation**: LPS quality depends heavily on the facilitator's skill and energy
- **Scaling difficulty**: Effective on individual projects but difficult to standardize across a large organization
- **Software gaps**: Most project management software was designed for CPM, not for LPS collaborative planning
- **Training cost**: All participants need LPS training; high turnover means continuous training investment
- **Measurement neglect**: Teams that stop tracking PPC lose the learning loop and revert to old habits

#### 6. Ideal ERP Functions

- **Digital pull planning**: Collaborative drag-and-drop interface for phase planning sessions (replacing physical sticky notes)
- **Constraint tracking system**: Systematic identification, assignment, and clearance of constraints per LPS methodology
- **Weekly work plan module**: Commitment entry by foremen; status tracking; PPC calculation
- **PPC analytics dashboard**: Real-time PPC by trade, phase, week; trend lines; benchmark comparison
- **Root cause analysis**: Structured variance coding with Pareto analysis and trend tracking
- **Reliable promise tracking**: Distinguish between "can do" (made-ready) and "will do" (committed) tasks
- **Integration with master schedule**: Two-way sync -- pull plan dates inform master schedule; master schedule milestones anchor pull plans
- **Mobile commitment interface**: Foremen make and update commitments from tablets in the field
- **Learning library**: Documented lessons learned, searchable by project type, trade, and issue category
- **Visual management boards**: Digital Kanban boards for work status by area/zone

#### 7. Russia-Specific

- **Emerging adoption**: Lean construction and LPS are gaining awareness in Russia but adoption is still early-stage, concentrated among progressive developers and international JVs
- **Cultural considerations**: Russian construction culture is traditionally hierarchical (директорский подход); LPS's collaborative approach requires significant cultural adaptation
- **Планёрка as precursor**: The traditional Russian planning meeting (планёрка) shares some elements with LPS but typically lacks the structured constraint management and PPC measurement
- **LEAN строительство in Russian**: Literature is available in Russian from organizations like the Russian Lean Construction Association
- **СП 48.13330.2019 compatibility**: LPS can be implemented within the framework of Russian construction organization standards

#### 8. Global Market Standards

| Standard / Organization | Description |
|------------------------|-------------|
| **Lean Construction Institute (LCI)** | Founded by Ballard and Howell; maintains LPS intellectual property and certification |
| **Last Planner System trademark** | LPS is a registered trademark of LCI |
| **Integrated Project Delivery (IPD)** | Contract model that naturally supports LPS implementation through shared risk/reward |
| **ISO 21500** | Project management guidance compatible with lean principles |
| **Lean Construction Journal** | Peer-reviewed research on LPS implementation and outcomes |
| **Target Value Delivery (TVD)** | Lean approach to cost management that pairs with LPS for schedule |
| **Outbuild, Touchplan, VisiLean, LCMD** | Software tools designed specifically for LPS/lean construction |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Percent Plan Complete (PPC)** | Core LPS metric: commitments met / total commitments | > 80% (projects consistently above 80% are on budget and on time) |
| **Tasks Made Ready (TMR)** | % of tasks successfully made ready before their planned week | > 85% |
| **Variance categories** | Distribution of missed commitment causes | No single cause > 25% of total |
| **PPC trend** | Direction of PPC over time | Improving; stabilizing above 80% |
| **Planning reliability index** | Aggregate measure of planning system health | Composite of PPC, TMR, constraint clearance |
| **Project predictability** | Actual completion vs. planned completion for milestones | Within 5% of planned dates |
| **Rework rate** | Rework hours / total hours | < 3% (lean target) |

---

### Process #23: Project Risk Management

#### 1. Process Description

Construction project risk management is the systematic process of identifying, analyzing, evaluating, treating, monitoring, and communicating risks that could affect project objectives (cost, schedule, quality, safety, scope). Construction is inherently high-risk due to its complexity, long duration, outdoor conditions, regulatory environment, and multi-party structure.

The process follows the **ISO 31000:2018** framework adapted for construction:

1. **Establish context**: Define project risk management approach, appetite, criteria, and governance structure
2. **Risk identification**: Systematic discovery of risks using checklists, brainstorming, expert interviews, historical data, and SWOT analysis. Common categories include:
   - Technical/design risks
   - Construction/execution risks
   - Financial/economic risks (inflation, currency, funding)
   - Environmental/weather risks
   - Regulatory/permitting risks
   - Supply chain risks
   - Labor/workforce risks
   - Safety risks
   - Geotechnical/subsurface risks
   - Stakeholder/political risks
3. **Qualitative analysis**: Risk assessment using probability-impact matrix (typically 5x5), producing a risk score and priority ranking
4. **Quantitative analysis**: Monte Carlo simulation for schedule and cost risk; sensitivity analysis (tornado diagrams); decision tree analysis
5. **Risk response planning**: For each significant risk, define response strategy:
   - **Avoid**: Eliminate the threat by changing the plan
   - **Mitigate**: Reduce probability or impact
   - **Transfer**: Shift to another party (insurance, contract terms)
   - **Accept**: Acknowledge and budget contingency
   - **Exploit/Enhance**: For opportunities (positive risks)
6. **Risk monitoring and control**: Ongoing tracking of identified risks, watching for new risks, evaluating response effectiveness
7. **Contingency management**: Allocating and managing cost/schedule contingency reserves based on quantified risk exposure

#### 2. Participants

| Role | Responsibility |
|------|---------------|
| **Risk Manager** | Facilitates risk management process; maintains risk register |
| **Project Manager** | Owns the overall risk management process; makes final decisions |
| **Project Team** | Identifies risks within their domains; implements responses |
| **Cost Engineer** | Quantifies cost impacts; manages cost contingency |
| **Scheduler** | Quantifies schedule impacts; manages schedule contingency |
| **Customer / Owner** | Defines risk appetite; approves contingency allocation; manages owner-side risks |
| **Insurance Broker** | Advises on insurable risks and coverage options |
| **Legal Counsel** | Reviews risk allocation in contracts |
| **External Risk Consultants** | Perform Monte Carlo simulation, independent risk assessments |

#### 3. Input Data

- Project scope, contract type, and delivery method
- Design maturity level and completeness assessment
- Geotechnical and environmental site investigation reports
- Historical risk data from similar projects
- Market conditions (material prices, labor availability, inflation forecasts)
- Regulatory and permitting requirements
- Stakeholder analysis
- Schedule and cost baseline
- AACE estimate class (determines expected accuracy range and contingency needs)

#### 4. Output Data / Documents

- **Risk Register**: Comprehensive log of all identified risks with probability, impact, score, owner, response, and status
- **Probability-Impact Matrix**: Visual heat map of risk distribution
- **Risk response plan**: Documented strategies for top risks
- **Monte Carlo simulation outputs**: Probability distributions for project cost and completion date (P50, P80, P90 values)
- **Tornado diagram**: Sensitivity analysis showing which risks have the greatest impact on outcomes
- **Contingency calculation**: Cost and schedule contingency amounts with underlying risk justification
- **Risk reporting**: Periodic risk reports to management and stakeholders (top 10 risks, changes, emerging threats)
- **Lessons learned**: Post-project risk analysis documenting which risks materialized and effectiveness of responses

#### 5. Typical Pain Points

- **Risk identification fatigue**: Teams produce long, generic risk lists that are never maintained or acted upon
- **Subjective assessments**: Probability and impact scoring is inconsistent between assessors and over time
- **Register stagnation**: Risk register created at project start and never updated; new risks emerge undocumented
- **Contingency misuse**: Contingency reserves are consumed by scope creep or poor management rather than actual risk events
- **Quantitative analysis gap**: Many teams perform only qualitative analysis; Monte Carlo simulation requires specialized expertise and software
- **Behavioral bias**: Optimism bias (underestimating risks) and anchoring (adjusting insufficiently from base estimates) are pervasive
- **Contractual risk dumping**: Clients transfer excessive risk to contractors through contract terms, leading to inflated bids or claims
- **Siloed risk management**: Safety risks managed separately from cost/schedule risks, despite their interconnection
- **Insurance vs. management**: Over-reliance on insurance rather than active risk mitigation

#### 6. Ideal ERP Functions

- **Risk register module**: Structured risk entry with categories, probability/impact scoring (5x5 matrix), automatic risk score calculation, and color-coded heat map
- **Risk ownership assignment**: Each risk assigned to a specific person with accountability tracking
- **Response plan tracking**: Link mitigation actions to tasks in the schedule; track implementation status
- **Monte Carlo integration**: Built-in or API-connected probabilistic simulation for cost and schedule
- **Contingency management**: Drawdown tracking of contingency reserves against specific risk events
- **Risk dashboard**: Top risks, risk trend (new/closed/escalated), contingency status, and heat map
- **Risk triggers and alerts**: Automatic notifications when risk indicators (e.g., cost variance, schedule delay, weather) exceed thresholds
- **Historical risk database**: Library of risks from completed projects, searchable by project type, region, and category
- **Risk-cost-schedule integration**: Link risks to specific cost codes and schedule activities for impact quantification
- **Reporting templates**: Standard risk reports for management, board, and client with configurable content
- **Contract risk allocation matrix**: Map risks to responsible parties per contract terms

#### 7. Russia-Specific

| Item | Description |
|------|-------------|
| **ГОСТ Р ИСО 31000-2019** | Russian adaptation of ISO 31000:2018 -- Risk management guidelines |
| **СП 48.13330.2019** | Requires consideration of risks in construction organization |
| **Федеральный закон 384-ФЗ "Технический регламент о безопасности зданий и сооружений"** | Defines safety-related risks in construction |
| **Ростехнадзор** | Federal authority overseeing industrial and construction safety risks |
| **Government project risk management** | Постановление Правительства РФ 1431 requires risk management for large government-funded projects |
| **Insurance requirements** | СРО membership requires insurance; specific insurance types for different construction risks |
| **Geotechnical risks**: Russia's vast territory includes permafrost zones, seismic areas, karst formations, and extreme climate conditions requiring specialized risk assessment |

#### 8. Global Market Standards

| Standard | Description |
|----------|-------------|
| **ISO 31000:2018** | International standard for risk management principles and guidelines |
| **PMI PMBOK, Chapter 11 (Risk Management)** | Six processes: plan, identify, qualitative analysis, quantitative analysis, plan responses, monitor |
| **ISO 21500** | Guidance on project management including risk |
| **AACE RP 40R-08** | Contingency Estimating -- General Principles |
| **AACE RP 41R-08** | Risk Analysis and Contingency Determination Using Range Estimating |
| **AACE RP 44R-08** | Risk Analysis and Contingency Determination Using Expected Value |
| **@RISK (Palisade/Lumivero)** | Leading Monte Carlo simulation software for project risk analysis |
| **Oracle Crystal Ball** | Monte Carlo simulation tool used in construction risk quantification |
| **Pertmaster / Primavera Risk Analysis** | Integrated schedule risk analysis tool |
| **RAMP (RICS)** | Risk Analysis and Management for Projects |

#### 9. KPIs and Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| **Risk register completeness** | Number of identified risks vs. benchmark for project type/size | Meet or exceed benchmark |
| **Risk response implementation** | % of planned mitigation actions completed on time | > 90% |
| **Contingency drawdown rate** | Contingency consumed / project % complete | Proportional; not front-loaded |
| **Risk register currency** | Days since last risk register update | < 30 days |
| **Residual risk exposure** | Sum of (probability x impact) for all open risks | Decreasing over project life |
| **P80 confidence** | Probability that project will complete within approved budget/schedule | >= 80% at all times |
| **Risk materialization rate** | % of identified risks that actually occurred | Track for calibration of future assessments |
| **Near-miss reporting** | Number of reported near-miss risk events | Increasing (indicates healthy reporting culture) |

---

## CROSS-REFERENCE MATRIX: Processes vs. ERP Modules

| Process | Estimation | Scheduling | Cost Control | Procurement | HR/Labor | Equipment | Document Mgmt | BI/Analytics |
|---------|-----------|------------|-------------|-------------|---------|-----------|--------------|-------------|
| #14 GESN/FER/TER | **Primary** | - | - | - | - | - | Output | Reports |
| #15 Resource Estimation | **Primary** | Link | - | Input | Input | Input | Output | Reports |
| #16 Price Indices | **Primary** | - | Link | - | - | - | Output | Trends |
| #17 Plan-Fact Analysis | Input | Input | **Primary** | Actuals | Actuals | Actuals | Output | **Primary** |
| #18 Change Orders | Input | **Link** | **Primary** | Impact | Impact | - | **Primary** | Reports |
| #19 CPM Scheduling | Link | **Primary** | Link | Lead times | Resources | Resources | Output | Reports |
| #20 Resource Planning | Input | **Primary** | Link | **Link** | **Primary** | **Primary** | Output | Dashboards |
| #21 Look-Ahead | - | **Primary** | - | Readiness | Availability | Availability | Output | PPC |
| #22 Lean / LPS | - | **Primary** | Link | Constraints | Team | Team | Commitments | PPC/Learning |
| #23 Risk Management | Input | Input | **Link** | Supply risks | Labor risks | Equipment risks | **Primary** | **Primary** |

---

## Sources

### Russian Regulations and Standards
- [Минстрой России -- Ценообразование](https://minstroyrf.gov.ru/trades/tsenoobrazovanie/)
- [Индексы изменения сметной стоимости -- Минстрой](https://minstroyrf.gov.ru/trades/tsenoobrazovanie/indeksy-izmeneniya-smetnoy-stoimosti/)
- [МДС 81-35.2004 -- docs.cntd.ru](http://docs.cntd.ru/document/1200035529)
- [МДС 81-35.2004 -- КонсультантПлюс](https://www.consultant.ru/document/cons_doc_LAW_48827/)
- [Приказ Минстроя 421/пр -- КонсультантПлюс](https://www.consultant.ru/document/cons_doc_LAW_362957/)
- [ФСНБ-2022 -- Минстрой России](https://www.minstroyrf.gov.ru/trades/tsenoobrazovanie/federalnaya-smetnaya-normativnaya-baza-fsnb-2022-utverzhdennaya-prikazom-minstroya-rossii-ot-30-dekabrya-2021-g-1046-pr/)
- [ФГИС ЦС](https://fgiscs.minstroyrf.ru/frsn/fsnb)
- [Приказ Минстроя 812/пр -- ГАРАНТ](https://base.garant.ru/400499913/)
- [СП 48.13330.2019 Организация строительства](http://docs.cntd.ru/document/564542209)
- [ФЕР, ТЕР, ГЭСН: отличия и применение](https://www.a-sstroy.ru/article/754-fer-ter-gesn)
- [Переход на ресурсно-индексный метод -- ГГЭ](https://gge.ru/press-center/news/s-25-fevralya-2023-goda-nachinaetsya-poetapnyy-perekhod-subektov-rossiyskoy-federatsii-na-resursno-i/)
- [Ресурсный метод составления смет](https://smetchik.com/info/articles/metodologiya-smetnogo-dela/resursnyy-metod-sostavleniya-smet/)
- [План-факт анализ в строительстве -- Gectaro](https://gectaro.com/blog/tpost/hxidomyyv1-plan-fakt-v-stroitelstve-kak-ne-teryat-m)

### Global Standards and Best Practices
- [RICS NRM: New Rules of Measurement](https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/construction-standards/nrm)
- [RSMeans Online -- Gordian](https://www.gordian.com/products/rsmeans-data-services/)
- [AACE Cost Estimate Classification System 18R-97](https://web.aacei.org/docs/default-source/toc/toc_18r-97.pdf)
- [AACE International](https://web.aacei.org/)
- [CPM Scheduling in Primavera P6](https://www.planacademy.com/cpm-scheduling-101-primavera-scheduling-works/)
- [Critical Path Analysis in Primavera P6](https://consultleopard.com/understanding-critical-path-analysis-using-primavera-p6/)
- [Look-Ahead Schedules Guide](https://crewcost.com/blog/construction-contractors-guide-to-look-ahead-schedules/)
- [Last Planner System -- Lean Construction Institute](https://leanconstruction.org/lean-topics/last-planner-system/)
- [What is the Last Planner System -- Lean Construction Blog](https://leanconstructionblog.com/What-is-the-Last-Planner-System.html)
- [Percent Plan Complete -- The Lean Builder](https://theleanbuilder.com/lean-construction-practices-percent-plan-complete/)
- [PPC in Last Planner -- Elevate Constructionist](https://elevateconstructionist.com/last-planner-in-construction-track-the-right-metrics-ppc-learning-loop/)
- [Change Order Management -- Long International](https://www.long-intl.com/articles/change-order-management/)
- [Construction Change Orders Explained -- OnIndus](https://onindus.com/construction-change-orders/)
- [ISO 31000:2018 Risk Management](https://www.iso.org/standard/65694.html)
- [Risk Management: ISO 31000 vs PMBOK](https://ieomsociety.org/proceedings/2022istanbul/285.pdf)
- [Construction Risk Matrix -- MASTT](https://www.mastt.com/blogs/what-is-a-risk-matrix)
- [ANSI/EIA-748 Earned Value Management -- AcqNotes](https://acqnotes.com/acqnote/tasks/ansi-eia-748-earned-value-management)
- [Earned Value Analysis -- WBDG](https://www.wbdg.org/resources/earned-value-analysis)
- [Resource Leveling Guide -- MASTT](https://www.mastt.com/blogs/resource-leveling)
- [Resource Management in Construction -- OutBuild](https://www.outbuild.com/blog/construction-resource-management)
- [Delay Analysis in Construction -- ProjectManager](https://www.projectmanager.com/blog/construction-delay-analysis)
