-- =============================================================================
-- V234: Fix demo data — link all financial documents, set price sources,
--       calculate amounts from real source documents (no manual values)
-- =============================================================================

-- Use same deterministic UUIDs as V233
DO $$
DECLARE
    -- Budget items (ЭО)
    bi_eo_cable1 UUID := 'a0000000-0006-0001-0001-000000000001';
    bi_eo_cable2 UUID := 'a0000000-0006-0001-0002-000000000001';
    bi_eo_lumin  UUID := 'a0000000-0006-0001-0003-000000000001';
    bi_eo_panel  UUID := 'a0000000-0006-0001-0005-000000000001';
    bi_eo_work1  UUID := 'a0000000-0006-0001-0008-000000000001';
    bi_eo_work2  UUID := 'a0000000-0006-0001-0009-000000000001';
    bi_eo_work3  UUID := 'a0000000-0006-0001-000a-000000000001';

    -- Budget items (ОВ)
    bi_ov_pipe1 UUID := 'a0000000-0006-0002-0001-000000000001';
    bi_ov_radia UUID := 'a0000000-0006-0002-0003-000000000001';
    bi_ov_work1 UUID := 'a0000000-0006-0002-0007-000000000001';
    bi_ov_work2 UUID := 'a0000000-0006-0002-0008-000000000001';

    -- Budget items (КР)
    bi_kr_conc  UUID := 'a0000000-0006-0003-0001-000000000001';
    bi_kr_rebar UUID := 'a0000000-0006-0003-0002-000000000001';
    bi_kr_work1 UUID := 'a0000000-0006-0003-0006-000000000001';
    bi_kr_work2 UUID := 'a0000000-0006-0003-0007-000000000001';
    bi_kr_work3 UUID := 'a0000000-0006-0003-0008-000000000001';

    -- Budget items (ВК)
    bi_vk_pipe1 UUID := 'a0000000-0006-0004-0001-000000000001';
    bi_vk_work1 UUID := 'a0000000-0006-0004-0005-000000000001';

    -- Budget sections
    bsec_eo UUID := 'a0000000-0005-0001-0000-000000000001';
    bsec_ov UUID := 'a0000000-0005-0002-0000-000000000001';
    bsec_kr UUID := 'a0000000-0005-0003-0000-000000000001';
    bsec_vk UUID := 'a0000000-0005-0004-0000-000000000001';

    -- Invoice lines
    il_cable1_1 UUID := 'a0000000-000a-0001-0001-000000000001';
    il_cable1_2 UUID := 'a0000000-000a-0001-0002-000000000001';
    il_cable2_1 UUID := 'a0000000-000a-0002-0001-000000000001';
    il_pipe1_1  UUID := 'a0000000-000a-0003-0001-000000000001';
    il_pipe1_2  UUID := 'a0000000-000a-0003-0002-000000000001';
    il_pipe2_1  UUID := 'a0000000-000a-0004-0001-000000000001';
    il_conc1_1  UUID := 'a0000000-000a-0005-0001-000000000001';
    il_rebar_1  UUID := 'a0000000-000a-0006-0001-000000000001';
    il_lumin_1  UUID := 'a0000000-000a-0007-0001-000000000001';
    il_radia_1  UUID := 'a0000000-000a-0008-0001-000000000001';

    -- Estimates
    est_eo UUID := 'a0000000-0008-0001-0000-000000000001';
    est_ov UUID := 'a0000000-0008-0002-0000-000000000001';
    est_kr UUID := 'a0000000-0008-0003-0000-000000000001';
    est_vk UUID := 'a0000000-0008-0004-0000-000000000001';

    -- Invoices
    inv_cable1 UUID := 'a0000000-0009-0001-0000-000000000001';
    inv_cable2 UUID := 'a0000000-0009-0002-0000-000000000001';
    inv_pipe1  UUID := 'a0000000-0009-0003-0000-000000000001';
    inv_conc1  UUID := 'a0000000-0009-0005-0000-000000000001';
    inv_rebar  UUID := 'a0000000-0009-0006-0000-000000000001';
    inv_lumin  UUID := 'a0000000-0009-0007-0000-000000000001';
    inv_radia  UUID := 'a0000000-0009-0008-0000-000000000001';

BEGIN

