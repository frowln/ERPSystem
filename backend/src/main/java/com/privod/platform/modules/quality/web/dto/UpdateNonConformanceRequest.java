package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.NonConformanceSeverity;
import com.privod.platform.modules.quality.domain.NonConformanceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateNonConformanceRequest(
        NonConformanceSeverity severity,
        String description,
        String rootCause,
        String correctiveAction,
        String preventiveAction,
        NonConformanceStatus status,
        UUID responsibleId,
        LocalDate dueDate,
        LocalDate resolvedDate,
        BigDecimal cost
) {
}
