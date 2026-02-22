-- P2-09: Equipment usage logs for engine hours tracking & machine-hour cost calculation
CREATE TABLE IF NOT EXISTS equipment_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    project_id UUID,
    operator_id UUID,
    operator_name VARCHAR(255),
    usage_date DATE NOT NULL,
    hours_worked NUMERIC(10,2) NOT NULL DEFAULT 0,
    hours_start NUMERIC(12,2),
    hours_end NUMERIC(12,2),
    fuel_consumed NUMERIC(10,2),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_usage_log_org ON equipment_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_vehicle ON equipment_usage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_project ON equipment_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_date ON equipment_usage_logs(usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_log_org_vehicle_date ON equipment_usage_logs(organization_id, vehicle_id, usage_date);

-- Add cost-related columns to vehicles for machine-hour calculation
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS monthly_insurance_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS monthly_operator_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS avg_monthly_maintenance_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS useful_life_years NUMERIC(5,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS annual_working_hours NUMERIC(8,2) DEFAULT 1800;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS market_rental_rate_per_hour NUMERIC(10,2);