-- =========================================================================
-- 1. LINK INVOICE LINES → BUDGET ITEMS
--    Each invoice line maps to a specific budget position
-- =========================================================================

-- Cable invoice 1 lines → bi_eo_cable1 (Кабель 3×2.5)
UPDATE invoice_lines SET budget_item_id = bi_eo_cable1 WHERE id IN (il_cable1_1, il_cable1_2);

-- Cable invoice 2 line → bi_eo_cable2 (Кабель 5×4.0)
UPDATE invoice_lines SET budget_item_id = bi_eo_cable2 WHERE id = il_cable2_1;

-- Pipe invoice 1 lines → bi_ov_pipe1 (Труба стальная ОВ)
UPDATE invoice_lines SET budget_item_id = bi_ov_pipe1 WHERE id IN (il_pipe1_1, il_pipe1_2);

-- Pipe invoice 2 line → bi_vk_pipe1 (Труба ПЭ ВК)
UPDATE invoice_lines SET budget_item_id = bi_vk_pipe1 WHERE id = il_pipe2_1;

-- Concrete invoice → bi_kr_conc (Бетон)
UPDATE invoice_lines SET budget_item_id = bi_kr_conc WHERE id = il_conc1_1;

-- Rebar invoice → bi_kr_rebar (Арматура)
UPDATE invoice_lines SET budget_item_id = bi_kr_rebar WHERE id = il_rebar_1;

-- Luminaire invoice → bi_eo_lumin (Светильники)
UPDATE invoice_lines SET budget_item_id = bi_eo_lumin WHERE id = il_lumin_1;

-- Radiator invoice → bi_ov_radia (Радиаторы)
UPDATE invoice_lines SET budget_item_id = bi_ov_radia WHERE id = il_radia_1;


-- =========================================================================
-- 2. SET PRICE SOURCE on budget items — every item linked to real document
--    Materials: source = INVOICE (price from supplier invoice)
--    Works: source = ESTIMATE (price from project estimate)
-- =========================================================================

-- ЭО Materials: price from invoices
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_cable1
    WHERE id = bi_eo_cable1;
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_cable2
    WHERE id = bi_eo_cable2;
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_lumin
    WHERE id = bi_eo_lumin;
-- Panel (no invoice yet, sourced from estimate)
UPDATE budget_items SET price_source_type = 'ESTIMATE', price_source_id = est_eo
    WHERE id = bi_eo_panel;

-- ЭО Works: price from estimate
UPDATE budget_items SET price_source_type = 'ESTIMATE', price_source_id = est_eo
    WHERE id IN (bi_eo_work1, bi_eo_work2, bi_eo_work3);

-- ОВ Materials: price from invoices
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_pipe1
    WHERE id = bi_ov_pipe1;
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_radia
    WHERE id = bi_ov_radia;

-- ОВ Works: price from estimate
UPDATE budget_items SET price_source_type = 'ESTIMATE', price_source_id = est_ov
    WHERE id IN (bi_ov_work1, bi_ov_work2);

-- КР Materials: price from invoices
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_conc1
    WHERE id = bi_kr_conc;
UPDATE budget_items SET price_source_type = 'INVOICE', price_source_id = inv_rebar
    WHERE id = bi_kr_rebar;

-- КР Works: price from estimate
UPDATE budget_items SET price_source_type = 'ESTIMATE', price_source_id = est_kr
    WHERE id IN (bi_kr_work1, bi_kr_work2, bi_kr_work3);

-- ВК Materials: price from estimate (no invoice yet for pipe2)
UPDATE budget_items SET price_source_type = 'ESTIMATE', price_source_id = est_vk
    WHERE id = bi_vk_pipe1;

-- ВК Works: price from estimate
UPDATE budget_items SET price_source_type = 'ESTIMATE', price_source_id = est_vk
    WHERE id = bi_vk_work1;

-- Remaining items without specific invoices: set from estimates
UPDATE budget_items SET price_source_type = 'ESTIMATE',
    price_source_id = CASE
        WHEN parent_id = bsec_eo THEN est_eo
        WHEN parent_id = bsec_ov THEN est_ov
        WHEN parent_id = bsec_kr THEN est_kr
        WHEN parent_id = bsec_vk THEN est_vk
    END
