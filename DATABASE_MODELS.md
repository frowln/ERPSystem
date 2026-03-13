# PRIVOD Platform — Complete Database Model Map

**Total Entities**: 591
**Total Modules**: 91
**Generated**: 2026-03-12

---

## Table of Contents

- [accounting](#accounting) (17 entities)
- [admin](#admin) (3 entities)
- [ai](#ai) (12 entities)
- [analytics](#analytics) (17 entities)
- [apiManagement](#apimanagement) (8 entities)
- [approval](#approval) (2 entities)
- [auth](#auth) (11 entities)
- [bidManagement](#bidmanagement) (3 entities)
- [bidScoring](#bidscoring) (3 entities)
- [bim](#bim) (18 entities)
- [calendar](#calendar) (6 entities)
- [cde](#cde) (7 entities)
- [changeManagement](#changemanagement) (4 entities)
- [chatter](#chatter) (6 entities)
- [closeout](#closeout) (11 entities)
- [closing](#closing) (4 entities)
- [commercialProposal](#commercialproposal) (2 entities)
- [common](#common) (1 entities)
- [compliance](#compliance) (4 entities)
- [constructability](#constructability) (2 entities)
- [contract](#contract) (4 entities)
- [contractExt](#contractext) (9 entities)
- [costManagement](#costmanagement) (10 entities)
- [crm](#crm) (4 entities)
- [dailylog](#dailylog) (3 entities)
- [dataExchange](#dataexchange) (3 entities)
- [design](#design) (3 entities)
- [document](#document) (4 entities)
- [email](#email) (4 entities)
- [esg](#esg) (3 entities)
- [estimate](#estimate) (12 entities)
- [feedback](#feedback) (1 entities)
- [finance](#finance) (11 entities)
- [fleet](#fleet) (8 entities)
- [gpsTimesheet](#gpstimesheet) (4 entities)
- [hr](#hr) (12 entities)
- [hrRussian](#hrrussian) (16 entities)
- [immutableAudit](#immutableaudit) (2 entities)
- [infrastructure/audit](#infrastructure-audit) (1 entities)
- [infrastructure/persistence](#infrastructure-persistence) (1 entities)
- [insurance](#insurance) (1 entities)
- [integration](#integration) (26 entities)
- [iot](#iot) (9 entities)
- [isup](#isup) (4 entities)
- [journal](#journal) (2 entities)
- [kep](#kep) (5 entities)
- [leave](#leave) (3 entities)
- [legal](#legal) (4 entities)
- [m29](#m29) (2 entities)
- [maintenance](#maintenance) (5 entities)
- [messaging](#messaging) (16 entities)
- [mobile](#mobile) (7 entities)
- [monitoring](#monitoring) (4 entities)
- [monteCarlo](#montecarlo) (4 entities)
- [monthlySchedule](#monthlyschedule) (2 entities)
- [notification](#notification) (5 entities)
- [ops](#ops) (8 entities)
- [organization](#organization) (4 entities)
- [payroll](#payroll) (2 entities)
- [permission](#permission) (6 entities)
- [planfact](#planfact) (1 entities)
- [planning](#planning) (12 entities)
- [pmWorkflow](#pmworkflow) (6 entities)
- [portal](#portal) (11 entities)
- [portfolio](#portfolio) (4 entities)
- [prequalification](#prequalification) (2 entities)
- [priceCoefficient](#pricecoefficient) (1 entities)
- [procurement](#procurement) (4 entities)
- [procurementExt](#procurementext) (8 entities)
- [project](#project) (5 entities)
- [pto](#pto) (18 entities)
- [punchlist](#punchlist) (3 entities)
- [quality](#quality) (15 entities)
- [recruitment](#recruitment) (4 entities)
- [regulatory](#regulatory) (9 entities)
- [report](#report) (3 entities)
- [revenueRecognition](#revenuerecognition) (4 entities)
- [russianDoc](#russiandoc) (17 entities)
- [safety](#safety) (19 entities)
- [scheduler](#scheduler) (2 entities)
- [search](#search) (2 entities)
- [selfEmployed](#selfemployed) (3 entities)
- [settings](#settings) (7 entities)
- [siteAssessment](#siteassessment) (1 entities)
- [specification](#specification) (7 entities)
- [subscription](#subscription) (3 entities)
- [support](#support) (6 entities)
- [task](#task) (16 entities)
- [taxRisk](#taxrisk) (3 entities)
- [warehouse](#warehouse) (12 entities)
- [workflowEngine](#workflowengine) (8 entities)

---

## Common Base: BaseEntity

Most entities extend `BaseEntity` which provides:

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at | |
| createdBy | String | created_by | |
| updatedBy | String | updated_by | |
| version | Long | version | |
| deleted | boolean | deleted | NOT NULL, default false |

---

## Module: accounting

### AccountEntry (extends BaseEntity)
**File**: `modules/accounting/domain/AccountEntry.java`
**Table**: `account_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| journalId | UUID | journal_id | NOT NULL |
| debitAccountId | UUID | debit_account_id | NOT NULL |
| creditAccountId | UUID | credit_account_id | NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| entryDate | LocalDate | entry_date | NOT NULL |
| description | String | description |  |
| documentType | String | document_type |  |
| documentId | UUID | document_id |  |
| periodId | UUID | period_id | NOT NULL |

---

### AccountPeriod (extends BaseEntity)
**File**: `modules/accounting/domain/AccountPeriod.java`
**Table**: `account_periods`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| year | Integer | year | NOT NULL |
| month | Integer | month | NOT NULL |
| status | PeriodStatus | status | ENUM, NOT NULL |
| closedById | UUID | closed_by_id |  |
| closedAt | Instant | closed_at |  |

---

### AccountPlan (extends BaseEntity)
**File**: `modules/accounting/domain/AccountPlan.java`
**Table**: `account_plans`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| accountType | AccountType | account_type | ENUM, NOT NULL |
| parentId | UUID | parent_id |  |
| analytical | boolean | is_analytical | NOT NULL |
| description | String | description |  |

---

### CostAllocation (extends BaseEntity)
**File**: `modules/accounting/domain/CostAllocation.java`
**Table**: `cost_allocations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| costCenterId | UUID | cost_center_id | NOT NULL |
| periodId | UUID | period_id | NOT NULL |
| accountId | UUID | account_id | NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| allocationType | AllocationType | allocation_type | ENUM, NOT NULL |

---

### CostCenter (extends BaseEntity)
**File**: `modules/accounting/domain/CostCenter.java`
**Table**: `cost_centers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| projectId | UUID | project_id |  |
| parentId | UUID | parent_id |  |
| active | boolean | is_active | NOT NULL |

---

### Counterparty (extends BaseEntity)
**File**: `modules/accounting/domain/Counterparty.java`
**Table**: `counterparties`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| inn | String | inn | NOT NULL |
| kpp | String | kpp |  |
| ogrn | String | ogrn |  |
| legalAddress | String | legal_address |  |
| actualAddress | String | actual_address |  |
| bankAccount | String | bank_account |  |
| bik | String | bik |  |
| correspondentAccount | String | correspondent_account |  |
| shortName | String | short_name |  |
| bankName | String | bank_name |  |
| contactPerson | String | contact_person |  |
| phone | String | phone |  |
| email | String | email |  |
| website | String | website |  |
| supplier | boolean | is_supplier | NOT NULL |
| customer | boolean | is_customer | NOT NULL |
| contractor | boolean | is_contractor | NOT NULL |
| subcontractor | boolean | is_subcontractor | NOT NULL |
| designer | boolean | is_designer | NOT NULL |
| active | boolean | is_active | NOT NULL |
| notes | String | notes |  |

---

### DepreciationSchedule (extends BaseEntity)
**File**: `modules/accounting/domain/DepreciationSchedule.java`
**Table**: `depreciation_schedules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| assetId | UUID | asset_id | NOT NULL |
| periodId | UUID | period_id | NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| accumulatedAmount | BigDecimal | accumulated_amount | NOT NULL |

---

### EnsAccount (extends BaseEntity)
**File**: `modules/accounting/domain/EnsAccount.java`
**Table**: `ens_accounts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| inn | String | inn | NOT NULL, UNIQUE |
| accountNumber | String | account_number |  |
| balance | BigDecimal | balance | NOT NULL |
| lastUpdated | Instant | last_updated |  |
| isActive | boolean | is_active | NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |

---

### EnsOperation (extends BaseEntity)
**File**: `modules/accounting/domain/EnsOperation.java`
**Table**: `ens_operations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ensAccountId | UUID | ens_account_id | NOT NULL |
| operationDate | LocalDate | operation_date | NOT NULL |
| operationType | EnsOperationType | operation_type | ENUM, NOT NULL |
| taxType | String | tax_type |  |
| amount | BigDecimal | amount | NOT NULL |
| description | String | description |  |
| documentNumber | String | document_number |  |
| documentDate | LocalDate | document_date |  |
| status | EnsOperationStatus | status | ENUM, NOT NULL |

---

### EnsPayment (extends BaseEntity)
**File**: `modules/accounting/domain/EnsPayment.java`
**Table**: `ens_payments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ensAccountId | UUID | ens_account_id | NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| paymentDate | LocalDate | payment_date | NOT NULL |
| taxType | EnsTaxType | tax_type | ENUM, NOT NULL |
| status | EnsPaymentStatus | status | ENUM, NOT NULL |
| receiptUrl | String | receipt_url |  |

---

### EnsReconciliation (extends BaseEntity)
**File**: `modules/accounting/domain/EnsReconciliation.java`
**Table**: `ens_reconciliations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ensAccountId | UUID | ens_account_id | NOT NULL |
| periodId | UUID | period_id | NOT NULL |
| periodStart | LocalDate | period_start |  |
| periodEnd | LocalDate | period_end |  |
| openingBalance | BigDecimal | opening_balance |  |
| expectedAmount | BigDecimal | expected_amount | NOT NULL |
| actualAmount | BigDecimal | actual_amount | NOT NULL |
| totalDebits | BigDecimal | total_debits |  |
| totalCredits | BigDecimal | total_credits |  |
| closingBalance | BigDecimal | closing_balance |  |
| difference | BigDecimal | difference | NOT NULL |
| discrepancyAmount | BigDecimal | discrepancy_amount |  |
| status | EnsReconciliationStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |
| reconciledById | UUID | reconciled_by_id |  |
| reconciledAt | Instant | reconciled_at |  |

---

### FinancialJournal (extends BaseEntity)
**File**: `modules/accounting/domain/FinancialJournal.java`
**Table**: `financial_journals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| journalType | JournalType | journal_type | ENUM, NOT NULL |
| active | boolean | is_active | NOT NULL |

---

### FixedAsset (extends BaseEntity)
**File**: `modules/accounting/domain/FixedAsset.java`
**Table**: `fixed_assets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| inventoryNumber | String | inventory_number | NOT NULL |
| accountId | UUID | account_id |  |
| purchaseDate | LocalDate | purchase_date | NOT NULL |
| purchaseAmount | BigDecimal | purchase_amount | NOT NULL |
| usefulLifeMonths | Integer | useful_life_months | NOT NULL |
| depreciationMethod | DepreciationMethod | depreciation_method | ENUM, NOT NULL |
| currentValue | BigDecimal | current_value | NOT NULL |
| status | FixedAssetStatus | status | ENUM, NOT NULL |

---

### JournalEntry (extends BaseEntity)
**File**: `modules/accounting/domain/JournalEntry.java`
**Table**: `journal_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| journalId | UUID | journal_id | NOT NULL |
| entryNumber | String | entry_number | NOT NULL |
| entryDate | LocalDate | entry_date | NOT NULL |
| totalDebit | BigDecimal | total_debit | NOT NULL |
| totalCredit | BigDecimal | total_credit | NOT NULL |
| status | JournalEntryStatus | status | ENUM, NOT NULL |
| postedById | UUID | posted_by_id |  |

---

### JournalLine (extends BaseEntity)
**File**: `modules/accounting/domain/JournalLine.java`
**Table**: `journal_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entryId | UUID | entry_id | NOT NULL |
| accountId | UUID | account_id | NOT NULL |
| debit | BigDecimal | debit | NOT NULL |
| credit | BigDecimal | credit | NOT NULL |
| partnerId | UUID | partner_id |  |
| description | String | description |  |
| analyticTags | Map<String, String> | analytic_tags | JSONB |

---

### ReconciliationAct (extends BaseEntity)
**File**: `modules/accounting/domain/ReconciliationAct.java`
**Table**: `reconciliation_acts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| counterpartyId | UUID | counterparty_id | NOT NULL |
| periodId | UUID | period_id | NOT NULL |
| ourDebit | BigDecimal | our_debit | NOT NULL |
| ourCredit | BigDecimal | our_credit | NOT NULL |
| theirDebit | BigDecimal | their_debit | NOT NULL |
| theirCredit | BigDecimal | their_credit | NOT NULL |
| difference | BigDecimal | difference | NOT NULL |
| status | ReconciliationActStatus | status | ENUM, NOT NULL |
| signedAt | Instant | signed_at |  |
| notes | String | notes |  |

---

### TaxDeclaration (extends BaseEntity)
**File**: `modules/accounting/domain/TaxDeclaration.java`
**Table**: `tax_declarations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| declarationType | DeclarationType | declaration_type | ENUM, NOT NULL |
| periodId | UUID | period_id | NOT NULL |
| status | DeclarationStatus | status | ENUM, NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| submittedAt | Instant | submitted_at |  |
| acceptedAt | Instant | accepted_at |  |
| fileUrl | String | file_url |  |
| notes | String | notes |  |

---

## Module: admin

### IpWhitelist
**File**: `modules/admin/domain/IpWhitelist.java`
**Table**: `ip_whitelist`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID |  | PK, AUTO |
| organizationId | UUID | organization_id | NOT NULL |
| ipAddress | String | ip_address | NOT NULL |
| description | String | description |  |
| isActive | boolean | is_active | NOT NULL |
| createdBy | String | created_by |  |
| createdAt | Instant | created_at | NOT NULL |

---

### LoginAuditLog
**File**: `modules/admin/domain/LoginAuditLog.java`
**Table**: `login_audit_log`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID |  | PK, AUTO |
| userId | UUID | user_id |  |
| email | String | email | NOT NULL |
| action | String | action | NOT NULL |
| ipAddress | String | ip_address |  |
| userAgent | String | user_agent |  |
| location | String | location |  |
| success | boolean | success | NOT NULL |
| failureReason | String | failure_reason |  |
| createdAt | Instant | created_at | NOT NULL |

---

### NotificationPreference
**File**: `modules/admin/domain/NotificationPreference.java`
**Table**: `notification_preferences`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID |  | PK, AUTO |
| organizationId | UUID | organization_id | NOT NULL |
| roleCode | String | role_code |  |
| userId | UUID | user_id |  |
| eventType | String | event_type | NOT NULL |
| channelEmail | boolean | channel_email | NOT NULL |
| channelPush | boolean | channel_push | NOT NULL |
| channelTelegram | boolean | channel_telegram | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

## Module: ai

### AiConversation (extends BaseEntity)
**File**: `modules/ai/domain/AiConversation.java`
**Table**: `ai_conversations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| userId | UUID | user_id | NOT NULL |
| projectId | UUID | project_id |  |
| title | String | title | NOT NULL |
| status | ConversationStatus | status | ENUM, NOT NULL |
| lastMessageAt | Instant | last_message_at |  |

---

### AiConversationContext (extends BaseEntity)
**File**: `modules/ai/domain/AiConversationContext.java`
**Table**: `ai_conversation_contexts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| conversationId | UUID | conversation_id | NOT NULL |
| contextType | AiContextType | context_type | ENUM, NOT NULL |
| entityId | UUID | entity_id |  |
| entityName | String | entity_name |  |
| contextDataJson | Map<String, Object> | context_data_json | JSONB |

---

### AiDocumentAnalysis (extends BaseEntity)
**File**: `modules/ai/domain/AiDocumentAnalysis.java`
**Table**: `ai_document_analyses`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentId | UUID | document_id | NOT NULL |
| analysisType | AnalysisType | analysis_type | ENUM, NOT NULL |
| result | Map<String, Object> | result | JSONB |
| confidence | Double | confidence |  |
| processedAt | Instant | processed_at |  |
| status | AnalysisStatus | status | ENUM, NOT NULL |

---

### AiMessage (extends BaseEntity)
**File**: `modules/ai/domain/AiMessage.java`
**Table**: `ai_messages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| conversationId | UUID | conversation_id | NOT NULL |
| role | MessageRole | role | ENUM, NOT NULL |
| content | String | content | NOT NULL |
| tokensUsed | Integer | tokens_used |  |
| model | String | model |  |

---

### AiModelConfig (extends BaseEntity)
**File**: `modules/ai/domain/AiModelConfig.java`
**Table**: `ai_model_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| provider | AiProvider | provider | ENUM, NOT NULL |
| apiUrl | String | api_url |  |
| apiKeyEncrypted | String | api_key_encrypted |  |
| modelName | String | model_name | NOT NULL |
| maxTokens | Integer | max_tokens | NOT NULL |
| temperature | Double | temperature | NOT NULL |
| isActive | Boolean | is_active | NOT NULL |
| isDefault | Boolean | is_default | NOT NULL |
| dataProcessingAgreementSigned | Boolean | data_processing_agreement_signed | NOT NULL |

---

### AiPrediction (extends BaseEntity)
**File**: `modules/ai/domain/AiPrediction.java`
**Table**: `ai_predictions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| predictionType | PredictionType | prediction_type | ENUM, NOT NULL |
| inputData | Map<String, Object> | input_data | JSONB, NOT NULL |
| result | Map<String, Object> | result | JSONB, NOT NULL |
| confidence | Double | confidence |  |
| actualValue | Double | actual_value |  |
| accuracy | Double | accuracy |  |

---

### AiPromptTemplate (extends BaseEntity)
**File**: `modules/ai/domain/AiPromptTemplate.java`
**Table**: `ai_prompt_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| category | AiPromptCategory | category | ENUM, NOT NULL |
| promptTextRu | String | prompt_text_ru | NOT NULL |
| promptTextEn | String | prompt_text_en |  |
| variablesJson | Map<String, Object> | variables_json | JSONB |
| isSystem | Boolean | is_system | NOT NULL |

---

### AiTemplate (extends BaseEntity)
**File**: `modules/ai/domain/AiTemplate.java`
**Table**: `ai_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| systemPrompt | String | system_prompt | NOT NULL |
| category | String | category |  |
| isActive | Boolean | is_active | NOT NULL |
| model | String | model |  |

---

### AiUsageLog (extends BaseEntity)
**File**: `modules/ai/domain/AiUsageLog.java`
**Table**: `ai_usage_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| userId | UUID | user_id | NOT NULL |
| conversationId | UUID | conversation_id |  |
| modelConfigId | UUID | model_config_id |  |
| feature | String | feature | NOT NULL |
| tokensInput | Integer | tokens_input | NOT NULL |
| tokensOutput | Integer | tokens_output | NOT NULL |
| cost | Double | cost |  |
| costRub | Double | cost_rub |  |
| responseTimeMs | Long | response_time_ms |  |
| wasSuccessful | Boolean | was_successful |  |
| errorMessage | String | error_message |  |

---

### DocumentClassification (extends BaseEntity)
**File**: `modules/ai/classification/domain/DocumentClassification.java`
**Table**: `document_classifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| detectedType | DocumentClassType | detected_type | ENUM, NOT NULL |
| confidencePercent | Integer | confidence_percent | NOT NULL |
| confirmed | boolean | is_confirmed | NOT NULL |
| confirmedByUserId | UUID | confirmed_by_user_id |  |
| confirmedAt | Instant | confirmed_at |  |
| rawOcrText | Map<String, Object> | raw_ocr_text | JSONB |
| extractedMetadataJson | Map<String, Object> | extracted_metadata_json | JSONB |

---

### DocumentCrossCheck (extends BaseEntity)
**File**: `modules/ai/classification/domain/DocumentCrossCheck.java`
**Table**: `document_cross_checks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| sourceDocumentId | UUID | source_document_id | NOT NULL |
| targetDocumentId | UUID | target_document_id | NOT NULL |
| checkType | CrossCheckType | check_type | ENUM, NOT NULL |
| status | CrossCheckStatus | status | ENUM, NOT NULL |
| discrepancyDetailsJson | Map<String, Object> | discrepancy_details_json | JSONB |
| checkedAt | Instant | checked_at | NOT NULL |

---

### OcrProcessingJob (extends BaseEntity)
**File**: `modules/ai/classification/domain/OcrProcessingJob.java`
**Table**: `ocr_processing_queue`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| status | OcrStatus | status | ENUM, NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| errorMessage | String | error_message |  |
| pageCount | Integer | page_count |  |
| processingTimeMs | Long | processing_time_ms |  |

---

## Module: analytics

### AbcXyzAnalysis (extends BaseEntity)
**File**: `modules/analytics/domain/AbcXyzAnalysis.java`
**Table**: `abc_xyz_analyses`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| analysisDate | LocalDate | analysis_date | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| entityName | String | entity_name | NOT NULL |
| abcCategory | AbcCategory | abc_category | ENUM, NOT NULL |
| xyzCategory | XyzCategory | xyz_category | ENUM, NOT NULL |
| totalValue | BigDecimal | total_value |  |
| percentOfTotal | BigDecimal | percent_of_total |  |
| variationCoefficient | BigDecimal | variation_coefficient |  |
| frequency | int | frequency | NOT NULL |

---

### AnalyticsReport (extends BaseEntity)
**File**: `modules/analytics/domain/AnalyticsReport.java`
**Table**: `analytics_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| reportType | BiReportType | report_type | ENUM, NOT NULL |
| category | String | category |  |
| query | String | query |  |
| parameters | String | parameters |  |
| outputFormat | BiOutputFormat | output_format | ENUM, NOT NULL |
| lastRunAt | Instant | last_run_at |  |
| runCount | int | run_count | NOT NULL |
| createdById | UUID | created_by_id |  |
| isPublic | boolean | is_public | NOT NULL |
| description | String | description |  |

---

### BiDashboard (extends BaseEntity)
**File**: `modules/analytics/domain/BiDashboard.java`
**Table**: `bi_dashboards`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| layout | String | layout |  |
| isDefault | boolean | is_default | NOT NULL |
| ownerId | UUID | owner_id |  |
| isShared | boolean | is_shared | NOT NULL |
| refreshIntervalSeconds | int | refresh_interval_seconds |  |

---

### BiWidget (extends BaseEntity)
**File**: `modules/analytics/domain/BiWidget.java`
**Table**: `bi_widgets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| dashboardId | UUID | dashboard_id | NOT NULL |
| widgetType | BiWidgetType | widget_type | ENUM, NOT NULL |
| title | String | title | NOT NULL |
| dataSource | String | data_source | NOT NULL |
| query | String | query |  |
| config | String | config |  |
| position | String | position |  |
| size | String | size |  |
| refreshIntervalSeconds | int | refresh_interval_seconds |  |

---

### BonusCalculation (extends BaseEntity)
**File**: `modules/analytics/domain/BonusCalculation.java`
**Table**: `bonus_calculations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| employeeName | String | employee_name |  |
| period | String | period | NOT NULL |
| baseBonus | BigDecimal | base_bonus |  |
| kpiMultiplier | BigDecimal | kpi_multiplier |  |
| finalBonus | BigDecimal | final_bonus |  |
| status | BonusStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |
| approvedAt | LocalDateTime | approved_at |  |
| paidAt | LocalDateTime | paid_at |  |

---

### Dashboard (extends BaseEntity)
**File**: `modules/analytics/domain/Dashboard.java`
**Table**: `dashboards`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| ownerId | UUID | owner_id |  |
| dashboardType | DashboardType | dashboard_type | ENUM, NOT NULL |
| layoutConfig | String | layout_config |  |
| isDefault | boolean | is_default | NOT NULL |
| isPublic | boolean | is_public | NOT NULL |

---

### DashboardWidget (extends BaseEntity)
**File**: `modules/analytics/domain/DashboardWidget.java`
**Table**: `dashboard_widgets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| dashboardId | UUID | dashboard_id | NOT NULL |
| widgetType | WidgetType | widget_type | ENUM, NOT NULL |
| title | String | title | NOT NULL |
| dataSource | String | data_source | NOT NULL |
| configJson | String | config_json |  |
| positionX | Integer | position_x | NOT NULL |
| positionY | Integer | position_y | NOT NULL |
| width | Integer | width | NOT NULL |
| height | Integer | height | NOT NULL |
| refreshIntervalSeconds | Integer | refresh_interval_seconds |  |

---

### KpiAchievement (extends BaseEntity)
**File**: `modules/analytics/domain/KpiAchievement.java`
**Table**: `kpi_achievements`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| kpiId | UUID | kpi_id | NOT NULL |
| period | String | period | NOT NULL |
| targetValue | BigDecimal | target_value |  |
| actualValue | BigDecimal | actual_value |  |
| achievementPercent | BigDecimal | achievement_percent |  |
| score | BigDecimal | score |  |
| notes | String | notes |  |

---

### KpiDefinition (extends BaseEntity)
**File**: `modules/analytics/domain/KpiDefinition.java`
**Table**: `kpi_definitions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| category | KpiCategory | category | ENUM, NOT NULL |
| dataSource | String | data_source |  |
| aggregationType | AggregationType | aggregation_type | ENUM, NOT NULL |
| formula | String | formula |  |
| unit | KpiUnit | unit | ENUM, NOT NULL |
| targetValue | BigDecimal | target_value |  |
| warningThreshold | BigDecimal | warning_threshold |  |
| criticalThreshold | BigDecimal | critical_threshold |  |
| isActive | boolean | is_active | NOT NULL |

---

### KpiSnapshot (extends BaseEntity)
**File**: `modules/analytics/domain/KpiSnapshot.java`
**Table**: `kpi_snapshots`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| kpiId | UUID | kpi_id | NOT NULL |
| projectId | UUID | project_id |  |
| snapshotDate | LocalDate | snapshot_date | NOT NULL |
| value | BigDecimal | value | NOT NULL |
| targetValue | BigDecimal | target_value |  |
| trend | KpiTrend | trend | ENUM, NOT NULL |

---

### PredictionModel (extends BaseEntity)
**File**: `modules/analytics/domain/PredictionModel.java`
**Table**: `prediction_models`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| modelType | PredictionModelType | model_type | ENUM, NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| trainingDataJson | String | training_data_json | NOT NULL |
| accuracyPercent | BigDecimal | accuracy_percent |  |
| isActive | boolean | is_active | NOT NULL |
| trainedAt | Instant | trained_at |  |

---

### ProjectRiskPrediction (extends BaseEntity)
**File**: `modules/analytics/domain/ProjectRiskPrediction.java`
**Table**: `project_risk_predictions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| modelId | UUID | model_id |  |
| predictionType | PredictionModelType | prediction_type | ENUM, NOT NULL |
| probabilityPercent | BigDecimal | probability_percent | NOT NULL |
| confidenceLevel | ConfidenceLevel | confidence_level | ENUM, NOT NULL |
| riskFactorsJson | String | risk_factors_json | NOT NULL |
| predictedDelayDays | Integer | predicted_delay_days |  |
| predictedOverrunAmount | BigDecimal | predicted_overrun_amount |  |
| alertGenerated | boolean | alert_generated | NOT NULL |
| predictedAt | Instant | predicted_at | NOT NULL |
| validUntil | Instant | valid_until |  |

---

### ReportBuilderExecution (extends BaseEntity)
**File**: `modules/analytics/domain/ReportBuilderExecution.java`
**Table**: `report_builder_executions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| templateId | UUID | template_id | NOT NULL |
| executedById | UUID | executed_by_id |  |
| parametersJson | String | parameters_json |  |
| rowCount | Integer | row_count |  |
| executionTimeMs | Long | execution_time_ms |  |
| outputFormat | ReportOutputFormat | output_format | ENUM |
| outputPath | String | output_path |  |
| status | ReportExecutionStatus | status | ENUM, NOT NULL |
| errorMessage | String | error_message |  |

---

### ReportExecution (extends BaseEntity)
**File**: `modules/analytics/domain/ReportExecution.java`
**Table**: `report_executions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| reportId | UUID | report_id | NOT NULL |
| executedById | UUID | executed_by_id |  |
| startedAt | Instant | started_at | NOT NULL |
| completedAt | Instant | completed_at |  |
| status | ExecutionStatus | status | ENUM, NOT NULL |
| outputUrl | String | output_url |  |
| outputSize | Long | output_size |  |
| errorMessage | String | error_message |  |
| parametersJson | String | parameters_json |  |

---

### ReportTemplate (extends BaseEntity)
**File**: `modules/analytics/domain/ReportTemplate.java`
**Table**: `report_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| dataSource | ReportDataSource | data_source | ENUM, NOT NULL |
| columnsJson | String | columns_json |  |
| filtersJson | String | filters_json |  |
| groupByJson | String | group_by_json |  |
| sortByJson | String | sort_by_json |  |
| chartType | ReportChartType | chart_type | ENUM |
| chartConfigJson | String | chart_config_json |  |
| isPublic | boolean | is_public | NOT NULL |
| scheduleEnabled | boolean | schedule_enabled | NOT NULL |
| scheduleCron | String | schedule_cron |  |
| scheduleRecipients | String | schedule_recipients |  |
| lastRunAt | Instant | last_run_at |  |
| createdById | UUID | created_by_id |  |

---

### RiskFactorWeight (extends BaseEntity)
**File**: `modules/analytics/domain/RiskFactorWeight.java`
**Table**: `risk_factor_weights`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| factorName | String | factor_name | NOT NULL |
| factorCategory | RiskFactorCategory | factor_category | ENUM, NOT NULL |
| weightValue | BigDecimal | weight_value | NOT NULL |
| description | String | description |  |

---

### SavedReport (extends BaseEntity)
**File**: `modules/analytics/domain/SavedReport.java`
**Table**: `saved_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| reportType | ReportType | report_type | ENUM, NOT NULL |
| queryConfig | String | query_config |  |
| outputFormat | OutputFormat | output_format | ENUM, NOT NULL |
| scheduleEnabled | boolean | schedule_enabled | NOT NULL |
| scheduleCron | String | schedule_cron |  |
| scheduleRecipients | String | schedule_recipients |  |
| lastRunAt | Instant | last_run_at |  |
| lastRunStatus | RunStatus | last_run_status | ENUM |
| createdById | UUID | created_by_id |  |

---

## Module: apiManagement

### ApiKey (extends BaseEntity)
**File**: `modules/apiManagement/domain/ApiKey.java`
**Table**: `api_keys`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| keyHash | String | key_hash | NOT NULL, UNIQUE |
| prefix | String | prefix | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| scopes | String | scopes |  |
| isActive | boolean | is_active | NOT NULL |
| expiresAt | Instant | expires_at |  |
| lastUsedAt | Instant | last_used_at |  |
| requestCount | long | request_count | NOT NULL |
| rateLimit | int | rate_limit | NOT NULL |

---

### ApiRateLimit (extends BaseEntity)
**File**: `modules/apiManagement/domain/ApiRateLimit.java`
**Table**: `api_rate_limits`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| apiKeyId | UUID | api_key_id | NOT NULL |
| requestsPerMinute | int | requests_per_minute | NOT NULL |
| requestsPerHour | int | requests_per_hour | NOT NULL |
| requestsPerDay | int | requests_per_day | NOT NULL |
| burstLimit | int | burst_limit | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### ApiUsageLog (extends BaseEntity)
**File**: `modules/apiManagement/domain/ApiUsageLog.java`
**Table**: `api_usage_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| apiKeyId | UUID | api_key_id | NOT NULL |
| endpoint | String | endpoint | NOT NULL |
| method | String | method | NOT NULL |
| statusCode | int | status_code | NOT NULL |
| responseTimeMs | Integer | response_time_ms |  |
| requestSizeBytes | Long | request_size_bytes |  |
| responseSizeBytes | Long | response_size_bytes |  |
| ipAddress | String | ip_address |  |
| userAgent | String | user_agent |  |
| errorMessage | String | error_message |  |
| requestedAt | Instant | requested_at | NOT NULL |

---

### ConnectorInstallation (extends BaseEntity)
**File**: `modules/apiManagement/domain/ConnectorInstallation.java`
**Table**: `connector_installations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| connectorId | UUID | connector_id | NOT NULL |
| configJson | String | config_json |  |
| status | ConnectorInstallationStatus | status | ENUM, NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |
| errorMessage | String | error_message |  |

---

### IdempotencyRecord (extends BaseEntity)
**File**: `modules/apiManagement/domain/IdempotencyRecord.java`
**Table**: `idempotency_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| idempotencyKey | String | idempotency_key | NOT NULL, UNIQUE |
| requestHash | String | request_hash |  |
| responseData | String | response_data |  |
| status | IdempotencyStatus | status | ENUM, NOT NULL |
| recordCreatedAt | Instant | record_created_at | NOT NULL |
| expiresAt | Instant | expires_at | NOT NULL |

---

### IntegrationConnector (extends BaseEntity)
**File**: `modules/apiManagement/domain/IntegrationConnector.java`
**Table**: `integration_connectors`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| slug | String | slug | NOT NULL, UNIQUE |
| description | String | description |  |
| category | ConnectorCategory | category | ENUM, NOT NULL |
| iconUrl | String | icon_url |  |
| documentationUrl | String | documentation_url |  |
| apiBaseUrl | String | api_base_url |  |
| authType | ConnectorAuthType | auth_type | ENUM, NOT NULL |
| isFirstParty | boolean | is_first_party | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| configSchemaJson | String | config_schema_json |  |

---

### WebhookConfig (extends BaseEntity)
**File**: `modules/apiManagement/domain/WebhookConfig.java`
**Table**: `webhook_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| url | String | url | NOT NULL |
| secret | String | secret |  |
| events | String | events |  |
| isActive | boolean | is_active | NOT NULL |
| lastTriggeredAt | Instant | last_triggered_at |  |
| failureCount | int | failure_count | NOT NULL |
| lastFailureAt | Instant | last_failure_at |  |
| lastFailureMessage | String | last_failure_message |  |
| retryPolicy | RetryPolicy | retry_policy | ENUM, NOT NULL |

---

### WebhookDelivery (extends BaseEntity)
**File**: `modules/apiManagement/domain/WebhookDelivery.java`
**Table**: `webhook_deliveries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| webhookConfigId | UUID | webhook_config_id | NOT NULL |
| event | String | event | NOT NULL |
| payload | String | payload |  |
| status | WebhookDeliveryStatus | status | ENUM, NOT NULL |
| responseCode | Integer | response_code |  |
| responseBody | String | response_body |  |
| sentAt | Instant | sent_at |  |
| deliveredAt | Instant | delivered_at |  |
| attemptCount | int | attempt_count | NOT NULL |
| nextRetryAt | Instant | next_retry_at |  |

---

## Module: approval

### ApprovalChain (extends BaseEntity)
**File**: `modules/approval/domain/ApprovalChain.java`
**Table**: `approval_chains`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| name | String | name |  |
| status | String | status |  |

**Relationships**:
- OneToMany → ApprovalStep `steps`

---

### ApprovalStep
**File**: `modules/approval/domain/ApprovalStep.java`
**Table**: `approval_steps`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| stepOrder | Integer | step_order | NOT NULL |
| approverName | String | approver_name | NOT NULL |
| approverRole | String | approver_role |  |
| status | String | status |  |
| comment | String | comment |  |
| decidedAt | Instant | decided_at |  |
| createdAt | Instant | created_at |  |
| updatedAt | Instant | updated_at |  |
| version | Long | version |  |

**Relationships**:
- ManyToOne → ApprovalChain `chain` (FK: chain_id)

---

## Module: auth

### LoginAttempt (extends BaseEntity)
**File**: `modules/auth/domain/LoginAttempt.java`
**Table**: `login_attempts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id |  |
| email | String | email | NOT NULL |
| ipAddress | String | ip_address |  |
| userAgent | String | user_agent |  |
| isSuccessful | boolean | is_successful | NOT NULL |
| failureReason | String | failure_reason |  |
| attemptedAt | Instant | attempted_at | NOT NULL |

---

### MfaAttempt (extends BaseEntity)
**File**: `modules/auth/domain/MfaAttempt.java`
**Table**: `mfa_attempts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| method | MfaMethod | method | ENUM, NOT NULL |
| code | String | code | NOT NULL |
| isSuccessful | boolean | is_successful | NOT NULL |
| ipAddress | String | ip_address |  |
| userAgent | String | user_agent |  |
| attemptedAt | Instant | attempted_at | NOT NULL |

---

### MfaConfig (extends BaseEntity)
**File**: `modules/auth/domain/MfaConfig.java`
**Table**: `mfa_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| method | MfaMethod | method | ENUM, NOT NULL |
| secret | String | secret |  |
| isEnabled | boolean | is_enabled | NOT NULL |
| enabledAt | Instant | enabled_at |  |
| backupCodes | List<String> | backup_codes | JSONB |

---

### OidcProvider (extends BaseEntity)
**File**: `modules/auth/domain/OidcProvider.java`
**Table**: `oidc_providers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| clientId | String | client_id | NOT NULL |
| clientSecret | String | client_secret | NOT NULL |
| authorizationUrl | String | authorization_url | NOT NULL |
| tokenUrl | String | token_url | NOT NULL |
| userInfoUrl | String | user_info_url |  |
| scope | String | scope | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| iconUrl | String | icon_url |  |

---

### OidcUserMapping (extends BaseEntity)
**File**: `modules/auth/domain/OidcUserMapping.java`
**Table**: `oidc_user_mappings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| oidcProviderId | UUID | oidc_provider_id | NOT NULL |
| externalUserId | String | external_user_id | NOT NULL |
| internalUserId | UUID | internal_user_id | NOT NULL |
| email | String | email |  |
| linkedAt | Instant | linked_at | NOT NULL |

---

### PasswordResetToken
**File**: `modules/auth/domain/PasswordResetToken.java`
**Table**: `password_reset_tokens`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID |  | PK, AUTO |
| token | String | token | NOT NULL, UNIQUE |
| expiresAt | Instant | expires_at | NOT NULL |
| used | boolean | used | NOT NULL |
| createdAt | Instant | created_at | NOT NULL |

**Relationships**:
- ManyToOne → User `user` (FK: user_id)

---

### Permission
**File**: `modules/auth/domain/Permission.java`
**Table**: `permissions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| module | String | module | NOT NULL |
| description | String | description |  |

---

### Role
**File**: `modules/auth/domain/Role.java`
**Table**: `roles`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| systemRole | boolean | system_role | NOT NULL |
| permissions | Set<Permission> |  |  |

---

### SecurityPolicy (extends BaseEntity)
**File**: `modules/auth/domain/SecurityPolicy.java`
**Table**: `security_policies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| passwordMinLength | int | password_min_length | NOT NULL |
| passwordRequiresUppercase | boolean | password_requires_uppercase | NOT NULL |
| passwordRequiresNumber | boolean | password_requires_number | NOT NULL |
| passwordRequiresSpecial | boolean | password_requires_special | NOT NULL |
| passwordExpiryDays | int | password_expiry_days | NOT NULL |
| maxLoginAttempts | int | max_login_attempts | NOT NULL |
| lockoutDurationMinutes | int | lockout_duration_minutes | NOT NULL |
| sessionTimeoutMinutes | int | session_timeout_minutes | NOT NULL |
| requireMfa | boolean | require_mfa | NOT NULL |
| allowedIpRanges | List<String> | allowed_ip_ranges | JSONB |
| isActive | boolean | is_active | NOT NULL |

---

### User (extends BaseEntity)
**File**: `modules/auth/domain/User.java`
**Table**: `users`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| email | String | email | NOT NULL, UNIQUE |
| passwordHash | String | password_hash | NOT NULL |
| firstName | String | first_name | NOT NULL |
| lastName | String | last_name | NOT NULL |
| phone | String | phone |  |
| position | String | position |  |
| avatarUrl | String | avatar_url |  |
| enabled | boolean | enabled | NOT NULL |
| organizationId | UUID | organization_id |  |
| twoFactorEnabled | boolean | two_factor_enabled |  |
| twoFactorSecret | String | two_factor_secret |  |
| twoFactorRecoveryCodes | String | two_factor_recovery_codes |  |
| lastLoginAt | Instant | last_login_at |  |
| roles | Set<Role> |  |  |

---

### UserSession (extends BaseEntity)
**File**: `modules/auth/domain/UserSession.java`
**Table**: `user_sessions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| sessionToken | String | session_token | NOT NULL, UNIQUE |
| ipAddress | String | ip_address |  |
| userAgent | String | user_agent |  |
| isActive | boolean | is_active | NOT NULL |
| lastActivityAt | Instant | last_activity_at | NOT NULL |
| expiresAt | Instant | expires_at | NOT NULL |

---

## Module: bidManagement

### BidEvaluation (extends BaseEntity)
**File**: `modules/bidManagement/domain/BidEvaluation.java`
**Table**: `bid_evaluations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| bidPackageId | UUID | bid_package_id | NOT NULL |
| invitationId | UUID | invitation_id | NOT NULL |
| criteriaName | String | criteria_name | NOT NULL |
| score | Integer | score |  |
| maxScore | Integer | max_score |  |
| weight | BigDecimal | weight |  |
| notes | String | notes |  |
| evaluatorName | String | evaluator_name |  |

---

### BidInvitation (extends BaseEntity)
**File**: `modules/bidManagement/domain/BidInvitation.java`
**Table**: `bid_invitations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| bidPackageId | UUID | bid_package_id | NOT NULL |
| vendorId | UUID | vendor_id |  |
| vendorName | String | vendor_name | NOT NULL |
| vendorEmail | String | vendor_email |  |
| status | BidInvitationStatus | status | ENUM, NOT NULL |
| invitedAt | LocalDateTime | invited_at |  |
| respondedAt | LocalDateTime | responded_at |  |
| bidAmount | BigDecimal | bid_amount |  |
| bidNotes | String | bid_notes |  |
| attachmentsCount | Integer | attachments_count |  |

---

### BidPackage (extends BaseEntity)
**File**: `modules/bidManagement/domain/BidPackage.java`
**Table**: `bid_packages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| status | BidPackageStatus | status | ENUM, NOT NULL |
| bidDueDate | LocalDateTime | bid_due_date |  |
| scopeOfWork | String | scope_of_work |  |
| specSections | String | spec_sections |  |

---

## Module: bidScoring

### BidComparison (extends BaseEntity)
**File**: `modules/bidScoring/domain/BidComparison.java`
**Table**: `bid_comparisons`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | ComparisonStatus | status | ENUM, NOT NULL |
| rfqNumber | String | rfq_number |  |
| category | String | category |  |
| createdById | UUID | created_by_id |  |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |
| winnerVendorId | UUID | winner_vendor_id |  |
| winnerJustification | String | winner_justification |  |

---

### BidCriteria (extends BaseEntity)
**File**: `modules/bidScoring/domain/BidCriteria.java`
**Table**: `bid_criteria`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| bidComparisonId | UUID | bid_comparison_id | NOT NULL |
| criteriaType | CriteriaType | criteria_type | ENUM |
| name | String | name | NOT NULL |
| description | String | description |  |
| weight | BigDecimal | weight | NOT NULL |
| maxScore | Integer | max_score | NOT NULL |
| sortOrder | Integer | sort_order |  |

---

### BidScore (extends BaseEntity)
**File**: `modules/bidScoring/domain/BidScore.java`
**Table**: `bid_scores`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| bidComparisonId | UUID | bid_comparison_id | NOT NULL |
| criteriaId | UUID | criteria_id | NOT NULL |
| vendorId | UUID | vendor_id | NOT NULL |
| vendorName | String | vendor_name |  |
| score | BigDecimal | score | NOT NULL |
| weightedScore | BigDecimal | weighted_score |  |
| comments | String | comments |  |
| scoredById | UUID | scored_by_id |  |
| scoredAt | Instant | scored_at |  |

---

## Module: bim

### BimClash (extends BaseEntity)
**File**: `modules/bim/domain/BimClash.java`
**Table**: `bim_clashes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelAId | UUID | model_a_id | NOT NULL |
| modelBId | UUID | model_b_id |  |
| elementAId | String | element_a_id |  |
| elementBId | String | element_b_id |  |
| clashType | ClashType | clash_type | ENUM, NOT NULL |
| severity | ClashSeverity | severity | ENUM, NOT NULL |
| status | ClashStatus | status | ENUM, NOT NULL |
| description | String | description |  |
| coordinates | Map<String, Object> | coordinates | JSONB |
| resolvedById | UUID | resolved_by_id |  |
| resolvedAt | Instant | resolved_at |  |

---

### BimClashResult (extends BaseEntity)
**File**: `modules/bim/domain/BimClashResult.java`
**Table**: `bim_clash_results`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| clashTestId | UUID | clash_test_id | NOT NULL |
| elementAGuid | String | element_a_guid | NOT NULL |
| elementAName | String | element_a_name |  |
| elementAType | String | element_a_type |  |
| elementBGuid | String | element_b_guid | NOT NULL |
| elementBName | String | element_b_name |  |
| elementBType | String | element_b_type |  |
| clashType | ClashType | clash_type | ENUM, NOT NULL |
| clashPointX | Double | clash_point_x |  |
| clashPointY | Double | clash_point_y |  |
| clashPointZ | Double | clash_point_z |  |
| distanceMm | Double | distance_mm |  |
| status | ClashResultStatus | status | ENUM, NOT NULL |
| assignedToUserId | UUID | assigned_to_user_id |  |
| resolvedAt | Instant | resolved_at |  |
| resolutionNotes | String | resolution_notes |  |

---

### BimClashTest (extends BaseEntity)
**File**: `modules/bim/domain/BimClashTest.java`
**Table**: `bim_clash_tests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| modelAId | UUID | model_a_id | NOT NULL |
| modelBId | UUID | model_b_id | NOT NULL |
| toleranceMm | Double | tolerance_mm | NOT NULL |
| status | ClashTestStatus | status | ENUM, NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| totalClashesFound | Integer | total_clashes_found | NOT NULL |

---

### BimDefectView (extends BaseEntity)
**File**: `modules/bim/domain/BimDefectView.java`
**Table**: `bim_defect_views`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| modelId | UUID | model_id |  |
| filterFloor | String | filter_floor |  |
| filterSystem | String | filter_system |  |
| filterDefectStatus | String | filter_defect_status |  |
| cameraPresetJson | String | camera_preset_json |  |
| elementGuidsJson | String | element_guids_json |  |
| isShared | Boolean | is_shared | NOT NULL |

---

### BimElement (extends BaseEntity)
**File**: `modules/bim/domain/BimElement.java`
**Table**: `bim_elements`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelId | UUID | model_id | NOT NULL |
| elementId | String | element_id | NOT NULL |
| ifcType | String | ifc_type | NOT NULL |
| name | String | name |  |
| properties | Map<String, Object> | properties | JSONB |
| geometry | Map<String, Object> | geometry | JSONB |
| floor | String | floor |  |
| zone | String | zone |  |

---

### BimElementMetadata (extends BaseEntity)
**File**: `modules/bim/domain/BimElementMetadata.java`
**Table**: `bim_element_metadata`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| modelId | UUID | model_id | NOT NULL |
| elementGuid | String | element_guid | NOT NULL |
| elementName | String | element_name |  |
| ifcType | String | ifc_type |  |
| floorName | String | floor_name |  |
| systemName | String | system_name |  |
| propertiesJson | Map<String, Object> | properties_json | JSONB |

---

### BimModel (extends BaseEntity)
**File**: `modules/bim/domain/BimModel.java`
**Table**: `bim_models`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| modelType | BimModelType | model_type | ENUM, NOT NULL |
| format | BimModelFormat | format | ENUM, NOT NULL |
| fileUrl | String | file_url |  |
| fileSize | Long | file_size |  |
| description | String | description |  |
| status | BimModelStatus | status | ENUM, NOT NULL |
| uploadedById | UUID | uploaded_by_id |  |
| elementCount | Integer | element_count |  |
| modelVersion | Integer | model_version |  |

---

### BimVersion (extends BaseEntity)
**File**: `modules/bim/domain/BimVersion.java`
**Table**: `bim_versions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelId | UUID | model_id | NOT NULL |
| versionNumber | Integer | version_number | NOT NULL |
| changeDescription | String | change_description |  |
| fileUrl | String | file_url |  |
| uploadedById | UUID | uploaded_by_id |  |

---

### BimViewer (extends BaseEntity)
**File**: `modules/bim/domain/BimViewer.java`
**Table**: `bim_viewers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelId | UUID | model_id | NOT NULL |
| viewName | String | view_name | NOT NULL |
| cameraPosition | Map<String, Object> | camera_position | JSONB |
| description | String | description |  |
| isDefault | Boolean | is_default | NOT NULL |

---

### BimViewerSession (extends BaseEntity)
**File**: `modules/bim/domain/BimViewerSession.java`
**Table**: `bim_viewer_sessions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| modelId | UUID | model_id | NOT NULL |
| startedAt | Instant | started_at | NOT NULL |
| endedAt | Instant | ended_at |  |
| cameraPositionJson | Map<String, Object> | camera_position_json | JSONB |
| selectedElementsJson | List<String> | selected_elements_json | JSONB |

---

### DefectBimLink (extends BaseEntity)
**File**: `modules/bim/domain/DefectBimLink.java`
**Table**: `defect_bim_links`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| defectId | UUID | defect_id | NOT NULL |
| modelId | UUID | model_id | NOT NULL |
| elementGuid | String | element_guid | NOT NULL |
| elementName | String | element_name |  |
| elementType | String | element_type |  |
| floorName | String | floor_name |  |
| systemName | String | system_name |  |
| pinX | Double | pin_x |  |
| pinY | Double | pin_y |  |
| pinZ | Double | pin_z |  |
| cameraPositionJson | String | camera_position_json |  |
| screenshotUrl | String | screenshot_url |  |
| notes | String | notes |  |
| linkedByUserId | UUID | linked_by_user_id |  |
| linkedAt | Instant | linked_at | NOT NULL |

---

### DesignDrawing (extends BaseEntity)
**File**: `modules/bim/domain/DesignDrawing.java`
**Table**: `design_drawings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| packageId | UUID | package_id | NOT NULL |
| number | String | number | NOT NULL |
| title | String | title | NOT NULL |
| revision | String | revision |  |
| scale | String | scale |  |
| format | String | format |  |
| fileUrl | String | file_url |  |
| status | DrawingStatus | status | ENUM, NOT NULL |
| discipline | DesignDiscipline | discipline | ENUM, NOT NULL |

---

### DesignPackage (extends BaseEntity)
**File**: `modules/bim/domain/DesignPackage.java`
**Table**: `design_packages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| discipline | DesignDiscipline | discipline | ENUM, NOT NULL |
| status | DesignPackageStatus | status | ENUM, NOT NULL |
| packageVersion | Integer | package_version |  |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |

---

### DrawingAnnotation (extends BaseEntity)
**File**: `modules/bim/domain/DrawingAnnotation.java`
**Table**: `drawing_annotations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| drawingId | UUID | drawing_id | NOT NULL |
| authorId | UUID | author_id |  |
| x | Double | x | NOT NULL |
| y | Double | y | NOT NULL |
| width | Double | width |  |
| height | Double | height |  |
| content | String | content |  |
| annotationType | AnnotationType | annotation_type | ENUM, NOT NULL |
| status | AnnotationStatus | status | ENUM, NOT NULL |
| resolvedById | UUID | resolved_by_id |  |
| resolvedAt | Instant | resolved_at |  |

---

### DrawingMarkup (extends BaseEntity)
**File**: `modules/bim/domain/DrawingMarkup.java`
**Table**: `drawing_markups`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| drawingId | UUID | drawing_id | NOT NULL |
| authorId | UUID | author_id |  |
| markupData | Map<String, Object> | markup_data | JSONB |
| color | String | color |  |
| layer | String | layer |  |

---

### PhotoAlbum (extends BaseEntity)
**File**: `modules/bim/domain/PhotoAlbum.java`
**Table**: `photo_albums`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| coverPhotoId | UUID | cover_photo_id |  |

---

### PhotoComparison (extends BaseEntity)
**File**: `modules/bim/domain/PhotoComparison.java`
**Table**: `photo_comparisons`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| beforePhotoId | UUID | before_photo_id | NOT NULL |
| afterPhotoId | UUID | after_photo_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| title | String | title | NOT NULL |
| description | String | description |  |

---

### PhotoProgress (extends BaseEntity)
**File**: `modules/bim/domain/PhotoProgress.java`
**Table**: `photo_progress`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| title | String | title | NOT NULL |
| location | String | location |  |
| photoUrl | String | photo_url | NOT NULL |
| thumbnailUrl | String | thumbnail_url |  |
| latitude | Double | latitude |  |
| longitude | Double | longitude |  |
| takenAt | Instant | taken_at |  |
| takenById | UUID | taken_by_id |  |
| weatherCondition | WeatherCondition | weather_condition | ENUM |
| description | String | description |  |

---

## Module: calendar

### CalendarEvent (extends BaseEntity)
**File**: `modules/calendar/domain/CalendarEvent.java`
**Table**: `calendar_events`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| title | String | title | NOT NULL |
| description | String | description |  |
| eventType | EventType | event_type | ENUM, NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| startTime | LocalTime | start_time |  |
| endDate | LocalDate | end_date | NOT NULL |
| endTime | LocalTime | end_time |  |
| isAllDay | boolean | is_all_day | NOT NULL |
| projectId | UUID | project_id |  |
| taskId | UUID | task_id |  |
| organizerId | UUID | organizer_id | NOT NULL |
| organizerName | String | organizer_name | NOT NULL |
| location | String | location |  |
| isOnline | boolean | is_online | NOT NULL |
| meetingUrl | String | meeting_url |  |
| recurrenceRule | RecurrenceRule | recurrence_rule | ENUM, NOT NULL |
| recurrenceEndDate | LocalDate | recurrence_end_date |  |
| color | String | color |  |
| priority | EventPriority | priority | ENUM, NOT NULL |
| reminderMinutesBefore | Integer | reminder_minutes_before |  |
| status | EventStatus | status | ENUM, NOT NULL |

---

### CalendarEventAttendee (extends BaseEntity)
**File**: `modules/calendar/domain/CalendarEventAttendee.java`
**Table**: `calendar_event_attendees`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| eventId | UUID | event_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name | NOT NULL |
| email | String | email |  |
| responseStatus | AttendeeResponseStatus | response_status | ENUM, NOT NULL |
| isRequired | boolean | is_required | NOT NULL |

---

### ConstructionSchedule (extends BaseEntity)
**File**: `modules/calendar/domain/ConstructionSchedule.java`
**Table**: `construction_schedules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| status | ScheduleStatus | status | ENUM, NOT NULL |
| plannedStartDate | LocalDate | planned_start_date |  |
| plannedEndDate | LocalDate | planned_end_date |  |
| actualStartDate | LocalDate | actual_start_date |  |
| actualEndDate | LocalDate | actual_end_date |  |
| docVersion | Integer | doc_version | NOT NULL |

---

### ScheduleItem (extends BaseEntity)
**File**: `modules/calendar/domain/ScheduleItem.java`
**Table**: `schedule_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| scheduleId | UUID | schedule_id | NOT NULL |
| parentItemId | UUID | parent_item_id |  |
| code | String | code |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| workType | WorkType | work_type | ENUM, NOT NULL |
| plannedStartDate | LocalDate | planned_start_date |  |
| plannedEndDate | LocalDate | planned_end_date |  |
| actualStartDate | LocalDate | actual_start_date |  |
| actualEndDate | LocalDate | actual_end_date |  |
| duration | Integer | duration |  |
| progress | Integer | progress | NOT NULL |
| predecessorItemId | UUID | predecessor_item_id |  |
| lagDays | Integer | lag_days |  |
| responsibleId | UUID | responsible_id |  |
| responsibleName | String | responsible_name |  |
| isCriticalPath | boolean | is_critical_path | NOT NULL |
| sortOrder | Integer | sort_order | NOT NULL |

---

### WorkCalendar (extends BaseEntity)
**File**: `modules/calendar/domain/WorkCalendar.java`
**Table**: `work_calendars`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| year | Integer | year | NOT NULL |
| calendarType | CalendarType | calendar_type | ENUM, NOT NULL |
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |

---

### WorkCalendarDay (extends BaseEntity)
**File**: `modules/calendar/domain/WorkCalendarDay.java`
**Table**: `work_calendar_days`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| calendarId | UUID | calendar_id | NOT NULL |
| calendarDate | LocalDate | calendar_date | NOT NULL |
| dayType | DayType | day_type | ENUM, NOT NULL |
| workHours | BigDecimal | work_hours | NOT NULL |
| note | String | note |  |

---

## Module: cde

### ArchivePolicy (extends BaseEntity)
**File**: `modules/cde/domain/ArchivePolicy.java`
**Table**: `cde_archive_policies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| classification | DocumentClassification | classification | ENUM |
| retentionDays | int | retention_days | NOT NULL |
| autoArchive | boolean | auto_archive | NOT NULL |
| enabled | boolean | enabled | NOT NULL |

---

### DocumentAuditEntry (extends BaseEntity)
**File**: `modules/cde/domain/DocumentAuditEntry.java`
**Table**: `cde_document_audit_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentContainerId | UUID | document_container_id | NOT NULL |
| action | String | action | NOT NULL |
| performedById | UUID | performed_by_id |  |
| performedAt | Instant | performed_at | NOT NULL |
| previousState | String | previous_state |  |
| newState | String | new_state |  |
| details | String | details |  |
| ipAddress | String | ip_address |  |

---

### DocumentContainer (extends BaseEntity)
**File**: `modules/cde/domain/DocumentContainer.java`
**Table**: `cde_document_containers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| documentNumber | String | document_number | NOT NULL |
| title | String | title | NOT NULL |
| description | String | description |  |
| classification | DocumentClassification | classification | ENUM |
| lifecycleState | DocumentLifecycleState | lifecycle_state | ENUM, NOT NULL |
| discipline | String | discipline |  |
| zone | String | zone |  |
| level | String | level |  |
| originatorCode | String | originator_code |  |
| typeCode | String | type_code |  |
| currentRevisionId | UUID | current_revision_id |  |
| metadata | String | metadata |  |
| tags | String | tags |  |

---

### DocumentRevision (extends BaseEntity)
**File**: `modules/cde/domain/DocumentRevision.java`
**Table**: `cde_document_revisions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentContainerId | UUID | document_container_id | NOT NULL |
| revisionNumber | String | revision_number | NOT NULL |
| revisionStatus | RevisionStatus | revision_status | ENUM, NOT NULL |
| description | String | description |  |
| fileId | UUID | file_id |  |
| fileName | String | file_name |  |
| fileSize | Long | file_size |  |
| mimeType | String | mime_type |  |
| uploadedById | UUID | uploaded_by_id |  |
| uploadedAt | Instant | uploaded_at |  |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |
| supersededById | UUID | superseded_by_id |  |
| supersededAt | Instant | superseded_at |  |

---

### RevisionSet (extends BaseEntity)
**File**: `modules/cde/domain/RevisionSet.java`
**Table**: `cde_revision_sets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| revisionIds | String | revision_ids |  |
| issuedDate | LocalDate | issued_date |  |
| issuedById | UUID | issued_by_id |  |

---

### Transmittal (extends BaseEntity)
**File**: `modules/cde/domain/Transmittal.java`
**Table**: `cde_transmittals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| transmittalNumber | String | transmittal_number | NOT NULL |
| subject | String | subject | NOT NULL |
| purpose | TransmittalPurpose | purpose | ENUM |
| status | TransmittalStatus | status | ENUM, NOT NULL |
| fromOrganizationId | UUID | from_organization_id |  |
| toOrganizationId | UUID | to_organization_id |  |
| issuedDate | LocalDate | issued_date |  |
| dueDate | LocalDate | due_date |  |
| acknowledgedDate | LocalDate | acknowledged_date |  |
| coverNote | String | cover_note |  |
| sentById | UUID | sent_by_id |  |

---

### TransmittalItem (extends BaseEntity)
**File**: `modules/cde/domain/TransmittalItem.java`
**Table**: `cde_transmittal_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| transmittalId | UUID | transmittal_id | NOT NULL |
| documentContainerId | UUID | document_container_id | NOT NULL |
| revisionId | UUID | revision_id | NOT NULL |
| notes | String | notes |  |
| responseRequired | Boolean | response_required | NOT NULL |
| responseText | String | response_text |  |
| respondedAt | Instant | responded_at |  |
| respondedById | UUID | responded_by_id |  |
| sortOrder | Integer | sort_order |  |

---

## Module: changeManagement

### ChangeEvent (extends BaseEntity)
**File**: `modules/changeManagement/domain/ChangeEvent.java`
**Table**: `change_events`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id | NOT NULL |
| number | String | number | NOT NULL |
| title | String | title | NOT NULL |
| description | String | description |  |
| source | ChangeEventSource | source | ENUM |
| status | ChangeEventStatus | status | ENUM, NOT NULL |
| identifiedById | UUID | identified_by_id | NOT NULL |
| identifiedDate | LocalDate | identified_date | NOT NULL |
| estimatedCostImpact | BigDecimal | estimated_cost_impact |  |
| estimatedScheduleImpact | Integer | estimated_schedule_impact |  |
| actualCostImpact | BigDecimal | actual_cost_impact |  |
| actualScheduleImpact | Integer | actual_schedule_impact |  |
| linkedRfiId | UUID | linked_rfi_id |  |
| linkedIssueId | UUID | linked_issue_id |  |
| contractId | UUID | contract_id |  |
| tags | String | tags | JSONB |

---

### ChangeOrder (extends BaseEntity)
**File**: `modules/changeManagement/domain/ChangeOrder.java`
**Table**: `change_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id | NOT NULL |
| contractId | UUID | contract_id | NOT NULL |
| number | String | number |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| changeOrderType | ChangeOrderType | change_order_type | ENUM |
| status | ChangeOrderStatus | status | ENUM, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| scheduleImpactDays | Integer | schedule_impact_days | NOT NULL |
| originalContractAmount | BigDecimal | original_contract_amount |  |
| revisedContractAmount | BigDecimal | revised_contract_amount |  |
| approvedById | UUID | approved_by_id |  |
| approvedDate | LocalDate | approved_date |  |
| executedDate | LocalDate | executed_date |  |
| changeOrderRequestId | UUID | change_order_request_id |  |

---

### ChangeOrderItem (extends BaseEntity)
**File**: `modules/changeManagement/domain/ChangeOrderItem.java`
**Table**: `change_order_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| changeOrderId | UUID | change_order_id | NOT NULL |
| description | String | description | NOT NULL |
| quantity | BigDecimal | quantity |  |
| unit | String | unit |  |
| unitPrice | BigDecimal | unit_price |  |
| totalPrice | BigDecimal | total_price |  |
| costCodeId | UUID | cost_code_id |  |
| wbsNodeId | UUID | wbs_node_id |  |
| sortOrder | Integer | sort_order |  |

---

### ChangeOrderRequest (extends BaseEntity)
**File**: `modules/changeManagement/domain/ChangeOrderRequest.java`
**Table**: `change_order_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| changeEventId | UUID | change_event_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| number | String | number |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | ChangeOrderRequestStatus | status | ENUM, NOT NULL |
| requestedById | UUID | requested_by_id |  |
| requestedDate | LocalDate | requested_date |  |
| proposedCost | BigDecimal | proposed_cost |  |
| proposedScheduleChange | Integer | proposed_schedule_change |  |
| justification | String | justification |  |
| attachmentIds | String | attachment_ids |  |
| reviewedById | UUID | reviewed_by_id |  |
| reviewedDate | LocalDate | reviewed_date |  |
| reviewComments | String | review_comments |  |

---

## Module: chatter

### Activity (extends BaseEntity)
**File**: `modules/chatter/domain/Activity.java`
**Table**: `chatter_activities`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| activityType | ChatterActivityType | activity_type | ENUM, NOT NULL |
| summary | String | summary | NOT NULL |
| description | String | description |  |
| assignedToId | UUID | assigned_to_id | NOT NULL |
| dueDate | LocalDate | due_date | NOT NULL |
| status | ActivityStatus | status | ENUM, NOT NULL |
| completedAt | Instant | completed_at |  |
| completedById | UUID | completed_by_id |  |

---

### ActivityTypeEntity (extends BaseEntity)
**File**: `modules/chatter/domain/ActivityTypeEntity.java`
**Table**: `chatter_activity_types`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| icon | String | icon |  |
| defaultDays | int | default_days | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| category | ActivityTypeCategory | category | ENUM, NOT NULL |

---

### Attachment (extends BaseEntity)
**File**: `modules/chatter/domain/Attachment.java`
**Table**: `chatter_attachments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| fileName | String | file_name | NOT NULL |
| fileUrl | String | file_url | NOT NULL |
| fileSize | long | file_size | NOT NULL |
| mimeType | String | mime_type |  |
| uploadedById | UUID | uploaded_by_id | NOT NULL |
| uploadedAt | Instant | uploaded_at | NOT NULL |

---

### Comment (extends BaseEntity)
**File**: `modules/chatter/domain/Comment.java`
**Table**: `chatter_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| authorId | UUID | author_id | NOT NULL |
| content | String | content | NOT NULL |
| attachmentUrls | List<String> | attachment_urls | JSONB |
| parentCommentId | UUID | parent_comment_id |  |
| mentionedUserIds | List<UUID> | mentioned_user_ids | JSONB |
| isInternal | boolean | is_internal | NOT NULL |

---

### EntityChangeLog (extends BaseEntity)
**File**: `modules/chatter/domain/EntityChangeLog.java`
**Table**: `chatter_entity_change_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| fieldName | String | field_name | NOT NULL |
| oldValue | String | old_value |  |
| newValue | String | new_value |  |
| changedById | UUID | changed_by_id | NOT NULL |
| changedAt | Instant | changed_at | NOT NULL |

---

### Follower (extends BaseEntity)
**File**: `modules/chatter/domain/Follower.java`
**Table**: `chatter_followers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| followReason | String | follow_reason |  |
| isActive | boolean | is_active | NOT NULL |

---

## Module: closeout

### AsBuiltRequirement (extends BaseEntity)
**File**: `modules/closeout/domain/AsBuiltRequirement.java`
**Table**: `as_built_requirements`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| workType | WorkType | work_type | ENUM, NOT NULL |
| docCategory | String | doc_category | NOT NULL |
| description | String | description |  |
| isRequired | boolean | is_required | NOT NULL |

---

### AsBuiltWbsLink (extends BaseEntity)
**File**: `modules/closeout/domain/AsBuiltWbsLink.java`
**Table**: `as_built_wbs_links`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| wbsNodeId | UUID | wbs_node_id | NOT NULL |
| docCategory | String | doc_category | NOT NULL |
| documentContainerId | UUID | document_container_id |  |
| status | AsBuiltLinkStatus | status | ENUM, NOT NULL |

---

### CommissioningChecklist (extends BaseEntity)
**File**: `modules/closeout/domain/CommissioningChecklist.java`
**Table**: `commissioning_checklists`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| system | String | system |  |
| status | ChecklistStatus | status | ENUM, NOT NULL |
| checkItems | String | check_items | JSONB |
| inspectorId | UUID | inspector_id |  |
| inspectionDate | LocalDate | inspection_date |  |
| signedOffById | UUID | signed_off_by_id |  |
| signedOffAt | Instant | signed_off_at |  |
| notes | String | notes |  |
| attachmentIds | String | attachment_ids | JSONB |

---

### CommissioningChecklistTemplate (extends BaseEntity)
**File**: `modules/closeout/domain/CommissioningChecklistTemplate.java`
**Table**: `commissioning_checklist_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| system | String | system |  |
| description | String | description |  |
| checkItemDefinitions | String | check_item_definitions |  |
| sortOrder | int | sort_order | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### CommissioningSignOff (extends BaseEntity)
**File**: `modules/closeout/domain/CommissioningSignOff.java`
**Table**: `commissioning_sign_offs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| checklistId | UUID | checklist_id | NOT NULL |
| signerName | String | signer_name | NOT NULL |
| signerRole | String | signer_role |  |
| signerOrganization | String | signer_organization |  |
| decision | SignOffDecision | decision | ENUM, NOT NULL |
| comments | String | comments |  |
| signedAt | Instant | signed_at |  |

---

### HandoverPackage (extends BaseEntity)
**File**: `modules/closeout/domain/HandoverPackage.java`
**Table**: `handover_packages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| packageNumber | String | package_number |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | HandoverStatus | status | ENUM, NOT NULL |
| recipientOrganization | String | recipient_organization |  |
| recipientContactId | UUID | recipient_contact_id |  |
| preparedById | UUID | prepared_by_id |  |
| preparedDate | LocalDate | prepared_date |  |
| handoverDate | LocalDate | handover_date |  |
| acceptedDate | LocalDate | accepted_date |  |
| acceptedById | UUID | accepted_by_id |  |
| documentIds | String | document_ids | JSONB |
| drawingIds | String | drawing_ids | JSONB |
| certificateIds | String | certificate_ids | JSONB |
| manualIds | String | manual_ids | JSONB |
| rejectionReason | String | rejection_reason |  |

---

### StroynadzorPackage (extends BaseEntity)
**File**: `modules/closeout/domain/StroynadzorPackage.java`
**Table**: `stroynadzor_packages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| wbsNodeId | UUID | wbs_node_id |  |
| name | String | name | NOT NULL |
| status | StroynadzorPackageStatus | status | ENUM, NOT NULL |
| completenessPct | BigDecimal | completeness_pct |  |
| totalDocuments | int | total_documents |  |
| missingDocuments | int | missing_documents |  |
| missingDocumentsJson | String | missing_documents_json |  |
| tocJson | String | toc_json |  |
| fileSizeBytes | Long | file_size_bytes |  |
| generatedAt | Instant | generated_at |  |
| sentAt | Instant | sent_at |  |
| sentTo | String | sent_to |  |
| errorMessage | String | error_message |  |
| notes | String | notes |  |

---

### StroynadzorPackageDocument (extends BaseEntity)
**File**: `modules/closeout/domain/StroynadzorPackageDocument.java`
**Table**: `stroynadzor_package_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| packageId | UUID | package_id | NOT NULL |
| documentCategory | DocumentCategory | document_category | ENUM, NOT NULL |
| documentType | String | document_type | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| documentNumber | String | document_number |  |
| documentDate | LocalDate | document_date |  |
| sectionNumber | String | section_number |  |
| pageNumber | Integer | page_number |  |
| hasSignature | boolean | has_signature |  |
| status | PackageDocumentStatus | status | ENUM |
| notes | String | notes |  |

---

### WarrantyClaim (extends BaseEntity)
**File**: `modules/closeout/domain/WarrantyClaim.java`
**Table**: `warranty_claims`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id | NOT NULL |
| handoverPackageId | UUID | handover_package_id |  |
| claimNumber | String | claim_number |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | WarrantyClaimStatus | status | ENUM, NOT NULL |
| defectType | String | defect_type |  |
| location | String | location |  |
| reportedById | UUID | reported_by_id |  |
| reportedDate | LocalDate | reported_date |  |
| warrantyExpiryDate | LocalDate | warranty_expiry_date |  |
| assignedToId | UUID | assigned_to_id |  |
| resolvedDate | LocalDate | resolved_date |  |
| resolutionDescription | String | resolution_description |  |
| costOfRepair | BigDecimal | cost_of_repair |  |
| attachmentIds | String | attachment_ids | JSONB |

---

### WarrantyObligation (extends BaseEntity)
**File**: `modules/closeout/domain/WarrantyObligation.java`
**Table**: `warranty_obligations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| handoverPackageId | UUID | handover_package_id |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| system | String | system |  |
| warrantyStartDate | LocalDate | warranty_start_date | NOT NULL |
| warrantyEndDate | LocalDate | warranty_end_date | NOT NULL |
| contractorName | String | contractor_name |  |
| contractorContactInfo | String | contractor_contact_info |  |
| coverageTerms | String | coverage_terms |  |
| exclusions | String | exclusions |  |
| status | WarrantyObligationStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |

---

### ZosDocument (extends BaseEntity)
**File**: `modules/closeout/domain/ZosDocument.java`
**Table**: `zos_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| documentNumber | String | document_number | NOT NULL |
| title | String | title | NOT NULL |
| system | String | system |  |
| checklistIds | String | checklist_ids |  |
| issuedDate | LocalDate | issued_date |  |
| issuedByName | String | issued_by_name |  |
| issuedByOrganization | String | issued_by_organization |  |
| status | ZosStatus | status | ENUM, NOT NULL |
| conclusionText | String | conclusion_text |  |
| remarks | String | remarks |  |
| attachmentIds | String | attachment_ids |  |

---

## Module: closing

### Ks2Document (extends BaseEntity)
**File**: `modules/closing/domain/Ks2Document.java`
**Table**: `ks2_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| documentDate | LocalDate | document_date | NOT NULL |
| name | String | name |  |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| status | ClosingDocumentStatus | status | ENUM, NOT NULL |
| totalAmount | BigDecimal | total_amount |  |
| totalQuantity | BigDecimal | total_quantity |  |
| notes | String | notes |  |
| signedById | UUID | signed_by_id |  |
| signedAt | Instant | signed_at |  |
| totalWithVat | BigDecimal | total_with_vat |  |
| totalVatAmount | BigDecimal | total_vat_amount |  |
| edoDocumentId | UUID | edo_document_id |  |
| edoStatus | String | edo_status |  |
| edoSentAt | Instant | edo_sent_at |  |
| edoDeliveredAt | Instant | edo_delivered_at |  |
| edoSignedAt | Instant | edo_signed_at |  |
| pipelineGenerated | Boolean | pipeline_generated |  |
| pipelineGeneratedAt | Instant | pipeline_generated_at |  |
| sourceDailyLogIds | String | source_daily_log_ids |  |
| oneCPostingStatus | OneCPostingStatus | onec_posting_status | ENUM |
| oneCDocumentId | String | onec_document_id |  |
| oneCPostedAt | Instant | onec_posted_at |  |

---

### Ks2Line (extends BaseEntity)
**File**: `modules/closing/domain/Ks2Line.java`
**Table**: `ks2_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ks2Id | UUID | ks2_id | NOT NULL |
| sequence | Integer | sequence |  |
| specItemId | UUID | spec_item_id |  |
| name | String | name | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| unitPrice | BigDecimal | unit_price | NOT NULL |
| amount | BigDecimal | amount |  |
| unitOfMeasure | String | unit_of_measure |  |
| vatRate | BigDecimal | vat_rate |  |
| vatAmount | BigDecimal | vat_amount |  |
| notes | String | notes |  |

---

### Ks3Document (extends BaseEntity)
**File**: `modules/closing/domain/Ks3Document.java`
**Table**: `ks3_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| documentDate | LocalDate | document_date | NOT NULL |
| name | String | name |  |
| periodFrom | LocalDate | period_from |  |
| periodTo | LocalDate | period_to |  |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| status | ClosingDocumentStatus | status | ENUM, NOT NULL |
| totalAmount | BigDecimal | total_amount |  |
| retentionPercent | BigDecimal | retention_percent |  |
| retentionAmount | BigDecimal | retention_amount |  |
| netAmount | BigDecimal | net_amount |  |
| notes | String | notes |  |
| signedById | UUID | signed_by_id |  |
| signedAt | Instant | signed_at |  |
| edoDocumentId | UUID | edo_document_id |  |
| edoStatus | String | edo_status |  |
| edoSentAt | Instant | edo_sent_at |  |
| edoDeliveredAt | Instant | edo_delivered_at |  |
| edoSignedAt | Instant | edo_signed_at |  |
| oneCPostingStatus | OneCPostingStatus | onec_posting_status | ENUM |
| oneCDocumentId | String | onec_document_id |  |
| oneCPostedAt | Instant | onec_posted_at |  |

---

### Ks3Ks2Link (extends BaseEntity)
**File**: `modules/closing/domain/Ks3Ks2Link.java`
**Table**: `ks3_ks2_links`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ks3Id | UUID | ks3_id | NOT NULL |
| ks2Id | UUID | ks2_id | NOT NULL |

---

## Module: commercialProposal

### CommercialProposal (extends BaseEntity)
**File**: `modules/commercialProposal/domain/CommercialProposal.java`
**Table**: `commercial_proposals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| budgetId | UUID | budget_id | NOT NULL |
| name | String | name | NOT NULL |
| status | ProposalStatus | status | ENUM, NOT NULL |
| totalCostPrice | BigDecimal | total_cost_price |  |
| createdById | UUID | created_by_id |  |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |
| notes | String | notes |  |
| specificationId | UUID | specification_id |  |
| totalCustomerPrice | BigDecimal | total_customer_price |  |
| totalMargin | BigDecimal | total_margin |  |
| marginPercent | BigDecimal | margin_percent |  |
| docVersion | Integer | doc_version | NOT NULL |
| parentVersionId | UUID | parent_version_id |  |
| current | boolean | is_current | NOT NULL |
| companyName | String | company_name |  |
| companyInn | String | company_inn |  |
| companyKpp | String | company_kpp |  |
| companyAddress | String | company_address |  |
| signatoryName | String | signatory_name |  |
| signatoryPosition | String | signatory_position |  |

---

### CommercialProposalItem
**File**: `modules/commercialProposal/domain/CommercialProposalItem.java`
**Table**: `commercial_proposal_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| proposalId | UUID | proposal_id | NOT NULL |
| budgetItemId | UUID | budget_item_id | NOT NULL |
| itemType | String | item_type | NOT NULL |
| selectedInvoiceLineId | UUID | selected_invoice_line_id |  |
| estimateItemId | UUID | estimate_item_id |  |
| tradingCoefficient | BigDecimal | trading_coefficient |  |
| costPrice | BigDecimal | cost_price |  |
| quantity | BigDecimal | quantity |  |
| totalCost | BigDecimal | total_cost |  |
| status | ProposalItemStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |
| rejectionReason | String | rejection_reason |  |
| notes | String | notes |  |
| competitiveListEntryId | UUID | competitive_list_entry_id |  |
| competitiveListId | UUID | competitive_list_id |  |
| specItemId | UUID | spec_item_id |  |
| unitPrice | BigDecimal | unit_price |  |
| unit | String | unit |  |
| vendorName | String | vendor_name |  |
| customerPrice | BigDecimal | customer_price |  |
| customerTotal | BigDecimal | customer_total |  |
| bidComparisonId | UUID | bid_comparison_id |  |
| bidWinnerVendorId | UUID | bid_winner_vendor_id |  |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

## Module: common

### FileAttachment (extends BaseEntity)
**File**: `modules/common/domain/FileAttachment.java`
**Table**: `file_attachments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| fileName | String | file_name | NOT NULL |
| fileSize | Long | file_size |  |
| contentType | String | content_type |  |
| storagePath | String | storage_path |  |
| description | String | description |  |
| uploadedBy | String | uploaded_by |  |

---

## Module: compliance

### DataConsent (extends BaseEntity)
**File**: `modules/compliance/domain/DataConsent.java`
**Table**: `data_consents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| consentType | ConsentType | consent_type | ENUM, NOT NULL |
| consentedAt | Instant | consented_at | NOT NULL |
| revokedAt | Instant | revoked_at |  |
| ipAddress | String | ip_address |  |
| userAgent | String | user_agent |  |
| consentVersion | String | consent_version | NOT NULL |
| legalBasis | LegalBasis | legal_basis | ENUM, NOT NULL |
| purpose | String | purpose | NOT NULL |
| dataCategories | String | data_categories |  |
| retentionDays | Integer | retention_days |  |
| isActive | boolean | is_active | NOT NULL |

---

### DataSubjectRequest (extends BaseEntity)
**File**: `modules/compliance/domain/DataSubjectRequest.java`
**Table**: `data_subject_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| requestType | SubjectRequestType | request_type | ENUM, NOT NULL |
| status | SubjectRequestStatus | status | ENUM, NOT NULL |
| description | String | description |  |
| responseText | String | response_text |  |
| completedAt | Instant | completed_at |  |
| deadlineAt | Instant | deadline_at | NOT NULL |
| processedBy | UUID | processed_by |  |

---

### PiiAccessLog (extends BaseEntity)
**File**: `modules/compliance/domain/PiiAccessLog.java`
**Table**: `pii_access_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| fieldName | String | field_name | NOT NULL |
| accessType | PiiAccessType | access_type | ENUM, NOT NULL |
| ipAddress | String | ip_address |  |
| accessedAt | Instant | accessed_at | NOT NULL |

---

### PrivacyPolicy (extends BaseEntity)
**File**: `modules/compliance/domain/PrivacyPolicy.java`
**Table**: `privacy_policies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| title | String | title | NOT NULL |
| content | String | content | NOT NULL |
| versionNumber | String | version_number | NOT NULL |
| effectiveFrom | LocalDate | effective_from | NOT NULL |
| effectiveTo | LocalDate | effective_to |  |
| isCurrent | boolean | is_current | NOT NULL |
| approvedBy | UUID | approved_by |  |
| approvedAt | Instant | approved_at |  |

---

## Module: constructability

### ConstructabilityItem (extends BaseEntity)
**File**: `modules/constructability/domain/ConstructabilityItem.java`
**Table**: `constructability_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| reviewId | UUID | review_id | NOT NULL |
| category | ItemCategory | category | ENUM, NOT NULL |
| description | String | description | NOT NULL |
| severity | ItemSeverity | severity | ENUM, NOT NULL |
| status | ItemStatus | status | ENUM, NOT NULL |
| resolution | String | resolution |  |
| rfiId | UUID | rfi_id |  |
| assignedTo | String | assigned_to |  |

---

### ConstructabilityReview (extends BaseEntity)
**File**: `modules/constructability/domain/ConstructabilityReview.java`
**Table**: `constructability_reviews`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| specificationId | UUID | specification_id |  |
| title | String | title | NOT NULL |
| status | ReviewStatus | status | ENUM, NOT NULL |
| reviewerName | String | reviewer_name | NOT NULL |
| reviewDate | LocalDate | review_date | NOT NULL |
| overallRating | OverallRating | overall_rating | ENUM |
| notes | String | notes |  |

---

## Module: contract

### Contract (extends BaseEntity)
**File**: `modules/contract/domain/Contract.java`
**Table**: `contracts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| number | String | number |  |
| contractDate | LocalDate | contract_date |  |
| partnerId | UUID | partner_id |  |
| partnerName | String | partner_name |  |
| projectId | UUID | project_id |  |
| typeId | UUID | type_id |  |
| status | ContractStatus | status | ENUM, NOT NULL |
| amount | BigDecimal | amount |  |
| vatRate | BigDecimal | vat_rate |  |
| vatAmount | BigDecimal | vat_amount |  |
| totalWithVat | BigDecimal | total_with_vat |  |
| paymentTerms | String | payment_terms |  |
| plannedStartDate | LocalDate | planned_start_date |  |
| plannedEndDate | LocalDate | planned_end_date |  |
| actualStartDate | LocalDate | actual_start_date |  |
| actualEndDate | LocalDate | actual_end_date |  |
| responsibleId | UUID | responsible_id |  |
| retentionPercent | BigDecimal | retention_percent |  |
| docVersion | Integer | doc_version |  |
| versionComment | String | version_comment |  |
| parentVersionId | UUID | parent_version_id |  |
| rejectionReason | String | rejection_reason |  |
| totalInvoiced | BigDecimal | total_invoiced |  |
| totalPaid | BigDecimal | total_paid |  |
| notes | String | notes |  |
| budgetItemId | UUID | budget_item_id |  |
| prepaymentPercent | BigDecimal | prepayment_percent |  |
| paymentDelayDays | Integer | payment_delay_days |  |
| guaranteePeriodMonths | Integer | guarantee_period_months |  |
| direction | ContractDirection | direction | ENUM |

---

### ContractApproval (extends BaseEntity)
**File**: `modules/contract/domain/ContractApproval.java`
**Table**: `contract_approvals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| stage | String | stage | NOT NULL |
| approverId | UUID | approver_id |  |
| approverName | String | approver_name |  |
| status | ApprovalStatus | status | ENUM, NOT NULL |
| approvedAt | Instant | approved_at |  |
| rejectedAt | Instant | rejected_at |  |
| rejectionReason | String | rejection_reason |  |
| comment | String | comment |  |

---

### ContractBudgetItem
**File**: `modules/contract/domain/ContractBudgetItem.java`
**Table**: `contract_budget_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| contractId | UUID | contract_id | NOT NULL |
| budgetItemId | UUID | budget_item_id | NOT NULL |
| allocatedQuantity | BigDecimal | allocated_quantity |  |
| allocatedAmount | BigDecimal | allocated_amount |  |
| notes | String | notes |  |
| coveragePercent | BigDecimal | coverage_percent |  |
| budgetItemName | String | budget_item_name |  |
| totalQuantity | BigDecimal | total_quantity |  |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

### ContractType (extends BaseEntity)
**File**: `modules/contract/domain/ContractType.java`
**Table**: `contract_types`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| sequence | Integer | sequence | NOT NULL |
| active | boolean | active | NOT NULL |
| requiresLawyerApproval | boolean | requires_lawyer_approval | NOT NULL |
| requiresManagementApproval | boolean | requires_management_approval | NOT NULL |
| requiresFinanceApproval | boolean | requires_finance_approval | NOT NULL |

---

## Module: contractExt

### ContractClaim (extends BaseEntity)
**File**: `modules/contractExt/domain/ContractClaim.java`
**Table**: `contract_claims`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| claimType | ClaimType | claim_type | ENUM, NOT NULL |
| subject | String | subject | NOT NULL |
| description | String | description |  |
| amount | BigDecimal | amount |  |
| evidenceUrls | List<String> | evidence_urls | JSONB |
| filedById | UUID | filed_by_id |  |
| filedAt | Instant | filed_at |  |
| respondedAt | Instant | responded_at |  |
| responseText | String | response_text |  |
| status | ClaimStatus | status | ENUM, NOT NULL |
| resolvedAt | Instant | resolved_at |  |
| resolutionNotes | String | resolution_notes |  |

---

### ContractGuarantee (extends BaseEntity)
**File**: `modules/contractExt/domain/ContractGuarantee.java`
**Table**: `contract_guarantees`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| guaranteeType | GuaranteeType | guarantee_type | ENUM, NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| currency | String | currency | NOT NULL |
| issuedBy | String | issued_by |  |
| issuedAt | LocalDate | issued_at |  |
| expiresAt | LocalDate | expires_at |  |
| status | GuaranteeStatus | status | ENUM, NOT NULL |
| documentUrl | String | document_url |  |

---

### ContractInsurance (extends BaseEntity)
**File**: `modules/contractExt/domain/ContractInsurance.java`
**Table**: `contract_insurances`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| policyNumber | String | policy_number | NOT NULL |
| insuranceType | String | insurance_type | NOT NULL |
| insurer | String | insurer | NOT NULL |
| coveredAmount | BigDecimal | covered_amount | NOT NULL |
| premiumAmount | BigDecimal | premium_amount |  |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| status | InsuranceStatus | status | ENUM, NOT NULL |
| policyUrl | String | policy_url |  |

---

### ContractMilestone (extends BaseEntity)
**File**: `modules/contractExt/domain/ContractMilestone.java`
**Table**: `contract_milestones`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| dueDate | LocalDate | due_date | NOT NULL |
| completionCriteria | String | completion_criteria |  |
| amount | BigDecimal | amount |  |
| status | MilestoneStatus | status | ENUM, NOT NULL |
| completedAt | Instant | completed_at |  |
| evidenceUrl | String | evidence_url |  |

---

### ContractSla (extends BaseEntity)
**File**: `modules/contractExt/domain/ContractSla.java`
**Table**: `contract_slas`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| metric | String | metric | NOT NULL |
| targetValue | BigDecimal | target_value | NOT NULL |
| unit | String | unit | NOT NULL |
| measurementPeriod | String | measurement_period |  |
| penaltyAmount | BigDecimal | penalty_amount |  |
| penaltyType | PenaltyType | penalty_type | ENUM |
| isActive | boolean | is_active | NOT NULL |

---

### ContractSupplement (extends BaseEntity)
**File**: `modules/contractExt/domain/ContractSupplement.java`
**Table**: `contract_supplements`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractId | UUID | contract_id | NOT NULL |
| number | String | number | NOT NULL |
| supplementDate | LocalDate | supplement_date | NOT NULL |
| reason | String | reason |  |
| description | String | description |  |
| amountChange | BigDecimal | amount_change |  |
| newTotalAmount | BigDecimal | new_total_amount |  |
| deadlineChange | Integer | deadline_change |  |
| newDeadline | LocalDate | new_deadline |  |
| status | SupplementStatus | status | ENUM, NOT NULL |
| signedAt | Instant | signed_at |  |
| signatories | List<String> | signatories | JSONB |

---

### LegalDocument (extends BaseEntity)
**File**: `modules/contractExt/domain/LegalDocument.java`
**Table**: `legal_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| caseId | UUID | case_id | NOT NULL |
| title | String | title | NOT NULL |
| documentType | String | document_type | NOT NULL |
| fileUrl | String | file_url | NOT NULL |
| uploadedById | UUID | uploaded_by_id |  |
| uploadedAt | Instant | uploaded_at |  |

---

### SlaViolation (extends BaseEntity)
**File**: `modules/contractExt/domain/SlaViolation.java`
**Table**: `sla_violations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| slaId | UUID | sla_id | NOT NULL |
| violationDate | LocalDate | violation_date | NOT NULL |
| actualValue | BigDecimal | actual_value | NOT NULL |
| penaltyAmount | BigDecimal | penalty_amount |  |
| status | ViolationStatus | status | ENUM, NOT NULL |
| notifiedAt | Instant | notified_at |  |
| resolvedAt | Instant | resolved_at |  |

---

### Tolerance (extends BaseEntity)
**File**: `modules/contractExt/domain/Tolerance.java`
**Table**: `tolerances`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| workType | String | work_type | NOT NULL |
| parameter | String | parameter | NOT NULL |
| nominalValue | BigDecimal | nominal_value | NOT NULL |
| unit | String | unit | NOT NULL |
| minDeviation | BigDecimal | min_deviation | NOT NULL |
| maxDeviation | BigDecimal | max_deviation | NOT NULL |
| measurementMethod | String | measurement_method |  |
| referenceStandard | String | reference_standard |  |

---

## Module: costManagement

### BudgetLine (extends BaseEntity)
**File**: `modules/costManagement/domain/BudgetLine.java`
**Table**: `budget_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| costCodeId | UUID | cost_code_id | NOT NULL |
| description | String | description |  |
| originalBudget | BigDecimal | original_budget | NOT NULL |
| approvedChanges | BigDecimal | approved_changes |  |
| revisedBudget | BigDecimal | revised_budget |  |
| committedCost | BigDecimal | committed_cost |  |
| actualCost | BigDecimal | actual_cost |  |
| forecastFinalCost | BigDecimal | forecast_final_cost |  |
| varianceAmount | BigDecimal | variance_amount |  |

---

### CashFlowForecastBucket (extends BaseEntity)
**File**: `modules/costManagement/domain/CashFlowForecastBucket.java`
**Table**: `cash_flow_forecast_buckets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| scenarioId | UUID | scenario_id | NOT NULL |
| projectId | UUID | project_id |  |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| forecastIncome | BigDecimal | forecast_income | NOT NULL |
| forecastExpense | BigDecimal | forecast_expense | NOT NULL |
| forecastNet | BigDecimal | forecast_net | NOT NULL |
| actualIncome | BigDecimal | actual_income | NOT NULL |
| actualExpense | BigDecimal | actual_expense | NOT NULL |
| actualNet | BigDecimal | actual_net | NOT NULL |
| variance | BigDecimal | variance | NOT NULL |
| cumulativeForecastNet | BigDecimal | cumulative_forecast_net | NOT NULL |
| cumulativeActualNet | BigDecimal | cumulative_actual_net | NOT NULL |
| notes | String | notes |  |

---

### CashFlowProjection (extends BaseEntity)
**File**: `modules/costManagement/domain/CashFlowProjection.java`
**Table**: `cash_flow_projections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| plannedIncome | BigDecimal | planned_income |  |
| plannedExpense | BigDecimal | planned_expense |  |
| actualIncome | BigDecimal | actual_income |  |
| actualExpense | BigDecimal | actual_expense |  |
| forecastIncome | BigDecimal | forecast_income |  |
| forecastExpense | BigDecimal | forecast_expense |  |
| cumulativePlannedNet | BigDecimal | cumulative_planned_net |  |
| cumulativeActualNet | BigDecimal | cumulative_actual_net |  |
| notes | String | notes |  |

---

### CashFlowScenario (extends BaseEntity)
**File**: `modules/costManagement/domain/CashFlowScenario.java`
**Table**: `cash_flow_scenarios`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| baselineDate | LocalDate | baseline_date |  |
| horizonMonths | int | horizon_months | NOT NULL |
| growthRatePercent | BigDecimal | growth_rate_percent | NOT NULL |
| paymentDelayDays | int | payment_delay_days | NOT NULL |
| retentionPercent | BigDecimal | retention_percent | NOT NULL |
| includeVat | boolean | include_vat | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### Commitment (extends BaseEntity)
**File**: `modules/costManagement/domain/Commitment.java`
**Table**: `commitments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| number | String | number |  |
| title | String | title | NOT NULL |
| commitmentType | CommitmentType | commitment_type | ENUM, NOT NULL |
| status | CommitmentStatus | status | ENUM, NOT NULL |
| vendorId | UUID | vendor_id |  |
| contractId | UUID | contract_id |  |
| originalAmount | BigDecimal | original_amount | NOT NULL |
| revisedAmount | BigDecimal | revised_amount |  |
| approvedChangeOrders | BigDecimal | approved_change_orders |  |
| invoicedAmount | BigDecimal | invoiced_amount |  |
| paidAmount | BigDecimal | paid_amount |  |
| retentionPercent | BigDecimal | retention_percent |  |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| costCodeId | UUID | cost_code_id |  |

---

### CommitmentItem (extends BaseEntity)
**File**: `modules/costManagement/domain/CommitmentItem.java`
**Table**: `commitment_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| commitmentId | UUID | commitment_id | NOT NULL |
| description | String | description | NOT NULL |
| costCodeId | UUID | cost_code_id |  |
| quantity | BigDecimal | quantity |  |
| unit | String | unit |  |
| unitPrice | BigDecimal | unit_price |  |
| totalPrice | BigDecimal | total_price |  |
| invoicedAmount | BigDecimal | invoiced_amount |  |
| sortOrder | Integer | sort_order |  |

---

### CostCode (extends BaseEntity)
**File**: `modules/costManagement/domain/CostCode.java`
**Table**: `cost_codes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| parentId | UUID | parent_id |  |
| level | CostCodeLevel | level | ENUM, NOT NULL |
| budgetAmount | BigDecimal | budget_amount |  |
| isActive | Boolean | is_active | NOT NULL |

---

### CostForecast (extends BaseEntity)
**File**: `modules/costManagement/domain/CostForecast.java`
**Table**: `cost_forecasts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| forecastDate | LocalDate | forecast_date | NOT NULL |
| forecastMethod | ForecastMethod | forecast_method | ENUM |
| budgetAtCompletion | BigDecimal | budget_at_completion |  |
| earnedValue | BigDecimal | earned_value |  |
| plannedValue | BigDecimal | planned_value |  |
| actualCost | BigDecimal | actual_cost |  |
| estimateAtCompletion | BigDecimal | estimate_at_completion |  |
| estimateToComplete | BigDecimal | estimate_to_complete |  |
| varianceAtCompletion | BigDecimal | variance_at_completion |  |
| costPerformanceIndex | BigDecimal | cost_performance_index |  |
| schedulePerformanceIndex | BigDecimal | schedule_performance_index |  |
| costVariance | BigDecimal | cost_variance |  |
| scheduleVariance | BigDecimal | schedule_variance |  |
| percentComplete | BigDecimal | percent_complete |  |
| notes | String | notes |  |
| createdById | UUID | created_by_id |  |

---

### ProfitabilityForecast (extends BaseEntity)
**File**: `modules/costManagement/domain/ProfitabilityForecast.java`
**Table**: `profitability_forecasts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| projectName | String | project_name |  |
| contractAmount | BigDecimal | contract_amount |  |
| originalBudget | BigDecimal | original_budget |  |
| revisedBudget | BigDecimal | revised_budget |  |
| actualCostToDate | BigDecimal | actual_cost_to_date |  |
| earnedValueToDate | BigDecimal | earned_value_to_date |  |
| estimateAtCompletion | BigDecimal | estimate_at_completion |  |
| estimateToComplete | BigDecimal | estimate_to_complete |  |
| forecastMargin | BigDecimal | forecast_margin |  |
| forecastMarginPercent | BigDecimal | forecast_margin_percent |  |
| originalMargin | BigDecimal | original_margin |  |
| profitFadeAmount | BigDecimal | profit_fade_amount |  |
| profitFadePercent | BigDecimal | profit_fade_percent |  |
| wipAmount | BigDecimal | wip_amount |  |
| overBillingAmount | BigDecimal | over_billing_amount |  |
| underBillingAmount | BigDecimal | under_billing_amount |  |
| completionPercent | BigDecimal | completion_percent |  |
| riskLevel | ProfitabilityRiskLevel | risk_level | ENUM |
| lastCalculatedAt | LocalDateTime | last_calculated_at |  |
| notes | String | notes |  |

---

### ProfitabilitySnapshot (extends BaseEntity)
**File**: `modules/costManagement/domain/ProfitabilitySnapshot.java`
**Table**: `profitability_snapshots`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| forecastId | UUID | forecast_id |  |
| snapshotDate | LocalDate | snapshot_date | NOT NULL |
| eac | BigDecimal | eac |  |
| etc | BigDecimal | etc |  |
| actualCost | BigDecimal | actual_cost |  |
| earnedValue | BigDecimal | earned_value |  |
| forecastMargin | BigDecimal | forecast_margin |  |
| forecastMarginPercent | BigDecimal | forecast_margin_percent |  |
| wipAmount | BigDecimal | wip_amount |  |
| profitFadeAmount | BigDecimal | profit_fade_amount |  |
| completionPercent | BigDecimal | completion_percent |  |

---

## Module: crm

### CrmActivity (extends BaseEntity)
**File**: `modules/crm/domain/CrmActivity.java`
**Table**: `crm_activities`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| leadId | UUID | lead_id | NOT NULL |
| activityType | CrmActivityType | activity_type | ENUM, NOT NULL |
| userId | UUID | user_id | NOT NULL |
| summary | String | summary |  |
| notes | String | notes |  |
| scheduledAt | LocalDateTime | scheduled_at |  |
| completedAt | LocalDateTime | completed_at |  |
| result | String | result |  |

---

### CrmLead (extends BaseEntity)
**File**: `modules/crm/domain/CrmLead.java`
**Table**: `crm_leads`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| partnerName | String | partner_name |  |
| email | String | email |  |
| phone | String | phone |  |
| companyName | String | company_name |  |
| source | String | source |  |
| medium | String | medium |  |
| stageId | UUID | stage_id |  |
| assignedToId | UUID | assigned_to_id |  |
| expectedRevenue | BigDecimal | expected_revenue |  |
| probability | int | probability |  |
| priority | LeadPriority | priority | ENUM, NOT NULL |
| description | String | description |  |
| status | LeadStatus | status | ENUM, NOT NULL |
| lostReason | String | lost_reason |  |
| wonDate | LocalDate | won_date |  |
| projectId | UUID | project_id |  |
| nextActivityDate | LocalDate | next_activity_date |  |

---

### CrmStage (extends BaseEntity)
**File**: `modules/crm/domain/CrmStage.java`
**Table**: `crm_stages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| name | String | name | NOT NULL |
| sequence | int | sequence | NOT NULL |
| probability | int | probability | NOT NULL |
| closed | boolean | is_closed | NOT NULL |
| won | boolean | is_won | NOT NULL |
| requirements | String | requirements |  |

---

### CrmTeam (extends BaseEntity)
**File**: `modules/crm/domain/CrmTeam.java`
**Table**: `crm_teams`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| leaderId | UUID | leader_id |  |
| memberIds | String | member_ids |  |
| targetRevenue | BigDecimal | target_revenue |  |
| color | String | color |  |
| active | boolean | is_active | NOT NULL |

---

## Module: dailylog

### DailyLog (extends BaseEntity)
**File**: `modules/dailylog/domain/DailyLog.java`
**Table**: `daily_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | UNIQUE |
| projectId | UUID | project_id | NOT NULL |
| logDate | LocalDate | log_date | NOT NULL |
| weatherConditions | WeatherCondition | weather_conditions | ENUM, NOT NULL |
| temperatureMin | BigDecimal | temperature_min |  |
| temperatureMax | BigDecimal | temperature_max |  |
| windSpeed | BigDecimal | wind_speed |  |
| shiftSupervisorId | UUID | shift_supervisor_id |  |
| shiftSupervisorName | String | shift_supervisor_name |  |
| status | DailyLogStatus | status | ENUM, NOT NULL |
| generalNotes | String | general_notes |  |

---

### DailyLogEntry (extends BaseEntity)
**File**: `modules/dailylog/domain/DailyLogEntry.java`
**Table**: `daily_log_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| dailyLogId | UUID | daily_log_id | NOT NULL |
| entryType | EntryType | entry_type | ENUM, NOT NULL |
| description | String | description | NOT NULL |
| quantity | BigDecimal | quantity |  |
| unit | String | unit |  |
| startTime | LocalTime | start_time |  |
| endTime | LocalTime | end_time |  |
| responsibleName | String | responsible_name |  |
| taskId | UUID | task_id |  |

---

### DailyLogPhoto (extends BaseEntity)
**File**: `modules/dailylog/domain/DailyLogPhoto.java`
**Table**: `daily_log_photos`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| dailyLogId | UUID | daily_log_id | NOT NULL |
| photoUrl | String | photo_url | NOT NULL |
| thumbnailUrl | String | thumbnail_url |  |
| caption | String | caption |  |
| takenAt | Instant | taken_at |  |
| takenById | UUID | taken_by_id |  |
| gpsLatitude | BigDecimal | gps_latitude |  |
| gpsLongitude | BigDecimal | gps_longitude |  |

---

## Module: dataExchange

### ExportJob (extends BaseEntity)
**File**: `modules/dataExchange/domain/ExportJob.java`
**Table**: `export_jobs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| format | ExportFormat | format | ENUM |
| fileName | String | file_name |  |
| filters | String | filters |  |
| totalRows | Integer | total_rows |  |
| status | String | status |  |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| fileUrl | String | file_url |  |
| requestedById | UUID | requested_by_id |  |
| projectId | UUID | project_id |  |

---

### ImportJob (extends BaseEntity)
**File**: `modules/dataExchange/domain/ImportJob.java`
**Table**: `import_jobs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| fileName | String | file_name | NOT NULL |
| fileSize | Long | file_size |  |
| status | ImportStatus | status | ENUM, NOT NULL |
| totalRows | Integer | total_rows |  |
| processedRows | Integer | processed_rows |  |
| successRows | Integer | success_rows |  |
| errorRows | Integer | error_rows |  |
| errors | String | errors |  |
| mappingId | UUID | mapping_id |  |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| startedById | UUID | started_by_id |  |
| projectId | UUID | project_id |  |

---

### ImportMapping (extends BaseEntity)
**File**: `modules/dataExchange/domain/ImportMapping.java`
**Table**: `import_mappings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| mappingConfig | String | mapping_config |  |
| isDefault | Boolean | is_default | NOT NULL |
| createdById | UUID | created_by_id |  |

---

## Module: design

### DesignReview (extends BaseEntity)
**File**: `modules/design/domain/DesignReview.java`
**Table**: `design_reviews`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| designVersionId | UUID | design_version_id | NOT NULL |
| reviewerId | UUID | reviewer_id | NOT NULL |
| reviewerName | String | reviewer_name |  |
| status | DesignReviewStatus | status | ENUM, NOT NULL |
| comments | String | comments |  |
| reviewedAt | LocalDateTime | reviewed_at |  |

---

### DesignSection (extends BaseEntity)
**File**: `modules/design/domain/DesignSection.java`
**Table**: `design_sections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| code | String | code | NOT NULL |
| discipline | String | discipline |  |
| parentId | UUID | parent_id |  |
| sequence | int | sequence | NOT NULL |
| description | String | description |  |

---

### DesignVersion (extends BaseEntity)
**File**: `modules/design/domain/DesignVersion.java`
**Table**: `design_versions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| documentId | UUID | document_id |  |
| versionNumber | String | version_number | NOT NULL |
| title | String | title | NOT NULL |
| discipline | String | discipline |  |
| author | String | author |  |
| status | DesignVersionStatus | status | ENUM, NOT NULL |
| reviewDeadline | LocalDate | review_deadline |  |
| fileUrl | String | file_url |  |
| fileSize | Long | file_size |  |
| changeDescription | String | change_description |  |

---

## Module: document

### Document (extends BaseEntity)
**File**: `modules/document/domain/Document.java`
**Table**: `documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| title | String | title | NOT NULL |
| documentNumber | String | document_number |  |
| category | DocumentCategory | category | ENUM |
| status | DocumentStatus | status | ENUM, NOT NULL |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| description | String | description |  |
| fileName | String | file_name |  |
| fileSize | Long | file_size |  |
| mimeType | String | mime_type |  |
| storagePath | String | storage_path |  |
| docVersion | Integer | doc_version |  |
| parentVersionId | UUID | parent_version_id |  |
| authorId | UUID | author_id |  |
| authorName | String | author_name |  |
| tags | String | tags |  |
| expiryDate | LocalDate | expiry_date |  |
| notes | String | notes |  |
| pdSection | String | pd_section |  |

---

### DocumentAccess (extends BaseEntity)
**File**: `modules/document/domain/DocumentAccess.java`
**Table**: `document_access`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentId | UUID | document_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| accessLevel | AccessLevel | access_level | ENUM, NOT NULL |
| grantedById | UUID | granted_by_id |  |
| grantedByName | String | granted_by_name |  |

---

### DocumentComment (extends BaseEntity)
**File**: `modules/document/domain/DocumentComment.java`
**Table**: `document_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentId | UUID | document_id | NOT NULL |
| authorId | UUID | author_id |  |
| authorName | String | author_name |  |
| content | String | content | NOT NULL |

---

### DrawingMarkup (extends BaseEntity)
**File**: `modules/document/domain/DrawingMarkup.java`
**Table**: `drawing_markups`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| pageNumber | Integer | page_number | NOT NULL |
| markupType | String | markup_type | NOT NULL |
| x | BigDecimal | x | NOT NULL |
| y | BigDecimal | y | NOT NULL |
| width | BigDecimal | width |  |
| height | BigDecimal | height |  |
| rotation | BigDecimal | rotation |  |
| color | String | color |  |
| strokeWidth | Integer | stroke_width |  |
| textContent | String | text_content |  |
| authorName | String | author_name |  |
| status | String | status | NOT NULL |

---

## Module: email

### EmailAttachment
**File**: `modules/email/domain/EmailAttachment.java`
**Table**: `email_attachments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| fileName | String | file_name | NOT NULL |
| contentType | String | content_type |  |
| sizeBytes | Long | size_bytes |  |
| storagePath | String | storage_path |  |
| createdAt | Instant | created_at |  |

**Relationships**:
- ManyToOne → EmailMessage `emailMessage` (FK: email_id)

---

### EmailLog
**File**: `modules/email/domain/EmailLog.java`
**Table**: `email_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| organizationId | UUID | organization_id |  |
| toEmail | String | to_email | NOT NULL |
| subject | String | subject | NOT NULL |
| body | String | body |  |
| status | EmailLogStatus | status | ENUM, NOT NULL |
| errorMessage | String | error_message |  |
| sentAt | Instant | sent_at |  |
| createdAt | Instant | created_at |  |

---

### EmailMessage
**File**: `modules/email/domain/EmailMessage.java`
**Table**: `email_messages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| messageUid | String | message_uid | NOT NULL |
| messageIdHeader | String | message_id_header |  |
| folder | String | folder | NOT NULL |
| fromAddress | String | from_address | NOT NULL |
| fromName | String | from_name |  |
| toAddresses | String | to_addresses |  |
| ccAddresses | String | cc_addresses |  |
| bccAddresses | String | bcc_addresses |  |
| subject | String | subject |  |
| bodyText | String | body_text |  |
| bodyHtml | String | body_html |  |
| receivedAt | Instant | received_at | NOT NULL |
| isRead | boolean | is_read |  |
| isStarred | boolean | is_starred |  |
| isDraft | boolean | is_draft |  |
| hasAttachments | boolean | has_attachments |  |
| inReplyTo | String | in_reply_to |  |
| referencesHeader | String | references_header |  |
| rawHeaders | String | raw_headers |  |
| createdAt | Instant | created_at |  |
| updatedAt | Instant | updated_at |  |

**Relationships**:
- OneToMany → EmailAttachment `attachments`
- OneToMany → EmailProjectLink `projectLinks`

---

### EmailProjectLink
**File**: `modules/email/domain/EmailProjectLink.java`
**Table**: `email_project_links`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| linkedBy | UUID | linked_by |  |
| linkedAt | Instant | linked_at |  |

**Relationships**:
- ManyToOne → EmailMessage `emailMessage` (FK: email_id)

---

## Module: esg

### EsgReport (extends BaseEntity)
**File**: `modules/esg/domain/EsgReport.java`
**Table**: `esg_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| reportType | EsgReportType | report_type | ENUM, NOT NULL |
| reportPeriod | String | report_period |  |
| status | EsgReportStatus | status | ENUM, NOT NULL |
| title | String | title | NOT NULL |
| totalCarbon | BigDecimal | total_carbon |  |
| totalEnergy | BigDecimal | total_energy |  |
| totalWaste | BigDecimal | total_waste |  |
| totalWater | BigDecimal | total_water |  |
| wasteDiversionRate | BigDecimal | waste_diversion_rate |  |
| carbonIntensity | BigDecimal | carbon_intensity |  |
| dataJson | String | data_json |  |
| carbonTarget | BigDecimal | carbon_target |  |
| carbonTargetMet | Boolean | carbon_target_met |  |
| benchmarkJson | String | benchmark_json |  |
| generatedAt | Instant | generated_at |  |
| approvedBy | UUID | approved_by |  |
| approvedAt | Instant | approved_at |  |
| notes | String | notes |  |

---

### MaterialGwpEntry (extends BaseEntity)
**File**: `modules/esg/domain/MaterialGwpEntry.java`
**Table**: `material_gwp_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| materialCategory | EsgMaterialCategory | material_category | ENUM, NOT NULL |
| materialSubcategory | String | material_subcategory |  |
| name | String | name | NOT NULL |
| gwpPerUnit | BigDecimal | gwp_per_unit | NOT NULL |
| unit | String | unit | NOT NULL |
| source | String | source |  |
| country | String | country |  |
| dataYear | Integer | data_year |  |
| isVerified | boolean | is_verified |  |
| notes | String | notes |  |

---

### ProjectCarbonFootprint (extends BaseEntity)
**File**: `modules/esg/domain/ProjectCarbonFootprint.java`
**Table**: `project_carbon_footprints`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| totalEmbodiedCarbon | BigDecimal | total_embodied_carbon |  |
| materialBreakdownJson | String | material_breakdown_json |  |
| totalEnergyKwh | BigDecimal | total_energy_kwh |  |
| energySourceBreakdownJson | String | energy_source_breakdown_json |  |
| totalWasteTons | BigDecimal | total_waste_tons |  |
| wasteDivertedTons | BigDecimal | waste_diverted_tons |  |
| wasteDiversionRate | BigDecimal | waste_diversion_rate |  |
| wasteBreakdownJson | String | waste_breakdown_json |  |
| totalWaterM3 | BigDecimal | total_water_m3 |  |
| totalCarbonFootprint | BigDecimal | total_carbon_footprint |  |
| carbonPerSqm | BigDecimal | carbon_per_sqm |  |
| builtAreaSqm | BigDecimal | built_area_sqm |  |
| calculatedAt | Instant | calculated_at | NOT NULL |
| periodFrom | LocalDate | period_from |  |
| periodTo | LocalDate | period_to |  |

---

## Module: estimate

### Estimate (extends BaseEntity)
**File**: `modules/estimate/domain/Estimate.java`
**Table**: `estimates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| contractId | UUID | contract_id |  |
| specificationId | UUID | specification_id | NOT NULL |
| status | EstimateStatus | status | ENUM, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| orderedAmount | BigDecimal | ordered_amount | NOT NULL |
| invoicedAmount | BigDecimal | invoiced_amount | NOT NULL |
| totalSpent | BigDecimal | total_spent | NOT NULL |
| notes | String | notes |  |

---

### EstimateItem (extends BaseEntity)
**File**: `modules/estimate/domain/EstimateItem.java`
**Table**: `estimate_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| estimateId | UUID | estimate_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| specItemId | UUID | spec_item_id |  |
| sequence | Integer | sequence | NOT NULL |
| name | String | name | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| unitOfMeasure | String | unit_of_measure | NOT NULL |
| unitPrice | BigDecimal | unit_price | NOT NULL |
| unitPriceCustomer | BigDecimal | unit_price_customer |  |
| amount | BigDecimal | amount |  |
| amountCustomer | BigDecimal | amount_customer |  |
| orderedAmount | BigDecimal | ordered_amount | NOT NULL |
| invoicedAmount | BigDecimal | invoiced_amount | NOT NULL |
| deliveredAmount | BigDecimal | delivered_amount | NOT NULL |
| notes | String | notes |  |

---

### EstimateVersion (extends BaseEntity)
**File**: `modules/estimate/domain/EstimateVersion.java`
**Table**: `estimate_versions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| estimateId | UUID | estimate_id | NOT NULL |
| versionNumber | String | version_number | NOT NULL |
| parentVersionId | UUID | parent_version_id |  |
| versionData | String | version_data |  |
| reason | String | reason | NOT NULL |
| comment | String | comment |  |
| isCurrent | boolean | is_current | NOT NULL |

---

### ExportHistory (extends BaseEntity)
**File**: `modules/estimate/domain/ExportHistory.java`
**Table**: `estimate_export_history`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| estimateId | UUID | estimate_id | NOT NULL |
| estimateName | String | estimate_name |  |
| exportDate | Instant | export_date | NOT NULL |
| format | String | format | NOT NULL |
| status | String | status | NOT NULL |

---

### ImportHistory (extends BaseEntity)
**File**: `modules/estimate/domain/ImportHistory.java`
**Table**: `estimate_import_history`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| fileName | String | file_name | NOT NULL |
| format | String | format | NOT NULL |
| importDate | Instant | import_date | NOT NULL |
| status | String | status | NOT NULL |
| itemsImported | int | items_imported |  |
| errors | String | errors |  |

---

### LocalEstimate (extends BaseEntity)
**File**: `modules/estimate/domain/LocalEstimate.java`
**Table**: `local_estimates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| name | String | name | NOT NULL |
| number | String | number |  |
| objectName | String | object_name |  |
| calculationMethod | CalculationMethod | calculation_method | ENUM, NOT NULL |
| region | String | region |  |
| baseYear | Integer | base_year |  |
| priceLevelQuarter | String | price_level_quarter |  |
| status | LocalEstimateStatus | status | ENUM, NOT NULL |
| totalDirectCost | BigDecimal | total_direct_cost |  |
| totalOverhead | BigDecimal | total_overhead |  |
| totalEstimatedProfit | BigDecimal | total_estimated_profit |  |
| totalWithVat | BigDecimal | total_with_vat |  |
| vatRate | BigDecimal | vat_rate |  |
| notes | String | notes |  |
| calculatedAt | Instant | calculated_at |  |
| overheadRate | BigDecimal | overhead_rate |  |
| profitRate | BigDecimal | profit_rate |  |

---

### LocalEstimateLine (extends BaseEntity)
**File**: `modules/estimate/domain/LocalEstimateLine.java`
**Table**: `local_estimate_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| estimateId | UUID | estimate_id | NOT NULL |
| lineNumber | int | line_number | NOT NULL |
| rateId | UUID | rate_id |  |
| justification | String | justification |  |
| name | String | name | NOT NULL |
| unit | String | unit |  |
| quantity | BigDecimal | quantity | NOT NULL |
| baseLaborCost | BigDecimal | base_labor_cost |  |
| baseMaterialCost | BigDecimal | base_material_cost |  |
| baseEquipmentCost | BigDecimal | base_equipment_cost |  |
| baseOverheadCost | BigDecimal | base_overhead_cost |  |
| baseTotal | BigDecimal | base_total |  |
| currentLaborCost | BigDecimal | current_labor_cost |  |
| currentMaterialCost | BigDecimal | current_material_cost |  |
| currentEquipmentCost | BigDecimal | current_equipment_cost |  |
| currentOverheadCost | BigDecimal | current_overhead_cost |  |
| currentTotal | BigDecimal | current_total |  |
| laborIndex | BigDecimal | labor_index |  |
| materialIndex | BigDecimal | material_index |  |
| equipmentIndex | BigDecimal | equipment_index |  |
| notes | String | notes |  |
| normativeCode | String | normative_code |  |
| normHours | BigDecimal | norm_hours |  |
| basePrice2001 | BigDecimal | base_price_2001 |  |
| priceIndex | BigDecimal | price_index |  |
| currentPrice | BigDecimal | current_price |  |
| directCosts | BigDecimal | direct_costs |  |
| overheadCosts | BigDecimal | overhead_costs |  |
| estimatedProfit | BigDecimal | estimated_profit |  |
| budgetItemId | UUID | budget_item_id |  |
| lineType | String | line_type |  |
| positionType | String | position_type |  |
| resourceType | String | resource_type |  |
| parentLineId | UUID | parent_line_id |  |
| sectionName | String | section_name |  |
| quantityPerUnit | BigDecimal | quantity_per_unit |  |
| quantityCoeff | BigDecimal | quantity_coeff |  |
| coefficients | String | coefficients |  |
| totalAmount | BigDecimal | total_amount |  |
| normativeSource | String | normative_source |  |

---

### LocalEstimateSummary
**File**: `modules/estimate/domain/LocalEstimateSummary.java`
**Table**: `local_estimate_summaries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| estimateId | UUID | estimate_id | NOT NULL |
| directCostsTotal | BigDecimal | direct_costs_total |  |
| overheadTotal | BigDecimal | overhead_total |  |
| profitTotal | BigDecimal | profit_total |  |
| subtotal | BigDecimal | subtotal |  |
| winterSurcharge | BigDecimal | winter_surcharge |  |
| winterSurchargeRate | BigDecimal | winter_surcharge_rate |  |
| tempStructures | BigDecimal | temp_structures |  |
| tempStructuresRate | BigDecimal | temp_structures_rate |  |
| contingency | BigDecimal | contingency |  |
| contingencyRate | BigDecimal | contingency_rate |  |
| vatRate | BigDecimal | vat_rate |  |
| vatAmount | BigDecimal | vat_amount |  |
| grandTotal | BigDecimal | grand_total |  |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

### MinstroyIndexImport (extends BaseEntity)
**File**: `modules/estimate/domain/MinstroyIndexImport.java`
**Table**: `minstroy_index_imports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| quarter | String | quarter | NOT NULL |
| importSource | String | import_source |  |
| importDate | Instant | import_date | NOT NULL |
| indicesCount | int | indices_count | NOT NULL |
| status | String | status | NOT NULL |
| notes | String | notes |  |

---

### NormativeSection (extends BaseEntity)
**File**: `modules/estimate/domain/NormativeSection.java`
**Table**: `normative_sections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| databaseId | UUID | database_id | NOT NULL |
| parentId | UUID | parent_id |  |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| level | int | level | NOT NULL |
| sortOrder | int | sort_order | NOT NULL |
| description | String | description |  |

---

### RateResourceItem (extends BaseEntity)
**File**: `modules/estimate/domain/RateResourceItem.java`
**Table**: `rate_resource_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| rateId | UUID | rate_id | NOT NULL |
| resourceType | ResourceType | resource_type | ENUM, NOT NULL |
| resourceCode | String | resource_code |  |
| resourceName | String | resource_name | NOT NULL |
| unit | String | unit |  |
| quantityPerUnit | BigDecimal | quantity_per_unit | NOT NULL |
| basePrice | BigDecimal | base_price |  |

---

### VolumeCalculation (extends BaseEntity)
**File**: `modules/estimate/domain/VolumeCalculation.java`
**Table**: `estimate_volume_calculations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| workType | String | work_type | NOT NULL |
| params | String | params |  |
| result | BigDecimal | result |  |
| unit | String | unit |  |
| linkedEstimateItemId | UUID | linked_estimate_item_id |  |

---

## Module: feedback

### UserFeedback
**File**: `modules/feedback/domain/UserFeedback.java`
**Table**: `user_feedback`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| userId | UUID | user_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| type | FeedbackType | type | ENUM, NOT NULL |
| score | int | score | NOT NULL |
| comment | String | comment |  |
| page | String | page |  |
| createdAt | Instant | created_at | NOT NULL |

---

## Module: finance

### Budget (extends BaseEntity)
**File**: `modules/finance/domain/Budget.java`
**Table**: `budgets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| name | String | name | NOT NULL |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| status | BudgetStatus | status | ENUM, NOT NULL |
| plannedRevenue | BigDecimal | planned_revenue |  |
| plannedCost | BigDecimal | planned_cost |  |
| plannedMargin | BigDecimal | planned_margin |  |
| actualRevenue | BigDecimal | actual_revenue |  |
| actualCost | BigDecimal | actual_cost |  |
| actualMargin | BigDecimal | actual_margin |  |
| docVersion | Integer | doc_version |  |
| notes | String | notes |  |
| contingencyPercent | BigDecimal | contingency_percent |  |
| overheadPercent | BigDecimal | overhead_percent |  |
| tempStructuresPercent | BigDecimal | temp_structures_percent |  |

---

### BudgetItem (extends BaseEntity)
**File**: `modules/finance/domain/BudgetItem.java`
**Table**: `budget_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| budgetId | UUID | budget_id | NOT NULL |
| sequence | Integer | sequence |  |
| category | BudgetCategory | category | ENUM, NOT NULL |
| name | String | name | NOT NULL |
| plannedAmount | BigDecimal | planned_amount | NOT NULL |
| actualAmount | BigDecimal | actual_amount |  |
| committedAmount | BigDecimal | committed_amount |  |
| remainingAmount | BigDecimal | remaining_amount |  |
| notes | String | notes |  |
| marginAmount | BigDecimal | margin_amount |  |
| marginPercent | BigDecimal | margin_percent |  |
| sectionId | UUID | section_id |  |
| customerPrice | BigDecimal | customer_price |  |
| quantity | BigDecimal | quantity |  |
| unit | String | unit |  |
| disciplineMark | String | discipline_mark |  |
| customerTotal | BigDecimal | customer_total |  |
| section | boolean | is_section | NOT NULL |
| contractedAmount | BigDecimal | contracted_amount |  |
| parentId | UUID | parent_id |  |
| itemType | BudgetItemType | item_type | ENUM |
| costPrice | BigDecimal | cost_price |  |
| estimatePrice | BigDecimal | estimate_price |  |
| coefficient | BigDecimal | coefficient |  |
| salePrice | BigDecimal | sale_price |  |
| vatRate | BigDecimal | vat_rate |  |
| vatAmount | BigDecimal | vat_amount |  |
| totalWithVat | BigDecimal | total_with_vat |  |
| actSignedAmount | BigDecimal | act_signed_amount |  |
| invoicedAmount | BigDecimal | invoiced_amount |  |
| paidAmount | BigDecimal | paid_amount |  |
| docStatus | BudgetItemDocStatus | doc_status | ENUM |
| priceSourceType | BudgetItemPriceSource | price_source_type | ENUM |
| priceSourceId | UUID | price_source_id |  |
| wbsNodeId | UUID | wbs_node_id |  |

---

### BudgetItemDistribution (extends BaseEntity)
**File**: `modules/finance/domain/BudgetItemDistribution.java`
**Table**: `budget_item_distributions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| budgetItemId | UUID | budget_item_id | NOT NULL |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| periodType | String | period_type |  |
| plannedAmount | BigDecimal | planned_amount |  |
| plannedQuantity | BigDecimal | planned_quantity |  |
| actualAmount | BigDecimal | actual_amount |  |
| actualQuantity | BigDecimal | actual_quantity |  |
| notes | String | notes |  |

---

### BudgetSnapshot (extends BaseEntity)
**File**: `modules/finance/domain/BudgetSnapshot.java`
**Table**: `budget_snapshots`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| budgetId | UUID | budget_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| snapshotName | String | snapshot_name | NOT NULL |
| snapshotType | SnapshotType | snapshot_type | ENUM, NOT NULL |
| sourceSnapshotId | UUID | source_snapshot_id |  |
| snapshotDate | Instant | snapshot_date | NOT NULL |
| createdById | UUID | created_by_id |  |
| totalCost | BigDecimal | total_cost |  |
| totalCustomer | BigDecimal | total_customer |  |
| totalMargin | BigDecimal | total_margin |  |
| marginPercent | BigDecimal | margin_percent |  |
| itemsJson | String | items_json | JSONB, NOT NULL |
| notes | String | notes |  |

---

### CashFlowEntry (extends BaseEntity)
**File**: `modules/finance/domain/CashFlowEntry.java`
**Table**: `cash_flow_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| entryDate | LocalDate | entry_date | NOT NULL |
| direction | String | direction | NOT NULL |
| category | CashFlowCategory | category | ENUM, NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| description | String | description |  |
| paymentId | UUID | payment_id |  |
| invoiceId | UUID | invoice_id |  |
| notes | String | notes |  |

---

### CostCode (extends BaseEntity)
**File**: `modules/finance/domain/CostCode.java`
**Table**: `cost_codes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| parentId | UUID | parent_id |  |
| level | Integer | level | NOT NULL |
| standard | String | standard | NOT NULL |
| isActive | Boolean | is_active | NOT NULL |

---

### Invoice (extends BaseEntity)
**File**: `modules/finance/domain/Invoice.java`
**Table**: `invoices`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| number | String | number | UNIQUE |
| invoiceDate | LocalDate | invoice_date | NOT NULL |
| dueDate | LocalDate | due_date |  |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| partnerId | UUID | partner_id |  |
| partnerName | String | partner_name |  |
| disciplineMark | String | discipline_mark |  |
| invoiceType | InvoiceType | invoice_type | ENUM, NOT NULL |
| status | InvoiceStatus | status | ENUM, NOT NULL |
| matchingStatus | InvoiceMatchingStatus | matching_status | ENUM |
| subtotal | BigDecimal | subtotal |  |
| vatRate | BigDecimal | vat_rate |  |
| vatAmount | BigDecimal | vat_amount |  |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| paidAmount | BigDecimal | paid_amount |  |
| remainingAmount | BigDecimal | remaining_amount |  |
| ks2Id | UUID | ks2_id |  |
| ks3Id | UUID | ks3_id |  |
| notes | String | notes |  |
| prepaymentPercent | BigDecimal | prepayment_percent |  |
| paymentDelayDays | Integer | payment_delay_days |  |
| matchedPoId | UUID | matched_po_id |  |
| matchedReceiptId | UUID | matched_receipt_id |  |
| matchingConfidence | BigDecimal | matching_confidence |  |

---

### InvoiceLine (extends BaseEntity)
**File**: `modules/finance/domain/InvoiceLine.java`
**Table**: `invoice_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| invoiceId | UUID | invoice_id | NOT NULL |
| sequence | Integer | sequence |  |
| name | String | name | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| unitPrice | BigDecimal | unit_price | NOT NULL |
| amount | BigDecimal | amount |  |
| unitOfMeasure | String | unit_of_measure |  |
| budgetItemId | UUID | budget_item_id |  |
| cpItemId | UUID | cp_item_id |  |
| selectedForCp | boolean | selected_for_cp |  |

---

### Payment (extends BaseEntity)
**File**: `modules/finance/domain/Payment.java`
**Table**: `payments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| number | String | number | UNIQUE |
| paymentDate | LocalDate | payment_date | NOT NULL |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| partnerId | UUID | partner_id |  |
| partnerName | String | partner_name |  |
| paymentType | PaymentType | payment_type | ENUM, NOT NULL |
| status | PaymentStatus | status | ENUM, NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| vatAmount | BigDecimal | vat_amount |  |
| totalAmount | BigDecimal | total_amount |  |
| purpose | String | purpose |  |
| bankAccount | String | bank_account |  |
| invoiceId | UUID | invoice_id |  |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |
| paidAt | Instant | paid_at |  |
| notes | String | notes |  |

---

### ProjectSection (extends BaseEntity)
**File**: `modules/finance/domain/ProjectSection.java`
**Table**: `project_sections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| enabled | boolean | is_enabled | NOT NULL |
| custom | boolean | is_custom | NOT NULL |
| sequence | Integer | sequence | NOT NULL |

---

### ReconciliationAct (extends BaseEntity)
**File**: `modules/finance/domain/ReconciliationAct.java`
**Table**: `reconciliation_acts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| actNumber | String | act_number | NOT NULL, UNIQUE |
| counterpartyId | UUID | counterparty_id | NOT NULL |
| contractId | UUID | contract_id |  |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| ourDebit | BigDecimal | our_debit |  |
| ourCredit | BigDecimal | our_credit |  |
| ourBalance | BigDecimal | our_balance |  |
| counterpartyDebit | BigDecimal | counterparty_debit |  |
| counterpartyCredit | BigDecimal | counterparty_credit |  |
| counterpartyBalance | BigDecimal | counterparty_balance |  |
| discrepancy | BigDecimal | discrepancy |  |
| status | ReconciliationActStatus | status | ENUM, NOT NULL |
| signedByUs | Boolean | signed_by_us |  |
| signedByCounterparty | Boolean | signed_by_counterparty |  |
| signedDate | LocalDate | signed_date |  |
| notes | String | notes |  |
| organizationId | UUID | organization_id |  |

---

## Module: fleet

### EquipmentInspection (extends BaseEntity)
**File**: `modules/fleet/domain/EquipmentInspection.java`
**Table**: `equipment_inspections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| vehicleId | UUID | vehicle_id | NOT NULL |
| inspectorId | UUID | inspector_id |  |
| inspectionDate | LocalDate | inspection_date | NOT NULL |
| inspectionType | InspectionType | inspection_type | ENUM, NOT NULL |
| overallRating | InspectionRating | overall_rating | ENUM, NOT NULL |
| findings | String | findings |  |
| recommendations | String | recommendations |  |
| nextInspectionDate | LocalDate | next_inspection_date |  |

---

### EquipmentUsageLog (extends BaseEntity)
**File**: `modules/fleet/domain/EquipmentUsageLog.java`
**Table**: `equipment_usage_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| vehicleId | UUID | vehicle_id | NOT NULL |
| projectId | UUID | project_id |  |
| operatorId | UUID | operator_id |  |
| operatorName | String | operator_name |  |
| usageDate | LocalDate | usage_date | NOT NULL |
| hoursWorked | BigDecimal | hours_worked | NOT NULL |
| hoursStart | BigDecimal | hours_start |  |
| hoursEnd | BigDecimal | hours_end |  |
| fuelConsumed | BigDecimal | fuel_consumed |  |
| description | String | description |  |
| notes | String | notes |  |

---

### FleetWaybill (extends BaseEntity)
**File**: `modules/fleet/domain/FleetWaybill.java`
**Table**: `fleet_waybills`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| vehicleId | UUID | vehicle_id | NOT NULL |
| projectId | UUID | project_id |  |
| number | String | number | NOT NULL |
| waybillDate | LocalDate | waybill_date | NOT NULL |
| driverId | UUID | driver_id |  |
| driverName | String | driver_name |  |
| routeDescription | String | route_description |  |
| departurePoint | String | departure_point |  |
| destinationPoint | String | destination_point |  |
| departureTime | Instant | departure_time |  |
| returnTime | Instant | return_time |  |
| mileageStart | BigDecimal | mileage_start |  |
| mileageEnd | BigDecimal | mileage_end |  |
| engineHoursStart | BigDecimal | engine_hours_start |  |
| engineHoursEnd | BigDecimal | engine_hours_end |  |
| fuelDispensed | BigDecimal | fuel_dispensed |  |
| fuelConsumed | BigDecimal | fuel_consumed |  |
| fuelNorm | BigDecimal | fuel_norm |  |
| fuelRemaining | BigDecimal | fuel_remaining |  |
| medicalExamPassed | Boolean | medical_exam_passed |  |
| medicalExamTime | Instant | medical_exam_time |  |
| medicalExaminer | String | medical_examiner |  |
| mechanicApproved | Boolean | mechanic_approved |  |
| mechanicName | String | mechanic_name |  |
| mechanicCheckTime | Instant | mechanic_check_time |  |
| status | WaybillStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |

---

### FuelRecord (extends BaseEntity)
**File**: `modules/fleet/domain/FuelRecord.java`
**Table**: `fuel_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| vehicleId | UUID | vehicle_id | NOT NULL |
| operatorId | UUID | operator_id |  |
| projectId | UUID | project_id |  |
| fuelDate | LocalDate | fuel_date | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| pricePerUnit | BigDecimal | price_per_unit | NOT NULL |
| totalCost | BigDecimal | total_cost | NOT NULL |
| mileageAtFuel | BigDecimal | mileage_at_fuel |  |
| hoursAtFuel | BigDecimal | hours_at_fuel |  |
| fuelStation | String | fuel_station |  |
| receiptNumber | String | receipt_number |  |

---

### MaintenanceRecord (extends BaseEntity)
**File**: `modules/fleet/domain/MaintenanceRecord.java`
**Table**: `maintenance_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| vehicleId | UUID | vehicle_id | NOT NULL |
| maintenanceType | MaintenanceType | maintenance_type | ENUM, NOT NULL |
| description | String | description |  |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date |  |
| status | MaintenanceStatus | status | ENUM, NOT NULL |
| cost | BigDecimal | cost |  |
| performedById | UUID | performed_by_id |  |
| vendor | String | vendor |  |
| mileageAtService | BigDecimal | mileage_at_service |  |
| hoursAtService | BigDecimal | hours_at_service |  |
| nextServiceMileage | BigDecimal | next_service_mileage |  |
| nextServiceHours | BigDecimal | next_service_hours |  |
| nextServiceDate | LocalDate | next_service_date |  |

---

### MaintenanceScheduleRule (extends BaseEntity)
**File**: `modules/fleet/domain/MaintenanceScheduleRule.java`
**Table**: `maintenance_schedule_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| vehicleId | UUID | vehicle_id |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| maintenanceType | MaintenanceType | maintenance_type | ENUM, NOT NULL |
| intervalHours | BigDecimal | interval_hours |  |
| intervalMileage | BigDecimal | interval_mileage |  |
| intervalDays | Integer | interval_days |  |
| leadTimeHours | BigDecimal | lead_time_hours |  |
| leadTimeMileage | BigDecimal | lead_time_mileage |  |
| leadTimeDays | Integer | lead_time_days |  |
| isActive | Boolean | is_active |  |
| appliesToAllVehicles | Boolean | applies_to_all_vehicles |  |
| lastTriggeredAt | Instant | last_triggered_at |  |
| notes | String | notes |  |

---

### Vehicle (extends BaseEntity)
**File**: `modules/fleet/domain/Vehicle.java`
**Table**: `vehicles`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| licensePlate | String | license_plate |  |
| make | String | make |  |
| model | String | model |  |
| year | Integer | year |  |
| vin | String | vin |  |
| vehicleType | VehicleType | vehicle_type | ENUM, NOT NULL |
| status | VehicleStatus | status | ENUM, NOT NULL |
| currentProjectId | UUID | current_project_id |  |
| currentLocationId | UUID | current_location_id |  |
| responsibleId | UUID | responsible_id |  |
| purchaseDate | LocalDate | purchase_date |  |
| purchasePrice | BigDecimal | purchase_price |  |
| currentValue | BigDecimal | current_value |  |
| depreciationRate | BigDecimal | depreciation_rate |  |
| fuelType | FuelType | fuel_type | ENUM |
| fuelConsumptionRate | BigDecimal | fuel_consumption_rate |  |
| currentMileage | BigDecimal | current_mileage |  |
| currentHours | BigDecimal | current_hours |  |
| insuranceExpiryDate | LocalDate | insurance_expiry_date |  |
| techInspectionExpiryDate | LocalDate | tech_inspection_expiry_date |  |
| notes | String | notes |  |
| usefulLifeYears | BigDecimal | useful_life_years |  |
| annualWorkingHours | BigDecimal | annual_working_hours |  |
| avgMonthlyMaintenanceCost | BigDecimal | avg_monthly_maintenance_cost |  |
| monthlyInsuranceCost | BigDecimal | monthly_insurance_cost |  |
| monthlyOperatorCost | BigDecimal | monthly_operator_cost |  |
| marketRentalRatePerHour | BigDecimal | market_rental_rate_per_hour |  |

---

### VehicleAssignment (extends BaseEntity)
**File**: `modules/fleet/domain/VehicleAssignment.java`
**Table**: `vehicle_assignments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| vehicleId | UUID | vehicle_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| assignedById | UUID | assigned_by_id |  |
| operatorId | UUID | operator_id |  |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date |  |
| actualReturnDate | LocalDate | actual_return_date |  |
| status | AssignmentStatus | status | ENUM, NOT NULL |
| dailyRate | BigDecimal | daily_rate |  |
| totalCost | BigDecimal | total_cost |  |
| notes | String | notes |  |

---

## Module: gpsTimesheet

### GpsCheckEvent (extends BaseEntity)
**File**: `modules/gpsTimesheet/domain/GpsCheckEvent.java`
**Table**: `gps_check_events`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| projectId | UUID | project_id |  |
| siteGeofenceId | UUID | site_geofence_id |  |
| eventType | CheckEventType | event_type | ENUM, NOT NULL |
| latitude | double | latitude | NOT NULL |
| longitude | double | longitude | NOT NULL |
| accuracyMeters | Double | accuracy_meters |  |
| isWithinGeofence | boolean | is_within_geofence | NOT NULL |
| deviceId | String | device_id |  |
| recordedAt | Instant | recorded_at | NOT NULL |

---

### GpsTimesheetEntry (extends BaseEntity)
**File**: `modules/gpsTimesheet/domain/GpsTimesheetEntry.java`
**Table**: `gps_timesheet_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| projectId | UUID | project_id |  |
| checkInEventId | UUID | check_in_event_id |  |
| checkOutEventId | UUID | check_out_event_id |  |
| workDate | LocalDate | work_date | NOT NULL |
| checkInTime | Instant | check_in_time |  |
| checkOutTime | Instant | check_out_time |  |
| totalHours | BigDecimal | total_hours |  |
| isVerified | boolean | is_verified | NOT NULL |
| isGeofenceVerified | boolean | is_geofence_verified | NOT NULL |
| costCodeId | UUID | cost_code_id |  |
| notes | String | notes |  |

---

### GpsTimesheetSummary (extends BaseEntity)
**File**: `modules/gpsTimesheet/domain/GpsTimesheetSummary.java`
**Table**: `gps_timesheet_summaries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| periodYear | int | period_year | NOT NULL |
| periodMonth | int | period_month | NOT NULL |
| totalDays | int | total_days | NOT NULL |
| totalHours | BigDecimal | total_hours | NOT NULL |
| verifiedHours | BigDecimal | verified_hours | NOT NULL |
| geofenceViolations | int | geofence_violations | NOT NULL |

---

### SiteGeofence (extends BaseEntity)
**File**: `modules/gpsTimesheet/domain/SiteGeofence.java`
**Table**: `site_geofences`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| centerLatitude | double | center_latitude | NOT NULL |
| centerLongitude | double | center_longitude | NOT NULL |
| radiusMeters | double | radius_meters | NOT NULL |
| polygonJson | String | polygon_json |  |
| isActive | boolean | is_active | NOT NULL |

---

## Module: hr

### Crew (extends BaseEntity)
**File**: `modules/hr/domain/Crew.java`
**Table**: `crews`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| name | String | name | NOT NULL |
| foremanId | UUID | foreman_id |  |
| foremanName | String | foreman_name |  |
| foremanPhone | String | foreman_phone |  |
| workersCount | int | workers_count |  |
| currentProjectId | UUID | current_project_id |  |
| currentProject | String | current_project |  |
| status | CrewStatus | status | ENUM |
| specialization | String | specialization |  |
| performance | Integer | performance |  |
| activeOrders | int | active_orders |  |

---

### CrewAssignment (extends BaseEntity)
**File**: `modules/hr/domain/CrewAssignment.java`
**Table**: `crew_assignments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| role | String | role |  |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date |  |
| active | boolean | active | NOT NULL |
| hourlyRate | BigDecimal | hourly_rate |  |

---

### CrewTimeEntry (extends BaseEntity)
**File**: `modules/hr/domain/CrewTimeEntry.java`
**Table**: `crew_time_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| crewId | UUID | crew_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| workDate | LocalDate | work_date | NOT NULL |
| hoursWorked | BigDecimal | hours_worked | NOT NULL |
| overtimeHours | BigDecimal | overtime_hours |  |
| activityType | String | activity_type |  |
| notes | String | notes |  |

---

### CrewTimeSheet (extends BaseEntity)
**File**: `modules/hr/domain/CrewTimeSheet.java`
**Table**: `crew_time_sheets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| crewId | UUID | crew_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| totalHours | BigDecimal | total_hours |  |
| totalOvertime | BigDecimal | total_overtime |  |
| status | CrewTimeSheetStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |
| approvedAt | LocalDateTime | approved_at |  |

---

### Employee (extends BaseEntity)
**File**: `modules/hr/domain/Employee.java`
**Table**: `employees`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id |  |
| firstName | String | first_name | NOT NULL |
| lastName | String | last_name | NOT NULL |
| middleName | String | middle_name |  |
| fullName | String | full_name |  |
| employeeNumber | String | employee_number | UNIQUE |
| position | String | position |  |
| departmentId | UUID | department_id |  |
| organizationId | UUID | organization_id |  |
| hireDate | LocalDate | hire_date | NOT NULL |
| terminationDate | LocalDate | termination_date |  |
| status | EmployeeStatus | status | ENUM, NOT NULL |
| phone | String | phone |  |
| email | String | email |  |
| passportNumber | String | passport_number |  |
| inn | String | inn |  |
| snils | String | snils |  |
| hourlyRate | BigDecimal | hourly_rate |  |
| monthlyRate | BigDecimal | monthly_rate |  |
| notes | String | notes |  |

---

### EmployeeCertificate (extends BaseEntity)
**File**: `modules/hr/domain/EmployeeCertificate.java`
**Table**: `employee_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| certificateType | CertificateType | certificate_type | ENUM, NOT NULL |
| name | String | name | NOT NULL |
| number | String | number |  |
| issuedDate | LocalDate | issued_date | NOT NULL |
| expiryDate | LocalDate | expiry_date |  |
| issuedBy | String | issued_by |  |
| notes | String | notes |  |
| status | CertificateStatus | status | ENUM |

---

### HrWorkOrder (extends BaseEntity)
**File**: `modules/hr/domain/HrWorkOrder.java`
**Table**: `hr_work_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| number | String | number | NOT NULL |
| type | HrWorkOrderType | type | ENUM, NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| projectName | String | project_name |  |
| crewName | String | crew_name |  |
| workDescription | String | work_description |  |
| date | LocalDate | date | NOT NULL |
| endDate | LocalDate | end_date |  |
| safetyRequirements | String | safety_requirements |  |
| hazardousConditions | String | hazardous_conditions |  |
| requiredPermits | String | required_permits |  |
| status | HrWorkOrderStatus | status | ENUM, NOT NULL |

---

### QualificationRecord (extends BaseEntity)
**File**: `modules/hr/domain/QualificationRecord.java`
**Table**: `hr_qualification_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| employeeId | UUID | employee_id | NOT NULL |
| employeeName | String | employee_name |  |
| qualificationType | String | qualification_type | NOT NULL |
| certificateNumber | String | certificate_number |  |
| issueDate | LocalDate | issue_date | NOT NULL |
| expiryDate | LocalDate | expiry_date | NOT NULL |
| status | QualificationStatus | status | ENUM, NOT NULL |

---

### StaffingPosition (extends BaseEntity)
**File**: `modules/hr/domain/StaffingPosition.java`
**Table**: `hr_staffing_positions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| department | String | department | NOT NULL |
| position | String | position | NOT NULL |
| grade | String | grade |  |
| salaryMin | BigDecimal | salary_min |  |
| salaryMax | BigDecimal | salary_max |  |
| filledCount | int | filled_count |  |
| totalCount | int | total_count |  |

---

### StaffingVacancy (extends BaseEntity)
**File**: `modules/hr/domain/StaffingVacancy.java`
**Table**: `hr_staffing_vacancies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| staffingPositionId | UUID | staffing_position_id | NOT NULL |
| status | VacancyStatus | status | ENUM, NOT NULL |

---

### Timesheet (extends BaseEntity)
**File**: `modules/hr/domain/Timesheet.java`
**Table**: `timesheets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| workDate | LocalDate | work_date | NOT NULL |
| hoursWorked | BigDecimal | hours_worked | NOT NULL |
| overtimeHours | BigDecimal | overtime_hours |  |
| status | TimesheetStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |
| notes | String | notes |  |
| budgetItemId | UUID | budget_item_id |  |

---

### TimesheetT13Cell (extends BaseEntity)
**File**: `modules/hr/domain/TimesheetT13Cell.java`
**Table**: `hr_timesheet_t13_cells`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| month | int | month | NOT NULL |
| year | int | year | NOT NULL |
| day | int | day | NOT NULL |
| code | String | code |  |
| dayHours | BigDecimal | day_hours |  |
| nightHours | BigDecimal | night_hours |  |

---

## Module: hrRussian

### BusinessTrip (extends BaseEntity)
**File**: `modules/hrRussian/domain/BusinessTrip.java`
**Table**: `business_trips`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| destination | String | destination | NOT NULL |
| purpose | String | purpose | NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| dailyAllowance | BigDecimal | daily_allowance |  |
| totalBudget | BigDecimal | total_budget |  |
| orderId | UUID | order_id |  |
| status | BusinessTripStatus | status | ENUM, NOT NULL |
| reportDate | LocalDate | report_date |  |
| reportUrl | String | report_url |  |

---

### CrewTimeReport (extends BaseEntity)
**File**: `modules/hrRussian/domain/CrewTimeReport.java`
**Table**: `crew_time_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| crewId | UUID | crew_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| reportDate | LocalDate | report_date | NOT NULL |
| totalHours | BigDecimal | total_hours | NOT NULL |
| overtimeHours | BigDecimal | overtime_hours | NOT NULL |
| nightHours | BigDecimal | night_hours | NOT NULL |
| entries | String | entries | JSONB, NOT NULL |
| status | CrewReportStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |

---

### EmploymentContract (extends BaseEntity)
**File**: `modules/hrRussian/domain/EmploymentContract.java`
**Table**: `employment_contracts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| contractNumber | String | contract_number | NOT NULL |
| contractType | ContractType | contract_type | ENUM, NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date |  |
| salary | BigDecimal | salary | NOT NULL |
| salaryType | SalaryType | salary_type | ENUM, NOT NULL |
| position | String | position |  |
| department | String | department |  |
| probationEndDate | LocalDate | probation_end_date |  |
| workSchedule | String | work_schedule |  |
| status | ContractStatus | status | ENUM, NOT NULL |

---

### EmploymentOrder (extends BaseEntity)
**File**: `modules/hrRussian/domain/EmploymentOrder.java`
**Table**: `employment_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| orderNumber | String | order_number | NOT NULL |
| orderType | OrderType | order_type | ENUM, NOT NULL |
| orderDate | LocalDate | order_date | NOT NULL |
| effectiveDate | LocalDate | effective_date | NOT NULL |
| reason | String | reason |  |
| basis | String | basis |  |
| signedById | UUID | signed_by_id |  |

---

### HrCertificateType (extends BaseEntity)
**File**: `modules/hrRussian/domain/HrCertificateType.java`
**Table**: `certificate_types`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| requiredForPositions | String | required_for_positions | JSONB, NOT NULL |
| validityMonths | int | validity_months | NOT NULL |
| required | boolean | is_required | NOT NULL |

---

### HrCrewAssignment (extends BaseEntity)
**File**: `modules/hrRussian/domain/HrCrewAssignment.java`
**Table**: `hr_crew_assignments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| crewId | UUID | crew_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| role | String | role |  |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date |  |
| dailyRate | BigDecimal | daily_rate |  |

---

### HrEmployeeCertificate (extends BaseEntity)
**File**: `modules/hrRussian/domain/HrEmployeeCertificate.java`
**Table**: `hr_employee_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| certificateTypeId | UUID | certificate_type_id |  |
| certificateName | String | certificate_name | NOT NULL |
| issuer | String | issuer |  |
| number | String | number |  |
| issuedDate | LocalDate | issued_date | NOT NULL |
| expiryDate | LocalDate | expiry_date |  |
| fileUrl | String | file_url |  |
| status | CertificateStatus | status | ENUM, NOT NULL |

---

### HrTimesheetEntry (extends BaseEntity)
**File**: `modules/hrRussian/domain/HrTimesheetEntry.java`
**Table**: `hr_timesheet_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| taskId | UUID | task_id |  |
| date | LocalDate | date | NOT NULL |
| hours | BigDecimal | hours | NOT NULL |
| overtimeHours | BigDecimal | overtime_hours | NOT NULL |
| description | String | description |  |
| status | TimesheetEntryStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |

---

### MilitaryRecord (extends BaseEntity)
**File**: `modules/hrRussian/domain/MilitaryRecord.java`
**Table**: `military_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL, UNIQUE |
| category | String | category |  |
| rank | String | rank |  |
| specialty | String | specialty |  |
| fitnessCategory | String | fitness_category |  |
| registrationOffice | String | registration_office |  |
| registered | boolean | is_registered | NOT NULL |

---

### PersonalCard (extends BaseEntity)
**File**: `modules/hrRussian/domain/PersonalCard.java`
**Table**: `personal_cards`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL, UNIQUE |
| formT2Data | String | form_t2_data | JSONB, NOT NULL |

---

### SickLeave (extends BaseEntity)
**File**: `modules/hrRussian/domain/SickLeave.java`
**Table**: `sick_leaves`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| sickLeaveNumber | String | sick_leave_number |  |
| diagnosis | String | diagnosis |  |
| extension | boolean | is_extension | NOT NULL |
| previousSickLeaveId | UUID | previous_sick_leave_id |  |
| paymentAmount | BigDecimal | payment_amount |  |
| status | SickLeaveStatus | status | ENUM, NOT NULL |

---

### StaffingTable (extends BaseEntity)
**File**: `modules/hrRussian/domain/StaffingTable.java`
**Table**: `staffing_table`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| positionName | String | position_name | NOT NULL |
| departmentId | UUID | department_id |  |
| grade | String | grade |  |
| salaryMin | BigDecimal | salary_min | NOT NULL |
| salaryMax | BigDecimal | salary_max | NOT NULL |
| headcount | int | headcount | NOT NULL |
| filledCount | int | filled_count | NOT NULL |
| active | boolean | is_active | NOT NULL |
| effectiveDate | LocalDate | effective_date | NOT NULL |

---

### SzvTd (extends BaseEntity)
**File**: `modules/hrRussian/domain/SzvTd.java`
**Table**: `szv_td_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| reportDate | LocalDate | report_date | NOT NULL |
| eventType | SzvEventType | event_type | ENUM, NOT NULL |
| eventDate | LocalDate | event_date | NOT NULL |
| position | String | position |  |
| orderNumber | String | order_number |  |

---

### TimesheetPeriod (extends BaseEntity)
**File**: `modules/hrRussian/domain/TimesheetPeriod.java`
**Table**: `timesheet_periods`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| month | int | month | NOT NULL |
| year | int | year | NOT NULL |
| status | TimesheetPeriodStatus | status | ENUM, NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| totalHours | BigDecimal | total_hours | NOT NULL |
| approvedById | UUID | approved_by_id |  |

---

### Vacation (extends BaseEntity)
**File**: `modules/hrRussian/domain/Vacation.java`
**Table**: `vacations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| vacationType | VacationType | vacation_type | ENUM, NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| daysCount | int | days_count | NOT NULL |
| status | VacationStatus | status | ENUM, NOT NULL |
| orderId | UUID | order_id |  |
| substitutingEmployeeId | UUID | substituting_employee_id |  |

---

### WorkBook (extends BaseEntity)
**File**: `modules/hrRussian/domain/WorkBook.java`
**Table**: `work_books`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL, UNIQUE |
| serialNumber | String | serial_number |  |
| entries | String | entries | JSONB, NOT NULL |
| electronic | boolean | is_electronic | NOT NULL |
| lastEntryDate | LocalDate | last_entry_date |  |

---

## Module: immutableAudit

### ImmutableRecord (extends BaseEntity)
**File**: `modules/immutableAudit/domain/ImmutableRecord.java`
**Table**: `immutable_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| recordHash | String | record_hash | NOT NULL |
| contentSnapshot | String | content_snapshot |  |
| previousRecordId | UUID | previous_record_id |  |
| recordedAt | Instant | recorded_at | NOT NULL |
| recordedById | UUID | recorded_by_id |  |
| action | String | action |  |
| recordVersion | Integer | record_version |  |
| isSuperseded | Boolean | is_superseded | NOT NULL |
| supersededById | UUID | superseded_by_id |  |
| supersededAt | Instant | superseded_at |  |
| chainValid | Boolean | chain_valid |  |

---

### RecordSupersession (extends BaseEntity)
**File**: `modules/immutableAudit/domain/RecordSupersession.java`
**Table**: `record_supersessions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| originalRecordId | UUID | original_record_id | NOT NULL |
| supersedingRecordId | UUID | superseding_record_id | NOT NULL |
| reason | String | reason | NOT NULL |
| supersededAt | Instant | superseded_at | NOT NULL |
| supersededById | UUID | superseded_by_id | NOT NULL |

---

## Module: infrastructure/audit

### AuditLog
**File**: `infrastructure/audit/AuditLog.java`
**Table**: `audit_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| action | AuditAction | action | ENUM, NOT NULL |
| field | String | field |  |
| oldValue | String | old_value |  |
| newValue | String | new_value |  |
| userId | UUID | user_id |  |
| userName | String | user_name |  |
| timestamp | Instant | timestamp | NOT NULL |
| ipAddress | String | ip_address |  |

---

## Module: infrastructure/persistence

### BaseEntity
**File**: `infrastructure/persistence/BaseEntity.java`
**Table**: `(default: baseentitys)`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |
| createdBy | String | created_by |  |
| updatedBy | String | updated_by |  |
| version | Long | version |  |
| deleted | boolean | deleted | NOT NULL |

---

## Module: insurance

### InsuranceCertificate (extends BaseEntity)
**File**: `modules/insurance/domain/InsuranceCertificate.java`
**Table**: `insurance_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| vendorId | UUID | vendor_id |  |
| vendorName | String | vendor_name | NOT NULL |
| certificateType | CertificateType | certificate_type | ENUM, NOT NULL |
| policyNumber | String | policy_number |  |
| insurerName | String | insurer_name |  |
| coverageAmount | BigDecimal | coverage_amount |  |
| deductible | BigDecimal | deductible |  |
| effectiveDate | LocalDate | effective_date |  |
| expiryDate | LocalDate | expiry_date |  |
| certificateHolder | String | certificate_holder |  |
| status | InsuranceCertificateStatus | status | ENUM, NOT NULL |
| storagePath | String | storage_path |  |
| notes | String | notes |  |

---

## Module: integration

### ExternalDocument (extends BaseEntity)
**File**: `modules/integration/domain/ExternalDocument.java`
**Table**: `external_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| externalId | String | external_id | NOT NULL |
| provider | EdoProvider | provider | ENUM, NOT NULL |
| documentType | EdoDocumentType | document_type | ENUM, NOT NULL |
| title | String | title | NOT NULL |
| senderInn | String | sender_inn |  |
| senderName | String | sender_name |  |
| recipientInn | String | recipient_inn |  |
| recipientName | String | recipient_name |  |
| status | ExternalDocumentStatus | status | ENUM, NOT NULL |
| signatureStatus | SignatureStatus | signature_status | ENUM, NOT NULL |
| fileUrl | String | file_url |  |
| signedFileUrl | String | signed_file_url |  |
| linkedEntityType | String | linked_entity_type |  |
| linkedEntityId | UUID | linked_entity_id |  |
| receivedAt | Instant | received_at |  |
| signedAt | Instant | signed_at |  |

---

### IntegrationEndpoint (extends BaseEntity)
**File**: `modules/integration/domain/IntegrationEndpoint.java`
**Table**: `integration_endpoints`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| provider | IntegrationProvider | provider | ENUM, NOT NULL |
| baseUrl | String | base_url | NOT NULL |
| authType | AuthType | auth_type | ENUM, NOT NULL |
| credentials | String | credentials |  |
| isActive | boolean | is_active | NOT NULL |
| lastHealthCheck | Instant | last_health_check |  |
| healthStatus | HealthStatus | health_status | ENUM, NOT NULL |
| rateLimitPerMinute | int | rate_limit_per_minute | NOT NULL |
| timeoutMs | int | timeout_ms | NOT NULL |

---

### OneCConfig (extends BaseEntity)
**File**: `modules/integration/domain/OneCConfig.java`
**Table**: `onec_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| baseUrl | String | base_url | NOT NULL |
| username | String | username | NOT NULL |
| password | String | password | NOT NULL |
| databaseName | String | database_name | NOT NULL |
| syncDirection | SyncDirection | sync_direction | ENUM, NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |
| syncIntervalMinutes | int | sync_interval_minutes | NOT NULL |

---

### OneCExchangeLog (extends BaseEntity)
**File**: `modules/integration/domain/OneCExchangeLog.java`
**Table**: `onec_exchange_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| configId | UUID | config_id | NOT NULL |
| exchangeType | OneCExchangeType | exchange_type | ENUM, NOT NULL |
| direction | SyncDirection | direction | ENUM, NOT NULL |
| status | OneCExchangeStatus | status | ENUM, NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| recordsProcessed | int | records_processed | NOT NULL |
| recordsFailed | int | records_failed | NOT NULL |
| errorMessage | String | error_message |  |
| details | String | details |  |

---

### OneCMapping (extends BaseEntity)
**File**: `modules/integration/domain/OneCMapping.java`
**Table**: `onec_mappings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| privodId | UUID | privod_id | NOT NULL |
| oneCId | String | onec_id | NOT NULL |
| oneCCode | String | onec_code |  |
| lastSyncAt | Instant | last_sync_at |  |
| syncStatus | OneCMappingSyncStatus | sync_status | ENUM, NOT NULL |
| conflictData | String | conflict_data |  |

---

### PriceIndex (extends BaseEntity)
**File**: `modules/integration/pricing/domain/PriceIndex.java`
**Table**: `price_indices`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| region | String | region | NOT NULL |
| workType | String | work_type | NOT NULL |
| baseQuarter | String | base_quarter | NOT NULL |
| targetQuarter | String | target_quarter | NOT NULL |
| indexValue | BigDecimal | index_value | NOT NULL |
| source | String | source |  |

---

### PriceRate (extends BaseEntity)
**File**: `modules/integration/pricing/domain/PriceRate.java`
**Table**: `price_rates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| databaseId | UUID | database_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| unit | String | unit |  |
| laborCost | BigDecimal | labor_cost |  |
| materialCost | BigDecimal | material_cost |  |
| equipmentCost | BigDecimal | equipment_cost |  |
| overheadCost | BigDecimal | overhead_cost |  |
| totalCost | BigDecimal | total_cost |  |
| category | String | category |  |
| subcategory | String | subcategory |  |

---

### PricingDatabase (extends BaseEntity)
**File**: `modules/integration/pricing/domain/PricingDatabase.java`
**Table**: `pricing_databases`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| type | PricingDatabaseType | type | ENUM, NOT NULL |
| region | String | region |  |
| baseYear | Integer | base_year | NOT NULL |
| coefficientToCurrentPrices | BigDecimal | coefficient_to_current_prices |  |
| effectiveFrom | LocalDate | effective_from |  |
| effectiveTo | LocalDate | effective_to |  |
| sourceUrl | String | source_url |  |
| active | boolean | active | NOT NULL |

---

### RegistryCheckResult (extends BaseEntity)
**File**: `modules/integration/govregistries/domain/RegistryCheckResult.java`
**Table**: `registry_check_results`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| counterpartyId | UUID | counterparty_id |  |
| inn | String | inn | NOT NULL |
| ogrn | String | ogrn |  |
| registryType | RegistryType | registry_type | ENUM, NOT NULL |
| checkDate | Instant | check_date | NOT NULL |
| status | CheckStatus | status | ENUM, NOT NULL |
| companyName | String | company_name |  |
| registrationDate | LocalDate | registration_date |  |
| isActive | boolean | is_active | NOT NULL |
| chiefName | String | chief_name |  |
| authorizedCapital | BigDecimal | authorized_capital |  |
| riskLevel | RiskLevel | risk_level | ENUM |
| rawResponse | String | raw_response |  |
| warnings | String | warnings |  |

---

### RegistryConfig (extends BaseEntity)
**File**: `modules/integration/govregistries/domain/RegistryConfig.java`
**Table**: `registry_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| registryType | RegistryType | registry_type | ENUM, NOT NULL, UNIQUE |
| apiUrl | String | api_url |  |
| apiKey | String | api_key |  |
| enabled | boolean | enabled | NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |

---

### SbisConfig (extends BaseEntity)
**File**: `modules/integration/domain/SbisConfig.java`
**Table**: `sbis_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| apiUrl | String | api_url | NOT NULL |
| login | String | login | NOT NULL |
| password | String | password | NOT NULL |
| certificateThumbprint | String | certificate_thumbprint |  |
| organizationInn | String | organization_inn | NOT NULL |
| organizationKpp | String | organization_kpp |  |
| isActive | boolean | is_active | NOT NULL |
| autoSend | boolean | auto_send | NOT NULL |

---

### SbisDocument (extends BaseEntity)
**File**: `modules/integration/domain/SbisDocument.java`
**Table**: `sbis_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| sbisId | String | sbis_id |  |
| documentType | SbisDocumentType | document_type | ENUM, NOT NULL |
| internalDocumentId | UUID | internal_document_id |  |
| internalDocumentModel | String | internal_document_model |  |
| partnerInn | String | partner_inn |  |
| partnerKpp | String | partner_kpp |  |
| partnerName | String | partner_name |  |
| direction | SbisDirection | direction | ENUM, NOT NULL |
| status | SbisDocumentStatus | status | ENUM, NOT NULL |
| sentAt | Instant | sent_at |  |
| receivedAt | Instant | received_at |  |
| signedAt | Instant | signed_at |  |
| errorMessage | String | error_message |  |
| documentData | String | document_data |  |

---

### SbisPartnerMapping (extends BaseEntity)
**File**: `modules/integration/domain/SbisPartnerMapping.java`
**Table**: `sbis_partner_mappings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| partnerId | UUID | partner_id | NOT NULL |
| partnerName | String | partner_name | NOT NULL |
| sbisContractorId | String | sbis_contractor_id |  |
| sbisContractorInn | String | sbis_contractor_inn |  |
| sbisContractorKpp | String | sbis_contractor_kpp |  |
| isActive | boolean | is_active | NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |

---

### SmsConfig (extends BaseEntity)
**File**: `modules/integration/sms/domain/SmsConfig.java`
**Table**: `sms_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| provider | SmsProvider | provider | ENUM, NOT NULL |
| apiUrl | String | api_url |  |
| apiKey | String | api_key |  |
| senderName | String | sender_name |  |
| enabled | boolean | enabled | NOT NULL |
| whatsappEnabled | boolean | whatsapp_enabled | NOT NULL |

---

### SmsMessage (extends BaseEntity)
**File**: `modules/integration/sms/domain/SmsMessage.java`
**Table**: `sms_messages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| phoneNumber | String | phone_number | NOT NULL |
| messageText | String | message_text | NOT NULL |
| channel | SmsChannel | channel | ENUM, NOT NULL |
| status | SmsMessageStatus | status | ENUM, NOT NULL |
| errorMessage | String | error_message |  |
| sentAt | Instant | sent_at |  |
| deliveredAt | Instant | delivered_at |  |
| externalId | String | external_id |  |
| userId | UUID | user_id |  |
| relatedEntityType | String | related_entity_type |  |
| relatedEntityId | UUID | related_entity_id |  |

---

### SyncJob (extends BaseEntity)
**File**: `modules/integration/domain/SyncJob.java`
**Table**: `sync_jobs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| endpointId | UUID | endpoint_id | NOT NULL |
| syncType | SyncType | sync_type | ENUM, NOT NULL |
| direction | SyncDirection | direction | ENUM, NOT NULL |
| entityType | String | entity_type | NOT NULL |
| status | SyncJobStatus | status | ENUM, NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| processedCount | int | processed_count | NOT NULL |
| errorCount | int | error_count | NOT NULL |
| errorLog | String | error_log |  |
| lastSyncCursor | String | last_sync_cursor |  |

---

### SyncMapping (extends BaseEntity)
**File**: `modules/integration/domain/SyncMapping.java`
**Table**: `sync_mappings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| endpointId | UUID | endpoint_id | NOT NULL |
| localEntityType | String | local_entity_type | NOT NULL |
| localFieldName | String | local_field_name | NOT NULL |
| remoteEntityType | String | remote_entity_type | NOT NULL |
| remoteFieldName | String | remote_field_name | NOT NULL |
| transformExpression | String | transform_expression |  |
| direction | MappingDirection | direction | ENUM, NOT NULL |
| isRequired | boolean | is_required | NOT NULL |

---

### TelegramConfig (extends BaseEntity)
**File**: `modules/integration/telegram/domain/TelegramConfig.java`
**Table**: `telegram_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| botToken | String | bot_token | NOT NULL |
| botUsername | String | bot_username | NOT NULL |
| webhookUrl | String | webhook_url |  |
| enabled | boolean | enabled | NOT NULL |
| chatIds | String | chat_ids |  |
| organizationId | UUID | organization_id | NOT NULL |

---

### TelegramLinkCode (extends BaseEntity)
**File**: `modules/integration/telegram/domain/TelegramLinkCode.java`
**Table**: `telegram_link_codes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| userId | UUID | user_id | NOT NULL |
| expiresAt | Instant | expires_at | NOT NULL |
| used | boolean | used | NOT NULL |
| usedAt | Instant | used_at |  |
| chatId | String | chat_id |  |

---

### TelegramMessage (extends BaseEntity)
**File**: `modules/integration/telegram/domain/TelegramMessage.java`
**Table**: `telegram_messages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| chatId | String | chat_id | NOT NULL |
| messageText | String | message_text | NOT NULL |
| messageType | TelegramMessageType | message_type | ENUM, NOT NULL |
| status | TelegramMessageStatus | status | ENUM, NOT NULL |
| errorMessage | String | error_message |  |
| sentAt | Instant | sent_at |  |
| relatedEntityType | String | related_entity_type |  |
| relatedEntityId | UUID | related_entity_id |  |

---

### TelegramSubscription (extends BaseEntity)
**File**: `modules/integration/telegram/domain/TelegramSubscription.java`
**Table**: `telegram_subscriptions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| chatId | String | chat_id | NOT NULL |
| notifyProjects | boolean | notify_projects | NOT NULL |
| notifySafety | boolean | notify_safety | NOT NULL |
| notifyTasks | boolean | notify_tasks | NOT NULL |
| notifyApprovals | boolean | notify_approvals | NOT NULL |
| active | boolean | active | NOT NULL |

---

### WeatherConfig (extends BaseEntity)
**File**: `modules/integration/weather/domain/WeatherConfig.java`
**Table**: `weather_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| apiProvider | WeatherApiProvider | api_provider | ENUM, NOT NULL |
| apiKey | String | api_key |  |
| defaultCity | String | default_city |  |
| defaultLatitude | Double | default_latitude |  |
| defaultLongitude | Double | default_longitude |  |
| enabled | boolean | enabled | NOT NULL |
| refreshIntervalMinutes | int | refresh_interval_minutes | NOT NULL |

---

### WeatherData (extends BaseEntity)
**File**: `modules/integration/weather/domain/WeatherData.java`
**Table**: `weather_data`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| locationName | String | location_name |  |
| latitude | Double | latitude | NOT NULL |
| longitude | Double | longitude | NOT NULL |
| temperature | Double | temperature |  |
| feelsLike | Double | feels_like |  |
| humidity | Integer | humidity |  |
| windSpeed | Double | wind_speed |  |
| windDirection | String | wind_direction |  |
| weatherCondition | String | weather_condition |  |
| weatherDescription | String | weather_description |  |
| pressure | Double | pressure |  |
| visibility | Integer | visibility |  |
| isSafeForWork | boolean | is_safe_for_work | NOT NULL |
| fetchedAt | Instant | fetched_at | NOT NULL |

---

### WebDavConfig (extends BaseEntity)
**File**: `modules/integration/webdav/domain/WebDavConfig.java`
**Table**: `webdav_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| serverUrl | String | server_url | NOT NULL |
| username | String | username | NOT NULL |
| password | String | password | NOT NULL |
| basePath | String | base_path | NOT NULL |
| enabled | boolean | enabled | NOT NULL |
| maxFileSizeMb | int | max_file_size_mb | NOT NULL |
| organizationId | UUID | organization_id |  |

---

### WebDavFile (extends BaseEntity)
**File**: `modules/integration/webdav/domain/WebDavFile.java`
**Table**: `webdav_files`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| remotePath | String | remote_path | NOT NULL |
| localDocumentId | UUID | local_document_id |  |
| organizationId | UUID | organization_id |  |
| fileName | String | file_name | NOT NULL |
| fileSizeBytes | Long | file_size_bytes |  |
| contentType | String | content_type |  |
| syncStatus | WebDavSyncStatus | sync_status | ENUM, NOT NULL |
| lastSyncedAt | Instant | last_synced_at |  |
| remoteLastModified | Instant | remote_last_modified |  |
| checksum | String | checksum |  |

---

### WebhookEndpoint (extends BaseEntity)
**File**: `modules/integration/domain/WebhookEndpoint.java`
**Table**: `webhook_endpoints`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| url | String | url | NOT NULL |
| secret | String | secret |  |
| events | String | events | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| lastTriggeredAt | Instant | last_triggered_at |  |
| failureCount | int | failure_count | NOT NULL |
| lastFailureReason | String | last_failure_reason |  |

---

## Module: iot

### GeofenceAlert (extends BaseEntity)
**File**: `modules/iot/domain/GeofenceAlert.java`
**Table**: `geofence_alerts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| deviceId | UUID | device_id | NOT NULL |
| zoneId | UUID | zone_id | NOT NULL |
| alertType | GeofenceAlertType | alert_type | ENUM, NOT NULL |
| triggeredAt | Instant | triggered_at | NOT NULL |
| latitude | Double | latitude |  |
| longitude | Double | longitude |  |
| acknowledged | boolean | acknowledged | NOT NULL |
| acknowledgedBy | UUID | acknowledged_by |  |
| acknowledgedAt | Instant | acknowledged_at |  |

---

### GeofenceZone (extends BaseEntity)
**File**: `modules/iot/domain/GeofenceZone.java`
**Table**: `geofence_zones`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| zoneType | GeofenceZoneType | zone_type | ENUM, NOT NULL |
| polygonJson | String | polygon_json |  |
| radiusMeters | Double | radius_meters |  |
| centerLat | Double | center_lat |  |
| centerLng | Double | center_lng |  |
| active | boolean | is_active | NOT NULL |

---

### IoTAlert (extends BaseEntity)
**File**: `modules/iot/domain/IoTAlert.java`
**Table**: `iot_alerts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| deviceId | UUID | device_id | NOT NULL |
| alertType | AlertType | alert_type | ENUM, NOT NULL |
| severity | AlertSeverity | severity | ENUM, NOT NULL |
| message | String | message | NOT NULL |
| thresholdValue | Double | threshold_value |  |
| actualValue | Double | actual_value |  |
| status | AlertStatus | status | ENUM, NOT NULL |
| acknowledgedById | UUID | acknowledged_by_id |  |
| resolvedAt | Instant | resolved_at |  |

---

### IoTAlertRule (extends BaseEntity)
**File**: `modules/iot/domain/IoTAlertRule.java`
**Table**: `iot_alert_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| deviceType | DeviceType | device_type | ENUM, NOT NULL |
| metricName | String | metric_name | NOT NULL |
| condition | RuleCondition | condition | ENUM, NOT NULL |
| thresholdValue | Double | threshold_value | NOT NULL |
| thresholdValue2 | Double | threshold_value2 |  |
| severity | AlertSeverity | severity | ENUM, NOT NULL |
| isActive | Boolean | is_active | NOT NULL |
| notifyUserIds | List<UUID> | notify_user_ids | JSONB |

---

### IoTDashboard (extends BaseEntity)
**File**: `modules/iot/domain/IoTDashboard.java`
**Table**: `iot_dashboards`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| widgets | List<Map<String, Object>> | widgets | JSONB |
| isDefault | Boolean | is_default | NOT NULL |
| createdById | UUID | created_by_id |  |

---

### IoTDevice (extends BaseEntity)
**File**: `modules/iot/domain/IoTDevice.java`
**Table**: `iot_devices`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| deviceType | DeviceType | device_type | ENUM, NOT NULL |
| serialNumber | String | serial_number | NOT NULL |
| projectId | UUID | project_id |  |
| location | String | location |  |
| installationDate | LocalDate | installation_date |  |
| status | DeviceStatus | status | ENUM, NOT NULL |
| lastDataAt | Instant | last_data_at |  |
| batteryLevel | Integer | battery_level |  |
| firmwareVersion | String | firmware_version |  |

---

### IoTSensorData (extends BaseEntity)
**File**: `modules/iot/domain/IoTSensorData.java`
**Table**: `iot_sensor_data`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| deviceId | UUID | device_id | NOT NULL |
| timestamp | Instant | timestamp | NOT NULL |
| metricName | String | metric_name | NOT NULL |
| metricValue | Double | metric_value | NOT NULL |
| unit | String | unit |  |
| isAnomaly | Boolean | is_anomaly | NOT NULL |

---

### IotEquipmentDevice (extends BaseEntity)
**File**: `modules/iot/domain/IotEquipmentDevice.java`
**Table**: `iot_equipment_devices`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| deviceSerial | String | device_serial | NOT NULL |
| deviceType | IotDeviceType | device_type | ENUM, NOT NULL |
| equipmentId | UUID | equipment_id |  |
| name | String | name | NOT NULL |
| manufacturer | String | manufacturer |  |
| model | String | model |  |
| firmwareVersion | String | firmware_version |  |
| active | boolean | is_active | NOT NULL |
| lastSeenAt | Instant | last_seen_at |  |

---

### IotTelemetryPoint (extends BaseEntity)
**File**: `modules/iot/domain/IotTelemetryPoint.java`
**Table**: `iot_telemetry_points`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| deviceId | UUID | device_id | NOT NULL |
| recordedAt | Instant | recorded_at | NOT NULL |
| latitude | Double | latitude |  |
| longitude | Double | longitude |  |
| altitude | Double | altitude |  |
| speed | Double | speed |  |
| heading | Double | heading |  |
| engineHours | Double | engine_hours |  |
| fuelLevelPercent | Double | fuel_level_percent |  |
| fuelConsumedLiters | Double | fuel_consumed_liters |  |
| temperature | Double | temperature |  |
| batteryLevel | Double | battery_level |  |
| rawPayloadJson | String | raw_payload_json |  |

---

## Module: isup

### IsupConfiguration (extends BaseEntity)
**File**: `modules/isup/domain/IsupConfiguration.java`
**Table**: `isup_configurations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| apiUrl | String | api_url | NOT NULL |
| apiKeyEncrypted | String | api_key_encrypted |  |
| certificatePath | String | certificate_path |  |
| organizationInn | String | organization_inn | NOT NULL |
| organizationKpp | String | organization_kpp |  |
| isActive | boolean | is_active | NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |

---

### IsupProjectMapping (extends BaseEntity)
**File**: `modules/isup/domain/IsupProjectMapping.java`
**Table**: `isup_project_mappings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| privodProjectId | UUID | privod_project_id | NOT NULL |
| isupProjectId | String | isup_project_id |  |
| isupObjectId | String | isup_object_id |  |
| governmentContractNumber | String | government_contract_number |  |
| registrationNumber | String | registration_number |  |
| syncEnabled | boolean | sync_enabled | NOT NULL |

---

### IsupTransmission (extends BaseEntity)
**File**: `modules/isup/domain/IsupTransmission.java`
**Table**: `isup_transmissions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectMappingId | UUID | project_mapping_id | NOT NULL |
| transmissionType | IsupTransmissionType | transmission_type | ENUM, NOT NULL |
| payloadJson | String | payload_json |  |
| status | IsupTransmissionStatus | status | ENUM, NOT NULL |
| sentAt | Instant | sent_at |  |
| confirmedAt | Instant | confirmed_at |  |
| errorMessage | String | error_message |  |
| retryCount | int | retry_count | NOT NULL |
| externalId | String | external_id |  |

---

### IsupVerificationRecord (extends BaseEntity)
**File**: `modules/isup/domain/IsupVerificationRecord.java`
**Table**: `isup_verification_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| transmissionId | UUID | transmission_id | NOT NULL |
| verificationType | IsupVerificationType | verification_type | ENUM, NOT NULL |
| verifiedByName | String | verified_by_name |  |
| verifiedAt | Instant | verified_at |  |
| comments | String | comments |  |
| externalReference | String | external_reference |  |

---

## Module: journal

### GeneralJournal (extends BaseEntity)
**File**: `modules/journal/domain/GeneralJournal.java`
**Table**: `general_journals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| status | JournalStatus | status | ENUM, NOT NULL |
| responsibleId | UUID | responsible_id |  |
| notes | String | notes |  |

---

### GeneralJournalEntry (extends BaseEntity)
**File**: `modules/journal/domain/GeneralJournalEntry.java`
**Table**: `general_journal_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| journalId | UUID | journal_id | NOT NULL |
| date | LocalDate | date | NOT NULL |
| section | String | section |  |
| workDescription | String | work_description |  |
| volume | BigDecimal | volume |  |
| unit | String | unit |  |
| crew | String | crew |  |
| weatherConditions | String | weather_conditions |  |
| notes | String | notes |  |

---

## Module: kep

### KepCertificate (extends BaseEntity)
**File**: `modules/kep/domain/KepCertificate.java`
**Table**: `kep_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ownerId | UUID | owner_id | NOT NULL |
| ownerName | String | owner_name | NOT NULL |
| serialNumber | String | serial_number | NOT NULL |
| issuer | String | issuer | NOT NULL |
| validFrom | LocalDateTime | valid_from | NOT NULL |
| validTo | LocalDateTime | valid_to | NOT NULL |
| thumbprint | String | thumbprint | NOT NULL |
| subjectCn | String | subject_cn |  |
| subjectOrg | String | subject_org |  |
| subjectInn | String | subject_inn |  |
| subjectOgrn | String | subject_ogrn |  |
| status | KepCertificateStatus | status | ENUM, NOT NULL |
| certificateData | String | certificate_data |  |
| qualified | boolean | is_qualified | NOT NULL |

---

### KepConfig (extends BaseEntity)
**File**: `modules/kep/domain/KepConfig.java`
**Table**: `kep_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| providerType | KepProviderType | provider_type | ENUM, NOT NULL |
| apiEndpoint | String | api_endpoint |  |
| apiKey | String | api_key |  |
| active | boolean | is_active | NOT NULL |
| settings | String | settings |  |

---

### KepSignature (extends BaseEntity)
**File**: `modules/kep/domain/KepSignature.java`
**Table**: `kep_signatures`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| certificateId | UUID | certificate_id | NOT NULL |
| documentModel | String | document_model | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| signedAt | LocalDateTime | signed_at | NOT NULL |
| signatureData | String | signature_data | NOT NULL |
| signatureHash | String | signature_hash |  |
| valid | boolean | is_valid | NOT NULL |
| validationMessage | String | validation_message |  |
| signerName | String | signer_name |  |
| signerPosition | String | signer_position |  |

---

### KepSigningRequest (extends BaseEntity)
**File**: `modules/kep/domain/KepSigningRequest.java`
**Table**: `kep_signing_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentModel | String | document_model | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| documentTitle | String | document_title |  |
| requesterId | UUID | requester_id | NOT NULL |
| signerId | UUID | signer_id | NOT NULL |
| status | KepSigningStatus | status | ENUM, NOT NULL |
| dueDate | LocalDate | due_date |  |
| signedAt | LocalDateTime | signed_at |  |
| rejectionReason | String | rejection_reason |  |
| priority | KepPriority | priority | ENUM, NOT NULL |

---

### MchDDocument (extends BaseEntity)
**File**: `modules/kep/domain/MchDDocument.java`
**Table**: `mchd_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| number | String | number | NOT NULL |
| principalInn | String | principal_inn | NOT NULL |
| principalName | String | principal_name | NOT NULL |
| representativeInn | String | representative_inn | NOT NULL |
| representativeName | String | representative_name | NOT NULL |
| representativeUserId | UUID | representative_user_id |  |
| scope | String | scope |  |
| validFrom | Instant | valid_from | NOT NULL |
| validTo | Instant | valid_to | NOT NULL |
| status | MchDStatus | status | ENUM, NOT NULL |
| registryId | String | registry_id |  |
| signatureData | String | signature_data |  |
| signingCertificateId | UUID | signing_certificate_id |  |
| notes | String | notes |  |

---

## Module: leave

### LeaveAllocation (extends BaseEntity)
**File**: `modules/leave/domain/LeaveAllocation.java`
**Table**: `leave_allocations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| leaveTypeId | UUID | leave_type_id | NOT NULL |
| allocatedDays | BigDecimal | allocated_days | NOT NULL |
| usedDays | BigDecimal | used_days | NOT NULL |
| remainingDays | BigDecimal | remaining_days | NOT NULL |
| year | int | year | NOT NULL |
| notes | String | notes |  |
| status | LeaveAllocationStatus | status | ENUM, NOT NULL |

---

### LeaveRequest (extends BaseEntity)
**File**: `modules/leave/domain/LeaveRequest.java`
**Table**: `leave_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| leaveTypeId | UUID | leave_type_id | NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| numberOfDays | BigDecimal | number_of_days | NOT NULL |
| reason | String | reason |  |
| status | LeaveRequestStatus | status | ENUM, NOT NULL |
| approverId | UUID | approver_id |  |
| approvedAt | LocalDateTime | approved_at |  |
| refusalReason | String | refusal_reason |  |

---

### LeaveType (extends BaseEntity)
**File**: `modules/leave/domain/LeaveType.java`
**Table**: `leave_types`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| color | String | color |  |
| maxDays | BigDecimal | max_days |  |
| requiresApproval | boolean | requires_approval | NOT NULL |
| allowNegative | boolean | allow_negative | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| validityStart | LocalDate | validity_start |  |
| validityEnd | LocalDate | validity_end |  |

---

## Module: legal

### ContractLegalTemplate (extends BaseEntity)
**File**: `modules/legal/domain/ContractLegalTemplate.java`
**Table**: `contract_legal_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| templateType | LegalTemplateType | template_type | ENUM, NOT NULL |
| category | String | category |  |
| content | String | content | NOT NULL |
| variables | String | variables |  |
| active | boolean | is_active | NOT NULL |
| templateVersion | int | template_version | NOT NULL |

---

### LegalCase (extends BaseEntity)
**File**: `modules/legal/domain/LegalCase.java`
**Table**: `legal_cases`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| caseNumber | String | case_number |  |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| caseType | CaseType | case_type | ENUM, NOT NULL |
| status | CaseStatus | status | ENUM, NOT NULL |
| amount | BigDecimal | amount |  |
| currency | String | currency |  |
| responsibleId | UUID | responsible_id |  |
| lawyerId | UUID | lawyer_id |  |
| courtName | String | court_name |  |
| filingDate | LocalDate | filing_date |  |
| hearingDate | LocalDate | hearing_date |  |
| resolutionDate | LocalDate | resolution_date |  |
| outcome | String | outcome |  |

---

### LegalDecision (extends BaseEntity)
**File**: `modules/legal/domain/LegalDecision.java`
**Table**: `legal_decisions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| caseId | UUID | case_id | NOT NULL |
| decisionDate | LocalDate | decision_date | NOT NULL |
| decisionType | DecisionType | decision_type | ENUM, NOT NULL |
| summary | String | summary |  |
| amount | BigDecimal | amount |  |
| enforceable | boolean | is_enforceable | NOT NULL |
| enforcementDeadline | LocalDate | enforcement_deadline |  |
| fileUrl | String | file_url |  |

---

### LegalRemark (extends BaseEntity)
**File**: `modules/legal/domain/LegalRemark.java`
**Table**: `legal_remarks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| caseId | UUID | case_id | NOT NULL |
| authorId | UUID | author_id | NOT NULL |
| remarkDate | LocalDate | remark_date | NOT NULL |
| content | String | content | NOT NULL |
| remarkType | RemarkType | remark_type | ENUM, NOT NULL |
| confidential | boolean | is_confidential | NOT NULL |

---

## Module: m29

### M29Document (extends BaseEntity)
**File**: `modules/m29/domain/M29Document.java`
**Table**: `m29_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL, UNIQUE |
| documentDate | LocalDate | document_date | NOT NULL |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| warehouseLocationId | UUID | warehouse_location_id |  |
| ks2Id | UUID | ks2_id |  |
| status | M29Status | status | ENUM, NOT NULL |
| notes | String | notes |  |

---

### M29Line (extends BaseEntity)
**File**: `modules/m29/domain/M29Line.java`
**Table**: `m29_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| m29Id | UUID | m29_id | NOT NULL |
| specItemId | UUID | spec_item_id |  |
| sequence | Integer | sequence |  |
| name | String | name | NOT NULL |
| plannedQuantity | BigDecimal | planned_quantity |  |
| actualQuantity | BigDecimal | actual_quantity |  |
| unitOfMeasure | String | unit_of_measure |  |
| variance | BigDecimal | variance |  |
| notes | String | notes |  |

---

## Module: maintenance

### MaintenanceEquipment (extends BaseEntity)
**File**: `modules/maintenance/domain/MaintenanceEquipment.java`
**Table**: `maintenance_equipment`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| serialNumber | String | serial_number |  |
| model | String | model |  |
| category | String | category |  |
| assignedTo | UUID | assigned_to |  |
| location | String | location |  |
| purchaseDate | LocalDate | purchase_date |  |
| warrantyDate | LocalDate | warranty_date |  |
| cost | BigDecimal | cost |  |
| status | EquipmentStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |
| lastMaintenanceDate | LocalDate | last_maintenance_date |  |
| nextMaintenanceDate | LocalDate | next_maintenance_date |  |
| maintenanceFrequencyDays | int | maintenance_frequency_days |  |

---

### MaintenanceRequest (extends BaseEntity)
**File**: `modules/maintenance/domain/MaintenanceRequest.java`
**Table**: `maintenance_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| requestDate | LocalDate | request_date | NOT NULL |
| equipmentId | UUID | equipment_id |  |
| equipmentName | String | equipment_name |  |
| maintenanceTeamId | UUID | maintenance_team_id |  |
| responsibleId | UUID | responsible_id |  |
| stageId | UUID | stage_id |  |
| priority | MaintenancePriority | priority | ENUM, NOT NULL |
| maintenanceType | MaintenanceType | maintenance_type | ENUM, NOT NULL |
| duration | BigDecimal | duration |  |
| scheduledDate | LocalDate | scheduled_date |  |
| completedDate | LocalDate | completed_date |  |
| notes | String | notes |  |
| cost | BigDecimal | cost |  |
| status | RequestStatus | status | ENUM, NOT NULL |

---

### MaintenanceStage (extends BaseEntity)
**File**: `modules/maintenance/domain/MaintenanceStage.java`
**Table**: `maintenance_stages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| sequence | int | sequence | NOT NULL |
| isClosed | boolean | is_closed | NOT NULL |
| description | String | description |  |

---

### MaintenanceTeam (extends BaseEntity)
**File**: `modules/maintenance/domain/MaintenanceTeam.java`
**Table**: `maintenance_teams`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| leadId | UUID | lead_id |  |
| color | String | color |  |
| memberIds | String | member_ids |  |

---

### PreventiveSchedule (extends BaseEntity)
**File**: `modules/maintenance/domain/PreventiveSchedule.java`
**Table**: `preventive_schedules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| equipmentId | UUID | equipment_id | NOT NULL |
| maintenanceTeamId | UUID | maintenance_team_id |  |
| name | String | name | NOT NULL |
| frequencyType | FrequencyType | frequency_type | ENUM, NOT NULL |
| frequencyInterval | int | frequency_interval | NOT NULL |
| nextExecution | LocalDate | next_execution |  |
| lastExecution | LocalDate | last_execution |  |
| isActive | boolean | is_active | NOT NULL |
| description | String | description |  |

---

## Module: messaging

### CallParticipant (extends BaseEntity)
**File**: `modules/messaging/domain/CallParticipant.java`
**Table**: `call_participants`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| callSessionId | UUID | call_session_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name |  |
| participantStatus | CallParticipantStatus | participant_status | ENUM, NOT NULL |
| joinedAt | Instant | joined_at |  |
| leftAt | Instant | left_at |  |
| isMuted | Boolean | is_muted | NOT NULL |
| isVideoEnabled | Boolean | is_video_enabled | NOT NULL |

---

### CallSession (extends BaseEntity)
**File**: `modules/messaging/domain/CallSession.java`
**Table**: `call_sessions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| title | String | title |  |
| projectId | UUID | project_id |  |
| channelId | UUID | channel_id |  |
| initiatorId | UUID | initiator_id | NOT NULL |
| initiatorName | String | initiator_name |  |
| callType | CallType | call_type | ENUM, NOT NULL |
| status | CallStatus | status | ENUM, NOT NULL |
| signalingKey | String | signaling_key | NOT NULL, UNIQUE |
| startedAt | Instant | started_at |  |
| endedAt | Instant | ended_at |  |
| durationSeconds | Integer | duration_seconds | NOT NULL |
| metadataJson | String | metadata_json |  |
| inviteToken | String | invite_token | UNIQUE |

---

### Channel (extends BaseEntity)
**File**: `modules/messaging/domain/Channel.java`
**Table**: `channels`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| channelType | ChannelType | channel_type | ENUM, NOT NULL |
| avatarUrl | String | avatar_url |  |
| creatorId | UUID | creator_id | NOT NULL |
| projectId | UUID | project_id |  |
| memberCount | Integer | member_count | NOT NULL |
| lastMessageAt | Instant | last_message_at |  |
| isPinned | Boolean | is_pinned | NOT NULL |
| isArchived | Boolean | is_archived | NOT NULL |

---

### ChannelMember (extends BaseEntity)
**File**: `modules/messaging/domain/ChannelMember.java`
**Table**: `channel_members`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| channelId | UUID | channel_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name |  |
| role | ChannelMemberRole | role | ENUM, NOT NULL |
| isMuted | Boolean | is_muted | NOT NULL |
| lastReadAt | Instant | last_read_at |  |
| unreadCount | Integer | unread_count | NOT NULL |
| joinedAt | Instant | joined_at | NOT NULL |

---

### MailActivity (extends BaseEntity)
**File**: `modules/messaging/domain/MailActivity.java`
**Table**: `mail_activities`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelName | String | model_name | NOT NULL |
| recordId | UUID | record_id | NOT NULL |
| activityTypeId | UUID | activity_type_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| assignedUserId | UUID | assigned_user_id | NOT NULL |
| summary | String | summary |  |
| note | String | note |  |
| dueDate | LocalDate | due_date | NOT NULL |
| status | MailActivityStatus | status | ENUM, NOT NULL |
| completedAt | Instant | completed_at |  |

---

### MailActivityType (extends BaseEntity)
**File**: `modules/messaging/domain/MailActivityType.java`
**Table**: `mail_activity_types`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| category | ActivityCategory | category | ENUM, NOT NULL |
| delayCount | int | delay_count | NOT NULL |
| delayUnit | ActivityDelayUnit | delay_unit | ENUM, NOT NULL |
| icon | String | icon |  |
| decorationType | ActivityDecorationType | decoration_type | ENUM |

---

### MailBlacklist (extends BaseEntity)
**File**: `modules/messaging/domain/MailBlacklist.java`
**Table**: `mail_blacklist`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| email | String | email | NOT NULL, UNIQUE |
| reason | String | reason |  |
| isActive | boolean | is_active | NOT NULL |

---

### MailFollower (extends BaseEntity)
**File**: `modules/messaging/domain/MailFollower.java`
**Table**: `mail_followers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelName | String | model_name | NOT NULL |
| recordId | UUID | record_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| channelId | UUID | channel_id |  |
| subtypeIds | String | subtype_ids |  |

---

### MailNotification (extends BaseEntity)
**File**: `modules/messaging/domain/MailNotification.java`
**Table**: `mail_notifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| messageId | UUID | message_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| isRead | boolean | is_read | NOT NULL |
| readAt | Instant | read_at |  |
| notificationType | MailNotificationType | notification_type | ENUM, NOT NULL |
| status | MailNotificationStatus | status | ENUM, NOT NULL |
| failureType | String | failure_type |  |

---

### MailSubtype (extends BaseEntity)
**File**: `modules/messaging/domain/MailSubtype.java`
**Table**: `mail_subtypes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| modelName | String | model_name |  |
| isDefault | boolean | is_default | NOT NULL |
| isInternal | boolean | is_internal | NOT NULL |
| parentId | UUID | parent_id |  |
| sequence | int | sequence | NOT NULL |

---

### MailTemplate (extends BaseEntity)
**File**: `modules/messaging/domain/MailTemplate.java`
**Table**: `mail_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| modelName | String | model_name |  |
| subject | String | subject |  |
| bodyHtml | String | body_html |  |
| emailFrom | String | email_from |  |
| emailTo | String | email_to |  |
| emailCc | String | email_cc |  |
| replyTo | String | reply_to |  |
| isActive | boolean | is_active | NOT NULL |
| lang | String | lang |  |

---

### MailTracking (extends BaseEntity)
**File**: `modules/messaging/domain/MailTracking.java`
**Table**: `mail_tracking`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| messageId | UUID | message_id | NOT NULL |
| recipientEmail | String | recipient_email | NOT NULL |
| status | MailTrackingStatus | status | ENUM, NOT NULL |
| sentAt | Instant | sent_at |  |
| deliveredAt | Instant | delivered_at |  |
| openedAt | Instant | opened_at |  |
| errorMessage | String | error_message |  |

---

### Message (extends BaseEntity)
**File**: `modules/messaging/domain/Message.java`
**Table**: `messages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| channelId | UUID | channel_id | NOT NULL |
| authorId | UUID | author_id | NOT NULL |
| authorName | String | author_name |  |
| authorAvatarUrl | String | author_avatar_url |  |
| content | String | content |  |
| messageType | MessageType | message_type | ENUM, NOT NULL |
| parentMessageId | UUID | parent_message_id |  |
| isEdited | Boolean | is_edited | NOT NULL |
| editedAt | Instant | edited_at |  |
| isPinned | Boolean | is_pinned | NOT NULL |
| pinnedBy | UUID | pinned_by |  |
| pinnedAt | Instant | pinned_at |  |
| replyCount | Integer | reply_count | NOT NULL |
| reactionCount | Integer | reaction_count | NOT NULL |
| attachmentUrl | String | attachment_url |  |
| attachmentName | String | attachment_name |  |
| attachmentSize | Long | attachment_size |  |
| attachmentType | String | attachment_type |  |

---

### MessageFavorite (extends BaseEntity)
**File**: `modules/messaging/domain/MessageFavorite.java`
**Table**: `message_favorites`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| messageId | UUID | message_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| note | String | note |  |

---

### MessageReaction (extends BaseEntity)
**File**: `modules/messaging/domain/MessageReaction.java`
**Table**: `message_reactions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| messageId | UUID | message_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name |  |
| emoji | String | emoji | NOT NULL |

---

### UserStatus (extends BaseEntity)
**File**: `modules/messaging/domain/UserStatus.java`
**Table**: `user_statuses`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL, UNIQUE |
| statusText | String | status_text |  |
| statusEmoji | String | status_emoji |  |
| isOnline | Boolean | is_online | NOT NULL |
| lastSeenAt | Instant | last_seen_at |  |
| availabilityStatus | AvailabilityStatus | availability_status | ENUM, NOT NULL |

---

## Module: mobile

### FieldReport (extends BaseEntity)
**File**: `modules/mobile/domain/FieldReport.java`
**Table**: `field_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | FieldReportStatus | status | ENUM, NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| authorId | UUID | author_id | NOT NULL |
| authorName | String | author_name |  |
| location | String | location |  |
| weatherCondition | String | weather_condition |  |
| temperature | Double | temperature |  |
| workersOnSite | Integer | workers_on_site |  |
| reportDate | LocalDate | report_date | NOT NULL |

---

### GeoLocation (extends BaseEntity)
**File**: `modules/mobile/domain/GeoLocation.java`
**Table**: `geo_locations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| latitude | Double | latitude | NOT NULL |
| longitude | Double | longitude | NOT NULL |
| accuracy | Double | accuracy |  |
| altitude | Double | altitude |  |
| recordedAt | Instant | recorded_at | NOT NULL |
| projectId | UUID | project_id |  |
| entityType | String | entity_type |  |
| entityId | UUID | entity_id |  |

---

### MobileDevice (extends BaseEntity)
**File**: `modules/mobile/domain/MobileDevice.java`
**Table**: `mobile_devices`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| deviceToken | String | device_token | NOT NULL |
| platform | MobilePlatform | platform | ENUM, NOT NULL |
| deviceModel | String | device_model |  |
| osVersion | String | os_version |  |
| appVersion | String | app_version |  |
| lastActiveAt | Instant | last_active_at |  |
| isActive | Boolean | is_active | NOT NULL |

---

### MobileFormConfig (extends BaseEntity)
**File**: `modules/mobile/domain/MobileFormConfig.java`
**Table**: `mobile_form_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | String | entity_type | NOT NULL |
| formLayout | Map<String, Object> | form_layout | JSONB, NOT NULL |
| requiredFields | List<String> | required_fields | JSONB |
| offlineCapable | Boolean | offline_capable | NOT NULL |
| formVersion | Integer | form_version | NOT NULL |
| isActive | Boolean | is_active | NOT NULL |

---

### OfflineAction (extends BaseEntity)
**File**: `modules/mobile/domain/OfflineAction.java`
**Table**: `offline_actions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| deviceId | UUID | device_id |  |
| actionType | OfflineActionType | action_type | ENUM, NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityId | UUID | entity_id |  |
| payload | Map<String, Object> | payload | JSONB, NOT NULL |
| syncedAt | Instant | synced_at |  |
| status | OfflineActionStatus | status | ENUM, NOT NULL |
| conflictResolution | String | conflict_resolution |  |

---

### PhotoCapture (extends BaseEntity)
**File**: `modules/mobile/domain/PhotoCapture.java`
**Table**: `photo_captures`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| projectId | UUID | project_id |  |
| photoUrl | String | photo_url | NOT NULL |
| thumbnailUrl | String | thumbnail_url |  |
| latitude | Double | latitude |  |
| longitude | Double | longitude |  |
| takenAt | Instant | taken_at | NOT NULL |
| entityType | String | entity_type |  |
| entityId | UUID | entity_id |  |
| description | String | description |  |
| tags | List<String> | tags | JSONB |

---

### PushNotification (extends BaseEntity)
**File**: `modules/mobile/domain/PushNotification.java`
**Table**: `push_notifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| deviceId | UUID | device_id | NOT NULL |
| title | String | title | NOT NULL |
| body | String | body | NOT NULL |
| data | Map<String, Object> | data | JSONB |
| status | PushNotificationStatus | status | ENUM, NOT NULL |
| sentAt | Instant | sent_at |  |
| deliveredAt | Instant | delivered_at |  |
| errorMessage | String | error_message |  |

---

## Module: monitoring

### BackupRecord (extends BaseEntity)
**File**: `modules/monitoring/domain/BackupRecord.java`
**Table**: `backup_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| backupType | BackupType | backup_type | ENUM, NOT NULL |
| status | BackupStatus | status | ENUM, NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| sizeBytes | Long | size_bytes |  |
| storageLocation | String | storage_location |  |
| errorMessage | String | error_message |  |

---

### SystemEvent (extends BaseEntity)
**File**: `modules/monitoring/domain/SystemEvent.java`
**Table**: `system_events`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| eventType | SystemEventType | event_type | ENUM, NOT NULL |
| severity | EventSeverity | severity | ENUM, NOT NULL |
| message | String | message | NOT NULL |
| details | Map<String, Object> | details | JSONB |
| source | String | source |  |
| userId | UUID | user_id |  |
| occurredAt | Instant | occurred_at | NOT NULL |

---

### SystemHealthCheck (extends BaseEntity)
**File**: `modules/monitoring/domain/SystemHealthCheck.java`
**Table**: `system_health_checks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| component | HealthComponent | component | ENUM, NOT NULL |
| status | HealthStatus | status | ENUM, NOT NULL |
| responseTimeMs | Long | response_time_ms |  |
| message | String | message |  |
| details | Map<String, Object> | details | JSONB |
| checkedAt | Instant | checked_at | NOT NULL |

---

### SystemMetric (extends BaseEntity)
**File**: `modules/monitoring/domain/SystemMetric.java`
**Table**: `system_metrics`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| metricName | String | metric_name | NOT NULL |
| metricValue | Double | metric_value | NOT NULL |
| metricUnit | String | metric_unit |  |
| tags | Map<String, String> | tags | JSONB |
| recordedAt | Instant | recorded_at | NOT NULL |

---

## Module: monteCarlo

### MonteCarloEacResult (extends BaseEntity)
**File**: `modules/monteCarlo/domain/MonteCarloEacResult.java`
**Table**: `monte_carlo_eac_results`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| simulationId | UUID | simulation_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| iterations | int | iterations | NOT NULL |
| costP10 | BigDecimal | cost_p10 |  |
| costP50 | BigDecimal | cost_p50 |  |
| costP90 | BigDecimal | cost_p90 |  |
| costMean | BigDecimal | cost_mean |  |
| costStdDev | BigDecimal | cost_std_dev |  |
| scheduleP10 | Integer | schedule_p10 |  |
| scheduleP50 | Integer | schedule_p50 |  |
| scheduleP90 | Integer | schedule_p90 |  |
| scheduleMean | BigDecimal | schedule_mean |  |
| eacTrajectoryJson | String | eac_trajectory_json |  |
| tcpiBac | BigDecimal | tcpi_bac |  |
| tcpiEac | BigDecimal | tcpi_eac |  |
| confidenceBandsJson | String | confidence_bands_json |  |
| insightsJson | String | insights_json |  |
| costHistogramJson | String | cost_histogram_json |  |
| scheduleHistogramJson | String | schedule_histogram_json |  |
| calculatedAt | Instant | calculated_at | NOT NULL |

---

### MonteCarloResult (extends BaseEntity)
**File**: `modules/monteCarlo/domain/MonteCarloResult.java`
**Table**: `monte_carlo_results`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| simulationId | UUID | simulation_id | NOT NULL |
| percentile | int | percentile | NOT NULL |
| durationDays | int | duration_days | NOT NULL |
| completionDate | LocalDate | completion_date |  |
| probability | BigDecimal | probability |  |

---

### MonteCarloSimulation (extends BaseEntity)
**File**: `modules/monteCarlo/domain/MonteCarloSimulation.java`
**Table**: `monte_carlo_simulations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| projectId | UUID | project_id |  |
| status | SimulationStatus | status | ENUM, NOT NULL |
| iterations | int | iterations | NOT NULL |
| confidenceLevel | BigDecimal | confidence_level | NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| resultP50Duration | Integer | result_p50_duration |  |
| resultP85Duration | Integer | result_p85_duration |  |
| resultP95Duration | Integer | result_p95_duration |  |
| resultP50Date | LocalDate | result_p50_date |  |
| resultP85Date | LocalDate | result_p85_date |  |
| resultP95Date | LocalDate | result_p95_date |  |
| baselineStartDate | LocalDate | baseline_start_date |  |
| baselineDuration | Integer | baseline_duration |  |
| description | String | description |  |

---

### MonteCarloTask (extends BaseEntity)
**File**: `modules/monteCarlo/domain/MonteCarloTask.java`
**Table**: `monte_carlo_tasks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| simulationId | UUID | simulation_id | NOT NULL |
| taskName | String | task_name | NOT NULL |
| wbsNodeId | UUID | wbs_node_id |  |
| optimisticDuration | int | optimistic_duration | NOT NULL |
| mostLikelyDuration | int | most_likely_duration | NOT NULL |
| pessimisticDuration | int | pessimistic_duration | NOT NULL |
| distribution | DistributionType | distribution | ENUM, NOT NULL |
| dependencies | String | dependencies |  |

---

## Module: monthlySchedule

### MonthlySchedule (extends BaseEntity)
**File**: `modules/monthlySchedule/domain/MonthlySchedule.java`
**Table**: `monthly_schedules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| year | Integer | year | NOT NULL |
| month | Integer | month | NOT NULL |
| status | MonthlyScheduleStatus | status | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |

---

### MonthlyScheduleLine (extends BaseEntity)
**File**: `modules/monthlySchedule/domain/MonthlyScheduleLine.java`
**Table**: `monthly_schedule_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| scheduleId | UUID | schedule_id | NOT NULL |
| workName | String | work_name | NOT NULL |
| unit | String | unit |  |
| plannedVolume | BigDecimal | planned_volume |  |
| actualVolume | BigDecimal | actual_volume |  |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| responsible | String | responsible |  |
| notes | String | notes |  |

---

## Module: notification

### BroadcastNotification (extends BaseEntity)
**File**: `modules/notification/domain/BroadcastNotification.java`
**Table**: `broadcast_notifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| title | String | title | NOT NULL |
| message | String | message | NOT NULL |
| type | BroadcastType | type | ENUM, NOT NULL |
| priority | BroadcastPriority | priority | ENUM, NOT NULL |
| broadcastCreatedBy | UUID | broadcast_created_by | NOT NULL |
| expiresAt | Instant | expires_at |  |
| active | boolean | active | NOT NULL |

---

### Notification (extends BaseEntity)
**File**: `modules/notification/domain/Notification.java`
**Table**: `notifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| title | String | title | NOT NULL |
| message | String | message | NOT NULL |
| notificationType | NotificationType | notification_type | ENUM, NOT NULL |
| sourceModel | String | source_model |  |
| sourceId | UUID | source_id |  |
| isRead | boolean | is_read | NOT NULL |
| readAt | Instant | read_at |  |
| actionUrl | String | action_url |  |
| priority | NotificationPriority | priority | ENUM, NOT NULL |
| expiresAt | Instant | expires_at |  |

---

### NotificationBatch (extends BaseEntity)
**File**: `modules/notification/domain/NotificationBatch.java`
**Table**: `notification_batches`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| title | String | title | NOT NULL |
| message | String | message | NOT NULL |
| notificationType | NotificationType | notification_type | ENUM, NOT NULL |
| targetType | TargetType | target_type | ENUM, NOT NULL |
| targetFilter | Map<String, Object> | target_filter | JSONB |
| sentCount | int | sent_count | NOT NULL |
| createdById | UUID | created_by_id |  |
| status | BatchStatus | status | ENUM, NOT NULL |

---

### NotificationEventEntity (extends BaseEntity)
**File**: `modules/notification/domain/NotificationEventEntity.java`
**Table**: `notification_events`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| userId | UUID | user_id | NOT NULL |
| type | String | type | NOT NULL |
| title | String | title | NOT NULL |
| message | String | message |  |
| entityType | String | entity_type |  |
| entityId | UUID | entity_id |  |
| projectId | UUID | project_id |  |
| isRead | boolean | is_read | NOT NULL |

---

### NotificationPreference (extends BaseEntity)
**File**: `modules/notification/domain/NotificationPreference.java`
**Table**: `notification_preferences`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| channel | NotificationChannel | channel | ENUM, NOT NULL |
| category | NotificationCategory | category | ENUM, NOT NULL |
| enabled | boolean | enabled | NOT NULL |

---

## Module: ops

### DailyReport (extends BaseEntity)
**File**: `modules/ops/domain/DailyReport.java`
**Table**: `daily_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| workOrderId | UUID | work_order_id | NOT NULL |
| reportDate | LocalDate | report_date | NOT NULL |
| workDone | String | work_done |  |
| issues | String | issues |  |
| materialsUsed | String | materials_used | JSONB |
| laborHours | BigDecimal | labor_hours |  |
| equipmentHours | BigDecimal | equipment_hours |  |
| weatherImpact | WeatherImpact | weather_impact | ENUM |
| submittedById | UUID | submitted_by_id |  |

---

### Defect (extends BaseEntity)
**File**: `modules/ops/domain/Defect.java`
**Table**: `defects`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id | NOT NULL |
| qualityCheckId | UUID | quality_check_id |  |
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| description | String | description |  |
| location | String | location |  |
| severity | DefectSeverity | severity | ENUM, NOT NULL |
| photoUrls | String | photo_urls | JSONB |
| detectedById | UUID | detected_by_id |  |
| assignedToId | UUID | assigned_to_id |  |
| contractorId | UUID | contractor_id |  |
| fixDeadline | LocalDate | fix_deadline |  |
| slaDeadlineHours | Integer | sla_deadline_hours |  |
| status | DefectStatus | status | ENUM, NOT NULL |
| fixDescription | String | fix_description |  |
| fixedAt | Instant | fixed_at |  |
| assignedAt | Instant | assigned_at |  |
| verificationRequestedAt | Instant | verification_requested_at |  |
| reinspectionCount | Integer | reinspection_count |  |
| drawingId | UUID | drawing_id |  |
| pinX | Double | pin_x |  |
| pinY | Double | pin_y |  |

---

### DispatchOrder (extends BaseEntity)
**File**: `modules/ops/domain/DispatchOrder.java`
**Table**: `dispatch_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| orderNumber | String | order_number | NOT NULL, UNIQUE |
| projectId | UUID | project_id | NOT NULL |
| vehicleId | UUID | vehicle_id |  |
| driverId | UUID | driver_id |  |
| loadingPoint | String | loading_point |  |
| unloadingPoint | String | unloading_point |  |
| materialName | String | material_name |  |
| quantity | BigDecimal | quantity |  |
| unit | String | unit |  |
| scheduledDate | LocalDate | scheduled_date |  |
| scheduledTime | String | scheduled_time |  |
| actualDepartureAt | LocalDateTime | actual_departure_at |  |
| actualArrivalAt | LocalDateTime | actual_arrival_at |  |
| status | DispatchStatus | status | ENUM, NOT NULL |
| distance | BigDecimal | distance |  |
| fuelUsed | BigDecimal | fuel_used |  |
| notes | String | notes |  |

---

### DispatchRoute (extends BaseEntity)
**File**: `modules/ops/domain/DispatchRoute.java`
**Table**: `dispatch_routes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| fromLocation | String | from_location | NOT NULL |
| toLocation | String | to_location | NOT NULL |
| distanceKm | BigDecimal | distance_km |  |
| estimatedDurationMinutes | int | estimated_duration_minutes |  |
| isActive | boolean | is_active | NOT NULL |

---

### FieldInstruction (extends BaseEntity)
**File**: `modules/ops/domain/FieldInstruction.java`
**Table**: `field_instructions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| content | String | content | NOT NULL |
| issuedById | UUID | issued_by_id |  |
| receivedById | UUID | received_by_id |  |
| dueDate | LocalDate | due_date |  |
| status | FieldInstructionStatus | status | ENUM, NOT NULL |
| priority | WorkOrderPriority | priority | ENUM, NOT NULL |
| responseText | String | response_text |  |
| respondedAt | Instant | responded_at |  |

---

### ShiftHandover (extends BaseEntity)
**File**: `modules/ops/domain/ShiftHandover.java`
**Table**: `shift_handovers`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| fromShiftLeaderId | UUID | from_shift_leader_id |  |
| toShiftLeaderId | UUID | to_shift_leader_id |  |
| handoverDate | LocalDate | handover_date | NOT NULL |
| openItems | String | open_items |  |
| equipmentStatus | String | equipment_status |  |
| safetyNotes | String | safety_notes |  |
| acknowledged | boolean | acknowledged | NOT NULL |

---

### WeatherRecord (extends BaseEntity)
**File**: `modules/ops/domain/WeatherRecord.java`
**Table**: `weather_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| recordDate | LocalDate | record_date | NOT NULL |
| temperature | BigDecimal | temperature |  |
| humidity | BigDecimal | humidity |  |
| windSpeed | BigDecimal | wind_speed |  |
| condition | WeatherCondition | condition | ENUM |
| precipitation | BigDecimal | precipitation |  |
| workable | boolean | is_workable | NOT NULL |
| notes | String | notes |  |

---

### WorkOrder (extends BaseEntity)
**File**: `modules/ops/domain/WorkOrder.java`
**Table**: `work_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| description | String | description |  |
| workType | WorkType | work_type | ENUM, NOT NULL |
| location | String | location |  |
| assignedCrewId | UUID | assigned_crew_id |  |
| foremanId | UUID | foreman_id |  |
| plannedStart | LocalDate | planned_start |  |
| plannedEnd | LocalDate | planned_end |  |
| actualStart | LocalDate | actual_start |  |
| actualEnd | LocalDate | actual_end |  |
| status | WorkOrderStatus | status | ENUM, NOT NULL |
| priority | WorkOrderPriority | priority | ENUM, NOT NULL |
| completionPercent | Integer | completion_percent | NOT NULL |

---

## Module: organization

### Department (extends BaseEntity)
**File**: `modules/organization/domain/Department.java`
**Table**: `departments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code |  |
| organizationId | UUID | organization_id | NOT NULL |
| headId | UUID | head_id |  |
| parentId | UUID | parent_id |  |
| description | String | description |  |
| sortOrder | Integer | sort_order |  |
| active | Boolean | active |  |

---

### Organization (extends BaseEntity)
**File**: `modules/organization/domain/Organization.java`
**Table**: `organizations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| inn | String | inn | UNIQUE |
| kpp | String | kpp |  |
| ogrn | String | ogrn |  |
| legalAddress | String | legal_address |  |
| actualAddress | String | actual_address |  |
| phone | String | phone |  |
| email | String | email |  |
| type | OrganizationType | type | ENUM, NOT NULL |
| parentId | UUID | parent_id |  |
| active | boolean | active | NOT NULL |

---

### PartnerEnrichment (extends BaseEntity)
**File**: `modules/organization/domain/PartnerEnrichment.java`
**Table**: `partner_enrichments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| partnerId | UUID | partner_id | NOT NULL |
| inn | String | inn |  |
| ogrn | String | ogrn |  |
| kpp | String | kpp |  |
| legalName | String | legal_name |  |
| tradeName | String | trade_name |  |
| legalAddress | String | legal_address |  |
| actualAddress | String | actual_address |  |
| registrationDate | LocalDate | registration_date |  |
| status | PartnerLegalStatus | status | ENUM |
| authorizedCapital | BigDecimal | authorized_capital |  |
| ceoName | String | ceo_name |  |
| ceoInn | String | ceo_inn |  |
| employeeCount | Integer | employee_count |  |
| mainActivity | String | main_activity |  |
| okvedCode | String | okved_code |  |
| enrichedAt | Instant | enriched_at |  |
| source | EnrichmentSource | source | ENUM, NOT NULL |
| reliabilityScore | int | reliability_score |  |

---

### PartnerEnrichmentLog (extends BaseEntity)
**File**: `modules/organization/domain/PartnerEnrichmentLog.java`
**Table**: `partner_enrichment_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| partnerId | UUID | partner_id | NOT NULL |
| source | String | source | NOT NULL |
| requestedAt | Instant | requested_at | NOT NULL |
| status | EnrichmentLogStatus | status | ENUM, NOT NULL |
| responseData | String | response_data |  |
| errorMessage | String | error_message |  |

---

## Module: payroll

### PayrollCalculation (extends BaseEntity)
**File**: `modules/payroll/domain/PayrollCalculation.java`
**Table**: `payroll_calculations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| templateId | UUID | template_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| basePay | BigDecimal | base_pay |  |
| overtimePay | BigDecimal | overtime_pay |  |
| bonusPay | BigDecimal | bonus_pay |  |
| grossPay | BigDecimal | gross_pay |  |
| taxDeduction | BigDecimal | tax_deduction |  |
| pensionDeduction | BigDecimal | pension_deduction |  |
| socialDeduction | BigDecimal | social_deduction |  |
| medicalDeduction | BigDecimal | medical_deduction |  |
| totalDeductions | BigDecimal | total_deductions |  |
| netPay | BigDecimal | net_pay |  |
| status | PayrollCalculationStatus | status | ENUM, NOT NULL |
| approvedBy | UUID | approved_by |  |
| approvedAt | Instant | approved_at |  |

---

### PayrollTemplate (extends BaseEntity)
**File**: `modules/payroll/domain/PayrollTemplate.java`
**Table**: `payroll_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code | UNIQUE |
| description | String | description |  |
| type | PayrollType | type | ENUM, NOT NULL |
| baseSalary | BigDecimal | base_salary |  |
| hourlyRate | BigDecimal | hourly_rate |  |
| overtimeMultiplier | BigDecimal | overtime_multiplier |  |
| bonusPercentage | BigDecimal | bonus_percentage |  |
| taxRate | BigDecimal | tax_rate |  |
| pensionRate | BigDecimal | pension_rate |  |
| socialRate | BigDecimal | social_rate |  |
| medicalRate | BigDecimal | medical_rate |  |
| currency | String | currency | NOT NULL |
| isActive | boolean | is_active | NOT NULL |
| projectId | UUID | project_id |  |

---

## Module: permission

### AuditPermissionChange
**File**: `modules/permission/domain/AuditPermissionChange.java`
**Table**: `permission_audit_log`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| userId | UUID | user_id | NOT NULL |
| action | PermissionAuditAction | action | ENUM, NOT NULL |
| targetUserId | UUID | target_user_id |  |
| groupId | UUID | group_id |  |
| details | String | details |  |
| ipAddress | String | ip_address |  |
| createdAt | Instant | created_at | NOT NULL |

---

### FieldAccess (extends BaseEntity)
**File**: `modules/permission/domain/FieldAccess.java`
**Table**: `field_access_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelName | String | model_name | NOT NULL |
| fieldName | String | field_name | NOT NULL |
| groupId | UUID | group_id | NOT NULL |
| canRead | boolean | can_read | NOT NULL |
| canWrite | boolean | can_write | NOT NULL |

---

### ModelAccess (extends BaseEntity)
**File**: `modules/permission/domain/ModelAccess.java`
**Table**: `model_access_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelName | String | model_name | NOT NULL |
| groupId | UUID | group_id | NOT NULL |
| canRead | boolean | can_read | NOT NULL |
| canCreate | boolean | can_create | NOT NULL |
| canUpdate | boolean | can_update | NOT NULL |
| canDelete | boolean | can_delete | NOT NULL |

---

### PermissionGroup (extends BaseEntity)
**File**: `modules/permission/domain/PermissionGroup.java`
**Table**: `permission_groups`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL, UNIQUE |
| displayName | String | display_name | NOT NULL |
| description | String | description |  |
| category | String | category | NOT NULL |
| parentGroupId | UUID | parent_group_id |  |
| isActive | boolean | is_active | NOT NULL |
| sequence | int | sequence | NOT NULL |

---

### RecordRule (extends BaseEntity)
**File**: `modules/permission/domain/RecordRule.java`
**Table**: `record_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| modelName | String | model_name | NOT NULL |
| groupId | UUID | group_id |  |
| domainFilter | String | domain_filter | NOT NULL |
| permRead | boolean | perm_read | NOT NULL |
| permWrite | boolean | perm_write | NOT NULL |
| permCreate | boolean | perm_create | NOT NULL |
| permUnlink | boolean | perm_unlink | NOT NULL |
| isGlobal | boolean | is_global | NOT NULL |

---

### UserGroup (extends BaseEntity)
**File**: `modules/permission/domain/UserGroup.java`
**Table**: `user_groups`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| groupId | UUID | group_id | NOT NULL |

---

## Module: planfact

### PlanFactLine (extends BaseEntity)
**File**: `modules/planfact/domain/PlanFactLine.java`
**Table**: `plan_fact_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| sequence | Integer | sequence |  |
| category | PlanFactCategory | category | ENUM, NOT NULL |
| planAmount | BigDecimal | plan_amount | NOT NULL |
| factAmount | BigDecimal | fact_amount | NOT NULL |
| variance | BigDecimal | variance |  |
| variancePercent | BigDecimal | variance_percent |  |
| notes | String | notes |  |

---

## Module: planning

### AllocationScenario (extends BaseEntity)
**File**: `modules/planning/domain/AllocationScenario.java`
**Table**: `allocation_scenarios`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| scenarioDataJson | String | scenario_data_json | NOT NULL |
| resultJson | String | result_json |  |

---

### EmployeeSkill (extends BaseEntity)
**File**: `modules/planning/domain/EmployeeSkill.java`
**Table**: `employee_skills`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| skillName | String | skill_name | NOT NULL |
| skillCategory | SkillCategory | skill_category | ENUM |
| proficiencyLevel | Integer | proficiency_level | NOT NULL |
| certifiedUntil | LocalDate | certified_until |  |
| certificationNumber | String | certification_number |  |
| verifiedAt | Instant | verified_at |  |
| verifiedBy | UUID | verified_by |  |
| notes | String | notes |  |

---

### EvmSnapshot (extends BaseEntity)
**File**: `modules/planning/domain/EvmSnapshot.java`
**Table**: `evm_snapshots`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| snapshotDate | LocalDate | snapshot_date | NOT NULL |
| dataDate | LocalDate | data_date |  |
| budgetAtCompletion | BigDecimal | budget_at_completion |  |
| plannedValue | BigDecimal | planned_value |  |
| earnedValue | BigDecimal | earned_value |  |
| actualCost | BigDecimal | actual_cost |  |
| cpi | BigDecimal | cpi |  |
| spi | BigDecimal | spi |  |
| eac | BigDecimal | eac |  |
| etcValue | BigDecimal | etc_value |  |
| tcpi | BigDecimal | tcpi |  |
| percentComplete | BigDecimal | percent_complete |  |
| criticalPathLength | Integer | critical_path_length |  |
| notes | String | notes |  |
| wbsNodeId | UUID | wbs_node_id |  |

---

### MobilizationLine
**File**: `modules/planning/domain/MobilizationLine.java`
**Table**: `mobilization_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| scheduleId | UUID | schedule_id | NOT NULL |
| resourceType | String | resource_type | NOT NULL |
| resourceName | String | resource_name | NOT NULL |
| quantity | Integer | quantity |  |
| rate | BigDecimal | rate |  |
| rateUnit | String | rate_unit |  |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| totalCost | BigDecimal | total_cost |  |
| notes | String | notes |  |

---

### MobilizationSchedule
**File**: `modules/planning/domain/MobilizationSchedule.java`
**Table**: `mobilization_schedules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| name | String | name |  |
| phase | String | phase | NOT NULL |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| totalPersonnelCost | BigDecimal | total_personnel_cost |  |
| totalEquipmentCost | BigDecimal | total_equipment_cost |  |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

### MultiProjectAllocation (extends BaseEntity)
**File**: `modules/planning/domain/MultiProjectAllocation.java`
**Table**: `multi_project_allocations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| resourceType | MultiProjectResourceType | resource_type | ENUM, NOT NULL |
| resourceId | UUID | resource_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| allocationPercent | Integer | allocation_percent | NOT NULL |
| role | String | role |  |
| notes | String | notes |  |

---

### ProjectSkillRequirement (extends BaseEntity)
**File**: `modules/planning/domain/ProjectSkillRequirement.java`
**Table**: `project_skill_requirements`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| skillName | String | skill_name | NOT NULL |
| skillCategory | SkillCategory | skill_category | ENUM |
| minimumProficiency | Integer | minimum_proficiency | NOT NULL |
| requiredCount | Integer | required_count | NOT NULL |
| isMandatory | Boolean | is_mandatory | NOT NULL |
| notes | String | notes |  |

---

### ResourceAllocation (extends BaseEntity)
**File**: `modules/planning/domain/ResourceAllocation.java`
**Table**: `resource_allocations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| wbsNodeId | UUID | wbs_node_id | NOT NULL |
| resourceType | ResourceType | resource_type | ENUM |
| resourceId | UUID | resource_id |  |
| resourceName | String | resource_name |  |
| plannedUnits | BigDecimal | planned_units |  |
| actualUnits | BigDecimal | actual_units |  |
| unitRate | BigDecimal | unit_rate |  |
| plannedCost | BigDecimal | planned_cost |  |
| actualCost | BigDecimal | actual_cost |  |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |

---

### ScheduleBaseline (extends BaseEntity)
**File**: `modules/planning/domain/ScheduleBaseline.java`
**Table**: `schedule_baselines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| baselineType | BaselineType | baseline_type | ENUM, NOT NULL |
| baselineDate | LocalDate | baseline_date | NOT NULL |
| snapshotData | String | snapshot_data |  |
| createdById | UUID | created_by_id |  |
| notes | String | notes |  |

---

### WbsDependency (extends BaseEntity)
**File**: `modules/planning/domain/WbsDependency.java`
**Table**: `wbs_dependencies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| predecessorId | UUID | predecessor_id | NOT NULL |
| successorId | UUID | successor_id | NOT NULL |
| dependencyType | DependencyType | dependency_type | ENUM, NOT NULL |
| lagDays | Integer | lag_days | NOT NULL |

---

### WbsNode (extends BaseEntity)
**File**: `modules/planning/domain/WbsNode.java`
**Table**: `wbs_nodes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id | NOT NULL |
| parentId | UUID | parent_id |  |
| code | String | code |  |
| name | String | name | NOT NULL |
| nodeType | WbsNodeType | node_type | ENUM, NOT NULL |
| level | Integer | level |  |
| sortOrder | Integer | sort_order |  |
| plannedStartDate | LocalDate | planned_start_date |  |
| plannedEndDate | LocalDate | planned_end_date |  |
| actualStartDate | LocalDate | actual_start_date |  |
| actualEndDate | LocalDate | actual_end_date |  |
| duration | Integer | duration |  |
| percentComplete | BigDecimal | percent_complete |  |
| costCodeId | UUID | cost_code_id |  |
| responsibleId | UUID | responsible_id |  |
| isCritical | Boolean | is_critical | NOT NULL |
| totalFloat | Integer | total_float |  |
| freeFloat | Integer | free_float |  |
| earlyStart | LocalDate | early_start |  |
| earlyFinish | LocalDate | early_finish |  |
| lateStart | LocalDate | late_start |  |
| lateFinish | LocalDate | late_finish |  |
| plannedVolume | BigDecimal | planned_volume |  |
| volumeUnitOfMeasure | String | volume_unit_of_measure |  |

---

### WorkVolumeEntry (extends BaseEntity)
**File**: `modules/planning/domain/WorkVolumeEntry.java`
**Table**: `work_volume_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| wbsNodeId | UUID | wbs_node_id | NOT NULL |
| recordDate | LocalDate | record_date | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| unitOfMeasure | String | unit_of_measure | NOT NULL |
| description | String | description |  |
| notes | String | notes |  |

---

## Module: pmWorkflow

### Issue (extends BaseEntity)
**File**: `modules/pmWorkflow/domain/Issue.java`
**Table**: `pm_issues`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| number | String | number | NOT NULL |
| title | String | title | NOT NULL |
| description | String | description |  |
| issueType | IssueType | issue_type | ENUM |
| status | IssueStatus | status | ENUM, NOT NULL |
| priority | IssuePriority | priority | ENUM, NOT NULL |
| assignedToId | UUID | assigned_to_id |  |
| reportedById | UUID | reported_by_id | NOT NULL |
| dueDate | LocalDate | due_date |  |
| resolvedDate | LocalDate | resolved_date |  |
| resolvedById | UUID | resolved_by_id |  |
| location | String | location |  |
| linkedRfiId | UUID | linked_rfi_id |  |
| linkedSubmittalId | UUID | linked_submittal_id |  |
| linkedDocumentIds | String | linked_document_ids | JSONB |
| rootCause | String | root_cause |  |
| resolution | String | resolution |  |
| tags | String | tags | JSONB |

---

### IssueComment (extends BaseEntity)
**File**: `modules/pmWorkflow/domain/IssueComment.java`
**Table**: `pm_issue_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| issueId | UUID | issue_id | NOT NULL |
| authorId | UUID | author_id | NOT NULL |
| commentText | String | comment_text | NOT NULL |
| attachmentIds | String | attachment_ids |  |
| postedAt | Instant | posted_at |  |

---

### Rfi (extends BaseEntity)
**File**: `modules/pmWorkflow/domain/Rfi.java`
**Table**: `rfis`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| number | String | number | NOT NULL |
| subject | String | subject | NOT NULL |
| question | String | question | NOT NULL |
| answer | String | answer |  |
| status | RfiStatus | status | ENUM, NOT NULL |
| priority | RfiPriority | priority | ENUM, NOT NULL |
| assignedToId | UUID | assigned_to_id |  |
| responsibleId | UUID | responsible_id |  |
| dueDate | LocalDate | due_date |  |
| answeredDate | LocalDate | answered_date |  |
| answeredById | UUID | answered_by_id |  |
| costImpact | Boolean | cost_impact | NOT NULL |
| scheduleImpact | Boolean | schedule_impact | NOT NULL |
| relatedDrawingId | UUID | related_drawing_id |  |
| relatedSpecSection | String | related_spec_section |  |
| distributionList | String | distribution_list | JSONB |
| linkedDocumentIds | String | linked_document_ids | JSONB |
| tags | String | tags | JSONB |

---

### RfiResponse (extends BaseEntity)
**File**: `modules/pmWorkflow/domain/RfiResponse.java`
**Table**: `rfi_responses`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| rfiId | UUID | rfi_id | NOT NULL |
| responderId | UUID | responder_id | NOT NULL |
| responseText | String | response_text | NOT NULL |
| attachmentIds | String | attachment_ids |  |
| isOfficial | Boolean | is_official | NOT NULL |
| respondedAt | Instant | responded_at |  |

---

### SubmittalPackage (extends BaseEntity)
**File**: `modules/pmWorkflow/domain/SubmittalPackage.java`
**Table**: `pm_submittal_packages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| packageNumber | String | package_number |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| submittalIds | String | submittal_ids |  |

---

### SubmittalReview (extends BaseEntity)
**File**: `modules/pmWorkflow/domain/SubmittalReview.java`
**Table**: `pm_submittal_reviews`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| submittalId | UUID | submittal_id | NOT NULL |
| reviewerId | UUID | reviewer_id | NOT NULL |
| status | SubmittalStatus | status | ENUM |
| comments | String | comments |  |
| reviewedAt | Instant | reviewed_at |  |
| stampType | String | stamp_type |  |
| attachmentIds | String | attachment_ids |  |

---

## Module: portal

### ClientClaim (extends BaseEntity)
**File**: `modules/portal/domain/ClientClaim.java`
**Table**: `client_claims`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| claimNumber | String | claim_number |  |
| unitNumber | String | unit_number |  |
| category | ClaimCategory | category | ENUM, NOT NULL |
| priority | ClaimPriority | priority | ENUM, NOT NULL |
| title | String | title | NOT NULL |
| description | String | description | NOT NULL |
| locationDescription | String | location_description |  |
| photosJson | String | photos_json |  |
| status | ClaimStatus | status | ENUM, NOT NULL |
| assignedContractorId | UUID | assigned_contractor_id |  |
| assignedContractorName | String | assigned_contractor_name |  |
| assignedAt | Instant | assigned_at |  |
| reportedByPortalUserId | UUID | reported_by_portal_user_id |  |
| reportedByName | String | reported_by_name |  |
| reportedByPhone | String | reported_by_phone |  |
| reportedByEmail | String | reported_by_email |  |
| slaDeadline | Instant | sla_deadline |  |
| slaBreached | Boolean | sla_breached |  |
| resolution | String | resolution |  |
| resolutionDate | Instant | resolution_date |  |
| resolutionAccepted | Boolean | resolution_accepted |  |
| resolutionFeedback | String | resolution_feedback |  |
| resolutionRating | Integer | resolution_rating |  |
| warrantyObligationId | UUID | warranty_obligation_id |  |
| internalNotes | String | internal_notes |  |
| triagedAt | Instant | triaged_at |  |
| triagedBy | UUID | triaged_by |  |

---

### ClientClaimActivity (extends BaseEntity)
**File**: `modules/portal/domain/ClientClaimActivity.java`
**Table**: `client_claim_activities`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| claimId | UUID | claim_id | NOT NULL |
| activityType | ClaimActivityType | activity_type | ENUM, NOT NULL |
| authorName | String | author_name |  |
| authorType | ClaimAuthorType | author_type | ENUM, NOT NULL |
| content | String | content |  |
| oldValue | String | old_value |  |
| newValue | String | new_value |  |

---

### ClientDocumentSignature (extends BaseEntity)
**File**: `modules/portal/domain/ClientDocumentSignature.java`
**Table**: `client_document_signatures`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| portalUserId | UUID | portal_user_id | NOT NULL |
| documentId | UUID | document_id |  |
| documentTitle | String | document_title | NOT NULL |
| documentUrl | String | document_url |  |
| signatureStatus | SignatureStatus | signature_status | ENUM, NOT NULL |
| signedAt | Instant | signed_at |  |
| rejectedReason | String | rejected_reason |  |
| expiresAt | Instant | expires_at |  |
| reminderSent | boolean | reminder_sent | NOT NULL |

---

### ClientMilestone (extends BaseEntity)
**File**: `modules/portal/domain/ClientMilestone.java`
**Table**: `client_milestones`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| title | String | title | NOT NULL |
| description | String | description |  |
| targetDate | LocalDate | target_date |  |
| actualDate | LocalDate | actual_date |  |
| status | MilestoneStatus | status | ENUM, NOT NULL |
| sortOrder | Integer | sort_order | NOT NULL |
| visibleToClient | boolean | is_visible_to_client | NOT NULL |

---

### ClientProgressSnapshot (extends BaseEntity)
**File**: `modules/portal/domain/ClientProgressSnapshot.java`
**Table**: `client_progress_snapshots`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| snapshotDate | LocalDate | snapshot_date | NOT NULL |
| overallPercent | BigDecimal | overall_percent | NOT NULL |
| description | String | description |  |
| milestoneSummaryJson | String | milestone_summary_json |  |
| photoReportJson | String | photo_report_json |  |
| weatherNotes | String | weather_notes |  |
| createdByUserId | UUID | created_by_user_id |  |
| published | boolean | is_published | NOT NULL |
| publishedAt | Instant | published_at |  |

---

### PortalDocument (extends BaseEntity)
**File**: `modules/portal/domain/PortalDocument.java`
**Table**: `portal_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| portalUserId | UUID | portal_user_id | NOT NULL |
| projectId | UUID | project_id |  |
| documentId | UUID | document_id | NOT NULL |
| sharedById | UUID | shared_by_id |  |
| sharedAt | Instant | shared_at | NOT NULL |
| expiresAt | Instant | expires_at |  |
| downloadCount | Integer | download_count | NOT NULL |

---

### PortalKs2Draft (extends BaseEntity)
**File**: `modules/portal/domain/PortalKs2Draft.java`
**Table**: `portal_ks2_drafts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| portalUserId | UUID | portal_user_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| contractId | UUID | contract_id |  |
| draftNumber | String | draft_number |  |
| reportingPeriodStart | LocalDate | reporting_period_start |  |
| reportingPeriodEnd | LocalDate | reporting_period_end |  |
| totalAmount | BigDecimal | total_amount |  |
| workDescription | String | work_description |  |
| linesJson | String | lines_json |  |
| status | PortalKs2DraftStatus | status | ENUM, NOT NULL |
| submittedAt | Instant | submitted_at |  |
| reviewComment | String | review_comment |  |
| reviewedBy | UUID | reviewed_by |  |
| reviewedAt | Instant | reviewed_at |  |
| linkedKs2Id | UUID | linked_ks2_id |  |

---

### PortalMessage (extends BaseEntity)
**File**: `modules/portal/domain/PortalMessage.java`
**Table**: `portal_messages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| fromPortalUserId | UUID | from_portal_user_id |  |
| toPortalUserId | UUID | to_portal_user_id |  |
| fromInternalUserId | UUID | from_internal_user_id |  |
| toInternalUserId | UUID | to_internal_user_id |  |
| projectId | UUID | project_id |  |
| subject | String | subject | NOT NULL |
| content | String | content | NOT NULL |
| isRead | boolean | is_read | NOT NULL |
| readAt | Instant | read_at |  |
| parentMessageId | UUID | parent_message_id |  |

---

### PortalProject (extends BaseEntity)
**File**: `modules/portal/domain/PortalProject.java`
**Table**: `portal_projects`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| portalUserId | UUID | portal_user_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| accessLevel | PortalAccessLevel | access_level | ENUM, NOT NULL |
| canViewFinance | boolean | can_view_finance | NOT NULL |
| canViewDocuments | boolean | can_view_documents | NOT NULL |
| canViewSchedule | boolean | can_view_schedule | NOT NULL |
| canViewPhotos | boolean | can_view_photos | NOT NULL |
| grantedById | UUID | granted_by_id |  |
| grantedAt | Instant | granted_at | NOT NULL |

---

### PortalTask (extends BaseEntity)
**File**: `modules/portal/domain/PortalTask.java`
**Table**: `portal_tasks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| portalUserId | UUID | portal_user_id | NOT NULL |
| projectId | UUID | project_id |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | PortalTaskStatus | status | ENUM, NOT NULL |
| priority | PortalTaskPriority | priority | ENUM, NOT NULL |
| dueDate | LocalDate | due_date |  |
| completedAt | Instant | completed_at |  |
| assignedById | UUID | assigned_by_id |  |
| completionNote | String | completion_note |  |

---

### PortalUser (extends BaseEntity)
**File**: `modules/portal/domain/PortalUser.java`
**Table**: `portal_users`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| email | String | email | NOT NULL, UNIQUE |
| passwordHash | String | password_hash | NOT NULL |
| firstName | String | first_name | NOT NULL |
| lastName | String | last_name | NOT NULL |
| phone | String | phone |  |
| organizationId | UUID | organization_id |  |
| organizationName | String | organization_name |  |
| inn | String | inn |  |
| portalRole | PortalRole | portal_role | ENUM, NOT NULL |
| status | PortalUserStatus | status | ENUM, NOT NULL |
| lastLoginAt | Instant | last_login_at |  |
| invitedById | UUID | invited_by_id |  |

---

## Module: portfolio

### BidPackage (extends BaseEntity)
**File**: `modules/portfolio/domain/BidPackage.java`
**Table**: `bid_packages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| opportunityId | UUID | opportunity_id |  |
| projectId | UUID | project_id |  |
| name | String | name | NOT NULL |
| projectName | String | project_name | NOT NULL |
| status | BidStatus | status | ENUM, NOT NULL |
| bidNumber | String | bid_number |  |
| clientOrganization | String | client_organization |  |
| submissionDeadline | LocalDateTime | submission_deadline |  |
| submissionDate | LocalDateTime | submission_date |  |
| bidAmount | BigDecimal | bid_amount |  |
| estimatedCost | BigDecimal | estimated_cost |  |
| estimatedMargin | BigDecimal | estimated_margin |  |
| bidManagerId | UUID | bid_manager_id |  |
| technicalLeadId | UUID | technical_lead_id |  |
| bondRequired | Boolean | bond_required | NOT NULL |
| bondAmount | BigDecimal | bond_amount |  |
| evaluationScore | Integer | evaluation_score |  |
| documents | String | documents | JSONB |
| competitorInfo | String | competitor_info | JSONB |
| notes | String | notes |  |

---

### Opportunity (extends BaseEntity)
**File**: `modules/portfolio/domain/Opportunity.java`
**Table**: `opportunities`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| clientName | String | client_name |  |
| clientType | ClientType | client_type | ENUM |
| stage | OpportunityStage | stage | ENUM, NOT NULL |
| estimatedValue | BigDecimal | estimated_value |  |
| probability | Integer | probability |  |
| expectedCloseDate | LocalDate | expected_close_date |  |
| actualCloseDate | LocalDate | actual_close_date |  |
| ownerId | UUID | owner_id |  |
| source | String | source |  |
| region | String | region |  |
| projectType | String | project_type |  |
| lostReason | String | lost_reason |  |
| wonProjectId | UUID | won_project_id |  |
| tags | String | tags | JSONB |
| goNoGoChecklist | String | go_no_go_checklist | JSONB |
| checklistScore | Integer | checklist_score |  |
| analogMarginPercent | BigDecimal | analog_margin_percent |  |
| analogProjectId | UUID | analog_project_id |  |

---

### Prequalification (extends BaseEntity)
**File**: `modules/portfolio/domain/Prequalification.java`
**Table**: `prequalifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| clientName | String | client_name | NOT NULL |
| projectName | String | project_name |  |
| status | PrequalificationStatus | status | ENUM, NOT NULL |
| submissionDate | LocalDate | submission_date |  |
| expiryDate | LocalDate | expiry_date |  |
| categories | String | categories |  |
| maxContractValue | BigDecimal | max_contract_value |  |
| responsibleId | UUID | responsible_id |  |
| documents | String | documents |  |
| notes | String | notes |  |

---

### TenderSubmission (extends BaseEntity)
**File**: `modules/portfolio/domain/TenderSubmission.java`
**Table**: `tender_submissions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| bidPackageId | UUID | bid_package_id | NOT NULL |
| submissionVersion | Integer | version |  |
| technicalProposal | String | technical_proposal |  |
| commercialSummary | String | commercial_summary |  |
| totalPrice | BigDecimal | total_price |  |
| discountPercent | BigDecimal | discount_percent |  |
| finalPrice | BigDecimal | final_price |  |
| submittedById | UUID | submitted_by_id |  |
| submittedAt | Instant | submitted_at |  |
| attachmentIds | String | attachment_ids |  |

---

## Module: prequalification

### Prequalification (extends BaseEntity)
**File**: `modules/prequalification/domain/Prequalification.java`
**Table**: `contractor_prequalifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| counterpartyId | UUID | counterparty_id |  |
| companyName | String | company_name | NOT NULL |
| inn | String | inn |  |
| contactPerson | String | contact_person |  |
| contactEmail | String | contact_email |  |
| contactPhone | String | contact_phone |  |
| workType | String | work_type |  |
| annualRevenue | BigDecimal | annual_revenue |  |
| yearsInBusiness | Integer | years_in_business |  |
| hasNoDebts | Boolean | has_no_debts |  |
| hasCreditLine | Boolean | has_credit_line |  |
| similarProjectsCount | Integer | similar_projects_count |  |
| maxProjectValue | BigDecimal | max_project_value |  |
| hasReferences | Boolean | has_references |  |
| hasSroMembership | Boolean | has_sro_membership |  |
| sroNumber | String | sro_number |  |
| hasIsoCertification | Boolean | has_iso_certification |  |
| hasSafetyCertification | Boolean | has_safety_certification |  |
| ltir | BigDecimal | ltir |  |
| hasSafetyPlan | Boolean | has_safety_plan |  |
| noFatalIncidents3y | Boolean | no_fatal_incidents_3y |  |
| hasLiabilityInsurance | Boolean | has_liability_insurance |  |
| insuranceCoverage | BigDecimal | insurance_coverage |  |
| canProvideBankGuarantee | Boolean | can_provide_bank_guarantee |  |
| employeeCount | Integer | employee_count |  |
| hasOwnEquipment | Boolean | has_own_equipment |  |
| hasOwnTransport | Boolean | has_own_transport |  |
| totalScore | Integer | total_score |  |
| financialScore | Integer | financial_score |  |
| experienceScore | Integer | experience_score |  |
| safetyScore | Integer | safety_score |  |
| qualificationResult | String | qualification_result |  |
| notes | String | notes |  |
| status | PrequalificationStatus | status | ENUM, NOT NULL |
| evaluatedAt | LocalDate | evaluated_at |  |
| evaluatedBy | String | evaluated_by |  |

---

### SroVerificationCache (extends BaseEntity)
**File**: `modules/prequalification/domain/SroVerificationCache.java`
**Table**: `sro_verification_cache`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| inn | String | inn | NOT NULL |
| companyName | String | company_name |  |
| isMember | Boolean | is_member | NOT NULL |
| sroName | String | sro_name |  |
| sroNumber | String | sro_number |  |
| certificateNumber | String | certificate_number |  |
| memberSince | LocalDate | member_since |  |
| status | String | status |  |
| allowedWorkTypes | String | allowed_work_types |  |
| compensationFund | BigDecimal | compensation_fund |  |
| competencyLevel | String | competency_level |  |
| verifiedAt | LocalDateTime | verified_at |  |
| cachedAt | LocalDateTime | cached_at |  |

---

## Module: priceCoefficient

### PriceCoefficient (extends BaseEntity)
**File**: `modules/priceCoefficient/domain/PriceCoefficient.java`
**Table**: `price_coefficients`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code | UNIQUE |
| value | BigDecimal | value | NOT NULL |
| effectiveFrom | LocalDate | effective_from | NOT NULL |
| effectiveTo | LocalDate | effective_to |  |
| contractId | UUID | contract_id |  |
| projectId | UUID | project_id |  |
| type | CoefficientType | type | ENUM, NOT NULL |
| status | CoefficientStatus | status | ENUM, NOT NULL |
| description | String | description |  |
| appliedToEstimateItems | boolean | applied_to_estimate_items | NOT NULL |

---

## Module: procurement

### PurchaseOrder (extends BaseEntity)
**File**: `modules/procurement/domain/PurchaseOrder.java`
**Table**: `purchase_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| orderNumber | String | order_number | NOT NULL |
| projectId | UUID | project_id |  |
| purchaseRequestId | UUID | purchase_request_id |  |
| contractId | UUID | contract_id |  |
| supplierId | UUID | supplier_id | NOT NULL |
| orderDate | LocalDate | order_date | NOT NULL |
| expectedDeliveryDate | LocalDate | expected_delivery_date |  |
| actualDeliveryDate | LocalDate | actual_delivery_date |  |
| subtotal | BigDecimal | subtotal |  |
| vatAmount | BigDecimal | vat_amount |  |
| totalAmount | BigDecimal | total_amount |  |
| currency | String | currency |  |
| status | PurchaseOrderStatus | status | ENUM, NOT NULL |
| paymentTerms | String | payment_terms |  |
| deliveryAddress | String | delivery_address |  |
| notes | String | notes |  |

---

### PurchaseOrderItem (extends BaseEntity)
**File**: `modules/procurement/domain/PurchaseOrderItem.java`
**Table**: `purchase_order_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| purchaseOrderId | UUID | purchase_order_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| unit | String | unit |  |
| quantity | BigDecimal | quantity | NOT NULL |
| unitPrice | BigDecimal | unit_price | NOT NULL |
| vatRate | BigDecimal | vat_rate |  |
| totalAmount | BigDecimal | total_amount |  |
| deliveredQuantity | BigDecimal | delivered_quantity |  |
| specificationItemId | UUID | specification_item_id |  |

---

### PurchaseRequest (extends BaseEntity)
**File**: `modules/procurement/domain/PurchaseRequest.java`
**Table**: `purchase_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL, UNIQUE |
| requestDate | LocalDate | request_date | NOT NULL |
| projectId | UUID | project_id |  |
| contractId | UUID | contract_id |  |
| specificationId | UUID | specification_id |  |
| status | PurchaseRequestStatus | status | ENUM, NOT NULL |
| priority | PurchaseRequestPriority | priority | ENUM, NOT NULL |
| requestedById | UUID | requested_by_id |  |
| requestedByName | String | requested_by_name |  |
| approvedById | UUID | approved_by_id |  |
| assignedToId | UUID | assigned_to_id |  |
| totalAmount | BigDecimal | total_amount |  |
| rejectionReason | String | rejection_reason |  |
| notes | String | notes |  |

---

### PurchaseRequestItem (extends BaseEntity)
**File**: `modules/procurement/domain/PurchaseRequestItem.java`
**Table**: `purchase_request_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| requestId | UUID | request_id | NOT NULL |
| specItemId | UUID | spec_item_id |  |
| sequence | Integer | sequence |  |
| name | String | name | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| unitOfMeasure | String | unit_of_measure | NOT NULL |
| unitPrice | BigDecimal | unit_price |  |
| amount | BigDecimal | amount |  |
| notes | String | notes |  |
| status | String | status |  |
| coveredQuantity | BigDecimal | covered_quantity |  |
| bestPrice | BigDecimal | best_price |  |
| bestVendorName | String | best_vendor_name |  |

---

## Module: procurementExt

### Delivery (extends BaseEntity)
**File**: `modules/procurementExt/domain/Delivery.java`
**Table**: `deliveries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| routeId | UUID | route_id |  |
| purchaseOrderId | UUID | purchase_order_id |  |
| vehicleId | UUID | vehicle_id |  |
| driverId | UUID | driver_id |  |
| plannedDepartureAt | Instant | planned_departure_at |  |
| plannedArrivalAt | Instant | planned_arrival_at |  |
| actualDepartureAt | Instant | actual_departure_at |  |
| actualArrivalAt | Instant | actual_arrival_at |  |
| status | DeliveryStatus | status | ENUM, NOT NULL |
| trackingNumber | String | tracking_number |  |

---

### DeliveryItem (extends BaseEntity)
**File**: `modules/procurementExt/domain/DeliveryItem.java`
**Table**: `delivery_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| deliveryId | UUID | delivery_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| unit | String | unit |  |
| weight | BigDecimal | weight |  |

---

### DeliveryRoute (extends BaseEntity)
**File**: `modules/procurementExt/domain/DeliveryRoute.java`
**Table**: `delivery_routes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| fromAddress | String | from_address |  |
| toAddress | String | to_address |  |
| distanceKm | BigDecimal | distance_km |  |
| estimatedHours | BigDecimal | estimated_hours |  |
| vehicleType | VehicleType | vehicle_type | ENUM |
| active | boolean | is_active | NOT NULL |

---

### DispatchItem (extends BaseEntity)
**File**: `modules/procurementExt/domain/DispatchItem.java`
**Table**: `dispatch_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| orderId | UUID | order_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| fromWarehouseId | UUID | from_warehouse_id |  |
| toWarehouseId | UUID | to_warehouse_id |  |

---

### MaterialReservation (extends BaseEntity)
**File**: `modules/procurementExt/domain/MaterialReservation.java`
**Table**: `material_reservations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| materialId | UUID | material_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| reservedById | UUID | reserved_by_id |  |
| reservedAt | Instant | reserved_at | NOT NULL |
| expiresAt | Instant | expires_at |  |
| status | ReservationStatus | status | ENUM, NOT NULL |
| workOrderId | UUID | work_order_id |  |

---

### PurchaseOrder (extends BaseEntity)
**File**: `modules/procurementExt/domain/PurchaseOrder.java`
**Table**: `purchase_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| orderNumber | String | order_number | NOT NULL |
| projectId | UUID | project_id |  |
| purchaseRequestId | UUID | purchase_request_id |  |
| contractId | UUID | contract_id |  |
| supplierId | UUID | supplier_id | NOT NULL |
| orderDate | LocalDate | order_date | NOT NULL |
| expectedDeliveryDate | LocalDate | expected_delivery_date |  |
| actualDeliveryDate | LocalDate | actual_delivery_date |  |
| subtotal | BigDecimal | subtotal |  |
| vatAmount | BigDecimal | vat_amount |  |
| totalAmount | BigDecimal | total_amount |  |
| currency | String | currency |  |
| status | PurchaseOrderStatus | status | ENUM, NOT NULL |
| paymentTerms | String | payment_terms |  |
| deliveryAddress | String | delivery_address |  |
| notes | String | notes |  |
| organizationId | UUID | organization_id | NOT NULL |

---

### PurchaseOrderItem (extends BaseEntity)
**File**: `modules/procurementExt/domain/PurchaseOrderItem.java`
**Table**: `purchase_order_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| purchaseOrderId | UUID | purchase_order_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| unit | String | unit |  |
| quantity | BigDecimal | quantity | NOT NULL |
| unitPrice | BigDecimal | unit_price | NOT NULL |
| vatRate | BigDecimal | vat_rate |  |
| totalAmount | BigDecimal | total_amount |  |
| deliveredQuantity | BigDecimal | delivered_quantity |  |
| specificationItemId | UUID | specification_item_id |  |

---

### SupplierRating (extends BaseEntity)
**File**: `modules/procurementExt/domain/SupplierRating.java`
**Table**: `supplier_ratings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| supplierId | UUID | supplier_id | NOT NULL |
| periodId | String | period_id | NOT NULL |
| qualityScore | BigDecimal | quality_score | NOT NULL |
| deliveryScore | BigDecimal | delivery_score | NOT NULL |
| priceScore | BigDecimal | price_score | NOT NULL |
| overallScore | BigDecimal | overall_score | NOT NULL |
| evaluatedById | UUID | evaluated_by_id |  |
| comments | String | comments |  |

---

## Module: project

### Project (extends BaseEntity)
**File**: `modules/project/domain/Project.java`
**Table**: `projects`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| status | ProjectStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| customerId | UUID | customer_id |  |
| managerId | UUID | manager_id |  |
| plannedStartDate | LocalDate | planned_start_date |  |
| plannedEndDate | LocalDate | planned_end_date |  |
| actualStartDate | LocalDate | actual_start_date |  |
| actualEndDate | LocalDate | actual_end_date |  |
| address | String | address |  |
| city | String | city |  |
| region | String | region |  |
| latitude | BigDecimal | latitude |  |
| longitude | BigDecimal | longitude |  |
| budgetAmount | BigDecimal | budget_amount |  |
| contractAmount | BigDecimal | contract_amount |  |
| type | ProjectType | type | ENUM |
| customerName | String | customer_name |  |
| category | String | category |  |
| constructionKind | String | construction_kind |  |
| priority | ProjectPriority | priority | ENUM, NOT NULL |

---

### ProjectCollaborator (extends BaseEntity)
**File**: `modules/project/domain/ProjectCollaborator.java`
**Table**: `project_collaborators`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| partnerId | UUID | partner_id | NOT NULL |
| role | String | role |  |
| invitedAt | LocalDateTime | invited_at |  |
| acceptedAt | LocalDateTime | accepted_at |  |

---

### ProjectMember
**File**: `modules/project/domain/ProjectMember.java`
**Table**: `project_members`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| role | ProjectMemberRole | role | ENUM, NOT NULL |
| joinedAt | Instant | joined_at | NOT NULL |
| leftAt | Instant | left_at |  |

---

### ProjectMilestone (extends BaseEntity)
**File**: `modules/project/domain/ProjectMilestone.java`
**Table**: `project_milestones`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| plannedDate | LocalDate | planned_date |  |
| actualDate | LocalDate | actual_date |  |
| status | String | status | NOT NULL |
| sequence | Integer | sequence |  |
| isKeyMilestone | Boolean | is_key_milestone |  |
| notes | String | notes |  |

---

### ProjectUpdate (extends BaseEntity)
**File**: `modules/project/domain/ProjectUpdate.java`
**Table**: `project_updates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| authorId | UUID | author_id |  |
| title | String | title | NOT NULL |
| description | String | description |  |
| status | ProjectHealthStatus | status | ENUM, NOT NULL |
| progressPercentage | Integer | progress_percentage |  |

---

## Module: pto

### ActOsvidetelstvovanie (extends BaseEntity)
**File**: `modules/pto/domain/ActOsvidetelstvovanie.java`
**Table**: `acts_osvidetelstvovanie`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| workType | WorkType | work_type | ENUM, NOT NULL |
| volume | BigDecimal | volume |  |
| unit | String | unit |  |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| responsibleId | UUID | responsible_id |  |
| inspectorId | UUID | inspector_id |  |
| result | ActResult | result | ENUM |
| comments | String | comments |  |
| status | ActOsvidetelstvovanieStatus | status | ENUM, NOT NULL |

---

### AsBuiltDoc (extends BaseEntity)
**File**: `modules/pto/domain/AsBuiltDoc.java`
**Table**: `as_built_docs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| workType | WorkType | work_type | ENUM, NOT NULL |
| originalDrawingId | UUID | original_drawing_id |  |
| asbuiltUrl | String | asbuilt_url |  |
| deviations | String | deviations |  |
| acceptedById | UUID | accepted_by_id |  |
| status | AsBuiltStatus | status | ENUM, NOT NULL |

---

### ExecutiveScheme (extends BaseEntity)
**File**: `modules/pto/domain/ExecutiveScheme.java`
**Table**: `executive_schemes`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| workType | WorkType | work_type | ENUM, NOT NULL |
| fileUrl | String | file_url |  |
| scale | String | scale |  |
| geodataJson | Map<String, Object> | geodata_json | JSONB |
| createdById | UUID | created_by_id |  |
| verifiedById | UUID | verified_by_id |  |
| status | ExecutiveSchemeStatus | status | ENUM, NOT NULL |

---

### HiddenWorkAct (extends BaseEntity)
**File**: `modules/pto/domain/HiddenWorkAct.java`
**Table**: `hidden_work_acts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| date | LocalDate | date | NOT NULL |
| workDescription | String | work_description | NOT NULL |
| location | String | location |  |
| inspectorId | UUID | inspector_id |  |
| contractorId | UUID | contractor_id |  |
| status | HiddenWorkActStatus | status | ENUM, NOT NULL |
| photoIds | String | photo_ids |  |
| notes | String | notes |  |
| actNumber | String | act_number |  |
| signedAt | Instant | signed_at |  |

---

### HiddenWorkActAttachment (extends BaseEntity)
**File**: `modules/pto/domain/HiddenWorkActAttachment.java`
**Table**: `hidden_work_act_attachments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| actId | UUID | act_id | NOT NULL |
| attachmentType | AttachmentType | attachment_type | ENUM, NOT NULL |
| fileName | String | file_name | NOT NULL |
| filePath | String | file_path | NOT NULL |
| fileSize | Long | file_size |  |
| mimeType | String | mime_type |  |
| description | String | description |  |

---

### HiddenWorkActSignature (extends BaseEntity)
**File**: `modules/pto/domain/HiddenWorkActSignature.java`
**Table**: `hidden_work_act_signatures`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| actId | UUID | act_id | NOT NULL |
| signerUserId | UUID | signer_user_id | NOT NULL |
| signerName | String | signer_name | NOT NULL |
| signerRole | SignerRole | signer_role | ENUM, NOT NULL |
| status | SignatureStatus | status | ENUM, NOT NULL |
| signedAt | Instant | signed_at |  |
| kepSignatureId | UUID | kep_signature_id |  |
| rejectionReason | String | rejection_reason |  |
| commentText | String | comment_text |  |

---

### InspectionPoint (extends BaseEntity)
**File**: `modules/pto/domain/InspectionPoint.java`
**Table**: `inspection_points`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| qualityPlanId | UUID | quality_plan_id | NOT NULL |
| name | String | name | NOT NULL |
| workStage | String | work_stage | NOT NULL |
| inspectionType | InspectionType | inspection_type | ENUM, NOT NULL |
| criteria | String | criteria |  |
| responsibleRole | String | responsible_role |  |

---

### Ks11AcceptanceAct (extends BaseEntity)
**File**: `modules/pto/domain/Ks11AcceptanceAct.java`
**Table**: `ks11_acceptance_acts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| date | LocalDate | date | NOT NULL |
| commissionMembers | String | commission_members |  |
| decision | String | decision |  |
| defects | String | defects |  |
| notes | String | notes |  |
| status | Ks11Status | status | ENUM, NOT NULL |

---

### Ks6Journal (extends BaseEntity)
**File**: `modules/pto/domain/Ks6Journal.java`
**Table**: `ks6_journals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| startDate | LocalDate | start_date | NOT NULL |
| responsibleEngineerId | UUID | responsible_engineer_id |  |
| status | Ks6JournalStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |

---

### Ks6aRecord (extends BaseEntity)
**File**: `modules/pto/domain/Ks6aRecord.java`
**Table**: `ks6a_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ks6JournalId | UUID | ks6_journal_id | NOT NULL |
| monthYear | String | month_year | NOT NULL |
| workName | String | work_name | NOT NULL |
| unit | String | unit |  |
| plannedVolume | BigDecimal | planned_volume |  |
| first10days | BigDecimal | first_10_days |  |
| second10days | BigDecimal | second_10_days |  |
| third10days | BigDecimal | third_10_days |  |
| totalActual | BigDecimal | total_actual |  |
| notes | String | notes |  |

---

### LabTest (extends BaseEntity)
**File**: `modules/pto/domain/LabTest.java`
**Table**: `lab_tests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| materialName | String | material_name | NOT NULL |
| testType | LabTestType | test_type | ENUM, NOT NULL |
| sampleNumber | String | sample_number |  |
| testDate | LocalDate | test_date | NOT NULL |
| result | String | result |  |
| conclusion | LabTestConclusion | conclusion | ENUM, NOT NULL |
| protocolUrl | String | protocol_url |  |
| labName | String | lab_name |  |
| performedById | UUID | performed_by_id |  |

---

### PtoDocument (extends BaseEntity)
**File**: `modules/pto/domain/PtoDocument.java`
**Table**: `pto_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| documentType | PtoDocumentType | document_type | ENUM, NOT NULL |
| discipline | Discipline | discipline | ENUM |
| status | PtoDocumentStatus | status | ENUM, NOT NULL |
| currentVersion | Integer | current_version | NOT NULL |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |
| notes | String | notes |  |

---

### PtoDocumentVersion (extends BaseEntity)
**File**: `modules/pto/domain/PtoDocumentVersion.java`
**Table**: `pto_document_versions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentId | UUID | document_id | NOT NULL |
| versionNumber | Integer | version_number | NOT NULL |
| fileUrl | String | file_url |  |
| changeDescription | String | change_description |  |
| uploadedById | UUID | uploaded_by_id |  |

---

### QualityPlan (extends BaseEntity)
**File**: `modules/pto/domain/QualityPlan.java`
**Table**: `quality_plans`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| planVersion | Integer | plan_version | NOT NULL |
| status | QualityPlanStatus | status | ENUM, NOT NULL |
| sections | Map<String, Object> | sections | JSONB |
| approvedById | UUID | approved_by_id |  |

---

### Submittal (extends BaseEntity)
**File**: `modules/pto/domain/Submittal.java`
**Table**: `submittals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| submittalType | SubmittalType | submittal_type | ENUM, NOT NULL |
| description | String | description |  |
| status | SubmittalStatus | status | ENUM, NOT NULL |
| submittedById | UUID | submitted_by_id |  |
| reviewedById | UUID | reviewed_by_id |  |
| dueDate | LocalDate | due_date |  |
| responseDate | LocalDate | response_date |  |
| specSection | String | spec_section |  |
| ballInCourt | UUID | ball_in_court |  |
| leadTime | Integer | lead_time |  |
| requiredDate | LocalDate | required_date |  |
| linkedDrawingIds | String | linked_drawing_ids |  |
| attachmentIds | String | attachment_ids |  |
| tags | String | tags |  |
| submittedDate | LocalDate | submitted_date |  |

---

### SubmittalComment (extends BaseEntity)
**File**: `modules/pto/domain/SubmittalComment.java`
**Table**: `submittal_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| submittalId | UUID | submittal_id | NOT NULL |
| authorId | UUID | author_id |  |
| content | String | content | NOT NULL |
| attachmentUrl | String | attachment_url |  |

---

### TechnicalSolution (extends BaseEntity)
**File**: `modules/pto/domain/TechnicalSolution.java`
**Table**: `technical_solutions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| problem | String | problem | NOT NULL |
| solution | String | solution | NOT NULL |
| justification | String | justification |  |
| status | TechnicalSolutionStatus | status | ENUM, NOT NULL |
| authorId | UUID | author_id |  |
| approvedById | UUID | approved_by_id |  |
| cost | BigDecimal | cost |  |
| drawingUrl | String | drawing_url |  |

---

### WorkPermit (extends BaseEntity)
**File**: `modules/pto/domain/WorkPermit.java`
**Table**: `work_permits`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| workType | WorkType | work_type | ENUM, NOT NULL |
| location | String | location |  |
| startDate | LocalDate | start_date | NOT NULL |
| endDate | LocalDate | end_date | NOT NULL |
| status | WorkPermitStatus | status | ENUM, NOT NULL |
| issuedById | UUID | issued_by_id |  |
| approvedById | UUID | approved_by_id |  |
| safetyMeasures | Map<String, Object> | safety_measures | JSONB |
| notes | String | notes |  |

---

## Module: punchlist

### PunchItem (extends BaseEntity)
**File**: `modules/punchlist/domain/PunchItem.java`
**Table**: `punch_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| punchListId | UUID | punch_list_id |  |
| number | Integer | number | NOT NULL |
| description | String | description | NOT NULL |
| location | String | location |  |
| category | String | category |  |
| priority | PunchItemPriority | priority | ENUM, NOT NULL |
| status | PunchItemStatus | status | ENUM, NOT NULL |
| assignedToId | UUID | assigned_to_id |  |
| photoUrls | String | photo_urls | JSONB |
| fixDeadline | LocalDate | fix_deadline |  |
| fixedAt | Instant | fixed_at |  |
| verifiedById | UUID | verified_by_id |  |
| verifiedAt | Instant | verified_at |  |

---

### PunchItemComment (extends BaseEntity)
**File**: `modules/punchlist/domain/PunchItemComment.java`
**Table**: `punch_item_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| punchItemId | UUID | punch_item_id |  |
| authorId | UUID | author_id |  |
| content | String | content | NOT NULL |
| attachmentUrl | String | attachment_url |  |

---

### PunchList (extends BaseEntity)
**File**: `modules/punchlist/domain/PunchList.java`
**Table**: `punch_lists`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | UNIQUE |
| name | String | name | NOT NULL |
| createdById | UUID | created_by_id |  |
| dueDate | LocalDate | due_date |  |
| status | PunchListStatus | status | ENUM, NOT NULL |
| completionPercent | Integer | completion_percent |  |
| areaOrZone | String | area_or_zone |  |

---

## Module: quality

### CertificateLine (extends BaseEntity)
**File**: `modules/quality/domain/CertificateLine.java`
**Table**: `certificate_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| certificateId | UUID | certificate_id | NOT NULL |
| parameterName | String | parameter_name | NOT NULL |
| standardValue | String | standard_value |  |
| actualValue | String | actual_value |  |
| unit | String | unit |  |
| isCompliant | boolean | is_compliant | NOT NULL |
| testMethod | String | test_method |  |

---

### ChecklistExecutionItem (extends BaseEntity)
**File**: `modules/quality/domain/ChecklistExecutionItem.java`
**Table**: `checklist_execution_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| checklistId | UUID | checklist_id | NOT NULL |
| description | String | description | NOT NULL |
| category | String | category |  |
| required | boolean | is_required | NOT NULL |
| result | ChecklistItemResult | result | ENUM, NOT NULL |
| photoRequired | boolean | photo_required | NOT NULL |
| photoUrls | List<String> | photo_urls | JSONB |
| notes | String | notes |  |
| inspectorId | UUID | inspector_id |  |
| inspectorName | String | inspector_name |  |
| inspectedAt | Instant | inspected_at |  |
| sortOrder | int | sort_order | NOT NULL |

---

### ChecklistTemplate (extends BaseEntity)
**File**: `modules/quality/domain/ChecklistTemplate.java`
**Table**: `checklist_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| workType | ChecklistWorkType | work_type | ENUM, NOT NULL |
| items | List<Object> | items | JSONB |

---

### InspectionChecklistItem (extends BaseEntity)
**File**: `modules/quality/domain/InspectionChecklistItem.java`
**Table**: `inspection_checklist_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| qualityCheckId | UUID | quality_check_id | NOT NULL, NOT NULL |
| name | String | name | NOT BLANK, NOT NULL |
| description | String | description |  |
| result | ChecklistItemResult | result | ENUM, NOT NULL |
| notes | String | notes |  |
| photoUrls | List<String> | photo_urls | JSONB |
| sortOrder | int | sort_order | NOT NULL |
| required | boolean | required | NOT NULL |

---

### MaterialCertificate (extends BaseEntity)
**File**: `modules/quality/domain/MaterialCertificate.java`
**Table**: `material_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| certificateNumber | String | certificate_number | NOT NULL |
| certificateType | MaterialCertificateType | certificate_type | ENUM, NOT NULL |
| issuedBy | String | issued_by |  |
| issuedDate | LocalDate | issued_date | NOT NULL |
| expiryDate | LocalDate | expiry_date |  |
| fileUrl | String | file_url |  |
| status | MaterialCertificateStatus | status | ENUM, NOT NULL |
| verifiedById | UUID | verified_by_id |  |
| verifiedAt | LocalDateTime | verified_at |  |
| notes | String | notes |  |

---

### MaterialInspection (extends BaseEntity)
**File**: `modules/quality/domain/MaterialInspection.java`
**Table**: `material_inspections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| number | String | number | UNIQUE |
| materialName | String | material_name | NOT NULL |
| supplier | String | supplier |  |
| batchNumber | String | batch_number |  |
| inspectionDate | LocalDate | inspection_date | NOT NULL |
| inspectorName | String | inspector_name |  |
| result | MaterialInspectionResult | result | ENUM, NOT NULL |
| testProtocolNumber | String | test_protocol_number |  |
| testResults | List<Object> | test_results | JSONB |
| notes | String | notes |  |
| projectId | UUID | project_id | NOT NULL |

---

### NonConformance (extends BaseEntity)
**File**: `modules/quality/domain/NonConformance.java`
**Table**: `non_conformances`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | UNIQUE |
| qualityCheckId | UUID | quality_check_id |  |
| projectId | UUID | project_id | NOT NULL |
| severity | NonConformanceSeverity | severity | ENUM, NOT NULL |
| description | String | description | NOT NULL |
| rootCause | String | root_cause |  |
| correctiveAction | String | corrective_action |  |
| preventiveAction | String | preventive_action |  |
| status | NonConformanceStatus | status | ENUM, NOT NULL |
| responsibleId | UUID | responsible_id |  |
| dueDate | LocalDate | due_date |  |
| resolvedDate | LocalDate | resolved_date |  |
| cost | BigDecimal | cost |  |

---

### QualityCertificate (extends BaseEntity)
**File**: `modules/quality/domain/QualityCertificate.java`
**Table**: `quality_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| materialId | UUID | material_id |  |
| supplierId | UUID | supplier_id |  |
| supplierName | String | supplier_name |  |
| certificateNumber | String | certificate_number | NOT NULL |
| issueDate | LocalDate | issue_date | NOT NULL |
| expiryDate | LocalDate | expiry_date |  |
| certificateType | CertificateType | certificate_type | ENUM, NOT NULL |
| fileUrl | String | file_url |  |
| isVerified | boolean | is_verified | NOT NULL |
| verifiedById | UUID | verified_by_id |  |

---

### QualityCheck (extends BaseEntity)
**File**: `modules/quality/domain/QualityCheck.java`
**Table**: `quality_checks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | UNIQUE |
| projectId | UUID | project_id | NOT NULL |
| taskId | UUID | task_id |  |
| wbsNodeId | UUID | wbs_node_id |  |
| specItemId | UUID | spec_item_id |  |
| checkType | CheckType | check_type | ENUM, NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| plannedDate | LocalDate | planned_date |  |
| actualDate | LocalDate | actual_date |  |
| inspectorId | UUID | inspector_id |  |
| inspectorName | String | inspector_name |  |
| result | CheckResult | result | ENUM, NOT NULL |
| status | CheckStatus | status | ENUM, NOT NULL |
| findings | String | findings |  |
| recommendations | String | recommendations |  |
| attachmentUrls | List<String> | attachment_urls | JSONB |

---

### QualityChecklist (extends BaseEntity)
**File**: `modules/quality/domain/QualityChecklist.java`
**Table**: `quality_checklists`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | UNIQUE |
| name | String | name | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| templateId | UUID | template_id |  |
| workType | ChecklistWorkType | work_type | ENUM, NOT NULL |
| wbsStage | String | wbs_stage |  |
| location | String | location |  |
| status | ChecklistExecutionStatus | status | ENUM, NOT NULL |
| inspectorId | UUID | inspector_id |  |
| inspectorName | String | inspector_name |  |
| scheduledDate | LocalDate | scheduled_date |  |
| completedDate | LocalDate | completed_date |  |
| totalItems | int | total_items |  |
| passedItems | int | passed_items |  |
| failedItems | int | failed_items |  |
| naItems | int | na_items |  |
| notes | String | notes |  |

---

### QualityGate (extends BaseEntity)
**File**: `modules/quality/domain/QualityGate.java`
**Table**: `quality_gates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| wbsNodeId | UUID | wbs_node_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| requiredDocumentsJson | String | required_documents_json |  |
| requiredQualityChecksJson | String | required_quality_checks_json |  |
| volumeThresholdPercent | Integer | volume_threshold_percent |  |
| status | QualityGateStatus | status | ENUM, NOT NULL |
| docCompletionPercent | Integer | doc_completion_percent |  |
| qualityCompletionPercent | Integer | quality_completion_percent |  |
| volumeCompletionPercent | Integer | volume_completion_percent |  |
| blockedReason | String | blocked_reason |  |
| passedAt | Instant | passed_at |  |
| passedBy | UUID | passed_by |  |

---

### QualityGateTemplate (extends BaseEntity)
**File**: `modules/quality/domain/QualityGateTemplate.java`
**Table**: `quality_gate_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectTemplateId | UUID | project_template_id |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| wbsLevelPattern | String | wbs_level_pattern |  |
| requiredDocumentsJson | String | required_documents_json |  |
| requiredQualityChecksJson | String | required_quality_checks_json |  |
| volumeThresholdPercent | Integer | volume_threshold_percent |  |

---

### SupervisionEntry (extends BaseEntity)
**File**: `modules/quality/domain/SupervisionEntry.java`
**Table**: `supervision_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| number | String | number | UNIQUE |
| entryDate | LocalDate | entry_date | NOT NULL |
| inspectorName | String | inspector_name |  |
| workType | String | work_type |  |
| remarks | String | remarks |  |
| directives | String | directives |  |
| complianceStatus | ComplianceStatus | compliance_status | ENUM, NOT NULL |
| projectId | UUID | project_id | NOT NULL |

---

### ToleranceCheck (extends BaseEntity)
**File**: `modules/quality/domain/ToleranceCheck.java`
**Table**: `tolerance_checks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| toleranceRuleId | UUID | tolerance_rule_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| location | String | location |  |
| measuredValue | BigDecimal | measured_value |  |
| isWithinTolerance | boolean | is_within_tolerance | NOT NULL |
| deviation | BigDecimal | deviation |  |
| checkedById | UUID | checked_by_id |  |
| checkedAt | LocalDateTime | checked_at |  |
| notes | String | notes |  |
| status | ToleranceCheckStatus | status | ENUM, NOT NULL |

---

### ToleranceRule (extends BaseEntity)
**File**: `modules/quality/domain/ToleranceRule.java`
**Table**: `tolerance_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code | UNIQUE |
| category | ToleranceCategory | category | ENUM, NOT NULL |
| parameterName | String | parameter_name | NOT NULL |
| nominalValue | BigDecimal | nominal_value |  |
| minValue | BigDecimal | min_value |  |
| maxValue | BigDecimal | max_value |  |
| unit | String | unit |  |
| standardReference | String | standard_reference |  |
| isActive | boolean | is_active | NOT NULL |

---

## Module: recruitment

### Applicant (extends BaseEntity)
**File**: `modules/recruitment/domain/Applicant.java`
**Table**: `applicants`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| partnerName | String | partner_name | NOT NULL |
| email | String | email |  |
| phone | String | phone |  |
| jobPositionId | UUID | job_position_id |  |
| stageId | UUID | stage_id |  |
| source | String | source |  |
| medium | String | medium |  |
| priority | ApplicantPriority | priority | ENUM, NOT NULL |
| salary | BigDecimal | salary |  |
| salaryCurrency | String | salary_currency |  |
| availability | LocalDate | availability |  |
| description | String | description |  |
| interviewNotes | String | interview_notes |  |
| status | ApplicantStatus | status | ENUM, NOT NULL |

---

### Interview (extends BaseEntity)
**File**: `modules/recruitment/domain/Interview.java`
**Table**: `interviews`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| applicantId | UUID | applicant_id | NOT NULL |
| interviewerId | UUID | interviewer_id |  |
| scheduledAt | LocalDateTime | scheduled_at | NOT NULL |
| duration | int | duration | NOT NULL |
| location | String | location |  |
| result | InterviewResult | result | ENUM |
| notes | String | notes |  |

---

### JobPosition (extends BaseEntity)
**File**: `modules/recruitment/domain/JobPosition.java`
**Table**: `job_positions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| departmentId | UUID | department_id |  |
| description | String | description |  |
| requirements | String | requirements |  |
| expectedEmployees | int | expected_employees | NOT NULL |
| hiredEmployees | int | hired_employees | NOT NULL |
| status | JobPositionStatus | status | ENUM, NOT NULL |
| deadline | LocalDate | deadline |  |

---

### RecruitmentStage (extends BaseEntity)
**File**: `modules/recruitment/domain/RecruitmentStage.java`
**Table**: `recruitment_stages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| sequence | int | sequence | NOT NULL |
| foldState | String | fold_state |  |
| isHired | boolean | is_hired | NOT NULL |
| requirements | String | requirements |  |

---

## Module: regulatory

### ConstructionPermit (extends BaseEntity)
**File**: `modules/regulatory/domain/ConstructionPermit.java`
**Table**: `construction_permits`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id | NOT NULL |
| permitNumber | String | permit_number | UNIQUE |
| issuedBy | String | issued_by |  |
| issuedDate | LocalDate | issued_date |  |
| expiresDate | LocalDate | expires_date |  |
| status | PermitStatus | status | ENUM, NOT NULL |
| permitType | String | permit_type |  |
| conditions | String | conditions | JSONB |
| fileUrl | String | file_url |  |

---

### OccupancyPermit (extends BaseEntity)
**File**: `modules/regulatory/domain/OccupancyPermit.java`
**Table**: `occupancy_permits`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| permitNumber | String | permit_number | UNIQUE |
| issuedDate | LocalDate | issued_date |  |
| issuedBy | String | issued_by |  |
| commissionMembers | String | commission_members |  |
| conditions | String | conditions |  |
| fileUrl | String | file_url |  |
| status | PermitStatus | status | ENUM, NOT NULL |

---

### Prescription (extends BaseEntity)
**File**: `modules/regulatory/domain/Prescription.java`
**Table**: `prescriptions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| inspectionId | UUID | inspection_id |  |
| projectId | UUID | project_id |  |
| number | String | number |  |
| description | String | description | NOT NULL |
| regulatoryBodyType | RegulatoryBodyType | regulatory_body_type | ENUM |
| receivedDate | LocalDate | received_date |  |
| deadline | LocalDate | deadline |  |
| appealDeadline | LocalDate | appeal_deadline |  |
| status | PrescriptionStatus | status | ENUM, NOT NULL |
| completedAt | Instant | completed_at |  |
| responseSubmittedAt | Instant | response_submitted_at |  |
| responseDate | LocalDate | response_date |  |
| evidenceUrl | String | evidence_url |  |
| responseLetterUrl | String | response_letter_url |  |
| responsibleId | UUID | responsible_id |  |
| responsibleName | String | responsible_name |  |
| fineAmount | java.math.BigDecimal | fine_amount |  |
| correctiveActionCost | java.math.BigDecimal | corrective_action_cost |  |
| violationCount | Integer | violation_count |  |
| regulatoryReference | String | regulatory_reference |  |
| notes | String | notes |  |
| appealFiled | boolean | appeal_filed |  |
| appealDate | LocalDate | appeal_date |  |

---

### RegulatoryBody (extends BaseEntity)
**File**: `modules/regulatory/domain/RegulatoryBody.java`
**Table**: `regulatory_bodies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code | NOT NULL, UNIQUE |
| region | String | region |  |
| address | String | address |  |
| contactPerson | String | contact_person |  |
| phone | String | phone |  |
| email | String | email |  |
| jurisdiction | String | jurisdiction |  |

---

### RegulatoryInspection (extends BaseEntity)
**File**: `modules/regulatory/domain/RegulatoryInspection.java`
**Table**: `regulatory_inspections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id | NOT NULL |
| inspectionDate | LocalDate | inspection_date | NOT NULL |
| inspectorName | String | inspector_name |  |
| inspectorOrgan | String | inspector_organ |  |
| inspectionType | RegulatoryInspectionType | inspection_type | ENUM, NOT NULL |
| result | InspectionResult | result | ENUM |
| violations | String | violations | JSONB |
| prescriptionsJson | String | prescriptions | JSONB |
| deadlineToFix | LocalDate | deadline_to_fix |  |
| actNumber | String | act_number |  |
| actUrl | String | act_url |  |

---

### RegulatoryReport (extends BaseEntity)
**File**: `modules/regulatory/domain/RegulatoryReport.java`
**Table**: `regulatory_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id |  |
| code | String | code | UNIQUE |
| reportType | String | report_type | NOT NULL |
| title | String | title | NOT NULL |
| period | String | period |  |
| dueDate | LocalDate | due_date |  |
| submittedAt | Instant | submitted_at |  |
| status | ReportStatus | status | ENUM, NOT NULL |
| submittedToOrgan | String | submitted_to_organ |  |
| organResponse | String | organ_response |  |
| fileUrl | String | file_url |  |
| preparedById | UUID | prepared_by_id |  |
| submittedById | UUID | submitted_by_id |  |

---

### ReportTemplate (extends BaseEntity)
**File**: `modules/regulatory/domain/ReportTemplate.java`
**Table**: `report_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| reportType | String | report_type | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| requiredFields | String | required_fields |  |
| frequency | ReportFrequency | frequency | ENUM, NOT NULL |
| templateFileUrl | String | template_file_url |  |
| regulations | String | regulations |  |

---

### ReportingDeadline (extends BaseEntity)
**File**: `modules/regulatory/domain/ReportingDeadline.java`
**Table**: `reporting_deadlines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| reportType | String | report_type | NOT NULL |
| frequency | ReportingFrequency | frequency | ENUM, NOT NULL |
| dueDate | LocalDate | due_date | NOT NULL |
| reminderDaysBefore | int | reminder_days_before | NOT NULL |
| responsibleId | UUID | responsible_id |  |
| status | DeadlineStatus | status | ENUM, NOT NULL |
| submittedAt | Instant | submitted_at |  |
| submittedById | UUID | submitted_by_id |  |
| notes | String | notes |  |
| regulatoryBody | String | regulatory_body |  |
| penaltyAmount | BigDecimal | penalty_amount |  |

---

### ReportingSubmission (extends BaseEntity)
**File**: `modules/regulatory/domain/ReportingSubmission.java`
**Table**: `reporting_submissions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| deadlineId | UUID | deadline_id | NOT NULL |
| submissionDate | LocalDate | submission_date | NOT NULL |
| submittedById | UUID | submitted_by_id |  |
| confirmationNumber | String | confirmation_number |  |
| channel | SubmissionChannel | channel | ENUM, NOT NULL |
| fileUrl | String | file_url |  |
| status | SubmissionStatus | status | ENUM, NOT NULL |
| rejectionReason | String | rejection_reason |  |
| correctedSubmissionId | UUID | corrected_submission_id |  |

---

## Module: report

### GeneratedReport (extends BaseEntity)
**File**: `modules/report/domain/GeneratedReport.java`
**Table**: `generated_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| templateId | UUID | template_id | NOT NULL |
| entityType | String | entity_type |  |
| entityId | UUID | entity_id |  |
| parameters | Map<String, Object> | parameters | JSONB |
| fileUrl | String | file_url | NOT NULL |
| fileSize | long | file_size | NOT NULL |
| generatedById | UUID | generated_by_id | NOT NULL |
| generatedAt | Instant | generated_at | NOT NULL |

---

### PrintForm (extends BaseEntity)
**File**: `modules/report/domain/PrintForm.java`
**Table**: `print_forms`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| templateId | UUID | template_id | NOT NULL |
| isDefault | boolean | is_default | NOT NULL |
| sortOrder | int | sort_order | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### ReportTemplate (extends BaseEntity)
**File**: `modules/report/domain/ReportTemplate.java`
**Table**: `pdf_report_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| reportType | String | report_type | NOT NULL |
| templateHtml | String | template_html | NOT NULL |
| headerHtml | String | header_html |  |
| footerHtml | String | footer_html |  |
| paperSize | PaperSize | paper_size | ENUM, NOT NULL |
| orientation | Orientation | orientation | ENUM, NOT NULL |
| marginTop | int | margin_top | NOT NULL |
| marginBottom | int | margin_bottom | NOT NULL |
| marginLeft | int | margin_left | NOT NULL |
| marginRight | int | margin_right | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

## Module: revenueRecognition

### CompletionPercentage (extends BaseEntity)
**File**: `modules/revenueRecognition/domain/CompletionPercentage.java`
**Table**: `completion_percentages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| revenueContractId | UUID | revenue_contract_id | NOT NULL |
| calculationDate | LocalDate | calculation_date | NOT NULL |
| method | RecognitionMethod | method | ENUM |
| cumulativeCostIncurred | BigDecimal | cumulative_cost_incurred |  |
| totalEstimatedCost | BigDecimal | total_estimated_cost |  |
| percentComplete | BigDecimal | percent_complete |  |
| physicalPercentComplete | BigDecimal | physical_percent_complete |  |
| notes | String | notes |  |
| calculatedById | UUID | calculated_by_id |  |

---

### RevenueAdjustment (extends BaseEntity)
**File**: `modules/revenueRecognition/domain/RevenueAdjustment.java`
**Table**: `revenue_adjustments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| recognitionPeriodId | UUID | recognition_period_id | NOT NULL |
| adjustmentType | String | adjustment_type | NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| reason | String | reason | NOT NULL |
| previousValue | BigDecimal | previous_value |  |
| newValue | BigDecimal | new_value |  |
| approvedById | UUID | approved_by_id |  |
| approvedAt | Instant | approved_at |  |

---

### RevenueContract (extends BaseEntity)
**File**: `modules/revenueRecognition/domain/RevenueContract.java`
**Table**: `revenue_contracts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| contractId | UUID | contract_id |  |
| contractName | String | contract_name |  |
| recognitionMethod | RecognitionMethod | recognition_method | ENUM, NOT NULL |
| recognitionStandard | RecognitionStandard | recognition_standard | ENUM, NOT NULL |
| totalContractRevenue | BigDecimal | total_contract_revenue | NOT NULL |
| totalEstimatedCost | BigDecimal | total_estimated_cost | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| startDate | LocalDate | start_date |  |
| endDate | LocalDate | end_date |  |
| isActive | Boolean | is_active | NOT NULL |

---

### RevenueRecognitionPeriod (extends BaseEntity)
**File**: `modules/revenueRecognition/domain/RevenueRecognitionPeriod.java`
**Table**: `revenue_recognition_periods`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| revenueContractId | UUID | revenue_contract_id | NOT NULL |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| status | PeriodStatus | status | ENUM, NOT NULL |
| cumulativeCostIncurred | BigDecimal | cumulative_cost_incurred |  |
| cumulativeRevenueRecognized | BigDecimal | cumulative_revenue_recognized |  |
| periodCostIncurred | BigDecimal | period_cost_incurred |  |
| periodRevenueRecognized | BigDecimal | period_revenue_recognized |  |
| percentComplete | BigDecimal | percent_complete |  |
| estimateCostToComplete | BigDecimal | estimate_cost_to_complete |  |
| expectedProfit | BigDecimal | expected_profit |  |
| expectedLoss | BigDecimal | expected_loss |  |
| adjustmentAmount | BigDecimal | adjustment_amount | NOT NULL |
| notes | String | notes |  |
| calculatedById | UUID | calculated_by_id |  |
| reviewedById | UUID | reviewed_by_id |  |
| postedById | UUID | posted_by_id |  |
| postedAt | Instant | posted_at |  |

---

## Module: russianDoc

### Act (extends BaseEntity)
**File**: `modules/russianDoc/domain/Act.java`
**Table**: `act`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| contractId | UUID | contract_id |  |
| executorId | UUID | executor_id | NOT NULL |
| customerId | UUID | customer_id | NOT NULL |
| items | String | items | JSONB, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| period | String | period |  |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### EdoDocument (extends BaseEntity)
**File**: `modules/russianDoc/domain/EdoDocument.java`
**Table**: `edo_documents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentNumber | String | document_number | NOT NULL |
| documentDate | LocalDate | document_date | NOT NULL |
| documentType | EdoEnhancedDocumentType | document_type | ENUM, NOT NULL |
| senderId | UUID | sender_id |  |
| senderInn | String | sender_inn |  |
| receiverId | UUID | receiver_id |  |
| receiverInn | String | receiver_inn |  |
| status | EdoEnhancedDocumentStatus | status | ENUM, NOT NULL |
| amount | BigDecimal | amount |  |
| vatAmount | BigDecimal | vat_amount |  |
| totalAmount | BigDecimal | total_amount |  |
| linkedDocumentId | UUID | linked_document_id |  |
| linkedDocumentModel | String | linked_document_model |  |
| fileUrl | String | file_url |  |
| xmlData | String | xml_data |  |

---

### EdoExchangeLog (extends BaseEntity)
**File**: `modules/russianDoc/domain/EdoExchangeLog.java`
**Table**: `edo_exchange_logs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| edoDocumentId | UUID | edo_document_id | NOT NULL |
| action | EdoAction | action | ENUM, NOT NULL |
| performedById | UUID | performed_by_id |  |
| performedAt | Instant | performed_at | NOT NULL |
| details | String | details |  |
| externalId | String | external_id |  |

---

### EdoGeneratedDocument (extends BaseEntity)
**File**: `modules/russianDoc/domain/EdoGeneratedDocument.java`
**Table**: `edo_generated_document`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| sourceDocumentType | String | source_document_type | NOT NULL |
| sourceDocumentId | UUID | source_document_id | NOT NULL |
| generatedXml | String | generated_xml |  |
| generatedPdfUrl | String | generated_pdf_url |  |
| status | EdoDocumentStatus | status | ENUM, NOT NULL |

**Relationships**:
- ManyToOne → EdoTemplate `template` (FK: template_id)

---

### EdoSignature (extends BaseEntity)
**File**: `modules/russianDoc/domain/EdoSignature.java`
**Table**: `edo_signatures`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| edoDocumentId | UUID | edo_document_id | NOT NULL |
| signerId | UUID | signer_id |  |
| signerName | String | signer_name | NOT NULL |
| signerPosition | String | signer_position |  |
| certificateSerialNumber | String | certificate_serial_number |  |
| signedAt | Instant | signed_at | NOT NULL |
| signatureData | String | signature_data |  |
| isValid | boolean | is_valid | NOT NULL |
| validationResult | String | validation_result |  |

---

### EdoTemplate (extends BaseEntity)
**File**: `modules/russianDoc/domain/EdoTemplate.java`
**Table**: `edo_template`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| documentType | String | document_type | NOT NULL |
| templateXml | String | template_xml | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### InventoryAct (extends BaseEntity)
**File**: `modules/russianDoc/domain/InventoryAct.java`
**Table**: `inventory_act`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| warehouseId | UUID | warehouse_id | NOT NULL |
| commissionMembers | String | commission_members | JSONB, NOT NULL |
| items | String | items | JSONB, NOT NULL |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### KepSignatureRequest (extends BaseEntity)
**File**: `modules/russianDoc/domain/KepSignatureRequest.java`
**Table**: `kep_signature_request`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentType | String | document_type | NOT NULL |
| documentId | UUID | document_id | NOT NULL |
| requestedById | UUID | requested_by_id | NOT NULL |
| requestedToId | UUID | requested_to_id | NOT NULL |
| status | KepSignatureRequestStatus | status | ENUM, NOT NULL |
| dueDate | LocalDate | due_date |  |
| comment | String | comment |  |

---

### OcrEstimateResult (extends BaseEntity)
**File**: `modules/russianDoc/domain/OcrEstimateResult.java`
**Table**: `ocr_estimate_results`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ocrTaskId | UUID | ocr_task_id | NOT NULL |
| lineNumber | Integer | line_number | NOT NULL |
| rateCode | String | rate_code |  |
| name | String | name |  |
| unit | String | unit |  |
| quantity | BigDecimal | quantity |  |
| unitPrice | BigDecimal | unit_price |  |
| totalPrice | BigDecimal | total_price |  |
| confidence | BigDecimal | confidence |  |
| boundingBoxJson | String | bounding_box_json |  |
| accepted | boolean | accepted |  |
| matchedRateId | UUID | matched_rate_id |  |
| notes | String | notes |  |

---

### OcrTask (extends BaseEntity)
**File**: `modules/russianDoc/domain/OcrTask.java`
**Table**: `ocr_task`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| fileUrl | String | file_url | NOT NULL |
| fileName | String | file_name | NOT NULL |
| status | OcrTaskStatus | status | ENUM, NOT NULL |
| documentType | String | document_type |  |
| recognizedText | String | recognized_text |  |
| recognizedFields | String | recognized_fields | JSONB |
| confidence | Double | confidence |  |
| processedAt | Instant | processed_at |  |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |
| totalLinesDetected | Integer | total_lines_detected |  |
| averageConfidence | BigDecimal | average_confidence |  |
| processingTimeMs | Long | processing_time_ms |  |

---

### OcrTemplate (extends BaseEntity)
**File**: `modules/russianDoc/domain/OcrTemplate.java`
**Table**: `ocr_template`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| documentType | String | document_type | NOT NULL |
| fieldMappings | String | field_mappings | JSONB, NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### PowerOfAttorney (extends BaseEntity)
**File**: `modules/russianDoc/domain/PowerOfAttorney.java`
**Table**: `power_of_attorney`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| issuedToId | UUID | issued_to_id | NOT NULL |
| purpose | String | purpose |  |
| validUntil | LocalDate | valid_until | NOT NULL |
| materialList | String | material_list | JSONB, NOT NULL |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### SchetFaktura (extends BaseEntity)
**File**: `modules/russianDoc/domain/SchetFaktura.java`
**Table**: `schet_faktura`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| correctionNumber | String | correction_number |  |
| sellerId | UUID | seller_id | NOT NULL |
| buyerId | UUID | buyer_id | NOT NULL |
| items | String | items | JSONB, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| vatAmount | BigDecimal | vat_amount | NOT NULL |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### Torg12 (extends BaseEntity)
**File**: `modules/russianDoc/domain/Torg12.java`
**Table**: `torg12`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| supplierId | UUID | supplier_id | NOT NULL |
| receiverId | UUID | receiver_id | NOT NULL |
| items | String | items | JSONB, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| vatAmount | BigDecimal | vat_amount | NOT NULL |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### Upd (extends BaseEntity)
**File**: `modules/russianDoc/domain/Upd.java`
**Table**: `upd`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| sellerId | UUID | seller_id | NOT NULL |
| buyerId | UUID | buyer_id | NOT NULL |
| items | String | items | JSONB, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| vatAmount | BigDecimal | vat_amount | NOT NULL |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| signedAt | Instant | signed_at |  |
| signedById | UUID | signed_by_id |  |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### Waybill (extends BaseEntity)
**File**: `modules/russianDoc/domain/Waybill.java`
**Table**: `waybill`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| senderId | UUID | sender_id | NOT NULL |
| receiverId | UUID | receiver_id | NOT NULL |
| carrierId | UUID | carrier_id |  |
| items | String | items | JSONB, NOT NULL |
| vehicleNumber | String | vehicle_number |  |
| driverName | String | driver_name |  |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

### WriteOffAct (extends BaseEntity)
**File**: `modules/russianDoc/domain/WriteOffAct.java`
**Table**: `write_off_act`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| number | String | number | NOT NULL |
| date | LocalDate | date | NOT NULL |
| reason | String | reason |  |
| items | String | items | JSONB, NOT NULL |
| totalAmount | BigDecimal | total_amount | NOT NULL |
| approvedById | UUID | approved_by_id |  |
| commissionMembers | String | commission_members | JSONB, NOT NULL |
| status | RussianDocStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id |  |
| projectId | UUID | project_id |  |

---

## Module: safety

### AccidentAct (extends BaseEntity)
**File**: `modules/safety/domain/AccidentAct.java`
**Table**: `safety_accident_acts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| actNumber | String | act_number | UNIQUE |
| projectId | UUID | project_id |  |
| incidentId | UUID | incident_id |  |
| accidentDate | LocalDateTime | accident_date | NOT NULL |
| accidentLocation | String | accident_location |  |
| victimFullName | String | victim_full_name | NOT NULL |
| victimPosition | String | victim_position |  |
| victimBirthDate | LocalDate | victim_birth_date |  |
| victimGender | String | victim_gender |  |
| victimWorkExperience | String | victim_work_experience |  |
| victimBriefingDate | LocalDate | victim_briefing_date |  |
| victimBriefingType | String | victim_briefing_type |  |
| investigationStartDate | LocalDate | investigation_start_date |  |
| investigationEndDate | LocalDate | investigation_end_date |  |
| commissionChairman | String | commission_chairman |  |
| commissionMembers | String | commission_members |  |
| circumstances | String | circumstances |  |
| rootCauses | String | root_causes |  |
| correctiveMeasures | String | corrective_measures |  |
| responsiblePersons | String | responsible_persons |  |
| injuryDescription | String | injury_description |  |
| injurySeverity | String | injury_severity |  |
| workDaysLost | Integer | work_days_lost |  |
| hospitalization | boolean | hospitalization |  |
| fatal | boolean | fatal |  |
| status | AccidentActStatus | status | ENUM, NOT NULL |
| approvedByName | String | approved_by_name |  |
| approvedDate | LocalDate | approved_date |  |
| sentToAuthoritiesDate | LocalDate | sent_to_authorities_date |  |
| notes | String | notes |  |

---

### BriefingAttendee (extends BaseEntity)
**File**: `modules/safety/domain/BriefingAttendee.java`
**Table**: `briefing_attendees`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| employeeName | String | employee_name |  |
| signed | boolean | signed | NOT NULL |
| signedAt | Instant | signed_at |  |

**Relationships**:
- ManyToOne → SafetyBriefing `briefing` (FK: briefing_id)

---

### IncidentCorrectiveAction (extends BaseEntity)
**File**: `modules/safety/domain/IncidentCorrectiveAction.java`
**Table**: `incident_corrective_actions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| incidentId | UUID | incident_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| actionType | CorrectiveActionType | action_type | ENUM, NOT NULL |
| description | String | description | NOT NULL |
| responsibleId | UUID | responsible_id |  |
| responsibleName | String | responsible_name |  |
| dueDate | LocalDate | due_date | NOT NULL |
| completedDate | LocalDate | completed_date |  |
| status | CorrectiveActionStatus | status | ENUM, NOT NULL |
| verificationDate | LocalDate | verification_date |  |
| verifiedById | UUID | verified_by_id |  |
| isEffective | Boolean | is_effective |  |
| notes | String | notes |  |

---

### IncidentInjuredPerson (extends BaseEntity)
**File**: `modules/safety/domain/IncidentInjuredPerson.java`
**Table**: `incident_injured_persons`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| incidentId | UUID | incident_id | NOT NULL |
| employeeId | UUID | employee_id |  |
| fullName | String | full_name | NOT NULL |
| position | String | position |  |
| department | String | department |  |
| dateOfBirth | LocalDate | date_of_birth |  |
| yearsOfExperience | BigDecimal | years_of_experience |  |
| injuryType | InjuryType | injury_type | ENUM, NOT NULL |
| bodyPart | BodyPart | body_part | ENUM, NOT NULL |
| injuryDescription | String | injury_description |  |
| medicalTreatment | boolean | medical_treatment | NOT NULL |
| hospitalized | boolean | hospitalized | NOT NULL |
| hospitalName | String | hospital_name |  |
| workDaysLost | Integer | work_days_lost |  |
| returnedToWork | boolean | returned_to_work |  |
| returnDate | LocalDate | return_date |  |
| disabilityType | String | disability_type |  |
| outcome | InjuredPersonOutcome | outcome | ENUM |

---

### PpeIssue (extends BaseEntity)
**File**: `modules/safety/domain/PpeIssue.java`
**Table**: `safety_ppe_issues`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| itemId | UUID | item_id | NOT NULL |
| itemName | String | item_name |  |
| employeeId | UUID | employee_id | NOT NULL |
| employeeName | String | employee_name |  |
| quantity | Integer | quantity | NOT NULL |
| issuedDate | LocalDate | issued_date | NOT NULL |
| returnDate | LocalDate | return_date |  |
| returnCondition | PpeCondition | return_condition | ENUM |
| returned | boolean | returned |  |
| notes | String | notes |  |

---

### PpeItem (extends BaseEntity)
**File**: `modules/safety/domain/PpeItem.java`
**Table**: `safety_ppe_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| sku | String | sku |  |
| category | PpeItemCategory | category | ENUM, NOT NULL |
| size | String | size |  |
| certificationStandard | String | certification_standard |  |
| totalQuantity | Integer | total_quantity | NOT NULL |
| availableQuantity | Integer | available_quantity | NOT NULL |
| minStockLevel | Integer | min_stock_level |  |
| expiryDate | LocalDate | expiry_date |  |
| notes | String | notes |  |

---

### SafetyAccessBlock (extends BaseEntity)
**File**: `modules/safety/domain/SafetyAccessBlock.java`
**Table**: `safety_access_blocks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| reason | String | reason | NOT NULL |
| blockedAt | Instant | blocked_at | NOT NULL |
| resolvedAt | Instant | resolved_at |  |
| resolvedBy | UUID | resolved_by |  |
| status | AccessBlockStatus | status | ENUM, NOT NULL |

---

### SafetyBriefing (extends BaseEntity)
**File**: `modules/safety/domain/SafetyBriefing.java`
**Table**: `safety_briefings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| briefingType | BriefingType | briefing_type | ENUM, NOT NULL |
| briefingDate | LocalDate | briefing_date | NOT NULL |
| instructorId | UUID | instructor_id |  |
| instructorName | String | instructor_name |  |
| topic | String | topic |  |
| notes | String | notes |  |
| status | BriefingStatus | status | ENUM, NOT NULL |
| nextBriefingDate | LocalDate | next_briefing_date |  |

**Relationships**:
- OneToMany → BriefingAttendee `attendees`

---

### SafetyBriefingRule (extends BaseEntity)
**File**: `modules/safety/domain/SafetyBriefingRule.java`
**Table**: `safety_briefing_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| rolePattern | String | role_pattern |  |
| hazardType | String | hazard_type |  |
| briefingType | BriefingType | briefing_type | ENUM, NOT NULL |
| frequencyDays | Integer | frequency_days | NOT NULL |
| requiredCertificateTypes | String | required_certificate_types |  |
| description | String | description |  |

---

### SafetyCertificate (extends BaseEntity)
**File**: `modules/safety/domain/SafetyCertificate.java`
**Table**: `safety_certificates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| employeeId | UUID | employee_id | NOT NULL |
| type | String | type | NOT NULL |
| number | String | number |  |
| issueDate | LocalDate | issue_date | NOT NULL |
| expiryDate | LocalDate | expiry_date |  |
| issuingAuthority | String | issuing_authority |  |
| notes | String | notes |  |

---

### SafetyIncident (extends BaseEntity)
**File**: `modules/safety/domain/SafetyIncident.java`
**Table**: `safety_incidents`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| number | String | number | UNIQUE |
| incidentDate | LocalDateTime | incident_date | NOT NULL |
| projectId | UUID | project_id |  |
| locationDescription | String | location_description |  |
| severity | IncidentSeverity | severity | ENUM, NOT NULL |
| incidentType | IncidentType | incident_type | ENUM, NOT NULL |
| status | IncidentStatus | status | ENUM, NOT NULL |
| description | String | description | NOT NULL |
| rootCause | String | root_cause |  |
| correctiveAction | String | corrective_action |  |
| reportedById | UUID | reported_by_id |  |
| reportedByName | String | reported_by_name |  |
| investigatorId | UUID | investigator_id |  |
| investigatorName | String | investigator_name |  |
| injuredEmployeeId | UUID | injured_employee_id |  |
| injuredEmployeeName | String | injured_employee_name |  |
| witnessNames | String | witness_names |  |
| workDaysLost | Integer | work_days_lost |  |
| medicalTreatment | boolean | medical_treatment |  |
| hospitalization | boolean | hospitalization |  |
| resolvedAt | Instant | resolved_at |  |
| notes | String | notes |  |

---

### SafetyInspection (extends BaseEntity)
**File**: `modules/safety/domain/SafetyInspection.java`
**Table**: `safety_inspections`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| number | String | number | UNIQUE |
| inspectionDate | LocalDate | inspection_date | NOT NULL |
| projectId | UUID | project_id |  |
| inspectorId | UUID | inspector_id |  |
| inspectorName | String | inspector_name |  |
| inspectionType | InspectionType | inspection_type | ENUM, NOT NULL |
| status | InspectionStatus | status | ENUM, NOT NULL |
| overallRating | InspectionRating | overall_rating | ENUM |
| findings | String | findings |  |
| recommendations | String | recommendations |  |
| nextInspectionDate | LocalDate | next_inspection_date |  |
| notes | String | notes |  |

---

### SafetyRiskFactor (extends BaseEntity)
**File**: `modules/safety/domain/SafetyRiskFactor.java`
**Table**: `safety_risk_factors`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| factorType | RiskFactorType | factor_type | ENUM, NOT NULL |
| weight | BigDecimal | weight | NOT NULL |
| rawValue | BigDecimal | raw_value |  |
| normalizedValue | BigDecimal | normalized_value |  |
| description | String | description |  |
| calculatedAt | Instant | calculated_at | NOT NULL |

---

### SafetyRiskReport (extends BaseEntity)
**File**: `modules/safety/domain/SafetyRiskReport.java`
**Table**: `safety_risk_reports`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| reportWeek | String | report_week | NOT NULL |
| projectCount | int | project_count | NOT NULL |
| avgRiskScore | BigDecimal | avg_risk_score |  |
| criticalProjects | int | critical_projects |  |
| highRiskProjects | int | high_risk_projects |  |
| topRecommendationsJson | String | top_recommendations_json |  |
| generatedAt | Instant | generated_at | NOT NULL |

---

### SafetyRiskScore (extends BaseEntity)
**File**: `modules/safety/domain/SafetyRiskScore.java`
**Table**: `safety_risk_scores`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| score | int | score | NOT NULL |
| riskLevel | SafetyRiskLevel | risk_level | ENUM, NOT NULL |
| factorsJson | String | factors_json |  |
| recommendationsJson | String | recommendations_json |  |
| incidentCount30d | int | incident_count_30d |  |
| violationCount30d | int | violation_count_30d |  |
| trainingCompliancePct | BigDecimal | training_compliance_pct |  |
| certExpiryRatio | BigDecimal | cert_expiry_ratio |  |
| calculatedAt | Instant | calculated_at | NOT NULL |
| validUntil | Instant | valid_until |  |

---

### SafetyTraining (extends BaseEntity)
**File**: `modules/safety/domain/SafetyTraining.java`
**Table**: `safety_trainings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id |  |
| title | String | title | NOT NULL |
| trainingType | TrainingType | training_type | ENUM, NOT NULL |
| projectId | UUID | project_id |  |
| date | LocalDate | date | NOT NULL |
| instructorId | UUID | instructor_id |  |
| instructorName | String | instructor_name |  |
| participants | String | participants | JSONB |
| topics | String | topics |  |
| duration | Integer | duration |  |
| status | TrainingStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |
| participantCount | Integer | participant_count |  |
| completedAt | Instant | completed_at |  |
| signatureData | String | signature_data |  |
| nextScheduledDate | LocalDate | next_scheduled_date |  |

---

### SafetyViolation (extends BaseEntity)
**File**: `modules/safety/domain/SafetyViolation.java`
**Table**: `safety_violations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| inspectionId | UUID | inspection_id |  |
| incidentId | UUID | incident_id |  |
| description | String | description | NOT NULL |
| severity | ViolationSeverity | severity | ENUM, NOT NULL |
| status | ViolationStatus | status | ENUM, NOT NULL |
| dueDate | LocalDate | due_date |  |
| assignedToId | UUID | assigned_to_id |  |
| assignedToName | String | assigned_to_name |  |
| resolvedAt | Instant | resolved_at |  |
| resolution | String | resolution |  |

---

### SoutCard (extends BaseEntity)
**File**: `modules/safety/domain/SoutCard.java`
**Table**: `safety_sout_cards`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id |  |
| cardNumber | String | card_number |  |
| workplaceName | String | workplace_name | NOT NULL |
| workplaceNumber | String | workplace_number |  |
| department | String | department |  |
| positionName | String | position_name |  |
| employeeCount | Integer | employee_count |  |
| hazardClass | SoutHazardClass | hazard_class | ENUM |
| status | SoutStatus | status | ENUM, NOT NULL |
| assessmentDate | LocalDate | assessment_date |  |
| nextAssessmentDate | LocalDate | next_assessment_date |  |
| assessorOrganization | String | assessor_organization |  |
| harmfulFactors | String | harmful_factors |  |
| compensations | String | compensations |  |
| ppeRecommendations | String | ppe_recommendations |  |
| notes | String | notes |  |

---

### TrainingRecord (extends BaseEntity)
**File**: `modules/safety/domain/TrainingRecord.java`
**Table**: `safety_training_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| employeeId | UUID | employee_id | NOT NULL |
| employeeName | String | employee_name |  |
| trainingType | String | training_type | NOT NULL |
| completedDate | LocalDate | completed_date | NOT NULL |
| expiryDate | LocalDate | expiry_date |  |
| certificateNumber | String | certificate_number |  |
| notes | String | notes |  |

---

## Module: scheduler

### JobExecution (extends BaseEntity)
**File**: `modules/scheduler/domain/JobExecution.java`
**Table**: `job_executions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| jobId | UUID | job_id | NOT NULL |
| startedAt | Instant | started_at | NOT NULL |
| completedAt | Instant | completed_at |  |
| status | JobStatus | status | ENUM, NOT NULL |
| result | String | result |  |
| errorMessage | String | error_message |  |
| errorStackTrace | String | error_stack_trace |  |

---

### ScheduledJob (extends BaseEntity)
**File**: `modules/scheduler/domain/ScheduledJob.java`
**Table**: `scheduled_jobs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| cronExpression | String | cron_expression | NOT NULL |
| jobClass | String | job_class | NOT NULL |
| jobMethod | String | job_method | NOT NULL |
| parameters | Map<String, Object> | parameters | JSONB |
| isActive | boolean | is_active | NOT NULL |
| lastRunAt | Instant | last_run_at |  |
| lastRunStatus | JobStatus | last_run_status | ENUM |
| nextRunAt | Instant | next_run_at |  |
| retryCount | int | retry_count | NOT NULL |
| maxRetries | int | max_retries | NOT NULL |

---

## Module: search

### SearchHistory (extends BaseEntity)
**File**: `modules/search/domain/SearchHistory.java`
**Table**: `search_history`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| organizationId | UUID | organization_id |  |
| query | String | query | NOT NULL |
| resultCount | Integer | result_count | NOT NULL |
| clickedEntityType | SearchEntityType | clicked_entity_type | ENUM |
| clickedEntityId | UUID | clicked_entity_id |  |
| searchedAt | Instant | searched_at | NOT NULL |

---

### SearchIndex (extends BaseEntity)
**File**: `modules/search/domain/SearchIndex.java`
**Table**: `search_index`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| entityType | SearchEntityType | entity_type | ENUM, NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| title | String | title | NOT NULL |
| content | String | content |  |
| metadata | Map<String, Object> | metadata | JSONB |
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id |  |
| indexedAt | Instant | indexed_at | NOT NULL |

---

## Module: selfEmployed

### SelfEmployedContractor (extends BaseEntity)
**File**: `modules/selfEmployed/domain/SelfEmployedContractor.java`
**Table**: `self_employed_contractors`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| fullName | String | full_name | NOT NULL |
| inn | String | inn | NOT NULL, UNIQUE |
| phone | String | phone |  |
| email | String | email |  |
| bankAccount | String | bank_account |  |
| bic | String | bic |  |
| status | ContractorStatus | status | ENUM, NOT NULL |
| registrationDate | LocalDate | registration_date | NOT NULL |
| taxStatus | TaxStatus | tax_status | ENUM, NOT NULL |
| projectIds | String | project_ids |  |

---

### SelfEmployedPayment (extends BaseEntity)
**File**: `modules/selfEmployed/domain/SelfEmployedPayment.java`
**Table**: `self_employed_payments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| contractorId | UUID | contractor_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| contractId | UUID | contract_id |  |
| amount | BigDecimal | amount | NOT NULL |
| description | String | description |  |
| serviceDate | LocalDate | service_date | NOT NULL |
| paymentDate | LocalDate | payment_date |  |
| receiptNumber | String | receipt_number |  |
| receiptUrl | String | receipt_url |  |
| status | SelfEmployedPaymentStatus | status | ENUM, NOT NULL |
| fiscalReceiptChecked | boolean | fiscal_receipt_checked | NOT NULL |
| taxPeriod | String | tax_period |  |

---

### SelfEmployedRegistry (extends BaseEntity)
**File**: `modules/selfEmployed/domain/SelfEmployedRegistry.java`
**Table**: `self_employed_registries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| totalAmount | BigDecimal | total_amount |  |
| totalPayments | int | total_payments |  |
| status | RegistryStatus | status | ENUM, NOT NULL |

---

## Module: settings

### AuditSetting (extends BaseEntity)
**File**: `modules/settings/domain/AuditSetting.java`
**Table**: `audit_settings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| modelName | String | model_name | NOT NULL, UNIQUE |
| trackCreate | boolean | track_create | NOT NULL |
| trackUpdate | boolean | track_update | NOT NULL |
| trackDelete | boolean | track_delete | NOT NULL |
| trackRead | boolean | track_read | NOT NULL |
| retentionDays | Integer | retention_days | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### EmailTemplate (extends BaseEntity)
**File**: `modules/settings/domain/EmailTemplate.java`
**Table**: `email_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| subject | String | subject | NOT NULL |
| bodyHtml | String | body_html |  |
| bodyText | String | body_text |  |
| category | EmailTemplateCategory | category | ENUM, NOT NULL |
| variables | List<String> | variables | JSONB |
| isActive | boolean | is_active | NOT NULL |

---

### FeatureFlag (extends BaseEntity)
**File**: `modules/settings/domain/FeatureFlag.java`
**Table**: `feature_flags`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| key | String | flag_key | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| description | String | description |  |
| enabled | boolean | enabled | NOT NULL |
| organizationScoped | boolean | organization_scoped | NOT NULL |

---

### IntegrationConfig (extends BaseEntity)
**File**: `modules/settings/domain/IntegrationConfig.java`
**Table**: `integration_configs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| integrationType | IntegrationType | integration_type | ENUM, NOT NULL |
| baseUrl | String | base_url |  |
| apiKey | String | api_key |  |
| apiSecret | String | api_secret |  |
| isActive | boolean | is_active | NOT NULL |
| lastSyncAt | Instant | last_sync_at |  |
| syncStatus | SyncStatus | sync_status | ENUM, NOT NULL |
| configJson | Map<String, Object> | config_json | JSONB |

---

### NotificationSetting (extends BaseEntity)
**File**: `modules/settings/domain/NotificationSetting.java`
**Table**: `notification_settings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| userId | UUID | user_id | NOT NULL |
| notificationType | NotificationType | notification_type | ENUM, NOT NULL |
| eventType | EventType | event_type | ENUM, NOT NULL |
| isEnabled | boolean | is_enabled | NOT NULL |

---

### NumberSequence (extends BaseEntity)
**File**: `modules/settings/domain/NumberSequence.java`
**Table**: `number_sequences`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| name | String | name | NOT NULL |
| prefix | String | prefix |  |
| suffix | String | suffix |  |
| nextNumber | Long | next_number | NOT NULL |
| step | Integer | step | NOT NULL |
| padding | Integer | padding | NOT NULL |
| resetPeriod | ResetPeriod | reset_period | ENUM, NOT NULL |
| lastResetDate | LocalDate | last_reset_date |  |

---

### SystemSetting (extends BaseEntity)
**File**: `modules/settings/domain/SystemSetting.java`
**Table**: `system_settings`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| settingKey | String | setting_key | NOT NULL, UNIQUE |
| settingValue | String | setting_value |  |
| settingType | SettingType | setting_type | ENUM, NOT NULL |
| category | SettingCategory | category | ENUM, NOT NULL |
| displayName | String | display_name | NOT NULL |
| description | String | description |  |
| isEditable | boolean | is_editable | NOT NULL |
| isEncrypted | boolean | is_encrypted | NOT NULL |

---

## Module: siteAssessment

### SiteAssessment (extends BaseEntity)
**File**: `modules/siteAssessment/domain/SiteAssessment.java`
**Table**: `site_assessments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| assessmentDate | LocalDate | assessment_date | NOT NULL |
| assessorName | String | assessor_name | NOT NULL |
| siteAddress | String | site_address |  |
| latitude | BigDecimal | latitude |  |
| longitude | BigDecimal | longitude |  |
| accessRoads | Boolean | access_roads |  |
| powerSupplyAvailable | Boolean | power_supply_available |  |
| waterSupplyAvailable | Boolean | water_supply_available |  |
| sewageAvailable | Boolean | sewage_available |  |
| groundConditionsOk | Boolean | ground_conditions_ok |  |
| noEnvironmentalRestrictions | Boolean | no_environmental_restrictions |  |
| cranePlacementPossible | Boolean | crane_placement_possible |  |
| materialStorageArea | Boolean | material_storage_area |  |
| workersCampArea | Boolean | workers_camp_area |  |
| neighboringBuildingsSafe | Boolean | neighboring_buildings_safe |  |
| zoningCompliant | Boolean | zoning_compliant |  |
| geodeticMarksPresent | Boolean | geodetic_marks_present |  |
| groundType | String | ground_type |  |
| siteAreaSqm | BigDecimal | site_area_sqm |  |
| maxBuildingHeightM | BigDecimal | max_building_height_m |  |
| distanceToPowerM | BigDecimal | distance_to_power_m |  |
| distanceToWaterM | BigDecimal | distance_to_water_m |  |
| observations | String | observations |  |
| risksIdentified | String | risks_identified |  |
| recommendation | String | recommendation |  |
| score | Integer | score |  |
| status | AssessmentStatus | status | ENUM, NOT NULL |

---

## Module: specification

### AnalogRequest (extends BaseEntity)
**File**: `modules/specification/domain/AnalogRequest.java`
**Table**: `analog_requests`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| originalMaterialId | UUID | original_material_id | NOT NULL |
| requestedById | UUID | requested_by_id | NOT NULL |
| reason | String | reason |  |
| status | AnalogRequestStatus | status | ENUM, NOT NULL |
| approvedAnalogId | UUID | approved_analog_id |  |
| approvedById | UUID | approved_by_id |  |
| reviewComment | String | review_comment |  |

---

### CompetitiveList (extends BaseEntity)
**File**: `modules/specification/domain/CompetitiveList.java`
**Table**: `competitive_lists`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| specificationId | UUID | specification_id | NOT NULL |
| name | String | name | NOT NULL |
| purchaseRequestId | UUID | purchase_request_id |  |
| status | CompetitiveListStatus | status | ENUM, NOT NULL |
| minProposalsRequired | int | min_proposals_required | NOT NULL |
| createdById | UUID | created_by_id |  |
| decidedById | UUID | decided_by_id |  |
| decidedAt | Instant | decided_at |  |
| notes | String | notes |  |
| budgetItemId | UUID | budget_item_id |  |
| bestPrice | BigDecimal | best_price |  |
| bestVendorName | String | best_vendor_name |  |

---

### CompetitiveListEntry
**File**: `modules/specification/domain/CompetitiveListEntry.java`
**Table**: `competitive_list_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| competitiveListId | UUID | competitive_list_id | NOT NULL |
| specItemId | UUID | spec_item_id | NOT NULL |
| invoiceId | UUID | invoice_id |  |
| invoiceLineId | UUID | invoice_line_id |  |
| vendorId | UUID | vendor_id |  |
| vendorName | String | vendor_name |  |
| unitPrice | BigDecimal | unit_price | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| totalPrice | BigDecimal | total_price | NOT NULL |
| deliveryDays | Integer | delivery_days |  |
| paymentTerms | String | payment_terms |  |
| isWinner | boolean | is_winner | NOT NULL |
| selectionReason | String | selection_reason |  |
| notes | String | notes |  |
| prepaymentPercent | BigDecimal | prepayment_percent |  |
| paymentDelayDays | Integer | payment_delay_days |  |
| warrantyMonths | Integer | warranty_months |  |
| score | BigDecimal | score |  |
| rankPosition | Integer | rank_position |  |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

### MaterialAnalog (extends BaseEntity)
**File**: `modules/specification/domain/MaterialAnalog.java`
**Table**: `material_analogs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| originalMaterialId | UUID | original_material_id | NOT NULL |
| originalMaterialName | String | original_material_name |  |
| analogMaterialId | UUID | analog_material_id | NOT NULL |
| analogMaterialName | String | analog_material_name |  |
| substitutionType | SubstitutionType | substitution_type | ENUM, NOT NULL |
| priceRatio | BigDecimal | price_ratio |  |
| qualityRating | QualityRating | quality_rating | ENUM, NOT NULL |
| approvedById | UUID | approved_by_id |  |
| approvedAt | LocalDateTime | approved_at |  |
| conditions | String | conditions |  |
| isActive | boolean | is_active | NOT NULL |

---

### ProcurementSchedule
**File**: `modules/specification/domain/ProcurementSchedule.java`
**Table**: `procurement_schedules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| specItemId | UUID | spec_item_id |  |
| budgetItemId | UUID | budget_item_id |  |
| itemName | String | item_name | NOT NULL |
| unit | String | unit |  |
| quantity | BigDecimal | quantity |  |
| requiredByDate | LocalDate | required_by_date |  |
| leadTimeDays | Integer | lead_time_days |  |
| orderByDate | LocalDate | order_by_date |  |
| status | String | status | NOT NULL |
| purchaseOrderId | UUID | purchase_order_id |  |
| notes | String | notes |  |
| createdAt | Instant | created_at | NOT NULL |
| updatedAt | Instant | updated_at |  |

---

### SpecItem (extends BaseEntity)
**File**: `modules/specification/domain/SpecItem.java`
**Table**: `spec_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| specificationId | UUID | specification_id | NOT NULL |
| sequence | Integer | sequence | NOT NULL |
| position | String | position |  |
| sectionName | String | section_name |  |
| itemType | SpecItemType | item_type | ENUM, NOT NULL |
| name | String | name | NOT NULL |
| brand | String | brand |  |
| productCode | String | product_code |  |
| manufacturer | String | manufacturer |  |
| quantity | BigDecimal | quantity | NOT NULL |
| unitOfMeasure | String | unit_of_measure | NOT NULL |
| plannedAmount | BigDecimal | planned_amount |  |
| weight | BigDecimal | weight |  |
| notes | String | notes |  |
| procurementStatus | String | procurement_status | NOT NULL |
| estimateStatus | String | estimate_status | NOT NULL |
| isCustomerProvided | boolean | is_customer_provided | NOT NULL |
| budgetItemId | UUID | budget_item_id |  |

---

### Specification (extends BaseEntity)
**File**: `modules/specification/domain/Specification.java`
**Table**: `specifications`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL, UNIQUE |
| title | String | title |  |
| projectId | UUID | project_id | NOT NULL |
| projectName | String | project_name |  |
| contractId | UUID | contract_id |  |
| docVersion | Integer | doc_version | NOT NULL |
| isCurrent | boolean | is_current | NOT NULL |
| status | SpecificationStatus | status | ENUM, NOT NULL |
| parentVersionId | UUID | parent_version_id |  |
| notes | String | notes |  |

---

## Module: subscription

### BillingRecord (extends BaseEntity)
**File**: `modules/subscription/domain/BillingRecord.java`
**Table**: `billing_records`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| subscriptionId | UUID | subscription_id | NOT NULL |
| planName | String | plan_name | NOT NULL |
| planDisplayName | String | plan_display_name | NOT NULL |
| amount | BigDecimal | amount | NOT NULL |
| currency | String | currency | NOT NULL |
| billingType | BillingType | billing_type | ENUM, NOT NULL |
| paymentStatus | PaymentStatus | payment_status | ENUM, NOT NULL |
| invoiceDate | Instant | invoice_date | NOT NULL |
| paidDate | Instant | paid_date |  |
| periodStart | Instant | period_start |  |
| periodEnd | Instant | period_end |  |
| invoiceNumber | String | invoice_number |  |
| description | String | description |  |
| yookassaIdempotency | String | yookassa_idempotency |  |
| yookassaPaymentId | String | yookassa_payment_id |  |
| confirmationUrl | String | confirmation_url |  |

---

### SubscriptionPlan (extends BaseEntity)
**File**: `modules/subscription/domain/SubscriptionPlan.java`
**Table**: `subscription_plans`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | PlanName | name | ENUM, NOT NULL, UNIQUE |
| displayName | String | display_name | NOT NULL |
| price | BigDecimal | price |  |
| currency | String | currency |  |
| billingPeriod | BillingPeriod | billing_period | ENUM |
| maxUsers | Integer | max_users |  |
| maxProjects | Integer | max_projects |  |
| maxStorageGb | Integer | max_storage_gb |  |
| features | String | features |  |
| isActive | boolean | is_active | NOT NULL |

---

### TenantSubscription (extends BaseEntity)
**File**: `modules/subscription/domain/TenantSubscription.java`
**Table**: `tenant_subscriptions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| planId | UUID | plan_id | NOT NULL |
| status | SubscriptionStatus | status | ENUM, NOT NULL |
| startDate | Instant | start_date |  |
| endDate | Instant | end_date |  |
| trialEndDate | Instant | trial_end_date |  |

---

## Module: support

### Faq (extends BaseEntity)
**File**: `modules/support/domain/Faq.java`
**Table**: `faqs`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| question | String | question | NOT NULL |
| answer | String | answer | NOT NULL |
| categoryId | UUID | category_id |  |
| sortOrder | Integer | sort_order | NOT NULL |
| isActive | boolean | is_active | NOT NULL |

---

### KnowledgeBase (extends BaseEntity)
**File**: `modules/support/domain/KnowledgeBase.java`
**Table**: `knowledge_base`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code |  |
| title | String | title | NOT NULL |
| content | String | content | NOT NULL |
| categoryId | UUID | category_id |  |
| tags | String | tags |  |
| views | Integer | views | NOT NULL |
| isPublished | boolean | is_published | NOT NULL |
| authorId | UUID | author_id |  |

---

### SupportTicket (extends BaseEntity)
**File**: `modules/support/domain/SupportTicket.java`
**Table**: `support_tickets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | UNIQUE |
| subject | String | subject | NOT NULL |
| description | String | description | NOT NULL |
| category | String | category |  |
| priority | TicketPriority | priority | ENUM, NOT NULL |
| status | TicketStatus | status | ENUM, NOT NULL |
| reporterId | UUID | reporter_id |  |
| assigneeId | UUID | assignee_id |  |
| dueDate | LocalDate | due_date |  |
| resolvedAt | Instant | resolved_at |  |
| satisfactionRating | Integer | satisfaction_rating |  |

---

### TicketCategory (extends BaseEntity)
**File**: `modules/support/domain/TicketCategory.java`
**Table**: `ticket_categories`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| code | String | code | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| defaultAssigneeId | UUID | default_assignee_id |  |
| slaHours | Integer | sla_hours |  |
| isActive | boolean | is_active | NOT NULL |

---

### TicketComment (extends BaseEntity)
**File**: `modules/support/domain/TicketComment.java`
**Table**: `ticket_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| ticketId | UUID | ticket_id |  |
| authorId | UUID | author_id |  |
| content | String | content | NOT NULL |
| isInternal | boolean | is_internal | NOT NULL |
| attachmentUrls | String | attachment_urls |  |

---

### TicketTemplate
**File**: `modules/support/domain/TicketTemplate.java`
**Table**: `ticket_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| organizationId | UUID | organization_id |  |
| name | String | name | NOT NULL |
| description | String | description |  |
| category | String | category |  |
| defaultPriority | String | default_priority |  |
| bodyTemplate | String | body_template |  |
| isActive | Boolean | is_active |  |
| createdAt | Instant | created_at |  |
| updatedAt | Instant | updated_at |  |

---

## Module: task

### Milestone (extends BaseEntity)
**File**: `modules/task/domain/Milestone.java`
**Table**: `milestones`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| projectId | UUID | project_id |  |
| dueDate | LocalDate | due_date | NOT NULL |
| completedDate | LocalDate | completed_date |  |
| status | MilestoneStatus | status | ENUM, NOT NULL |
| description | String | description |  |
| progress | Integer | progress |  |

---

### ProjectTask (extends BaseEntity)
**File**: `modules/task/domain/ProjectTask.java`
**Table**: `project_tasks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| code | String | code | NOT NULL, UNIQUE |
| title | String | title | NOT NULL |
| description | String | description |  |
| projectId | UUID | project_id |  |
| parentTaskId | UUID | parent_task_id |  |
| status | TaskStatus | status | ENUM, NOT NULL |
| priority | TaskPriority | priority | ENUM, NOT NULL |
| assigneeId | UUID | assignee_id |  |
| assigneeName | String | assignee_name |  |
| reporterId | UUID | reporter_id |  |
| reporterName | String | reporter_name |  |
| plannedStartDate | LocalDate | planned_start_date |  |
| plannedEndDate | LocalDate | planned_end_date |  |
| actualStartDate | LocalDate | actual_start_date |  |
| actualEndDate | LocalDate | actual_end_date |  |
| estimatedHours | BigDecimal | estimated_hours |  |
| actualHours | BigDecimal | actual_hours |  |
| progress | Integer | progress |  |
| wbsCode | String | wbs_code |  |
| sortOrder | Integer | sort_order |  |
| specItemId | UUID | spec_item_id |  |
| tags | String | tags |  |
| notes | String | notes |  |
| visibility | TaskVisibility | visibility | ENUM, NOT NULL |
| delegatedToId | UUID | delegated_to_id |  |
| delegatedToName | String | delegated_to_name |  |

---

### TaskActivity (extends BaseEntity)
**File**: `modules/task/domain/TaskActivity.java`
**Table**: `task_activities`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| taskId | UUID | task_id | NOT NULL |
| activityTypeId | UUID | activity_type_id |  |
| userId | UUID | user_id |  |
| summary | String | summary | NOT NULL |
| note | String | note |  |
| dueDate | LocalDate | due_date |  |
| status | TaskActivityStatus | status | ENUM, NOT NULL |

---

### TaskApproval (extends BaseEntity)
**File**: `modules/task/domain/TaskApproval.java`
**Table**: `task_approvals`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| taskId | UUID | task_id | NOT NULL |
| approverId | UUID | approver_id | NOT NULL |
| approverName | String | approver_name |  |
| status | ApprovalStatus | status | ENUM, NOT NULL |
| comment | String | comment |  |
| approvedAt | LocalDateTime | approved_at |  |
| sequence | Integer | sequence | NOT NULL |

---

### TaskChecklist (extends BaseEntity)
**File**: `modules/task/domain/TaskChecklist.java`
**Table**: `task_checklists`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| taskId | UUID | task_id | NOT NULL |
| title | String | title | NOT NULL |
| sortOrder | Integer | sort_order |  |
| isCompleted | boolean | is_completed | NOT NULL |
| completedAt | LocalDateTime | completed_at |  |
| completedById | UUID | completed_by_id |  |

---

### TaskComment (extends BaseEntity)
**File**: `modules/task/domain/TaskComment.java`
**Table**: `task_comments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| taskId | UUID | task_id | NOT NULL |
| authorId | UUID | author_id |  |
| authorName | String | author_name |  |
| content | String | content | NOT NULL |

---

### TaskCommentReaction (extends BaseEntity)
**File**: `modules/task/domain/TaskCommentReaction.java`
**Table**: `task_comment_reactions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| commentId | UUID | comment_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name |  |
| emoji | String | emoji | NOT NULL |

---

### TaskDependency
**File**: `modules/task/domain/TaskDependency.java`
**Table**: `task_dependencies`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| taskId | UUID | task_id | NOT NULL |
| dependsOnTaskId | UUID | depends_on_task_id | NOT NULL |
| dependencyType | DependencyType | dependency_type | ENUM, NOT NULL |
| lagDays | int | lag_days |  |

---

### TaskLabel
**File**: `modules/task/domain/TaskLabel.java`
**Table**: `task_labels`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| organizationId | UUID | organization_id |  |
| name | String | name | NOT NULL |
| color | String | color | NOT NULL |
| icon | String | icon |  |
| createdAt | Instant | created_at |  |

---

### TaskLabelAssignment
**File**: `modules/task/domain/TaskLabelAssignment.java`
**Table**: `task_label_assignments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| taskId | UUID | task_id | NOT NULL |
| labelId | UUID | label_id | NOT NULL |

---

### TaskParticipant
**File**: `modules/task/domain/TaskParticipant.java`
**Table**: `task_participants`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| taskId | UUID | task_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name | NOT NULL |
| role | ParticipantRole | role | ENUM, NOT NULL |
| addedAt | Instant | added_at | NOT NULL |
| addedById | UUID | added_by_id |  |
| addedByName | String | added_by_name |  |

---

### TaskRecurrence (extends BaseEntity)
**File**: `modules/task/domain/TaskRecurrence.java`
**Table**: `task_recurrences`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| taskId | UUID | task_id | NOT NULL |
| recurrenceType | RecurrenceType | recurrence_type | ENUM, NOT NULL |
| intervalDays | Integer | interval_days | NOT NULL |
| nextOccurrence | LocalDate | next_occurrence |  |
| endDate | LocalDate | end_date |  |
| isActive | boolean | is_active | NOT NULL |
| createdCount | Integer | created_count | NOT NULL |

---

### TaskStage (extends BaseEntity)
**File**: `modules/task/domain/TaskStage.java`
**Table**: `task_stages`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| projectId | UUID | project_id | NOT NULL |
| name | String | name | NOT NULL |
| sequence | Integer | sequence | NOT NULL |
| foldState | String | fold_state |  |
| description | String | description |  |
| isDefault | boolean | is_default | NOT NULL |
| isClosed | boolean | is_closed | NOT NULL |
| color | String | color |  |
| icon | String | icon |  |

---

### TaskTag (extends BaseEntity)
**File**: `modules/task/domain/TaskTag.java`
**Table**: `task_tags`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| color | String | color |  |
| projectId | UUID | project_id |  |

---

### TaskTemplate (extends BaseEntity)
**File**: `modules/task/domain/TaskTemplate.java`
**Table**: `task_templates`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| defaultPriority | TaskPriority | default_priority | ENUM, NOT NULL |
| estimatedHours | BigDecimal | estimated_hours |  |
| category | String | category |  |
| checklistTemplate | String | checklist_template |  |
| tags | String | tags |  |
| isActive | boolean | is_active | NOT NULL |

---

### TaskTimeEntry
**File**: `modules/task/domain/TaskTimeEntry.java`
**Table**: `task_time_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| id | UUID | id | PK, AUTO, NOT NULL |
| taskId | UUID | task_id | NOT NULL |
| userId | UUID | user_id | NOT NULL |
| userName | String | user_name |  |
| startedAt | Instant | started_at | NOT NULL |
| stoppedAt | Instant | stopped_at |  |
| durationSeconds | Integer | duration_seconds |  |
| description | String | description |  |
| isRunning | Boolean | is_running |  |
| createdAt | Instant | created_at |  |
| updatedAt | Instant | updated_at |  |

---

## Module: taxRisk

### TaxRiskAssessment (extends BaseEntity)
**File**: `modules/taxRisk/domain/TaxRiskAssessment.java`
**Table**: `tax_risk_assessments`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| code | String | code | UNIQUE |
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id |  |
| assessmentDate | LocalDate | assessment_date |  |
| assessor | String | assessor |  |
| riskLevel | RiskLevel | risk_level | ENUM |
| status | AssessmentStatus | status | ENUM, NOT NULL |
| overallScore | BigDecimal | overall_score |  |
| description | String | description |  |

---

### TaxRiskFactor (extends BaseEntity)
**File**: `modules/taxRisk/domain/TaxRiskFactor.java`
**Table**: `tax_risk_factors`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| assessmentId | UUID | assessment_id | NOT NULL |
| factorName | String | factor_name | NOT NULL |
| factorCategory | FactorCategory | factor_category | ENUM, NOT NULL |
| weight | BigDecimal | weight |  |
| score | BigDecimal | score |  |
| weightedScore | BigDecimal | weighted_score |  |
| description | String | description |  |
| recommendation | String | recommendation |  |
| evidence | String | evidence |  |

---

### TaxRiskMitigation (extends BaseEntity)
**File**: `modules/taxRisk/domain/TaxRiskMitigation.java`
**Table**: `tax_risk_mitigations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| assessmentId | UUID | assessment_id | NOT NULL |
| factorId | UUID | factor_id |  |
| action | String | action | NOT NULL |
| responsible | String | responsible |  |
| deadline | LocalDate | deadline |  |
| status | MitigationStatus | status | ENUM, NOT NULL |
| result | String | result |  |

---

## Module: warehouse

### InventoryCheck (extends BaseEntity)
**File**: `modules/warehouse/domain/InventoryCheck.java`
**Table**: `inventory_checks`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name |  |
| checkDate | LocalDate | check_date | NOT NULL |
| locationId | UUID | location_id | NOT NULL |
| projectId | UUID | project_id |  |
| status | InventoryCheckStatus | status | ENUM, NOT NULL |
| responsibleId | UUID | responsible_id |  |
| responsibleName | String | responsible_name |  |
| notes | String | notes |  |

---

### InventoryCheckLine (extends BaseEntity)
**File**: `modules/warehouse/domain/InventoryCheckLine.java`
**Table**: `inventory_check_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| checkId | UUID | check_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| expectedQuantity | BigDecimal | expected_quantity |  |
| actualQuantity | BigDecimal | actual_quantity |  |
| variance | BigDecimal | variance |  |
| notes | String | notes |  |

---

### LimitFenceSheet (extends BaseEntity)
**File**: `modules/warehouse/domain/LimitFenceSheet.java`
**Table**: `limit_fence_sheets`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| sheetNumber | String | sheet_number | NOT NULL |
| projectId | UUID | project_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| unit | String | unit |  |
| limitQuantity | BigDecimal | limit_quantity | NOT NULL |
| issuedQuantity | BigDecimal | issued_quantity |  |
| returnedQuantity | BigDecimal | returned_quantity |  |
| periodStart | LocalDate | period_start | NOT NULL |
| periodEnd | LocalDate | period_end | NOT NULL |
| warehouseId | UUID | warehouse_id |  |
| responsibleId | UUID | responsible_id |  |
| specificationId | UUID | specification_id |  |
| status | LimitFenceSheetStatus | status | ENUM, NOT NULL |
| organizationId | UUID | organization_id | NOT NULL |
| notes | String | notes |  |

---

### Material (extends BaseEntity)
**File**: `modules/warehouse/domain/Material.java`
**Table**: `materials`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| code | String | code |  |
| category | MaterialCategory | category | ENUM |
| unitOfMeasure | String | unit_of_measure | NOT NULL |
| description | String | description |  |
| minStockLevel | BigDecimal | min_stock_level |  |
| currentPrice | BigDecimal | current_price |  |
| active | boolean | active | NOT NULL |

---

### StockEntry (extends BaseEntity)
**File**: `modules/warehouse/domain/StockEntry.java`
**Table**: `stock_entries`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| locationId | UUID | location_id | NOT NULL |
| quantity | BigDecimal | quantity | NOT NULL |
| reservedQuantity | BigDecimal | reserved_quantity |  |
| availableQuantity | BigDecimal | available_quantity |  |
| lastPricePerUnit | BigDecimal | last_price_per_unit |  |
| totalValue | BigDecimal | total_value |  |

---

### StockLimit (extends BaseEntity)
**File**: `modules/warehouse/domain/StockLimit.java`
**Table**: `stock_limits`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| warehouseLocationId | UUID | warehouse_location_id | NOT NULL |
| minQuantity | BigDecimal | min_quantity |  |
| maxQuantity | BigDecimal | max_quantity |  |
| reorderPoint | BigDecimal | reorder_point |  |
| reorderQuantity | BigDecimal | reorder_quantity |  |
| unit | String | unit |  |
| isActive | boolean | is_active | NOT NULL |
| lastAlertAt | LocalDateTime | last_alert_at |  |

---

### StockLimitAlert (extends BaseEntity)
**File**: `modules/warehouse/domain/StockLimitAlert.java`
**Table**: `stock_limit_alerts`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| stockLimitId | UUID | stock_limit_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| currentQuantity | BigDecimal | current_quantity |  |
| limitType | StockLimitType | limit_type | ENUM, NOT NULL |
| severity | StockAlertSeverity | severity | ENUM, NOT NULL |
| acknowledgedById | UUID | acknowledged_by_id |  |
| acknowledgedAt | LocalDateTime | acknowledged_at |  |
| isResolved | boolean | is_resolved | NOT NULL |

---

### StockMovement (extends BaseEntity)
**File**: `modules/warehouse/domain/StockMovement.java`
**Table**: `stock_movements`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| number | String | number |  |
| movementDate | LocalDate | movement_date | NOT NULL |
| movementType | StockMovementType | movement_type | ENUM, NOT NULL |
| status | StockMovementStatus | status | ENUM, NOT NULL |
| projectId | UUID | project_id |  |
| sourceLocationId | UUID | source_location_id |  |
| destinationLocationId | UUID | destination_location_id |  |
| purchaseRequestId | UUID | purchase_request_id |  |
| m29Id | UUID | m29_id |  |
| responsibleId | UUID | responsible_id |  |
| responsibleName | String | responsible_name |  |
| notes | String | notes |  |

---

### StockMovementLine (extends BaseEntity)
**File**: `modules/warehouse/domain/StockMovementLine.java`
**Table**: `stock_movement_lines`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| movementId | UUID | movement_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| sequence | Integer | sequence |  |
| quantity | BigDecimal | quantity | NOT NULL |
| unitPrice | BigDecimal | unit_price |  |
| totalPrice | BigDecimal | total_price |  |
| unitOfMeasure | String | unit_of_measure |  |
| notes | String | notes |  |

---

### WarehouseLocation (extends BaseEntity)
**File**: `modules/warehouse/domain/WarehouseLocation.java`
**Table**: `warehouse_locations`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| name | String | name | NOT NULL |
| code | String | code |  |
| locationType | WarehouseLocationType | location_type | ENUM |
| projectId | UUID | project_id |  |
| address | String | address |  |
| responsibleId | UUID | responsible_id |  |
| responsibleName | String | responsible_name |  |
| parentId | UUID | parent_id |  |
| active | boolean | active | NOT NULL |

---

### WarehouseOrder (extends BaseEntity)
**File**: `modules/warehouse/domain/WarehouseOrder.java`
**Table**: `warehouse_orders`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| orderNumber | String | order_number | NOT NULL |
| orderType | WarehouseOrderType | order_type | ENUM, NOT NULL |
| orderDate | LocalDate | order_date | NOT NULL |
| warehouseId | UUID | warehouse_id | NOT NULL |
| stockMovementId | UUID | stock_movement_id |  |
| counterpartyId | UUID | counterparty_id |  |
| contractId | UUID | contract_id |  |
| purchaseOrderId | UUID | purchase_order_id |  |
| responsibleId | UUID | responsible_id |  |
| receiverId | UUID | receiver_id |  |
| totalQuantity | BigDecimal | total_quantity |  |
| totalAmount | BigDecimal | total_amount |  |
| status | WarehouseOrderStatus | status | ENUM, NOT NULL |
| notes | String | notes |  |
| organizationId | UUID | organization_id | NOT NULL |

---

### WarehouseOrderItem (extends BaseEntity)
**File**: `modules/warehouse/domain/WarehouseOrderItem.java`
**Table**: `warehouse_order_items`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| warehouseOrderId | UUID | warehouse_order_id | NOT NULL |
| materialId | UUID | material_id | NOT NULL |
| materialName | String | material_name |  |
| unit | String | unit |  |
| quantity | BigDecimal | quantity | NOT NULL |
| unitPrice | BigDecimal | unit_price |  |
| totalAmount | BigDecimal | total_amount |  |
| lotNumber | String | lot_number |  |
| certificateNumber | String | certificate_number |  |

---

## Module: workflowEngine

### ApprovalDecision (extends BaseEntity)
**File**: `modules/workflowEngine/domain/ApprovalDecision.java`
**Table**: `approval_decisions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| approvalInstanceId | UUID | approval_instance_id | NOT NULL |
| workflowStepId | UUID | workflow_step_id | NOT NULL |
| stepOrder | Integer | step_order |  |
| approverId | UUID | approver_id | NOT NULL |
| decision | ApprovalDecisionType | decision | ENUM, NOT NULL |
| comments | String | comments |  |
| decidedAt | Instant | decided_at |  |

---

### ApprovalInstance (extends BaseEntity)
**File**: `modules/workflowEngine/domain/ApprovalInstance.java`
**Table**: `approval_instances`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| organizationId | UUID | organization_id | NOT NULL |
| workflowDefinitionId | UUID | workflow_definition_id |  |
| entityId | UUID | entity_id | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| entityNumber | String | entity_number |  |
| currentStepId | UUID | current_step_id |  |
| currentStepOrder | Integer | current_step_order |  |
| status | ApprovalInstanceStatus | status | ENUM, NOT NULL |
| initiatedById | UUID | initiated_by_id |  |
| completedAt | Instant | completed_at |  |
| slaDeadline | Instant | sla_deadline |  |
| escalatedTo | UUID | escalated_to |  |
| delegatedTo | UUID | delegated_to |  |
| notes | String | notes |  |

---

### AutoApprovalRule (extends BaseEntity)
**File**: `modules/workflowEngine/domain/AutoApprovalRule.java`
**Table**: `auto_approval_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| entityType | ApprovalEntityType | entity_type | ENUM, NOT NULL |
| conditions | String | conditions |  |
| autoApproveThreshold | BigDecimal | auto_approve_threshold |  |
| requiredApprovers | Integer | required_approvers | NOT NULL |
| escalationTimeoutHours | Integer | escalation_timeout_hours | NOT NULL |
| isActive | Boolean | is_active | NOT NULL |
| projectId | UUID | project_id |  |
| organizationId | UUID | organization_id |  |

---

### AutomationExecution (extends BaseEntity)
**File**: `modules/workflowEngine/domain/AutomationExecution.java`
**Table**: `automation_executions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| automationRuleId | UUID | automation_rule_id | NOT NULL |
| entityId | UUID | entity_id |  |
| entityType | String | entity_type |  |
| executionStatus | ExecutionStatus | execution_status | ENUM, NOT NULL |
| startedAt | Instant | started_at |  |
| completedAt | Instant | completed_at |  |
| triggerData | String | trigger_data |  |
| resultData | String | result_data |  |
| errorMessage | String | error_message |  |

---

### AutomationRule (extends BaseEntity)
**File**: `modules/workflowEngine/domain/AutomationRule.java`
**Table**: `automation_rules`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| entityType | String | entity_type |  |
| triggerType | WorkflowTriggerType | trigger_type | ENUM, NOT NULL |
| triggerCondition | String | trigger_condition |  |
| actionType | ActionType | action_type | ENUM, NOT NULL |
| actionConfig | String | action_config |  |
| isActive | Boolean | is_active | NOT NULL |
| organizationId | UUID | organization_id |  |
| priority | Integer | priority | NOT NULL |
| lastExecutedAt | Instant | last_executed_at |  |
| executionCount | Integer | execution_count | NOT NULL |

---

### WorkflowDefinition (extends BaseEntity)
**File**: `modules/workflowEngine/domain/WorkflowDefinition.java`
**Table**: `workflow_definitions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| name | String | name | NOT NULL |
| description | String | description |  |
| entityType | String | entity_type |  |
| isActive | Boolean | is_active | NOT NULL |
| organizationId | UUID | organization_id |  |
| createdById | UUID | created_by_id |  |

---

### WorkflowStep (extends BaseEntity)
**File**: `modules/workflowEngine/domain/WorkflowStep.java`
**Table**: `workflow_steps`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| workflowDefinitionId | UUID | workflow_definition_id | NOT NULL |
| name | String | name | NOT NULL |
| description | String | description |  |
| actionType | String | action_type |  |
| actionConfig | String | action_config |  |
| fromStatus | String | from_status |  |
| toStatus | String | to_status |  |
| requiredRole | String | required_role |  |
| approverIds | String | approver_ids |  |
| slaHours | Integer | sla_hours |  |
| sortOrder | Integer | sort_order |  |
| conditions | String | conditions |  |

---

### WorkflowTransition (extends BaseEntity)
**File**: `modules/workflowEngine/domain/WorkflowTransition.java`
**Table**: `workflow_transitions`

| Field | Type | Column | Constraints |
|-------|------|--------|-------------|
| workflowStepId | UUID | workflow_step_id | NOT NULL |
| entityId | UUID | entity_id | NOT NULL |
| entityType | String | entity_type | NOT NULL |
| transitionedById | UUID | transitioned_by_id |  |
| transitionedAt | Instant | transitioned_at |  |
| fromStatus | String | from_status |  |
| toStatus | String | to_status |  |
| comments | String | comments |  |
| duration | Long | duration |  |

---


---

## Flyway Migrations

**Total Migrations**: 304

| Migration | Description |
|-----------|-------------|
| V1__init_extensions.sql | init extensions — CREATE EXTENSION; CREATE FUNCTION |
| V2__auth_tables.sql | auth tables — CREATE INDEX; CREATE PERMISSIONS; CREATE ROLES; CREATE USERS |
| V3__organization_tables.sql | organization tables — CREATE DEPARTMENTS; CREATE INDEX; CREATE ORGANIZATIONS |
| V4__project_tables.sql | project tables — CREATE PROJECTS; CREATE SEQUENCE |
| V5__audit_log_table.sql | audit log table — CREATE AUDIT_LOGS; CREATE INDEX |
| V6__contract_tables.sql | contract tables — CREATE CONTRACT_TYPES; CREATE INDEX; CREATE SEQUENCE; INSERT CONTRACT_TYPES |
| V7__specification_tables.sql | specification tables — CREATE INDEX; CREATE SEQUENCE; CREATE SPECIFICATIONS |
| V8__estimate_tables.sql | estimate tables — CREATE ESTIMATES; CREATE INDEX |
| V9__closing_document_tables.sql | closing document tables — CREATE INDEX; CREATE KS2_DOCUMENTS |
| V10__m29_tables.sql | m29 tables — CREATE INDEX; CREATE M29_DOCUMENTS; CREATE SEQUENCE |
| V11__procurement_tables.sql | procurement tables — CREATE INDEX; CREATE PURCHASE_REQUESTS; CREATE SEQUENCE |
| V12__plan_fact_tables.sql | plan fact tables — CREATE INDEX; CREATE PLAN_FACT_LINES |
| V13__finance_tables.sql | finance tables — CREATE BUDGETS; CREATE SEQUENCE |
| V14__warehouse_tables.sql | warehouse tables — CREATE INDEX; CREATE SEQUENCE; CREATE WAREHOUSE_LOCATIONS |
| V15__hr_tables.sql | hr tables — CREATE EMPLOYEES; CREATE INDEX; CREATE SEQUENCE |
| V16__safety_tables.sql | safety tables — CREATE SAFETY_INCIDENTS; CREATE SEQUENCE |
| V17__task_tables.sql | task tables — CREATE PROJECT_TASKS; CREATE SEQUENCE |
| V18__document_tables.sql | document tables — CREATE DOCUMENTS; CREATE INDEX |
| V19__messaging_tables.sql | messaging tables — CREATE CHANNELS; CREATE INDEX; CREATE SEQUENCE |
| V20__permission_tables.sql | permission tables — CREATE INDEX; CREATE MODEL_ACCESS_RULES; CREATE PERMISSION_GROUPS |
| V21__settings_tables.sql | settings tables — CREATE INDEX; CREATE SYSTEM_SETTINGS; INSERT SYST |
| V22__fleet_tables.sql | fleet tables — CREATE SEQUENCE; CREATE VEHICLES |
| V23__quality_tables.sql | quality tables — CREATE QUALITY_CHECKS; CREATE SEQUENCE |
| V24__dailylog_tables.sql | dailylog tables — CREATE DAILY_LOGS; CREATE INDEX; CREATE SEQUENCE |
| V25__notification_tables.sql | notification tables — CREATE INDEX; CREATE NOTIFICATIONS |
| V26__analytics_tables.sql | analytics tables — CREATE DASHBOARDS; CREATE INDEX; CREATE SEQUENCE |
| V27__integration_tables.sql | integration tables — CREATE INDEX; CREATE INTEGRATION_ENDPOINTS; CREATE SEQUENCE |
| V28__calendar_tables.sql | calendar tables — CREATE CALENDAR_EVENTS |
| V29__portal_tables.sql | portal tables — CREATE INDEX; CREATE PORTAL_USERS |
| V30__search_tables.sql | search tables — CREATE FUNCTION; CREATE INDEX; CREATE SEARCH_INDEX |
| V31__monitoring_tables.sql | monitoring tables — CREATE INDEX; CREATE SYSTEM_HEALTH_CHECKS; CREATE SYSTEM_METRICS |
| V32__bim_tables.sql | bim tables — CREATE BIM_ELEMENTS; CREATE BIM_MODELS; CREATE INDEX; CREATE SEQUENCE |
| V33__pto_tables.sql | pto tables — CREATE INDEX; CREATE PTO_DOCUMENTS; CREATE PTO_DOCUMENT_VERSIONS |
| V34__accounting_tables.sql | accounting tables — CREATE ACCOUNT_PLANS; CREATE INDEX; CREATE SEQUENCE |
| V35__russian_document_tables.sql | russian document tables — CREATE INDEX; CREATE TORG12; CREATE UPD |
| V36__hr_russian_tables.sql | hr russian tables — CREATE INDEX; CREATE STAFFING_TABLE |
| V37__operations_tables.sql | operations tables — CREATE SEQUENCE; CREATE WORK_ORDERS |
| V38__procurement_ext_tables.sql | procurement ext tables — CREATE INDEX; CREATE MATERIAL_ANALOGS; CREATE SEQUENCE |
| V39__contract_ext_tables.sql | contract ext tables — CREATE CONTRACT_SUPPLEMENTS; CREATE INDEX; CREATE SEQUENCE |
| V40__regulatory_tables.sql | regulatory tables — CREATE INDEX; CREATE REGULATORY_BODIES; CREATE SEQUENCE |
| V41__punchlist_tables.sql | punchlist tables — CREATE INDEX; CREATE PUNCH_LISTS; CREATE SEQUENCE |
| V42__support_tables.sql | support tables — CREATE INDEX; CREATE SEQUENCE; CREATE SUPPORT_TICKETS; CREATE TICKET_CATEGORIES |
| V43__chatter_tables.sql | chatter tables — CREATE CHATTER_COMMENTS; CREATE INDEX |
| V44__report_tables.sql | report tables — CREATE INDEX; CREATE PDF_REPORT_TEMPLATES |
| V45__scheduler_tables.sql | scheduler tables — CREATE INDEX; CREATE SCHEDULED_JOBS |
| V46__mfa_sso_tables.sql | mfa sso tables — CREATE INDEX; CREATE MFA_ATTEMPTS; CREATE MFA_CONFIGS |
| V47__ai_tables.sql | ai tables — CREATE AI_CONVERSATIONS; CREATE AI_MESSAGES; CREATE INDEX |
| V48__iot_tables.sql | iot tables — CREATE I; CREATE INDEX; CREATE IOT_DEVICES |
| V49__mobile_tables.sql | mobile tables — CREATE INDEX; CREATE MOBILE_DEVICES; CREATE PUSH_NOTIFICATIONS |
| V50__rfi_submittal_issue_tables.sql | rfi submittal issue tables — CREATE RFIS; CREATE SEQUENCE |
| V51__change_management_tables.sql | change management tables — CREATE CHANGE_EVENTS; CREATE SEQUENCE |
| V52__cde_iso19650_tables.sql | cde iso19650 tables — CREATE CDE_DOCUMENT_CONTAINERS; CREATE CDE_DOCUMENT_REVISIONS; CREATE INDEX |
| V53__cost_management_tables.sql | cost management tables — CREATE COST_CODES; CREATE INDEX; CREATE SEQUENCE |
| V54__wbs_cpm_planning_tables.sql | wbs cpm planning tables — CREATE INDEX; CREATE WBS_NODES |
| V55__portfolio_crm_tables.sql | portfolio crm tables — CREATE INDEX; CREATE OPPORTUNITIES |
| V56__workflow_engine_tables.sql | workflow engine tables — CREATE INDEX; CREATE WORKFLOW_DEFINITIONS; CREATE WORKFLOW_STEPS |
| V57__closeout_commissioning_tables.sql | closeout commissioning tables — CREATE COMMISSIONING_CHECKLISTS; CREATE INDEX |
| V58__bid_scoring_tables.sql | bid scoring tables — CREATE BID_COMPARISONS; CREATE INDEX |
| V59__immutable_audit_tables.sql | immutable audit tables — CREATE IMMUTABLE_RECORDS; CREATE INDEX |
| V60__import_export_tables.sql | import export tables — CREATE IMPORT_JOBS; CREATE IMPORT_MAPPINGS; CREATE INDEX |
| V61__revenue_recognition_tables.sql | revenue recognition tables — CREATE REVENUE_CONTRACTS |
| V62__communication_call_tables.sql | communication call tables — CREATE CALL_SESSIONS; CREATE INDEX |
| V63__journal_tables.sql | journal tables — CREATE GENERAL_JOURNALS; CREATE GENERAL_JOURNAL_ENTRIES; CREATE INDEX |
| V64__monthly_schedule_tables.sql | monthly schedule tables — CREATE INDEX; CREATE MONTHLY_SCHEDULES; CREATE MONTHLY_SCHEDULE_LINES |
| V65__pto_extended_tables.sql | pto extended tables — CREATE INDEX; CREATE KS6A_RECORDS; CREATE KS6_JOURNALS |
| V66__task_templates_checklists.sql | task templates checklists — CREATE INDEX; CREATE TASK_TEMPLATES |
| V67__messaging_extended.sql | messaging extended — CREATE INDEX; CREATE MAIL_SUBTYPES; INSERT MAIL_SUBTYPES |
| V68__recruitment_leave_tables.sql | recruitment leave tables — CREATE INDEX; CREATE JOB_POSITIONS; CREATE RECRUITMENT_STAGES |
| V69__maintenance_tables.sql | maintenance tables — CREATE INDEX; CREATE MAINTENANCE_STAGES; CREATE MAINTENANCE_TEAMS |
| V70__dispatch_design_kpi_crew.sql | dispatch design kpi crew — CREATE DISPATCH_ORDERS |
| V71__stock_limits_certificates_analogs_tolerance.sql | stock limits certificates analogs tolerance — ALTER STOCK_LIMITS; CREATE STOCK_LIMITS |
| V72__kep_legal_crm_tables.sql | kep legal crm tables — CREATE INDEX; CREATE KEP_CERTIFICATES |
| V73__integrations_1c_sbis_edo_ens.sql | integrations 1c sbis edo ens — CREATE INDEX; CREATE ONEC_CONFIGS |
| V74__analytics_reporting_api_partner.sql | analytics reporting api partner — CREATE ANALYTICS_REPORTS; CREATE INDEX |
| V75__auto_approval_rules_table.sql | auto approval rules table — CREATE AUTO_APPROVAL_RULES; CREATE INDEX |
| V76__seed_roles_and_admin_user.sql | seed roles and admin user — INSERT ROLES |
| V77__price_coefficient_tables.sql | price coefficient tables — CREATE INDEX; CREATE PRICE_COEFFICIENTS |
| V78__payroll_tables.sql | payroll tables — CREATE PAYROLL_TEMPLATES |
| V79__self_employed_tables.sql | self employed tables — CREATE INDEX; CREATE SELF_EMPLOYED_CONTRACTORS |
| V80__tax_risk_tables.sql | tax risk tables — CREATE INDEX; CREATE TAX_RISK_ASSESSMENTS |
| V81__monte_carlo_tables.sql | monte carlo tables — CREATE INDEX; CREATE MONTE_CARLO_SIMULATIONS |
| V82__sequences_and_missing_triggers.sql | sequences and missing triggers — CREATE FUNCTION; CREATE SEQUENCE |
| V83__telegram_link_codes_table.sql | telegram link codes table — CREATE INDEX; CREATE TELEGRAM_LINK_CODES |
| V84__seed_missing_system_roles.sql | seed missing system roles — INSERT ROLES |
| V85__seed_default_organization_and_backfill_tenant_ids.sql | seed default organization and backfill tenant ids — INSERT ORGANIZATIONS |
| V86__search_history_add_organization_id.sql | search history add organization id — ALTER SEARCH_HISTORY; CREATE INDEX |
| V87__webdav_add_organization_id_and_backfill.sql | webdav add organization id and backfill — ALTER WEBDAV_FILES; CREATE INDEX |
| V88__ens_backfill_organization_id.sql | ens backfill organization id |
| V89__counterparties_add_organization_id_and_tenant_unique_inn.sql | counterparties add organization id and tenant unique inn — ADD CONSTRAINT; ALTER COUNTERPARTIES; CREATE INDEX; DROP CONSTRAINT |
| V90__accounting_add_tenant_columns_periods_journals_entries_fixed_assets_tax.sql | accounting add tenant columns periods journals entries fixed assets tax — ADD CONSTRAINT; ALTER ACCOUNT_PERIODS; ALTER FINANCIAL_JOURNALS; CREATE INDEX; DROP CONSTRAINT |
| V91__purchase_orders_and_warehouse_orders.sql | purchase orders and warehouse orders — CREATE INDEX; CREATE PURCHASE_ORDERS; CREATE PURCHASE_ORDER_ITEMS |
| V92__seed_accounting_journals_and_period.sql | seed accounting journals and period — INSERT ACCOUNT_PERIODS; INSERT FINANCIAL_JOURNALS |
| V93__documents_add_organization_id_and_backfill.sql | documents add organization id and backfill — ALTER DOCUMENTS; CREATE INDEX |
| V94__purchase_orders_tenant_scope.sql | purchase orders tenant scope — ADD CONSTRAINT; ALTER PURCHASE_ORDERS; CREATE INDEX; DROP CONSTRAINT |
| V95__contracts_add_organization_id_and_backfill.sql | contracts add organization id and backfill — ADD CONSTRAINT; ALTER CONTRACTS; CREATE INDEX; DROP CONSTRAINT |
| V96__account_plans_add_organization_id_and_tenant_unique_code.sql | account plans add organization id and tenant unique code — ADD CONSTRAINT; ALTER ACCOUNT_PLANS; CREATE INDEX; DROP CONSTRAINT |
| V97__crm_add_organization_id_and_tenant_scope.sql | crm add organization id and tenant scope — ALTER CRM_ACTIVITIES; ALTER CRM_LEADS; ALTER CRM_STAGES; ALTER CRM_TEAMS |
| V98__support_tickets_add_organization_id.sql | support tickets add organization id — ALTER SUPPORT_TICKETS; CREATE INDEX |
| V99__support_kb_faq_categories_add_organization_id.sql | support kb faq categories add organization id — ADD CONSTRAINT; ALTER FAQS; ALTER KNOWLEDGE_BASE; ALTER TICKET_CATEGORIES; DROP CONSTRAINT |
| V100__safety_add_organization_id.sql | safety add organization id — ALTER SAFETY_INCIDENTS; ALTER SAFETY_INSPECTIONS; ALTER SAFETY_VIOLATIONS |
| V101__legal_add_organization_id.sql | legal add organization id — ALTER CONTRACT_LEGAL_TEMPLATES; ALTER LEGAL_CASES; CREATE INDEX |
| V102__fleet_vehicles_add_organization_id.sql | fleet vehicles add organization id — ALTER VEHICLES; CREATE INDEX |
| V103__procurement_purchase_requests_add_organization_id.sql | procurement purchase requests add organization id — ALTER PURCHASE_REQUESTS; CREATE INDEX |
| V104__warehouse_orders_lfs_tenant_scope.sql | warehouse orders lfs tenant scope — ADD CONSTRAINT; ALTER WAREHOUSE_ORDERS; CREATE INDEX; DROP CONSTRAINT |
| V105__bid_comparisons_add_organization_id.sql | bid comparisons add organization id — ALTER BID_COMPARISONS; CREATE INDEX |
| V106__warehouse_core_tenant_scope.sql | warehouse core tenant scope — ALTER MATERIALS; ALTER WAREHOUSE_LOCATIONS; CREATE INDEX; DROP CONSTRAINT |
| V107__bid_scores_unique_active_key.sql | bid scores unique active key — CREATE INDEX |
| V108__add_tenant_scoped_composite_indexes.sql | add tenant scoped composite indexes — ALTER BUDGETS; ALTER INVOICES; ALTER PAYMENTS; CREATE INDEX |
| V109__reserved_placeholder.sql | reserved placeholder |
| V110__reserved_placeholder.sql | reserved placeholder |
| V111__reserved_placeholder.sql | reserved placeholder |
| V112__reserved_placeholder.sql | reserved placeholder |
| V113__fix_finance_unique_constraints.sql | fix finance unique constraints — ALTER INVOICES; ALTER PAYMENTS |
| V114__users_account_lockout.sql | users account lockout — ALTER USERS; CREATE INDEX |
| V115__mfa_security_hardening.sql | mfa security hardening — ALTER MFA_ATTEMPTS |
| V116__project_organization_id_not_null.sql | project organization id not null — ALTER PROJECTS |
| V117__add_organization_id_to_critical_entities.sql | add organization id to critical entities — ALTER BUDGETS; ALTER INVOICES; CREATE INDEX |
| V118__ks2_per_line_vat.sql | ks2 per line vat — ALTER KS2_DOCUMENTS; ALTER KS2_LINES |
| V119__work_volume_entries.sql | work volume entries — ALTER WBS_NODES; CREATE FUNCTION; CREATE INDEX; CREATE WORK_VOLUME_ENTRIES |
| V120__budget_items_construction_fields.sql | budget items construction fields — ALTER BUDGET_ITEMS; CREATE INDEX |
| V121__contracts_budget_item_id_and_purchase_tender_type.sql | contracts budget item id and purchase tender type — ALTER CONTRACTS; ALTER PURCHASE_REQUESTS; CREATE INDEX |
| V122__race_condition_unique_constraints.sql | race condition unique constraints — CREATE INDEX |
| V123__inspection_checklist_items.sql | inspection checklist items — ALTER QUALITY_CHECKS; CREATE INDEX; CREATE INSPECTION_CHECKLIST_ITEMS |
| V124__defect_registry_org_isolation.sql | defect registry org isolation — ALTER DEFECTS; ALTER PUNCH_ITEMS; ALTER PUNCH_LISTS; CREATE INDEX |
| V125__defect_contractor_and_sla.sql | defect contractor and sla — ALTER DEFECTS; CREATE INDEX |
| V126__safety_briefing_journal.sql | safety briefing journal — ALTER SAFETY_TRAININGS; CREATE INDEX |
| V127__certification_matrix_enhancements.sql | certification matrix enhancements — ALTER EMPLOYEE_CERTIFICATES; CREATE INDEX |
| V128__incident_form_n1_and_injured_persons.sql | incident form n1 and injured persons — ALTER SAFETY_INCIDENTS |
| V129__prescription_tracking_enhancement.sql | prescription tracking enhancement — ALTER PRESCRIPTIONS |
| V130__fleet_waybills.sql | fleet waybills — CREATE FLEET_WAYBILLS; CREATE INDEX; CREATE SEQUENCE |
| V131__equipment_usage_log.sql | equipment usage log — ALTER VEHICLES; CREATE EQUIPMENT_USAGE_LOGS; CREATE INDEX |
| V132_1__budget_item_discipline_mark.sql | budget item discipline mark — ALTER BUDGET_ITEMS |
| V132__maintenance_schedule_rules.sql | maintenance schedule rules — ALTER MAINTENANCE_RECORDS; CREATE INDEX; CREATE MAINTENANCE_SCHEDULE_RULES |
| V133__material_barcode_column.sql | material barcode column — ALTER MATERIALS; CREATE INDEX |
| V134__onec_config_organization_id.sql | onec config organization id — ALTER ONEC_CONFIGS; CREATE INDEX |
| V135__ks2_ks3_onec_posting_status.sql | ks2 ks3 onec posting status — ALTER KS2_DOCUMENTS; ALTER KS3_DOCUMENTS; CREATE INDEX |
| V136__cde_document_locking_and_approval.sql | cde document locking and approval — ALTER CDE_DOCUMENT_CONTAINERS; ALTER CDE_DOCUMENT_REVISIONS |
| V137__cde_archive_policies.sql | cde archive policies — ALTER CDE_DOCUMENT_CONTAINERS; CREATE CDE_ARCHIVE_POLICIES; CREATE INDEX |
| V138__as_built_tracker.sql | as built tracker — CREATE AS_BUILT_REQUIREMENTS; CREATE AS_BUILT_WBS_LINKS; CREATE INDEX |
| V139__warranty_obligations.sql | warranty obligations — CREATE INDEX; CREATE WARRANTY_OBLIGATIONS |
| V140__commissioning_enhancements.sql | commissioning enhancements — CREATE COMMISSIONING_CHECKLIST_TEMPLATES; CREATE COMMISSIONING_SIGN_OFFS; CREATE INDEX; CREATE ZOS_DOCUMENTS |
| V141__cash_flow_forecast.sql | cash flow forecast — CREATE CASH_FLOW_FORECAST_BUCKETS; CREATE CASH_FLOW_SCENARIOS; CREATE INDEX |
| V142__profitability_forecast.sql | profitability forecast — CREATE INDEX; CREATE PROFITABILITY_FORECASTS |
| V143__approval_instances.sql | approval instances — CREATE APPROVAL_DECISIONS; CREATE APPROVAL_INSTANCES; CREATE INDEX |
| V144__mchd_documents.sql | mchd documents — CREATE INDEX; CREATE MCHD_DOCUMENTS |
| V145__edo_tracking.sql | edo tracking — ALTER KS2_DOCUMENTS; ALTER KS3_DOCUMENTS; CREATE INDEX |
| V146__hidden_work_act_enhancements.sql | hidden work act enhancements — ALTER HIDDEN_WORK_ACTS; CREATE HIDDEN_WORK_ACT_ATTACHMENTS; CREATE INDEX |
| V147__portal_ks2_drafts_and_tasks.sql | portal ks2 drafts and tasks — CREATE INDEX; CREATE PORTAL_KS2_DRAFTS; CREATE PORTAL_TASKS |
| V149__multi_project_allocations.sql | multi project allocations — CREATE INDEX; CREATE MULTI_PROJECT_ALLOCATIONS |
| V200__seed_construction_test_data.sql | seed construction test data |
| V201__seed_biznes_center_gorizont.sql | seed biznes center gorizont — INSERT PROJECTS |
| V202__budget_items_estimate_price.sql | budget items estimate price — ALTER BUDGET_ITEMS |
| V203__change_management_organization_id.sql | change management organization id — ALTER CHANGE_EVENTS; ALTER CHANGE_ORDER_REQUESTS; CREATE INDEX |
| V204__ks2_pipeline_tracking.sql | ks2 pipeline tracking — ALTER KS2_DOCUMENTS |
| V205__report_builder.sql | report builder — ALTER REPORT_TEMPLATES; CREATE REPORT_TEMPLATES |
| V206__quality_gate_tables.sql | quality gate tables — CREATE INDEX; CREATE QUALITY_GATES |
| V207__safety_compliance_engine.sql | safety compliance engine — CREATE INDEX; CREATE SAFETY_ACCESS_BLOCKS; CREATE SAFETY_BRIEFING_RULES |
| V208__normative_cost_database.sql | normative cost database — CREATE INDEX; CREATE NORMATIVE_SECTIONS; CREATE PRICE_RATES; CREATE PRICING_DATABASES |
| V209__ocr_estimate_results.sql | ocr estimate results — ALTER OCR_TASK; CREATE INDEX; CREATE OCR_ESTIMATE_RESULTS |
| V210__safety_risk_scoring.sql | safety risk scoring — CREATE INDEX; CREATE SAFETY_RISK_FACTORS; CREATE SAFETY_RISK_REPORTS; CREATE SAFETY_RISK_SCORES |
| V211__stroynadzor_package.sql | stroynadzor package — CREATE INDEX; CREATE STROYNADZOR_PACKAGES; CREATE STROYNADZOR_PACKAGE_DOCUMENTS |
| V212__skills_matching.sql | skills matching — CREATE ALLOCATION_SCENARIOS; CREATE EMPLOYEE_SKILLS; CREATE INDEX; CREATE PROJECT_SKILL_REQUIREMENTS |
| V213__monte_carlo_eac_results.sql | monte carlo eac results — CREATE INDEX; CREATE MONTE_CARLO_EAC_RESULTS |
| V214__privacy_compliance.sql | privacy compliance — CREATE DATA_CONSENTS; CREATE DATA_SUBJECT_REQUESTS; CREATE INDEX |
| V215__api_marketplace.sql | api marketplace — CREATE API_RATE_LIMITS; CREATE API_USAGE_LOGS; CREATE INDEX; CREATE INTEGRATION_CONNECTORS |
| V216__esg_carbon_tracking.sql | esg carbon tracking — CREATE INDEX; CREATE MATERIAL_GWP_ENTRIES; CREATE PROJECT_CARBON_FOOTPRINTS |
| V217__client_claims.sql | client claims — CREATE CLIENT_CLAIMS; CREATE INDEX |
| V218__iot_equipment_dashboard.sql | iot equipment dashboard — CREATE INDEX; CREATE IOT_EQUIPMENT_DEVICES; CREATE IOT_TELEMETRY_POINTS |
| V219__gps_timesheets.sql | gps timesheets — CREATE GPS_CHECK_EVENTS; CREATE INDEX; CREATE SITE_GEOFENCES |
| V220__client_portal_enhancements.sql | client portal enhancements — CREATE CLIENT_DOCUMENT_SIGNATURES; CREATE CLIENT_PROGRESS_SNAPSHOTS; CREATE INDEX |
| V221__isup_vertical_integration.sql | isup vertical integration — CREATE INDEX; CREATE ISUP_CONFIGURATIONS; CREATE ISUP_PROJECT_MAPPINGS |
| V222__ai_assistant_enhancement.sql | ai assistant enhancement — CREATE AI_MODEL_CONFIGS; CREATE INDEX |
| V223__predictive_analytics.sql | predictive analytics — CREATE INDEX; CREATE PREDICTION_MODELS; CREATE PROJECT_RISK_PREDICTIONS |
| V224__ai_document_classification.sql | ai document classification — CREATE DOCUMENT_CLASSIFICATIONS; CREATE DOCUMENT_CROSS_CHECKS; CREATE INDEX |
| V225__bim_clash_detection.sql | bim clash detection — CREATE BIM_CLASH_RESULTS; CREATE BIM_CLASH_TESTS; CREATE INDEX |
| V226__defect_bim_linking.sql | defect bim linking — CREATE BIM_DEFECT_VIEWS; CREATE DEFECT_BIM_LINKS; CREATE INDEX |
| V227__project_sections.sql | project sections — CREATE INDEX; CREATE PROJECT_SECTIONS |
| V228__budget_item_customer_price.sql | budget item customer price — ALTER BUDGET_ITEMS |
| V229__contract_direction_budget_items.sql | contract direction budget items — ALTER CONTRACTS; CREATE CONTRACT_BUDGET_ITEMS; CREATE INDEX |
| V230__commercial_proposals.sql | commercial proposals — CREATE COMMERCIAL_PROPOSALS; CREATE COMMERCIAL_PROPOSAL_ITEMS; CREATE INDEX |
| V231__invoice_enhancements.sql | invoice enhancements — ALTER INVOICES; ALTER INVOICE_LINES; CREATE INDEX; CREATE INVOICE_LINES |
| V232__competitive_lists.sql | competitive lists — CREATE COMPETITIVE_LISTS; CREATE COMPETITIVE_LIST_ENTRIES; CREATE INDEX |
| V233__demo_project_seed.sql | demo project seed |
| V234__fix_demo_data.sql | fix demo data |
| V235__clean_and_reseed.sql | clean and reseed |
| V236__gov_registry_extended_types.sql | gov registry extended types — CREATE INDEX; CREATE REGISTRY_CHECK_RESULTS; CREATE REGISTRY_CONFIGS |
| V237__subscription_plans.sql | subscription plans — CREATE INDEX; CREATE SUBSCRIPTION_PLANS; CREATE TENANT_SUBSCRIPTIONS |
| V238__invoice_status_check_alignment.sql | invoice status check alignment — ADD CONSTRAINT; ALTER INVOICES |
| V239__billing_records.sql | billing records — CREATE BILLING_RECORDS; CREATE INDEX |
| V240__pricing_schema_reconcile.sql | pricing schema reconcile — ALTER PRICING_DATAB; ALTER PRICING_DATABASES |
| V241__project_add_construction_kind.sql | project add construction kind — ALTER PROJECTS |
| V1013__budget_items_customer_total.sql | budget items customer total — ALTER BUDGET_ITEMS |
| V1014__equipment_usage_logs_audit_columns.sql | equipment usage logs audit columns — ALTER EQUIPMENT_USAGE_LOGS |
| V1015__normalize_audit_actor_columns.sql | normalize audit actor columns |
| V1016__general_journal_entries_date_alignment.sql | general journal entries date alignment — ALTER PUBLIC; CREATE INDEX |
| V1017__align_date_columns_for_pto_and_safety.sql | align date columns for pto and safety — ALTER PUBLIC; CREATE INDEX |
| V1018__normalize_version_columns_to_bigint.sql | normalize version columns to bigint |
| V1019__immutable_records_record_version.sql | immutable records record version — ALTER IMMUTABLE_RECORDS |
| V1020__ensure_audit_actor_columns.sql | ensure audit actor columns |
| V1021__ensure_version_column.sql | ensure version column |
| V1022__invoice_lines_selected_for_cp_alias.sql | invoice lines selected for cp alias — ALTER INVOICE_LINES |
| V1023__fm_snapshots_and_margin.sql | fm snapshots and margin — ALTER BUDGET_ITEMS; CREATE BUDGET_SNAPSHOTS; CREATE INDEX |
| V1024__invoice_competitive_list_enhancements.sql | invoice competitive list enhancements — ALTER COMPETITIVE_LISTS; ALTER COMPETITIVE_LIST_ENTRIES; ALTER INVOICES |
| V1025__cp_competitive_list_link.sql | cp competitive list link — ALTER COMMERCIAL_PROPOSALS; ALTER COMMERCIAL_PROPOSAL_ITEMS |
| V1026__contract_structured_payments.sql | contract structured payments — ALTER CONTRACTS; ALTER CONTRACT_BUDGET_ITEMS; CREATE INDEX |
| V1027__estimate_normative_enhanced.sql | estimate normative enhanced — ALTER LOCAL_ESTIMATE_LINES; CREATE INDEX; CREATE MINSTROY_PRICE_INDICES |
| V1028__spec_supply_status.sql | spec supply status — ALTER SPEC_ITEMS; CREATE INDEX |
| V1029__fix_varchar_to_uuid_columns.sql | fix varchar to uuid columns — ALTER MULTI_PROJECT_ALLOCATIONS; ALTER PORTAL_KS2_DRAFTS; ALTER PORTAL_TASKS; CREATE INDEX |
| V1030__budget_snapshot_types.sql | budget snapshot types — ALTER BUDGET_SNAPSHOTS; CREATE INDEX |
| V1031__spec_items_brand_manufacturer_weight.sql | spec items brand manufacturer weight — ALTER SPEC_ITEMS |
| V1032__spec_items_position_section.sql | spec items position section — ALTER SPEC_ITEMS |
| V1033__specification_title_project_name.sql | specification title project name — ALTER SPECIFICATIONS |
| V1034__backfill_spec_project_names.sql | backfill spec project names |
| V1035__opportunity_go_no_go_checklist.sql | opportunity go no go checklist — ALTER OPPORTUNITIES |
| V1036__document_pd_section.sql | document pd section — ALTER DOCUMENTS; CREATE INDEX |
| V1037__commercial_proposal_versioning_company.sql | commercial proposal versioning company — ALTER COMMERCIAL_PROPOSALS |
| V1038__cp_item_bid_comparison_link.sql | cp item bid comparison link — ALTER COMMERCIAL_PROPOSAL_ITEMS |
| V1039__local_estimate_configurable_rates.sql | local estimate configurable rates — ALTER LOCAL_ESTIMATES |
| V1040__budget_own_cost_support.sql | budget own cost support — ALTER BUDGETS |
| V1041__timesheet_equipment_budget_links.sql | timesheet equipment budget links — ALTER EQUIPMENT_USAGE_LOGS; ALTER TIMESHEETS |
| V1042__evm_snapshot_wbs_link.sql | evm snapshot wbs link — ALTER EVM_SNAPSHOTS |
| V1043__procurement_schedule.sql | procurement schedule — CREATE INDEX; CREATE PROCUREMENT_SCHEDULES |
| V1044__mobilization_schedule.sql | mobilization schedule — CREATE INDEX; CREATE MOBILIZATION_LINES; CREATE MOBILIZATION_SCHEDULES |
| V1045__add_negotiation_status.sql | add negotiation status — ALTER CRM_LEADS |
| V1046__add_customer_name_to_projects.sql | add customer name to projects — ALTER PROJECTS |
| V1047__add_brand_fields_to_estimate_items.sql | add brand fields to estimate items — ALTER ESTIMATE_ITEMS |
| V1048__cleanup_duplicate_data.sql | cleanup duplicate data |
| V1049__budget_items_overhead_profit_contingency_rates.sql | budget items overhead profit contingency rates — ALTER BUDGET_ITEMS |
| V1050__crm_lead_go_nogo_scorecard.sql | crm lead go nogo scorecard — ALTER CRM_LEADS |
| V1051__estimate_class_field.sql | estimate class field — ALTER ESTIMATES |
| V1052__long_lead_items.sql | long lead items — ALTER BUDGET_ITEMS |
| V1053__budget_contract_type.sql | budget contract type — ALTER BUDGETS |
| V1054__submittal_workflow.sql | submittal workflow — ALTER SUBMITTALS |
| V1055__site_assessment_expansion.sql | site assessment expansion — ALTER SITE_ASSESSMENTS; CREATE SITE_ASSESSMENTS |
| V1056__project_milestones.sql | project milestones — CREATE INDEX; CREATE PROJECT_MILESTONES |
| V1057__file_attachments.sql | file attachments — CREATE FILE_ATTACHMENTS; CREATE INDEX |
| V1058__approval_chains.sql | approval chains — CREATE APPROVAL_CHAINS; CREATE APPROVAL_STEPS; CREATE INDEX |
| V1059__bid_management.sql | bid management — CREATE BID_EVALUATIONS; CREATE BID_INVITATIONS; CREATE BID_PACKAGES; CREATE INDEX |
| V1060__drawing_markups.sql | drawing markups — CREATE DRAWING_MARKUPS; CREATE INDEX |
| V1061__cost_codes.sql | cost codes — CREATE COST_CODES; CREATE INDEX |
| V1062__cost_code_budget_link.sql | cost code budget link — ALTER BUDGET_ITEMS |
| V1063__insurance_certificates.sql | insurance certificates — CREATE INDEX; CREATE INSURANCE_CERTIFICATES |
| V1064__constructability_reviews.sql | constructability reviews — CREATE CONSTRUCTABILITY_ITEMS; CREATE CONSTRUCTABILITY_REVIEWS; CREATE INDEX |
| V1065__email_messages.sql | email messages — CREATE EMAIL_ATTACHMENTS; CREATE EMAIL_MESSAGES; CREATE EMAIL_PROJECT_LINKS; CREATE INDEX |
| V1066__email_attachment_content_type_expand.sql | email attachment content type expand — ALTER EMAIL_ATTACHMENTS |
| V1067__lsr_hierarchy_fields.sql | lsr hierarchy fields — ADD CONSTRAINT; ALTER LOCAL_ESTIMATE_LINES; CREATE INDEX |
| V1068__local_estimate_summaries.sql | local estimate summaries — CREATE INDEX; CREATE LOCAL_ESTIMATE_SUMMARIES |
| V1069__competitive_list_works.sql | competitive list works — ALTER COMPETITIVE_LISTS; ALTER COMPETITIVE_LIST_ENTRIES; CREATE INDEX |
| V1070__prequalification_insurance_score.sql | prequalification insurance score — ALTER CONTRACTOR_PREQUALIFICATIONS |
| V1071__sro_verification_cache.sql | sro verification cache — CREATE INDEX; CREATE SRO_VERIFICATION_CACHE |
| V1072__expand_analog_requests_ve_proposals.sql | expand analog requests ve proposals — ALTER ANALOG_REQUESTS; ALTER MATERIAL_ANALOGS |
| V1073__analog_spec_item_link.sql | analog spec item link — ALTER ANALOG_REQUESTS; ALTER MATERIAL_ANALOGS; CREATE INDEX |
| V1074__task_enhancement_yougile.sql | task enhancement yougile — ALTER PROJECT_TASKS; CREATE INDEX; CREATE TASK_LABELS; CREATE TASK_LABEL_ASSIGNMENTS; CREATE TASK_TIME_ENTRIES |
| V1076__admin_system_settings.sql | admin system settings — CREATE INDEX; CREATE SYSTEM_SETTINGS; INSERT SYSTEM_SETTINGS |
| V1077__messaging_unread_tracking.sql | messaging unread tracking — ALTER CHANNEL_MEMBERS |
| V1078__support_ticket_templates.sql | support ticket templates — CREATE INDEX; CREATE TICKET_TEMPLATES; INSERT TICKET_TEMPLATES |
| V1079__task_stages_color_icon.sql | task stages color icon — ALTER PROJECT_TASKS; ALTER TASK_STAGES; CREATE INDEX |
| V1080__crm_lead_address_worktype.sql | crm lead address worktype — ALTER CRM_LEADS |
| V1081__counterparty_types.sql | counterparty types — ALTER COUNTERPARTIES |
| V1082__counterparty_contacts.sql | counterparty contacts — ALTER COUNTERPARTIES |
| V1083__admin_login_audit_and_2fa.sql | admin login audit and 2fa — ALTER USERS; CREATE INDEX; CREATE LOGIN_AUDIT_LOG; CREATE PASSWORD_HISTORY; CREATE USER_SESSIONS |
| V1084__org_structure_and_departments.sql | org structure and departments — ALTER DEPARTMENTS; CREATE INDEX; CREATE IP_WHITELIST; CREATE NOTIFICATION_PREFERENCES |
| V1085__task_cover_color_and_comment_reactions.sql | task cover color and comment reactions — ALTER PROJECT_TASKS; CREATE INDEX; CREATE TASK_COMMENT_REACTIONS |
| V1086__competitive_list_estimate_id.sql | competitive list estimate id — ALTER COMPETITIVE_LISTS; CREATE INDEX |
| V1087__invoice_budget_item_fk.sql | invoice budget item fk — ALTER INVOICES; CREATE INDEX |
| V1088__task_dependencies_lag_org_created.sql | task dependencies lag org created — ALTER TASK_DEPENDENCIES; CREATE INDEX |
| V1089__purchase_request_order_backref.sql | purchase request order backref — ALTER PURCHASE_REQUESTS; CREATE INDEX |
| V1090__budget_item_vendor_name.sql | budget item vendor name — ALTER BUDGET_ITEMS |
| V1091__ks2_daily_report_link.sql | ks2 daily report link — ALTER DAILY_REPORTS; ALTER KS2_DOCUMENTS; CREATE INDEX |
| V1092__password_reset_tokens.sql | password reset tokens — CREATE INDEX; CREATE PASSWORD_RESET_TOKENS |
| V1093__yookassa_payment_fields.sql | yookassa payment fields — ALTER BILLING_RECORDS; CREATE INDEX |
| V1094__notification_preferences.sql | notification preferences — CREATE INDEX; CREATE NOTIFICATION_PREFERENCES |
| V1095__feature_flags.sql | feature flags — CREATE FEATURE_FLAGS; CREATE INDEX; INSERT FEATURE_FLAGS |
| V1096__broadcast_notifications.sql | broadcast notifications — CREATE BROADCAST_NOTIFICATIONS; CREATE INDEX |
| V1097__user_feedback.sql | user feedback — CREATE INDEX; CREATE USER_FEEDBACK |
| V1098__refresh_token_rotation.sql | refresh token rotation — ALTER USER_SESSIONS; CREATE INDEX |
| V1099__field_reports.sql | field reports — CREATE FIELD_REPORTS; CREATE INDEX; CREATE SEQUENCE |
| V1100__two_factor_auth.sql | two factor auth — ALTER USERS |
| V1101__quality_checklists.sql | quality checklists — CREATE CHECKLIST_EXECUTION_ITEMS; CREATE INDEX; CREATE QUALITY_CHECKLISTS |
| V1102__incident_n1_form.sql | incident n1 form — ALTER SAFETY_INCIDENTS; CREATE INDEX |
| V1103__safety_briefings_and_cert_matrix.sql | safety briefings and cert matrix — CREATE BRIEFING_ATTENDEES; CREATE INDEX; CREATE SAFETY_BRIEFINGS |
| V1104__safety_ppe_sout_accident_training_records.sql | safety ppe sout accident training records — CREATE INDEX; CREATE SAFETY_PPE_ISSUES; CREATE SAFETY_PPE_ITEMS |
| V1105__task_delegation_fields.sql | task delegation fields — ALTER PROJECT_TASKS; CREATE INDEX |
| V1106__notification_events.sql | notification events — ALTER NOTIFICATIONS; CREATE INDEX; CREATE NOTIFICATION_EVENTS |
| V1107__email_log_table.sql | email log table — CREATE EMAIL_LOGS; CREATE INDEX |
| V1108__fix_audit_columns_uuid_to_varchar.sql | fix audit columns uuid to varchar — ALTER EQUIPMENT_USAGE_LOGS; ALTER FLEET_WAYBILLS; ALTER MAINTENANCE_SCHEDULE_RULES; ALTER WORK_VOLUME_ENTRIES |
| V1109__fix_legacy_not_null_columns.sql | fix legacy not null columns — ALTER SAFETY_INCIDENTS; ALTER SAFETY_TRAININGS |
| V1110__varchar_to_jsonb_implicit_cast.sql | varchar to jsonb implicit cast — CREATE FUNCTION |
| V1111__quality_material_inspections_checklist_templates_supervision.sql | quality material inspections checklist templates supervision — CREATE INDEX; CREATE MATERIAL_INSPECTIONS; CREATE SEQUENCE |
| V1112__task_participants_and_visibility.sql | task participants and visibility — ALTER PROJECT_TASKS; CREATE INDEX; CREATE TASK_PARTICIPANTS; INSERT TASK_PARTICIPANTS |
| V1113__users_last_login_at.sql | users last login at — ALTER USERS; CREATE INDEX |
| V1114__fix_pm_submittal_reviews_fk.sql | fix pm submittal reviews fk — ADD CONSTRAINT; ALTER PM_SUBMITTAL_REVIEWS; DROP CONSTRAINT |
| V1115__call_session_invite_token.sql | call session invite token — ALTER CALL_PARTICIPANTS; ALTER CALL_SESSIONS; CREATE INDEX |
| V1116__workflow_step_extra_columns.sql | workflow step extra columns — ALTER WORKFLOW_STEPS |
| V1117__expand_notification_type_check.sql | expand notification type check — ALTER NOTIFICATIONS; ALTER NOTIFICATION_BATCHES |
| V1118__counterparty_extended_fields.sql | counterparty extended fields — ALTER COUNTERPARTIES |
| V1119__bid_packages_nullable_project_id.sql | bid packages nullable project id — ALTER BID_PACKAGES |
| V1120__bid_packages_evaluation_score.sql | bid packages evaluation score — ALTER BID_PACKAGES; CREATE INDEX |
| V1121__bid_packages_add_missing_columns.sql | bid packages add missing columns — ALTER BID_PACKAGES |
| V1122__spec_items_expand_text_columns.sql | spec items expand text columns — ALTER SPEC_ITEMS |
| V1123__cp_item_customer_price.sql | cp item customer price — ALTER COMMERCIAL_PROPOSAL_ITEMS |
| V1124__hr_staffing_tables.sql | hr staffing tables — ADD CONSTRAINT; ALTER HR_STAFFING_VACANCIES; CREATE HR_STAFFING_POSITIONS; CREATE HR_STAFFING_VACANCIES; CREATE INDEX |
| V1125__crews_table.sql | crews table — ALTER CREWS; CREATE CREWS; CREATE INDEX |
| V1126__local_estimate_lines_hierarchy.sql | local estimate lines hierarchy — ALTER LOCAL_ESTIMATE_LINES; CREATE INDEX |
