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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pm_issues", indexes = {
        @Index(name = "idx_pm_issue_project", columnList = "project_id"),
        @Index(name = "idx_pm_issue_status", columnList = "status"),
        @Index(name = "idx_pm_issue_priority", columnList = "priority"),
        @Index(name = "idx_pm_issue_type", columnList = "issue_type"),
        @Index(name = "idx_pm_issue_assigned", columnList = "assigned_to_id"),
        @Index(name = "idx_pm_issue_due", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Issue extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", length = 30)
    private IssueType issueType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private IssueStatus status = IssueStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private IssuePriority priority = IssuePriority.NORMAL;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "reported_by_id", nullable = false)
    private UUID reportedById;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(name = "resolved_by_id")
    private UUID resolvedById;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "linked_rfi_id")
    private UUID linkedRfiId;

    @Column(name = "linked_submittal_id")
    private UUID linkedSubmittalId;

    @Column(name = "linked_document_ids", columnDefinition = "JSONB")
    private String linkedDocumentIds;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "tags", columnDefinition = "JSONB")
    private String tags;

    public boolean canTransitionTo(IssueStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
