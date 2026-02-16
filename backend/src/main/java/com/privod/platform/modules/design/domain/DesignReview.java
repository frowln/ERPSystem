package com.privod.platform.modules.design.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "design_reviews", indexes = {
        @Index(name = "idx_dr_design_version", columnList = "design_version_id"),
        @Index(name = "idx_dr_reviewer", columnList = "reviewer_id"),
        @Index(name = "idx_dr_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignReview extends BaseEntity {

    @Column(name = "design_version_id", nullable = false)
    private UUID designVersionId;

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    @Column(name = "reviewer_name", length = 255)
    private String reviewerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DesignReviewStatus status = DesignReviewStatus.PENDING;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
