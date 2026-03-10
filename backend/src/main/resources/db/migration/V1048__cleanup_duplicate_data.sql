-- Cleanup duplicate projects created by failed lead conversion (bug #6)
-- Duplicate projects have codes PRJ-00078 through PRJ-00082 with identical names
-- Strategy: soft-delete duplicates, keep the first one (PRJ-00078)

-- Step 1: Find and soft-delete duplicate projects (keep the earliest created)
-- Identify duplicate groups: same name + same organization_id, more than 1 project
WITH duplicates AS (
    SELECT id, name, code, organization_id, created_at,
           ROW_NUMBER() OVER (PARTITION BY name, organization_id ORDER BY created_at ASC) as rn
    FROM projects
    WHERE deleted = false
      AND name LIKE '%Домодедово%Складской%'
)
UPDATE projects SET deleted = true, updated_at = NOW()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Step 2: Soft-delete budgets (financial models) that belong to soft-deleted projects
UPDATE budgets SET deleted = true, updated_at = NOW()
WHERE project_id IN (SELECT id FROM projects WHERE deleted = true)
  AND deleted = false
  AND (planned_revenue = 0 OR planned_revenue IS NULL)
  AND (planned_cost = 0 OR planned_cost IS NULL);

-- Step 3: Soft-delete commercial proposals that belong to soft-deleted projects
UPDATE commercial_proposals SET deleted = true, updated_at = NOW()
WHERE project_id IN (SELECT id FROM projects WHERE deleted = true)
  AND deleted = false
  AND (total_cost_price = 0 OR total_cost_price IS NULL);

-- Step 4: Clean up orphaned budget items from deleted budgets
UPDATE budget_items SET deleted = true, updated_at = NOW()
WHERE budget_id IN (SELECT id FROM budgets WHERE deleted = true)
  AND deleted = false;

-- Log what was cleaned up (for audit trail)
DO $$
DECLARE
    del_projects INTEGER;
    del_budgets INTEGER;
    del_cps INTEGER;
BEGIN
    SELECT COUNT(*) INTO del_projects FROM projects WHERE deleted = true AND name LIKE '%Домодедово%Складской%';
    SELECT COUNT(*) INTO del_budgets FROM budgets WHERE deleted = true AND (planned_revenue = 0 OR planned_revenue IS NULL);
    SELECT COUNT(*) INTO del_cps FROM commercial_proposals WHERE deleted = true AND (total_cost_price = 0 OR total_cost_price IS NULL);
    RAISE NOTICE 'Cleanup complete: % duplicate projects, % empty budgets, % empty CPs soft-deleted', del_projects, del_budgets, del_cps;
END $$;
