-- P2-05: Certification matrix with expiry alerts
-- Enhance employee_certificates with org scoping, file storage, status tracking

-- 1. Add new columns
ALTER TABLE employee_certificates
    ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS file_url       VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS status         VARCHAR(20) DEFAULT 'VALID';

-- 2. Backfill organization_id from employees
UPDATE employee_certificates ec
SET organization_id = e.organization_id
FROM employees e
WHERE ec.employee_id = e.id
  AND ec.organization_id IS NULL;

-- 3. Set NOT NULL after backfill
ALTER TABLE employee_certificates
    ALTER COLUMN organization_id SET NOT NULL;

-- 4. Auto-compute status based on expiry_date
UPDATE employee_certificates
SET status = CASE
    WHEN expiry_date IS NULL THEN 'VALID'
    WHEN expiry_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING'
    ELSE 'VALID'
END
WHERE deleted = false;

-- 5. Indexes for certification dashboard queries
CREATE INDEX IF NOT EXISTS idx_cert_org ON employee_certificates(organization_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_cert_org_status ON employee_certificates(organization_id, status) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_cert_expiry ON employee_certificates(expiry_date) WHERE deleted = false AND expiry_date IS NOT NULL;
