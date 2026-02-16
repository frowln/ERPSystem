-- =============================================================================
-- V107: Ensure uniqueness of active bid scores per comparison/criteria/vendor
-- =============================================================================

-- Keep only the most recent active score for each (comparison, criteria, vendor)
-- and soft-delete older duplicates before creating the unique index.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY bid_comparison_id, criteria_id, vendor_id
            ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        ) AS rn
    FROM bid_scores
    WHERE deleted = FALSE
)
UPDATE bid_scores bs
SET deleted = TRUE,
    updated_at = NOW()
FROM ranked r
WHERE bs.id = r.id
  AND r.rn > 1
  AND bs.deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bid_scores_active_key
    ON bid_scores (bid_comparison_id, criteria_id, vendor_id)
    WHERE deleted = FALSE;
