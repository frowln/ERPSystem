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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quality_checks", indexes = {
        @Index(name = "idx_qc_code", columnList = "code", unique = true),
        @Index(name = "idx_qc_project", columnList = "project_id"),
        @Index(name = "idx_qc_status", columnList = "status"),
        @Index(name = "idx_qc_result", columnList = "result"),
        @Index(name = "idx_qc_check_type", columnList = "check_type"),
        @Index(name = "idx_qc_planned_date", columnList = "planned_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityCheck extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", unique = true, length = 20)
    private String code;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "wbs_node_id")
    private UUID wbsNodeId;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "check_type", nullable = false, length = 30)
    private CheckType checkType;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 30)
    @Builder.Default
    private CheckResult result = CheckResult.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CheckStatus status = CheckStatus.PLANNED;

    @Column(name = "findings", columnDefinition = "TEXT")
    private String findings;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachment_urls", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> attachmentUrls = new ArrayList<>();
}