WHERE deleted = false
  AND is_section = false
  AND price_source_type IS NULL
  AND parent_id IN (bsec_eo, bsec_ov, bsec_kr, bsec_vk);


-- =========================================================================
-- 3. CALCULATE contracted_amount FROM contract_budget_items
--    This is the SUM of allocated_amount from all linked contracts
-- =========================================================================
UPDATE budget_items bi
SET contracted_amount = COALESCE(sub.total, 0)
FROM (
    SELECT cbi.budget_item_id, SUM(cbi.allocated_amount) AS total
    FROM contract_budget_items cbi
    JOIN contracts c ON c.id = cbi.contract_id AND c.deleted = false
    WHERE c.status IN ('SIGNED', 'ACTIVE', 'CLOSED')
    GROUP BY cbi.budget_item_id
) sub
WHERE bi.id = sub.budget_item_id
  AND bi.deleted = false
  AND bi.is_section = false;


-- =========================================================================
-- 4. CALCULATE invoiced_amount FROM invoice_lines
--    SUM(amount) from invoice lines linked to each budget item
-- =========================================================================
UPDATE budget_items bi
SET invoiced_amount = COALESCE(sub.total, 0)
FROM (
    SELECT il.budget_item_id, SUM(il.amount) AS total
    FROM invoice_lines il
    JOIN invoices inv ON inv.id = il.invoice_id AND inv.deleted = false
    WHERE il.budget_item_id IS NOT NULL
      AND il.deleted = false
      AND inv.invoice_type = 'RECEIVED'
    GROUP BY il.budget_item_id
) sub
WHERE bi.id = sub.budget_item_id
  AND bi.deleted = false
  AND bi.is_section = false;


-- =========================================================================
-- 5. CALCULATE paid_amount FROM payments
--    Payments link to invoices; invoices link to contracts; contracts link to budget items.
--    We trace: payment → invoice → invoice_lines → budget_item
-- =========================================================================

-- For items with linked invoice lines: prorate payment based on line share of invoice
UPDATE budget_items bi
SET paid_amount = COALESCE(sub.total_paid, 0)
FROM (
    SELECT il.budget_item_id,
           SUM(
               CASE WHEN inv.total_amount > 0
               THEN il.amount::numeric * (inv.paid_amount::numeric / inv.total_amount::numeric)
               ELSE 0 END
           ) AS total_paid
    FROM invoice_lines il
    JOIN invoices inv ON inv.id = il.invoice_id AND inv.deleted = false
    WHERE il.budget_item_id IS NOT NULL
      AND il.deleted = false
      AND inv.invoice_type = 'RECEIVED'
      AND inv.paid_amount > 0
    GROUP BY il.budget_item_id
) sub
WHERE bi.id = sub.budget_item_id
  AND bi.deleted = false
  AND bi.is_section = false;


-- =========================================================================
-- 6. CALCULATE act_signed_amount FROM KS-2 acts
--    KS-2 acts link to contracts via contract_id.
--    Contracts link to budget items via contract_budget_items.
--    We distribute KS-2 total proportionally across linked budget items.
-- =========================================================================
UPDATE budget_items bi
SET act_signed_amount = COALESCE(sub.total_signed, 0)
FROM (
    SELECT cbi.budget_item_id,
           SUM(
               CASE WHEN ctr_total.total_allocated > 0
               THEN (cbi.allocated_amount::numeric / ctr_total.total_allocated::numeric) * ks2_total.total_ks2
               ELSE 0 END
           ) AS total_signed
    FROM contract_budget_items cbi
    -- Total allocated per contract (to compute proportions)
    JOIN (
        SELECT contract_id, SUM(allocated_amount) AS total_allocated
        FROM contract_budget_items
        GROUP BY contract_id
    ) ctr_total ON ctr_total.contract_id = cbi.contract_id
    -- Total KS-2 per contract (only SIGNED acts)
    JOIN (
        SELECT contract_id, SUM(total_amount) AS total_ks2
        FROM ks2_documents
        WHERE deleted = false AND status = 'SIGNED'
        GROUP BY contract_id
    ) ks2_total ON ks2_total.contract_id = cbi.contract_id
    GROUP BY cbi.budget_item_id
) sub
WHERE bi.id = sub.budget_item_id
  AND bi.deleted = false
  AND bi.is_section = false;


