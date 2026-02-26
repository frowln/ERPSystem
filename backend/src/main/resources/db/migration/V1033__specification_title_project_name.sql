-- Add user-facing title and denormalized project_name to specifications
ALTER TABLE specifications
    ADD COLUMN IF NOT EXISTS title        VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS project_name VARCHAR(300) NULL;

-- Migrate: seed title from existing auto-generated name
UPDATE specifications SET title = name WHERE title IS NULL;
