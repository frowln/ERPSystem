ALTER TABLE immutable_records
    ADD COLUMN IF NOT EXISTS record_version INTEGER;

UPDATE immutable_records
SET record_version = COALESCE(record_version, version::INTEGER)
WHERE record_version IS NULL
  AND version IS NOT NULL;
