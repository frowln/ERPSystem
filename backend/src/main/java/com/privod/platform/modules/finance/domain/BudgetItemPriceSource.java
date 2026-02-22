package com.privod.platform.modules.finance.domain;

public enum BudgetItemPriceSource {
    /** Price entered manually */
    MANUAL,
    /** Price taken from a works tender (PurchaseRequest type=WORKS) */
    WORKS_TENDER,
    /** Price taken from a materials tender (PurchaseRequest type=MATERIALS) */
    MATERIALS_TENDER,
    /** Price taken from an estimate */
    ESTIMATE,
    /** Price taken from an invoice */
    INVOICE,
    /** Price taken from a competitive list entry */
    COMPETITIVE_LIST;
}
