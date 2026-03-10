CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  organization_id UUID NOT NULL,
  name VARCHAR(300) NOT NULL,
  planned_date DATE,
  actual_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  sequence INTEGER DEFAULT 0,
  is_key_milestone BOOLEAN DEFAULT FALSE,
  notes TEXT,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  version BIGINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_milestone_project ON project_milestones(project_id);
