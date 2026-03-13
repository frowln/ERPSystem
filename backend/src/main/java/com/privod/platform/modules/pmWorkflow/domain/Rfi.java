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
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "rfis", indexes = {
        @Index(name = "idx_rfi_project", columnList = "project_id"),
        @Index(name = "idx_rfi_status", columnList = "status"),
        @Index(name = "idx_rfi_priority", columnList = "priority"),
        @Index(name = "idx_rfi_assigned", columnList = "assigned_to_id"),
        @Index(name = "idx_rfi_due_date", columnList = "due_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rfi extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "question", columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RfiStatus status = RfiStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private RfiPriority priority = RfiPriority.NORMAL;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "answered_date")
    private LocalDate answeredDate;

    @Column(name = "answered_by_id")
    private UUID answeredById;

    @Column(name = "cost_impact", nullable = false)
    @Builder.Default
    private Boolean costImpact = false;

    @Column(name = "schedule_impact", nullable = false)
    @Builder.Default
    private Boolean scheduleImpact = false;

    @Column(name = "related_drawing_id")
    private UUID relatedDrawingId;

    @Column(name = "related_spec_section", length = 255)
    private String relatedSpecSection;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "distribution_list", columnDefinition = "jsonb")
    private String distributionList;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "linked_document_ids", columnDefinition = "jsonb")
    private String linkedDocumentIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private String tags;

    public boolean canTransitionTo(RfiStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
