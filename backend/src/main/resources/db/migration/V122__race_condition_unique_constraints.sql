-- =============================================================================
-- V122: Add unique constraints to prevent race-condition duplicate inserts
-- Safe variant: skips indexes for modules that are not installed in current schema.
-- =============================================================================

DO $$
BEGIN
    IF to_regclass('public.pricing_databases') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_db_name_org
                 ON pricing_databases (name, organization_id) WHERE deleted = false';
    END IF;

    IF to_regclass('public.contract_types') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_contract_type_code
                 ON contract_types (code) WHERE deleted = false';
    END IF;

    IF to_regclass('public.cost_codes') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_cost_code_project_code
                 ON cost_codes (project_id, code) WHERE deleted = false';
    END IF;

    IF to_regclass('public.payroll_templates') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_payroll_template_code
                 ON payroll_templates (code) WHERE deleted = false';
    END IF;

    IF to_regclass('public.revenue_recognition_periods') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_rev_period_contract_dates
                 ON revenue_recognition_periods (revenue_contract_id, period_start, period_end)
                 WHERE deleted = false';
    END IF;

    IF to_regclass('public.mobile_devices') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_mobile_device_token
                 ON mobile_devices (device_token) WHERE deleted = false';
    END IF;

    IF to_regclass('public.followers') IS NOT NULL THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_follower_entity_user
                 ON followers (entity_type, entity_id, user_id) WHERE deleted = false';
    END IF;
END $$;