-- =========================================================================
-- 7. RECALCULATE SECTION TOTALS (child → parent, bottom-up)
-- =========================================================================

-- Level 2 first (subsections with parent)
-- NOTE: Only aggregate monetary totals (planned, contracted, act_signed, invoiced, paid).
-- Per-unit prices (cost_price, estimate_price, customer_price) are NOT summed
-- because they use different units (руб/м, руб/шт, руб/т) — summing is meaningless.
UPDATE budget_items parent_item
SET planned_amount = COALESCE(sub.sum_planned, 0),
    contracted_amount = COALESCE(sub.sum_contracted, 0),
    act_signed_amount = COALESCE(sub.sum_act_signed, 0),
    invoiced_amount = COALESCE(sub.sum_invoiced, 0),
    paid_amount = COALESCE(sub.sum_paid, 0)
FROM (
    SELECT parent_id,
           SUM(COALESCE(planned_amount, 0)) AS sum_planned,
           SUM(COALESCE(contracted_amount, 0)) AS sum_contracted,
           SUM(COALESCE(act_signed_amount, 0)) AS sum_act_signed,
           SUM(COALESCE(invoiced_amount, 0)) AS sum_invoiced,
           SUM(COALESCE(paid_amount, 0)) AS sum_paid
    FROM budget_items
    WHERE deleted = false AND parent_id IS NOT NULL
    GROUP BY parent_id
) sub
WHERE parent_item.id = sub.parent_id
  AND parent_item.deleted = false
  AND parent_item.is_section = true;

-- Level 1 (root sections)
UPDATE budget_items root_section
SET planned_amount = COALESCE(sub.sum_planned, 0),
    contracted_amount = COALESCE(sub.sum_contracted, 0),
    act_signed_amount = COALESCE(sub.sum_act_signed, 0),
    invoiced_amount = COALESCE(sub.sum_invoiced, 0),
    paid_amount = COALESCE(sub.sum_paid, 0)
FROM (
    SELECT parent_id,
           SUM(COALESCE(planned_amount, 0)) AS sum_planned,
           SUM(COALESCE(contracted_amount, 0)) AS sum_contracted,
           SUM(COALESCE(act_signed_amount, 0)) AS sum_act_signed,
           SUM(COALESCE(invoiced_amount, 0)) AS sum_invoiced,
           SUM(COALESCE(paid_amount, 0)) AS sum_paid
    FROM budget_items
    WHERE deleted = false AND parent_id IS NOT NULL
    GROUP BY parent_id
) sub
WHERE root_section.id = sub.parent_id
  AND root_section.deleted = false
  AND root_section.is_section = true
  AND root_section.parent_id IS NULL;


-- =========================================================================
-- 8. UPDATE doc_status BASED ON FINANCIAL PROGRESS
--    Chain: PLANNED → CONTRACTED → ACT_SIGNED → INVOICED → PAID
-- =========================================================================

-- Items with contracts → CONTRACTED
UPDATE budget_items
SET doc_status = 'CONTRACTED'
WHERE deleted = false
  AND is_section = false
  AND contracted_amount > 0
  AND (act_signed_amount IS NULL OR act_signed_amount = 0)
  AND doc_status = 'PLANNED';

-- Items with signed acts → ACT_SIGNED
UPDATE budget_items
SET doc_status = 'ACT_SIGNED'
WHERE deleted = false
  AND is_section = false
  AND act_signed_amount > 0
  AND (invoiced_amount IS NULL OR invoiced_amount = 0)
  AND doc_status IN ('PLANNED', 'CONTRACTED');

-- Items invoiced → INVOICED
UPDATE budget_items
SET doc_status = 'INVOICED'
WHERE deleted = false
  AND is_section = false
  AND invoiced_amount > 0
  AND (paid_amount IS NULL OR paid_amount = 0 OR paid_amount < invoiced_amount)
  AND doc_status IN ('PLANNED', 'CONTRACTED', 'ACT_SIGNED');

-- Items fully paid → PAID
UPDATE budget_items
SET doc_status = 'PAID'
WHERE deleted = false
  AND is_section = false
  AND paid_amount > 0
  AND invoiced_amount > 0
  AND paid_amount >= invoiced_amount
  AND doc_status IN ('PLANNED', 'CONTRACTED', 'ACT_SIGNED', 'INVOICED');

END $$;
