-- Backfill project_name for specifications created before denormalization was added.
-- Also updates any records where project_name is stale (not matching projects.name).
UPDATE specifications s
SET    project_name = (
           SELECT p.name
           FROM   projects p
           WHERE  p.id = s.project_id
       )
WHERE  s.project_name IS NULL
  AND  s.project_id   IS NOT NULL
  AND  s.deleted = false;
