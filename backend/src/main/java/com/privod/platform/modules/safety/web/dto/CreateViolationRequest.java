package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.ViolationSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateViolationRequest(
        UUID inspectionId,
        UUID incidentId,

        @NotBlank(message = "Описание нарушения обязательно")
        String description,

        @NotNull(message = "Степень тяжести нарушения обязательна")
        ViolationSeverity severity,

        LocalDate dueDate,
        UUID assignedToId,
        String assignedToName
) {
}
