package com.privod.platform.modules.pto.domain;

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
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "submittals", indexes = {
        @Index(name = "idx_submittal_project", columnList = "project_id"),
        @Index(name = "idx_submittal_status", columnList = "status"),
        @Index(name = "idx_submittal_type", columnList = "submittal_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submittal extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "submittal_type", nullable = false, length = 30)
    private SubmittalType submittalType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SubmittalStatus status = SubmittalStatus.DRAFT;

    @Column(name = "submitted_by_id")
    private UUID submittedById;

    @Column(name = "reviewed_by_id")
    private UUID reviewedById;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "response_date")
    private LocalDate responseDate;

    @Column(name = "spec_section", length = 100)
    private String specSection;

    @Column(name = "ball_in_court")
    private UUID ballInCourt;

    @Column(name = "lead_time")
    private Integer leadTime;

    @Column(name = "required_date")
    private LocalDate requiredDate;

    @Column(name = "linked_drawing_ids", columnDefinition = "TEXT")
    private String linkedDrawingIds;

    @Column(name = "attachment_ids", columnDefinition = "TEXT")
    private String attachmentIds;

    @Column(name = "tags", length = 1000)
    private String tags;

    @Column(name = "submitted_date")
    private LocalDate submittedDate;

    public boolean canTransitionTo(SubmittalStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
