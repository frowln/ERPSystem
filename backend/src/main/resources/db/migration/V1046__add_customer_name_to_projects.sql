-- Add customer_name field to projects table for lead conversion support
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_name VARCHAR(500);
