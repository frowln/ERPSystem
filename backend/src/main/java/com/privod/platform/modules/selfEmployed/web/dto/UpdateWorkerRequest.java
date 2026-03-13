package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.ContractType;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record UpdateWorkerRequest(
        @Size(max = 255, message = "ФИО не должно превышать 255 символов")
        String fullName,

        @Size(max = 20)
        String phone,

        @Size(max = 255)
        String email,

        ContractType contractType,

        @Size(max = 100)
        String contractNumber,

        LocalDate contractStartDate,

        LocalDate contractEndDate,

        @Size(max = 255)
        String specialization,

        BigDecimal hourlyRate,

        Set<UUID> projectIds
) {
}
