package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.ReportingSubmission;
import com.privod.platform.modules.regulatory.domain.SubmissionChannel;
import com.privod.platform.modules.regulatory.domain.SubmissionStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ReportingSubmissionResponse(
        UUID id,
        UUID deadlineId,
        LocalDate submissionDate,
        UUID submittedById,
        String confirmationNumber,
        SubmissionChannel channel,
        String channelDisplayName,
        String fileUrl,
        SubmissionStatus status,
        String statusDisplayName,
        String rejectionReason,
        UUID correctedSubmissionId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ReportingSubmissionResponse fromEntity(ReportingSubmission submission) {
        return new ReportingSubmissionResponse(
                submission.getId(),
                submission.getDeadlineId(),
                submission.getSubmissionDate(),
                submission.getSubmittedById(),
                submission.getConfirmationNumber(),
                submission.getChannel(),
                submission.getChannel().getDisplayName(),
                submission.getFileUrl(),
                submission.getStatus(),
                submission.getStatus().getDisplayName(),
                submission.getRejectionReason(),
                submission.getCorrectedSubmissionId(),
                submission.getCreatedAt(),
                submission.getUpdatedAt(),
                submission.getCreatedBy()
        );
    }
}
