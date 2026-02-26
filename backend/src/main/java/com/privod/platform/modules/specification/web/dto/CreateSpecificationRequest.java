package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.SpecificationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSpecificationRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @Size(max = 500)
        String title,

        @Size(max = 300)
        String projectName,

        UUID contractId,

        SpecificationStatus status,

        String notes
) {
}
