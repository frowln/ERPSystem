package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateCommissioningChecklistRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 100)
        String system,

        ChecklistStatus status,

        String checkItems,

        UUID inspectorId,

        LocalDate inspectionDate,

        UUID signedOffById,

        String notes,

        String attachmentIds
) {
}
