package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.AssessmentStatus;
import com.privod.platform.modules.taxRisk.domain.RiskLevel;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateTaxRiskAssessmentRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        UUID projectId,

        UUID organizationId,

        LocalDate assessmentDate,

        @Size(max = 255, message = "Имя оценщика не должно превышать 255 символов")
        String assessor,

        RiskLevel riskLevel,

        AssessmentStatus status,

        String description
) {
}
