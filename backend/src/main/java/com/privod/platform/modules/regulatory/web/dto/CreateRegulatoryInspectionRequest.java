package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.InspectionResult;
import com.privod.platform.modules.regulatory.domain.RegulatoryInspectionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRegulatoryInspectionRequest(
        UUID projectId,

        @NotNull(message = "Дата проверки обязательна")
        LocalDate inspectionDate,

        String inspectorName,
        String inspectorOrgan,

        @NotNull(message = "Тип проверки обязателен")
        RegulatoryInspectionType inspectionType,

        InspectionResult result,
        String violations,
        String prescriptionsJson,
        LocalDate deadlineToFix,
        String actNumber,
        String actUrl
) {
}
