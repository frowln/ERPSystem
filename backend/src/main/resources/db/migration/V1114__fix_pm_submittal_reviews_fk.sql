-- Fix: pm_submittal_reviews.submittal_id FK should point to submittals (PTO) table,
-- because PmSubmittalService uses the shared Submittal entity mapped to 'submittals'.
-- The pm_submittals table is not used by any JPA entity.

ALTER TABLE pm_submittal_reviews
    DROP CONSTRAINT IF EXISTS pm_submittal_reviews_submittal_id_fkey;

ALTER TABLE pm_submittal_reviews
    ADD CONSTRAINT pm_submittal_reviews_submittal_id_fkey
    FOREIGN KEY (submittal_id) REFERENCES submittals(id) ON DELETE CASCADE;
