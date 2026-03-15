-- Building sections (корпуса)
CREATE TABLE building_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    section_order INTEGER DEFAULT 0,
    floor_count INTEGER,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);

-- Floors (этажи)
CREATE TABLE building_floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES building_sections(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(100) NOT NULL,
    floor_number INTEGER,
    elevation NUMERIC(10,3),
    area NUMERIC(12,2),
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);

-- Rooms/Spaces (помещения)
CREATE TABLE building_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES building_floors(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    room_type VARCHAR(50),
    area NUMERIC(10,2),
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);

-- Construction axes (оси)
CREATE TABLE building_axes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES building_sections(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    axis_type VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    position NUMERIC(10,3),
    organization_id UUID REFERENCES organizations(id),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_building_sections_project ON building_sections(project_id);
CREATE INDEX idx_building_floors_section ON building_floors(section_id);
CREATE INDEX idx_building_rooms_floor ON building_rooms(floor_id);
CREATE INDEX idx_building_axes_section ON building_axes(section_id);
