-- V1138: Add organization_id column for multi-tenant isolation to critical modules.
-- Modules: hrRussian, closing, messaging, task, contractExt (60 entities).
-- Column is nullable to allow backfill from parent entities.

-- ═══════════════════════════════════════════════════════════════════
-- hrRussian module (16 tables)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE personal_cards ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE military_records ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE work_books ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE hr_crew_assignments ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE crew_time_reports ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE certificate_types ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE hr_employee_certificates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE hr_timesheet_entries ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE timesheet_periods ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE szv_td_reports ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE employment_orders ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE staffing_table ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ═══════════════════════════════════════════════════════════════════
-- closing module (4 tables)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks3_ks2_links ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ═══════════════════════════════════════════════════════════════════
-- messaging module (16 tables)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE channels ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE channel_members ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE message_reactions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE message_favorites ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE user_statuses ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE call_participants ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_followers ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_activities ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_activity_types ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_templates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_blacklist ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_tracking ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_notifications ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE mail_subtypes ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ═══════════════════════════════════════════════════════════════════
-- task module (15 tables — task_labels already has organization_id)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_stages ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_approvals ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_participants ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_dependencies ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_time_entries ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_checklists ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_recurrences ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_tags ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_activities ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_comment_reactions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE task_label_assignments ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ═══════════════════════════════════════════════════════════════════
-- contractExt module (9 tables)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE contract_supplements ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE contract_claims ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE contract_slas ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE sla_violations ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE contract_guarantees ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE tolerances ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE contract_insurances ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ═══════════════════════════════════════════════════════════════════
-- Indexes for performance (organization_id is used in tenant filtering)
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_business_trips_org ON business_trips(organization_id);
CREATE INDEX IF NOT EXISTS idx_personal_cards_org ON personal_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_employment_contracts_org ON employment_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_timesheet_entries_org ON hr_timesheet_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_periods_org ON timesheet_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacations_org ON vacations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sick_leaves_org ON sick_leaves(organization_id);
CREATE INDEX IF NOT EXISTS idx_ks2_documents_org ON ks2_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ks3_documents_org ON ks3_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_channels_org ON channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_org ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_org ON project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_milestones_org ON milestones(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_supplements_org ON contract_supplements(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_claims_org ON contract_claims(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_guarantees_org ON contract_guarantees(organization_id);
