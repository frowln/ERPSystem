package com.privod.platform.modules.pmWorkflow.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pm_submittal_reviews", indexes = {
        @Index(name = "idx_pm_submittal_review_submittal", columnList = "submittal_id"),
        @Index(name = "idx_pm_submittal_review_reviewer", columnList = "reviewer_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmittalReview extends BaseEntity {

    @Column(name = "submittal_id", nullable = false)
    private UUID submittalId;

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private SubmittalStatus status;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "stamp_type", length = 30)
    private String stampType;

    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;
}
