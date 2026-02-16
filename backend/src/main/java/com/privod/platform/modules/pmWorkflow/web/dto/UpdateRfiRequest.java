package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.RfiPriority;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateRfiRequest(
        String subject,
        String question,
        String answer,
        RfiPriority priority,
        UUID assignedToId,
        UUID responsibleId,
        LocalDate dueDate,
        Boolean costImpact,
        Boolean scheduleImpact,
        UUID relatedDrawingId,
        String relatedSpecSection,
        String distributionList,
        String linkedDocumentIds,
        String tags
) {
}
