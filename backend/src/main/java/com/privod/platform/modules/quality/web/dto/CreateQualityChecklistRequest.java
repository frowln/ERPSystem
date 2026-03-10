package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistWorkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateQualityChecklistRequest(
        @NotBlank @Size(max = 500) String name,
        @NotNull UUID projectId,
        UUID templateId,
        @NotNull ChecklistWorkType workType,
        String wbsStage,
        String location,
        UUID inspectorId,
        String inspectorName,
        LocalDate scheduledDate,
        String notes,
        List<ChecklistItemInput> items
) {
    public record ChecklistItemInput(
            @NotBlank String description,
            String category,
            boolean required,
            boolean photoRequired,
            int sortOrder
    ) {}
}
