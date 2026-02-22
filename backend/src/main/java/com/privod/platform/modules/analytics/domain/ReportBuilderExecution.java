package com.privod.platform.modules.analytics.domain;

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

import java.util.UUID;

@Entity
@Table(name = "report_builder_executions", indexes = {
        @Index(name = "idx_rbe_org", columnList = "organization_id"),
        @Index(name = "idx_rbe_template", columnList = "template_id"),
        @Index(name = "idx_rbe_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportBuilderExecution extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "executed_by_id")
    private UUID executedById;

    @Column(name = "parameters_json", columnDefinition = "TEXT")
    @Builder.Default
    private String parametersJson = "{}";

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Enumerated(EnumType.STRING)
    @Column(name = "output_format", length = 50)
    @Builder.Default
    private ReportOutputFormat outputFormat = ReportOutputFormat.JSON;

    @Column(name = "output_path", length = 1000)
    private String outputPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private ReportExecutionStatus status = ReportExecutionStatus.RUNNING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
