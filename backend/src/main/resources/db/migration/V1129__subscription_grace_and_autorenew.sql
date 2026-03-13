-- Grace period + auto-renew for subscriptions
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS grace_end_date TIMESTAMPTZ;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false;
