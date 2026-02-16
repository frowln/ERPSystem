package com.privod.platform.modules.regulatory.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reporting_submissions", indexes = {
        @Index(name = "idx_rpt_submission_deadline", columnList = "deadline_id"),
        @Index(name = "idx_rpt_submission_status", columnList = "status"),
        @Index(name = "idx_rpt_submission_date", columnList = "submission_date"),
        @Index(name = "idx_rpt_submission_submitted_by", columnList = "submitted_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportingSubmission extends BaseEntity {

    @Column(name = "deadline_id", nullable = false)
    private UUID deadlineId;

    @Column(name = "submission_date", nullable = false)
    private LocalDate submissionDate;

    @Column(name = "submitted_by_id")
    private UUID submittedById;

    @Column(name = "confirmation_number", length = 100)
    private String confirmationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 20)
    @Builder.Default
    private SubmissionChannel channel = SubmissionChannel.ELECTRONIC;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "corrected_submission_id")
    private UUID correctedSubmissionId;
}
