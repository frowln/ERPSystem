package com.privod.platform.modules.regulatory.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreateConstructionPermitRequest(
        UUID projectId,

        @NotBlank(message = "Номер разрешения обязателен")
        String permitNumber,

        String issuedBy,
        LocalDate issuedDate,
        LocalDate expiresDate,
        String permitType,
        String conditions,
        String fileUrl
) {
}
