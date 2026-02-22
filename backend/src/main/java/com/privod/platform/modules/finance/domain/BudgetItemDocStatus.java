package com.privod.platform.modules.finance.domain;

public enum BudgetItemDocStatus {
    /** Position exists in budget but procurement not started */
    PLANNED,
    /** Tender published, waiting for offers */
    TENDERED,
    /** Contract signed with winner */
    CONTRACTED,
    /** КС-2 (works) or ТОРГ-12/УПД (materials) signed */
    ACT_SIGNED,
    /** Invoice issued */
    INVOICED,
    /** Payment confirmed */
    PAID;
}
