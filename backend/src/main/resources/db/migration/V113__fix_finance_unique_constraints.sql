-- Sprint 8: Fix invoice/payment number uniqueness scoped to organization
-- Previously these were globally unique; now unique per-organization (multi-tenant safe)

-- Drop global unique constraints
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_number_key;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_number_key;

-- Add organization-scoped uniqueness
ALTER TABLE payments ADD CONSTRAINT uq_payment_org_number UNIQUE (organization_id, number);
ALTER TABLE invoices ADD CONSTRAINT uq_invoice_org_number UNIQUE (organization_id, number);
