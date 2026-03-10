package com.privod.platform.modules.quality.domain;

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
@Table(name = "quality_checklists", indexes = {
        @Index(name = "idx_qcl_code", columnList = "code", unique = true),
        @Index(name = "idx_qcl_project", columnList = "project_id"),
        @Index(name = "idx_qcl_status", columnList = "status"),
        @Index(name = "idx_qcl_work_type", columnList = "work_type"),
        @Index(name = "idx_qcl_wbs_stage", columnList = "wbs_stage")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityChecklist extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "template_id")
    private UUID templateId;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 50)
    private ChecklistWorkType workType;

    @Column(name = "wbs_stage", length = 255)
    private String wbsStage;

    @Column(name = "location", length = 500)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ChecklistExecutionStatus status = ChecklistExecutionStatus.DRAFT;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(name = "total_items")
    @Builder.Default
    private int totalItems = 0;

    @Column(name = "passed_items")
    @Builder.Default
    private int passedItems = 0;

    @Column(name = "failed_items")
    @Builder.Default
    private int failedItems = 0;

    @Column(name = "na_items")
    @Builder.Default
    private int naItems = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
