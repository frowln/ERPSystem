package com.privod.platform.modules.constructability.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "constructability_reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConstructabilityReview extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "specification_id")
    private UUID specificationId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.DRAFT;

    @Column(name = "reviewer_name", nullable = false, length = 200)
    private String reviewerName;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_rating", length = 30)
    private OverallRating overallRating;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
