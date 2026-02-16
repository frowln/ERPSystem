package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.MitigationStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateTaxRiskMitigationRequest(
        UUID factorId,

        @Size(max = 1000, message = "Описание действия не должно превышать 1000 символов")
        String action,

        @Size(max = 255, message = "Имя ответственного не должно превышать 255 символов")
        String responsible,

        LocalDate deadline,

        MitigationStatus status,

        String result
) {
}
