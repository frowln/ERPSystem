-- P4-09: Skills-Based Resource Matching + Certification Compliance

CREATE TABLE employee_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100),
    proficiency_level INTEGER NOT NULL DEFAULT 1,
    certified_until DATE,
    certification_number VARCHAR(100),
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_es_org ON employee_skills(organization_id);
CREATE INDEX idx_es_employee ON employee_skills(employee_id);
CREATE INDEX idx_es_skill ON employee_skills(skill_name);
CREATE INDEX idx_es_category ON employee_skills(skill_category);
CREATE INDEX idx_es_proficiency ON employee_skills(proficiency_level);
CREATE INDEX idx_es_certified ON employee_skills(certified_until);

-- Skill requirements per project
CREATE TABLE project_skill_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100),
    minimum_proficiency INTEGER NOT NULL DEFAULT 1,
    required_count INTEGER NOT NULL DEFAULT 1,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_psr_org ON project_skill_requirements(organization_id);
CREATE INDEX idx_psr_project ON project_skill_requirements(project_id);
CREATE INDEX idx_psr_skill ON project_skill_requirements(skill_name);

-- What-if scenario simulations
CREATE TABLE allocation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_data_json TEXT NOT NULL,
    result_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_as_org ON allocation_scenarios(organization_id);
