package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistItemResult;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record UpdateChecklistItemRequest(
        @NotNull ChecklistItemResult result,
        String notes,
        UUID inspectorId,
        String inspectorName,
        List<String> photoUrls
) {}
