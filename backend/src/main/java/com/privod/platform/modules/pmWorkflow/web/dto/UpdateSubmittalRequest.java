package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalType;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateSubmittalRequest(
        String title,
        String description,
        SubmittalType submittalType,
        String specSection,
        LocalDate dueDate,
        UUID ballInCourt,
        Integer leadTime,
        LocalDate requiredDate,
        String linkedDrawingIds,
        String attachmentIds,
        String tags
) {
}
