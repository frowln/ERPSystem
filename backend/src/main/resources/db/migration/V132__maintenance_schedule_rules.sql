-- P2-10: Preventive maintenance scheduling by hours/mileage
CREATE TABLE IF NOT EXISTS maintenance_schedule_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    maintenance_type VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    interval_hours NUMERIC(10,2),
    interval_mileage NUMERIC(12,2),
    interval_days INTEGER,
    lead_time_hours NUMERIC(10,2) DEFAULT 50,
    lead_time_mileage NUMERIC(12,2) DEFAULT 500,
    lead_time_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT TRUE,
    applies_to_all_vehicles BOOLEAN DEFAULT FALSE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sched_rule_org ON maintenance_schedule_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_sched_rule_vehicle ON maintenance_schedule_rules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sched_rule_active ON maintenance_schedule_rules(organization_id, is_active);

-- Add organization_id to maintenance_records for tenant isolation
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS organization_id UUID;
-- Backfill from vehicle
UPDATE maintenance_records mr SET organization_id = v.organization_id
FROM vehicles v WHERE mr.vehicle_id = v.id AND mr.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_org ON maintenance_records(organization_id);
