package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateChangeEventRequest(
        String title,
        String description,
        ChangeEventSource source,
        BigDecimal estimatedCostImpact,
        Integer estimatedScheduleImpact,
        BigDecimal actualCostImpact,
        Integer actualScheduleImpact,
        UUID linkedRfiId,
        UUID linkedIssueId,
        UUID contractId,
        String tags
) {
}
