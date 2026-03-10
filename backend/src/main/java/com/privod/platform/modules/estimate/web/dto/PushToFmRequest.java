package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Request to push estimate lines to financial model (FM/Budget).
 * Works (GESN/GESNr/FER/TER) → create new BudgetItem with itemType=WORKS, estimatePrice.
 * Materials/Equipment (FSBC/TC) → match existing BudgetItem by name, update estimatePrice.
 */
@Data
public class PushToFmRequest {
    @NotNull
    private UUID budgetId;

    /** If true, push works (positions with work-type codes) to FM. Default: true. */
    private boolean pushWorks = true;

    /** If true, update estimatePrice for matching materials in FM. Default: true. */
    private boolean pushMaterials = true;

    /** If true, create FM section items for estimate sections. Default: false. */
    private boolean pushSections = false;
}
