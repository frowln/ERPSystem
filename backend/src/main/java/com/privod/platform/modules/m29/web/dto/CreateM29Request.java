package com.privod.platform.modules.m29.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateM29Request(
        @NotNull(message = "Дата документа обязательна")
        LocalDate documentDate,

        UUID projectId,

        UUID contractId,

        UUID warehouseLocationId,

        UUID ks2Id,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes
) {
}
