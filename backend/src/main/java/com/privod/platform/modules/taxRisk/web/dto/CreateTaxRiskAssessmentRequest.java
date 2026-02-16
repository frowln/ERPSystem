package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.RiskLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTaxRiskAssessmentRequest(
        @NotBlank(message = "Наименование оценки обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        UUID projectId,

        UUID organizationId,

        LocalDate assessmentDate,

        @Size(max = 255, message = "Имя оценщика не должно превышать 255 символов")
        String assessor,

        RiskLevel riskLevel,

        String description
) {
}
