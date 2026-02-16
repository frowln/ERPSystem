package com.privod.platform.modules.changeManagement.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateChangeOrderRequestRequest(
        String title,
        String description,
        BigDecimal proposedCost,
        Integer proposedScheduleChange,
        String justification,
        String attachmentIds
) {
}
