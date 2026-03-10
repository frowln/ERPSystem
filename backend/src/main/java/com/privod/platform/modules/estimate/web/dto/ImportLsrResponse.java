package com.privod.platform.modules.estimate.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportLsrResponse {
    private UUID estimateId;
    private int sectionsCreated;
    private int positionsCreated;
    private int resourcesCreated;
    private int fmItemsCreated;
    private int fmItemsUpdated;
    private int specLinked;
}
