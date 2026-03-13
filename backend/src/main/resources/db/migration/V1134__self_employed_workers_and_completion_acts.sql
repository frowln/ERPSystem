-- =============================================================================
-- Self-Employed Workers (Самозанятые исполнители — расширенная модель)
-- =============================================================================

CREATE TABLE self_employed_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  inn VARCHAR(12) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  npd_status VARCHAR(20) DEFAULT 'UNKNOWN',
  npd_verified_at TIMESTAMP,
  contract_type VARCHAR(20) NOT NULL DEFAULT 'GPC',
  contract_number VARCHAR(100),
  contract_start_date DATE,
  contract_end_date DATE,
  specialization VARCHAR(255),
  hourly_rate NUMERIC(12,2),
  total_paid NUMERIC(14,2) DEFAULT 0,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_sew_organization ON self_employed_workers(organization_id);
CREATE INDEX idx_sew_inn ON self_employed_workers(inn);
CREATE INDEX idx_sew_npd_status ON self_employed_workers(npd_status);
CREATE INDEX idx_sew_not_deleted ON self_employed_workers(deleted) WHERE deleted = false;

-- =============================================================================
-- Self-Employed Project Links (Привязка исполнителей к проектам)
-- =============================================================================

CREATE TABLE self_employed_project_links (
  worker_id UUID REFERENCES self_employed_workers(id),
  project_id UUID NOT NULL,
  PRIMARY KEY (worker_id, project_id)
);

-- =============================================================================
-- Completion Acts (Акты выполненных работ)
-- =============================================================================

CREATE TABLE completion_acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  worker_id UUID REFERENCES self_employed_workers(id),
  project_id UUID,
  act_number VARCHAR(50) NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  period VARCHAR(7),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  signed_at TIMESTAMP,
  paid_at TIMESTAMP,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_ca_organization ON completion_acts(organization_id);
CREATE INDEX idx_ca_worker ON completion_acts(worker_id);
CREATE INDEX idx_ca_project ON completion_acts(project_id);
CREATE INDEX idx_ca_status ON completion_acts(status);
CREATE INDEX idx_ca_not_deleted ON completion_acts(deleted) WHERE deleted = false;
