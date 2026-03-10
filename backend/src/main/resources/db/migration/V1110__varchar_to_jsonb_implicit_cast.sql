-- V1110: Allow implicit cast from VARCHAR to JSONB.
-- Hibernate 6 sends String parameters as VARCHAR even when columnDefinition="JSONB".
-- This cast enables PostgreSQL to accept VARCHAR values for JSONB columns without explicit ::jsonb.

CREATE OR REPLACE FUNCTION varchar_to_jsonb(text) RETURNS jsonb AS $$
  SELECT $1::jsonb;
$$ LANGUAGE SQL IMMUTABLE STRICT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_cast
    JOIN pg_type src ON src.oid = castsource
    JOIN pg_type tgt ON tgt.oid = casttarget
    WHERE src.typname = 'varchar' AND tgt.typname = 'jsonb'
  ) THEN
    CREATE CAST (varchar AS jsonb) WITH FUNCTION varchar_to_jsonb(text) AS IMPLICIT;
  END IF;
END $$;
