-- =============================================================================
-- V117: Add organization_id to critical entities for multi-tenant isolation
-- Backfills from related parent entities (projects, employees, contracts, users)
-- =============================================================================

-- Default organization for backfill fallback
DO $$ DECLARE default_org UUID;
BEGIN
    SELECT id INTO default_org FROM organizations WHERE deleted = false ORDER BY created_at LIMIT 1;
    IF default_org IS NULL THEN
        RAISE NOTICE 'No default organization found — skipping backfill';
        RETURN;
    END IF;

    -- =========================================================================
    -- FINANCE MODULE
    -- =========================================================================

    -- budgets (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='organization_id') THEN
        ALTER TABLE budgets ADD COLUMN organization_id UUID;
        UPDATE budgets b SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = b.project_id) WHERE b.organization_id IS NULL AND b.project_id IS NOT NULL;
        UPDATE budgets SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE budgets ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_budget_org ON budgets(organization_id);
    END IF;

    -- invoices (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='organization_id') THEN
        ALTER TABLE invoices ADD COLUMN organization_id UUID;
        UPDATE invoices i SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = i.project_id) WHERE i.organization_id IS NULL AND i.project_id IS NOT NULL;
        UPDATE invoices SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_invoice_org_v2 ON invoices(organization_id);
    END IF;

    -- payments (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='organization_id') THEN
        ALTER TABLE payments ADD COLUMN organization_id UUID;
        UPDATE payments p SET organization_id = (SELECT pr.organization_id FROM projects pr WHERE pr.id = p.project_id) WHERE p.organization_id IS NULL AND p.project_id IS NOT NULL;
        UPDATE payments SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE payments ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_payment_org_v2 ON payments(organization_id);
    END IF;

    -- general_journals (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='general_journals' AND column_name='organization_id') THEN
        ALTER TABLE general_journals ADD COLUMN organization_id UUID;
        UPDATE general_journals gj SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = gj.project_id) WHERE gj.organization_id IS NULL AND gj.project_id IS NOT NULL;
        UPDATE general_journals SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE general_journals ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_general_journal_org ON general_journals(organization_id);
    END IF;

    -- =========================================================================
    -- QUALITY MODULE
    -- =========================================================================

    -- quality_checks (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quality_checks' AND column_name='organization_id') THEN
        ALTER TABLE quality_checks ADD COLUMN organization_id UUID;
        UPDATE quality_checks qc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = qc.project_id) WHERE qc.organization_id IS NULL AND qc.project_id IS NOT NULL;
        UPDATE quality_checks SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE quality_checks ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_quality_check_org ON quality_checks(organization_id);
    END IF;

    -- non_conformances (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='non_conformances' AND column_name='organization_id') THEN
        ALTER TABLE non_conformances ADD COLUMN organization_id UUID;
        UPDATE non_conformances nc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = nc.project_id) WHERE nc.organization_id IS NULL AND nc.project_id IS NOT NULL;
        UPDATE non_conformances SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE non_conformances ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_non_conformance_org ON non_conformances(organization_id);
    END IF;

    -- quality_certificates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quality_certificates' AND column_name='organization_id') THEN
        ALTER TABLE quality_certificates ADD COLUMN organization_id UUID;
        UPDATE quality_certificates SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE quality_certificates ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_quality_cert_org ON quality_certificates(organization_id);
    END IF;

    -- =========================================================================
    -- PTO MODULE
    -- =========================================================================

    -- pto_documents (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pto_documents' AND column_name='organization_id') THEN
        ALTER TABLE pto_documents ADD COLUMN organization_id UUID;
        UPDATE pto_documents pd SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = pd.project_id) WHERE pd.organization_id IS NULL AND pd.project_id IS NOT NULL;
        UPDATE pto_documents SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE pto_documents ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_pto_doc_org ON pto_documents(organization_id);
    END IF;

    -- submittals (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submittals' AND column_name='organization_id') THEN
        ALTER TABLE submittals ADD COLUMN organization_id UUID;
        UPDATE submittals s SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = s.project_id) WHERE s.organization_id IS NULL AND s.project_id IS NOT NULL;
        UPDATE submittals SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE submittals ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_submittal_org ON submittals(organization_id);
    END IF;

    -- work_permits (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_permits' AND column_name='organization_id') THEN
        ALTER TABLE work_permits ADD COLUMN organization_id UUID;
        UPDATE work_permits wp SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = wp.project_id) WHERE wp.organization_id IS NULL AND wp.project_id IS NOT NULL;
        UPDATE work_permits SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE work_permits ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_work_permit_org ON work_permits(organization_id);
    END IF;

    -- hidden_work_acts (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hidden_work_acts' AND column_name='organization_id') THEN
        ALTER TABLE hidden_work_acts ADD COLUMN organization_id UUID;
        UPDATE hidden_work_acts h SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = h.project_id) WHERE h.organization_id IS NULL AND h.project_id IS NOT NULL;
        UPDATE hidden_work_acts SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE hidden_work_acts ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_hidden_work_act_org ON hidden_work_acts(organization_id);
    END IF;

    -- ks11_acceptance_acts (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ks11_acceptance_acts' AND column_name='organization_id') THEN
        ALTER TABLE ks11_acceptance_acts ADD COLUMN organization_id UUID;
        UPDATE ks11_acceptance_acts k SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = k.project_id) WHERE k.organization_id IS NULL AND k.project_id IS NOT NULL;
        UPDATE ks11_acceptance_acts SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE ks11_acceptance_acts ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_ks11_org ON ks11_acceptance_acts(organization_id);
    END IF;

    -- ks6_journals (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ks6_journals' AND column_name='organization_id') THEN
        ALTER TABLE ks6_journals ADD COLUMN organization_id UUID;
        UPDATE ks6_journals k SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = k.project_id) WHERE k.organization_id IS NULL AND k.project_id IS NOT NULL;
        UPDATE ks6_journals SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE ks6_journals ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_ks6_journal_org ON ks6_journals(organization_id);
    END IF;

    -- =========================================================================
    -- OPERATIONS MODULE
    -- =========================================================================

    -- work_orders (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_orders' AND column_name='organization_id') THEN
        ALTER TABLE work_orders ADD COLUMN organization_id UUID;
        UPDATE work_orders wo SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = wo.project_id) WHERE wo.organization_id IS NULL AND wo.project_id IS NOT NULL;
        UPDATE work_orders SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE work_orders ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_work_order_org ON work_orders(organization_id);
    END IF;

    -- daily_logs (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_logs' AND column_name='organization_id') THEN
        ALTER TABLE daily_logs ADD COLUMN organization_id UUID;
        UPDATE daily_logs dl SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = dl.project_id) WHERE dl.organization_id IS NULL AND dl.project_id IS NOT NULL;
        UPDATE daily_logs SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE daily_logs ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_daily_log_org ON daily_logs(organization_id);
    END IF;

    -- =========================================================================
    -- CHANGE MANAGEMENT MODULE
    -- =========================================================================

    -- change_orders (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='change_orders' AND column_name='organization_id') THEN
        ALTER TABLE change_orders ADD COLUMN organization_id UUID;
        UPDATE change_orders co SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = co.project_id) WHERE co.organization_id IS NULL AND co.project_id IS NOT NULL;
        UPDATE change_orders SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE change_orders ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_change_order_org ON change_orders(organization_id);
    END IF;

    -- change_events (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='change_events' AND column_name='organization_id') THEN
        ALTER TABLE change_events ADD COLUMN organization_id UUID;
        UPDATE change_events ce SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = ce.project_id) WHERE ce.organization_id IS NULL AND ce.project_id IS NOT NULL;
        UPDATE change_events SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE change_events ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_change_event_org ON change_events(organization_id);
    END IF;

    -- change_order_requests (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='change_order_requests' AND column_name='organization_id') THEN
        ALTER TABLE change_order_requests ADD COLUMN organization_id UUID;
        UPDATE change_order_requests cor SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = cor.project_id) WHERE cor.organization_id IS NULL AND cor.project_id IS NOT NULL;
        UPDATE change_order_requests SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE change_order_requests ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_change_order_req_org ON change_order_requests(organization_id);
    END IF;

    -- =========================================================================
    -- PM WORKFLOW MODULE
    -- =========================================================================

    -- pm_issues (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pm_issues' AND column_name='organization_id') THEN
        ALTER TABLE pm_issues ADD COLUMN organization_id UUID;
        UPDATE pm_issues i SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = i.project_id) WHERE i.organization_id IS NULL AND i.project_id IS NOT NULL;
        UPDATE pm_issues SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE pm_issues ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_issue_org ON pm_issues(organization_id);
    END IF;

    -- rfis (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rfis' AND column_name='organization_id') THEN
        ALTER TABLE rfis ADD COLUMN organization_id UUID;
        UPDATE rfis r SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = r.project_id) WHERE r.organization_id IS NULL AND r.project_id IS NOT NULL;
        UPDATE rfis SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE rfis ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_rfi_org ON rfis(organization_id);
    END IF;

    -- =========================================================================
    -- PLANNING MODULE
    -- =========================================================================

    -- wbs_nodes (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wbs_nodes' AND column_name='organization_id') THEN
        ALTER TABLE wbs_nodes ADD COLUMN organization_id UUID;
        UPDATE wbs_nodes w SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = w.project_id) WHERE w.organization_id IS NULL AND w.project_id IS NOT NULL;
        UPDATE wbs_nodes SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE wbs_nodes ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_wbs_node_org ON wbs_nodes(organization_id);
    END IF;

    -- schedule_baselines (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedule_baselines' AND column_name='organization_id') THEN
        ALTER TABLE schedule_baselines ADD COLUMN organization_id UUID;
        UPDATE schedule_baselines sb SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = sb.project_id) WHERE sb.organization_id IS NULL AND sb.project_id IS NOT NULL;
        UPDATE schedule_baselines SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE schedule_baselines ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_schedule_baseline_org ON schedule_baselines(organization_id);
    END IF;

    -- =========================================================================
    -- COST MANAGEMENT MODULE
    -- =========================================================================

    -- cost_codes (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cost_codes' AND column_name='organization_id') THEN
        ALTER TABLE cost_codes ADD COLUMN organization_id UUID;
        UPDATE cost_codes cc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = cc.project_id) WHERE cc.organization_id IS NULL AND cc.project_id IS NOT NULL;
        UPDATE cost_codes SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE cost_codes ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_cost_code_org ON cost_codes(organization_id);
    END IF;

    -- commitments (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commitments' AND column_name='organization_id') THEN
        ALTER TABLE commitments ADD COLUMN organization_id UUID;
        UPDATE commitments c SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = c.project_id) WHERE c.organization_id IS NULL AND c.project_id IS NOT NULL;
        UPDATE commitments SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE commitments ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_commitment_org ON commitments(organization_id);
    END IF;

    -- =========================================================================
    -- CDE MODULE
    -- =========================================================================

    -- cde_document_containers (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cde_document_containers' AND column_name='organization_id') THEN
        ALTER TABLE cde_document_containers ADD COLUMN organization_id UUID;
        UPDATE cde_document_containers dc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = dc.project_id) WHERE dc.organization_id IS NULL AND dc.project_id IS NOT NULL;
        UPDATE cde_document_containers SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE cde_document_containers ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_doc_container_org ON cde_document_containers(organization_id);
    END IF;

    -- cde_transmittals (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cde_transmittals' AND column_name='organization_id') THEN
        ALTER TABLE cde_transmittals ADD COLUMN organization_id UUID;
        UPDATE cde_transmittals t SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = t.project_id) WHERE t.organization_id IS NULL AND t.project_id IS NOT NULL;
        UPDATE cde_transmittals SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE cde_transmittals ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_transmittal_org ON cde_transmittals(organization_id);
    END IF;

    -- cde_revision_sets (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cde_revision_sets' AND column_name='organization_id') THEN
        ALTER TABLE cde_revision_sets ADD COLUMN organization_id UUID;
        UPDATE cde_revision_sets rs SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = rs.project_id) WHERE rs.organization_id IS NULL AND rs.project_id IS NOT NULL;
        UPDATE cde_revision_sets SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE cde_revision_sets ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_revision_set_org ON cde_revision_sets(organization_id);
    END IF;

    -- =========================================================================
    -- BIM MODULE
    -- =========================================================================

    -- bim_models (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bim_models' AND column_name='organization_id') THEN
        ALTER TABLE bim_models ADD COLUMN organization_id UUID;
        UPDATE bim_models bm SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = bm.project_id) WHERE bm.organization_id IS NULL AND bm.project_id IS NOT NULL;
        UPDATE bim_models SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE bim_models ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_bim_model_org ON bim_models(organization_id);
    END IF;

    -- photo_albums (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='photo_albums' AND column_name='organization_id') THEN
        ALTER TABLE photo_albums ADD COLUMN organization_id UUID;
        UPDATE photo_albums pa SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = pa.project_id) WHERE pa.organization_id IS NULL AND pa.project_id IS NOT NULL;
        UPDATE photo_albums SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE photo_albums ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_photo_album_org ON photo_albums(organization_id);
    END IF;

    -- =========================================================================
    -- CALENDAR MODULE
    -- =========================================================================

    -- calendar_events (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='organization_id') THEN
        ALTER TABLE calendar_events ADD COLUMN organization_id UUID;
        UPDATE calendar_events ce SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = ce.project_id) WHERE ce.organization_id IS NULL AND ce.project_id IS NOT NULL;
        UPDATE calendar_events SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE calendar_events ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_calendar_event_org ON calendar_events(organization_id);
    END IF;

    -- construction_schedules (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='construction_schedules' AND column_name='organization_id') THEN
        ALTER TABLE construction_schedules ADD COLUMN organization_id UUID;
        UPDATE construction_schedules cs SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = cs.project_id) WHERE cs.organization_id IS NULL AND cs.project_id IS NOT NULL;
        UPDATE construction_schedules SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE construction_schedules ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_construction_schedule_org ON construction_schedules(organization_id);
    END IF;

    -- work_calendars (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_calendars' AND column_name='organization_id') THEN
        ALTER TABLE work_calendars ADD COLUMN organization_id UUID;
        UPDATE work_calendars wc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = wc.project_id) WHERE wc.organization_id IS NULL AND wc.project_id IS NOT NULL;
        UPDATE work_calendars SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE work_calendars ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_work_calendar_org ON work_calendars(organization_id);
    END IF;

    -- =========================================================================
    -- SPECIFICATION & ESTIMATE MODULES
    -- =========================================================================

    -- specifications (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='specifications' AND column_name='organization_id') THEN
        ALTER TABLE specifications ADD COLUMN organization_id UUID;
        UPDATE specifications s SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = s.project_id) WHERE s.organization_id IS NULL AND s.project_id IS NOT NULL;
        UPDATE specifications SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE specifications ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_specification_org ON specifications(organization_id);
    END IF;

    -- estimates (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estimates' AND column_name='organization_id') THEN
        ALTER TABLE estimates ADD COLUMN organization_id UUID;
        UPDATE estimates e SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = e.project_id) WHERE e.organization_id IS NULL AND e.project_id IS NOT NULL;
        UPDATE estimates SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE estimates ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_estimate_org ON estimates(organization_id);
    END IF;

    -- =========================================================================
    -- CLOSEOUT MODULE
    -- =========================================================================

    -- commissioning_checklists (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissioning_checklists' AND column_name='organization_id') THEN
        ALTER TABLE commissioning_checklists ADD COLUMN organization_id UUID;
        UPDATE commissioning_checklists cc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = cc.project_id) WHERE cc.organization_id IS NULL AND cc.project_id IS NOT NULL;
        UPDATE commissioning_checklists SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE commissioning_checklists ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_commissioning_org ON commissioning_checklists(organization_id);
    END IF;

    -- handover_packages (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='handover_packages' AND column_name='organization_id') THEN
        ALTER TABLE handover_packages ADD COLUMN organization_id UUID;
        UPDATE handover_packages hp SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = hp.project_id) WHERE hp.organization_id IS NULL AND hp.project_id IS NOT NULL;
        UPDATE handover_packages SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE handover_packages ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_handover_package_org ON handover_packages(organization_id);
    END IF;

    -- warranty_claims (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warranty_claims' AND column_name='organization_id') THEN
        ALTER TABLE warranty_claims ADD COLUMN organization_id UUID;
        UPDATE warranty_claims wc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = wc.project_id) WHERE wc.organization_id IS NULL AND wc.project_id IS NOT NULL;
        UPDATE warranty_claims SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE warranty_claims ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_warranty_claim_org ON warranty_claims(organization_id);
    END IF;

    -- =========================================================================
    -- REGULATORY MODULE
    -- =========================================================================

    -- construction_permits (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='construction_permits' AND column_name='organization_id') THEN
        ALTER TABLE construction_permits ADD COLUMN organization_id UUID;
        UPDATE construction_permits cp SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = cp.project_id) WHERE cp.organization_id IS NULL AND cp.project_id IS NOT NULL;
        UPDATE construction_permits SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE construction_permits ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_construction_permit_org ON construction_permits(organization_id);
    END IF;

    -- regulatory_inspections (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='regulatory_inspections' AND column_name='organization_id') THEN
        ALTER TABLE regulatory_inspections ADD COLUMN organization_id UUID;
        UPDATE regulatory_inspections ri SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = ri.project_id) WHERE ri.organization_id IS NULL AND ri.project_id IS NOT NULL;
        UPDATE regulatory_inspections SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE regulatory_inspections ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_reg_inspection_org ON regulatory_inspections(organization_id);
    END IF;

    -- regulatory_reports (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='regulatory_reports' AND column_name='organization_id') THEN
        ALTER TABLE regulatory_reports ADD COLUMN organization_id UUID;
        UPDATE regulatory_reports rr SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = rr.project_id) WHERE rr.organization_id IS NULL AND rr.project_id IS NOT NULL;
        UPDATE regulatory_reports SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE regulatory_reports ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_reg_report_org ON regulatory_reports(organization_id);
    END IF;

    -- =========================================================================
    -- HR MODULES
    -- =========================================================================

    -- timesheets (has employeeId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='timesheets' AND column_name='organization_id') THEN
        ALTER TABLE timesheets ADD COLUMN organization_id UUID;
        UPDATE timesheets t SET organization_id = (SELECT e.organization_id FROM employees e WHERE e.id = t.employee_id) WHERE t.organization_id IS NULL AND t.employee_id IS NOT NULL;
        UPDATE timesheets SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE timesheets ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_timesheet_org ON timesheets(organization_id);
    END IF;

    -- employment_contracts (has employeeId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_contracts' AND column_name='organization_id') THEN
        ALTER TABLE employment_contracts ADD COLUMN organization_id UUID;
        UPDATE employment_contracts ec SET organization_id = (SELECT e.organization_id FROM employees e WHERE e.id = ec.employee_id) WHERE ec.organization_id IS NULL AND ec.employee_id IS NOT NULL;
        UPDATE employment_contracts SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE employment_contracts ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_employment_contract_org ON employment_contracts(organization_id);
    END IF;

    -- employment_orders (has employeeId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employment_orders' AND column_name='organization_id') THEN
        ALTER TABLE employment_orders ADD COLUMN organization_id UUID;
        UPDATE employment_orders eo SET organization_id = (SELECT e.organization_id FROM employees e WHERE e.id = eo.employee_id) WHERE eo.organization_id IS NULL AND eo.employee_id IS NOT NULL;
        UPDATE employment_orders SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE employment_orders ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_employment_order_org ON employment_orders(organization_id);
    END IF;

    -- vacations (has employeeId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacations' AND column_name='organization_id') THEN
        ALTER TABLE vacations ADD COLUMN organization_id UUID;
        UPDATE vacations v SET organization_id = (SELECT e.organization_id FROM employees e WHERE e.id = v.employee_id) WHERE v.organization_id IS NULL AND v.employee_id IS NOT NULL;
        UPDATE vacations SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE vacations ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_vacation_org ON vacations(organization_id);
    END IF;

    -- staffing_table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staffing_table' AND column_name='organization_id') THEN
        ALTER TABLE staffing_table ADD COLUMN organization_id UUID;
        UPDATE staffing_table SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE staffing_table ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_staffing_table_org ON staffing_table(organization_id);
    END IF;

    -- =========================================================================
    -- TASK MODULE
    -- =========================================================================

    -- milestones (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='milestones' AND column_name='organization_id') THEN
        ALTER TABLE milestones ADD COLUMN organization_id UUID;
        UPDATE milestones m SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = m.project_id) WHERE m.organization_id IS NULL AND m.project_id IS NOT NULL;
        UPDATE milestones SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE milestones ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_milestone_org ON milestones(organization_id);
    END IF;

    -- =========================================================================
    -- REVENUE RECOGNITION MODULE
    -- =========================================================================

    -- revenue_recognition_periods (has contractId → contract.organizationId)
    IF to_regclass('public.revenue_recognition_periods') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='revenue_recognition_periods' AND column_name='organization_id') THEN
        ALTER TABLE revenue_recognition_periods ADD COLUMN organization_id UUID;
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'revenue_recognition_periods'
              AND column_name = 'contract_id'
        ) THEN
            UPDATE revenue_recognition_periods rrp
            SET organization_id = (
                SELECT c.organization_id
                FROM contracts c
                WHERE c.id = rrp.contract_id
            )
            WHERE rrp.organization_id IS NULL
              AND rrp.contract_id IS NOT NULL;
        END IF;
        UPDATE revenue_recognition_periods SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE revenue_recognition_periods ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_rev_period_org ON revenue_recognition_periods(organization_id);
    END IF;

    -- revenue_adjustments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='revenue_adjustments' AND column_name='organization_id') THEN
        ALTER TABLE revenue_adjustments ADD COLUMN organization_id UUID;
        UPDATE revenue_adjustments SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE revenue_adjustments ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_rev_adjustment_org ON revenue_adjustments(organization_id);
    END IF;

    -- =========================================================================
    -- MONTHLY SCHEDULE MODULE
    -- =========================================================================

    -- monthly_schedules (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_schedules' AND column_name='organization_id') THEN
        ALTER TABLE monthly_schedules ADD COLUMN organization_id UUID;
        UPDATE monthly_schedules ms SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = ms.project_id) WHERE ms.organization_id IS NULL AND ms.project_id IS NOT NULL;
        UPDATE monthly_schedules SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE monthly_schedules ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_monthly_schedule_org ON monthly_schedules(organization_id);
    END IF;

    -- =========================================================================
    -- PRICE COEFFICIENT MODULE
    -- =========================================================================

    -- price_coefficients (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='price_coefficients' AND column_name='organization_id') THEN
        ALTER TABLE price_coefficients ADD COLUMN organization_id UUID;
        UPDATE price_coefficients pc SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = pc.project_id) WHERE pc.organization_id IS NULL AND pc.project_id IS NOT NULL;
        UPDATE price_coefficients SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE price_coefficients ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_price_coeff_org ON price_coefficients(organization_id);
    END IF;

    -- =========================================================================
    -- ANALYTICS MODULE
    -- =========================================================================

    -- dashboards
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboards' AND column_name='organization_id') THEN
        ALTER TABLE dashboards ADD COLUMN organization_id UUID;
        UPDATE dashboards SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE dashboards ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_dashboard_org ON dashboards(organization_id);
    END IF;

    -- analytics_reports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_reports' AND column_name='organization_id') THEN
        ALTER TABLE analytics_reports ADD COLUMN organization_id UUID;
        UPDATE analytics_reports SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE analytics_reports ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_analytics_report_org ON analytics_reports(organization_id);
    END IF;

    -- =========================================================================
    -- PORTAL MODULE (has projectId/userId)
    -- =========================================================================

    -- portal_projects (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portal_projects' AND column_name='organization_id') THEN
        ALTER TABLE portal_projects ADD COLUMN organization_id UUID;
        UPDATE portal_projects pp SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = pp.project_id) WHERE pp.organization_id IS NULL AND pp.project_id IS NOT NULL;
        UPDATE portal_projects SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE portal_projects ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_portal_project_org ON portal_projects(organization_id);
    END IF;

    -- portal_messages (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portal_messages' AND column_name='organization_id') THEN
        ALTER TABLE portal_messages ADD COLUMN organization_id UUID;
        UPDATE portal_messages pm SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = pm.project_id) WHERE pm.organization_id IS NULL AND pm.project_id IS NOT NULL;
        UPDATE portal_messages SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE portal_messages ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_portal_message_org ON portal_messages(organization_id);
    END IF;

    -- portal_documents (has projectId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portal_documents' AND column_name='organization_id') THEN
        ALTER TABLE portal_documents ADD COLUMN organization_id UUID;
        UPDATE portal_documents pd SET organization_id = (SELECT p.organization_id FROM projects p WHERE p.id = pd.project_id) WHERE pd.organization_id IS NULL AND pd.project_id IS NOT NULL;
        UPDATE portal_documents SET organization_id = default_org WHERE organization_id IS NULL;
        ALTER TABLE portal_documents ALTER COLUMN organization_id SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_portal_doc_org ON portal_documents(organization_id);
    END IF;

END $$;
