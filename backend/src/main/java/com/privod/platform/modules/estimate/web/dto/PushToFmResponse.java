package com.privod.platform.modules.estimate.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Result of pushing estimate lines to FM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushToFmResponse {
    private UUID estimateId;
    private UUID budgetId;
    private int worksCreated;
    private int materialsUpdated;
    private int sectionsCreated;
    private int totalProcessed;
}
