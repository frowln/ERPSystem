package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.CheckStatus;
import com.privod.platform.modules.quality.domain.CheckType;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateQualityCheckRequest(
        UUID taskId,
        UUID specItemId,
        CheckType checkType,

        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,
        LocalDate plannedDate,
        LocalDate actualDate,
        UUID inspectorId,
        String inspectorName,
        CheckResult result,
        CheckStatus status,
        String findings,
        String recommendations,
        List<String> attachmentUrls
) {
}
