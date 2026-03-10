-- V1109: Fix legacy NOT NULL columns that no longer match Java entity mappings.
-- These columns were created in early migrations but the Java entities now use different column names.

-- safety_trainings: Java entity uses 'training_type' (added V126) instead of 'type' (V65)
-- Make 'type' nullable since Hibernate writes to 'training_type' instead
ALTER TABLE safety_trainings ALTER COLUMN type DROP NOT NULL;
ALTER TABLE safety_trainings ALTER COLUMN type SET DEFAULT 'UNSCHEDULED';

-- safety_trainings: Java entity uses 'instructor_name' (added via ddl-auto) instead of 'instructor' (V65)
ALTER TABLE safety_trainings ALTER COLUMN instructor DROP NOT NULL;
ALTER TABLE safety_trainings ALTER COLUMN instructor SET DEFAULT '';

-- safety_trainings: 'participants' is JSONB NOT NULL but Java entity may not always set it
ALTER TABLE safety_trainings ALTER COLUMN participants DROP NOT NULL;

-- safety_trainings: drop old CHECK constraint that doesn't match current enum values
-- (V65 constraint only allows INTRODUCTORY/PRIMARY/REPEATED/UNSCHEDULED/TARGETED/FIRE_SAFETY
--  but Java enum uses INITIAL/PERIODIC/UNSCHEDULED/SPECIAL)
ALTER TABLE safety_trainings DROP CONSTRAINT IF EXISTS chk_training_type;

-- safety_incidents: 'reported_to_authorities' was added as NOT NULL without DEFAULT
ALTER TABLE safety_incidents ALTER COLUMN reported_to_authorities SET DEFAULT false;
