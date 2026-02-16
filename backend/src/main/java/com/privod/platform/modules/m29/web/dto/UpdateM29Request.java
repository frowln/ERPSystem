package com.privod.platform.modules.m29.web.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateM29Request(
        LocalDate documentDate,

        UUID projectId,

        UUID contractId,

        UUID warehouseLocationId,

        UUID ks2Id,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes
) {
}
