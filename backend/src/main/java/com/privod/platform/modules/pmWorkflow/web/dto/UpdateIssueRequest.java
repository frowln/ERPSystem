package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.IssuePriority;
import com.privod.platform.modules.pmWorkflow.domain.IssueType;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateIssueRequest(
        String title,
        String description,
        IssueType issueType,
        IssuePriority priority,
        UUID assignedToId,
        LocalDate dueDate,
        String location,
        UUID linkedRfiId,
        UUID linkedSubmittalId,
        String linkedDocumentIds,
        String rootCause,
        String resolution,
        String tags
) {
}
