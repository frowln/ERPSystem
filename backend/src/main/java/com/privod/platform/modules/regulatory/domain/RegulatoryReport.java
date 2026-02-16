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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "regulatory_reports", indexes = {
        @Index(name = "idx_reg_report_project", columnList = "project_id"),
        @Index(name = "idx_reg_report_status", columnList = "status"),
        @Index(name = "idx_reg_report_due_date", columnList = "due_date"),
        @Index(name = "idx_reg_report_code", columnList = "code", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegulatoryReport extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "period", length = 100)
    private String period;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.DRAFT;

    @Column(name = "submitted_to_organ", length = 500)
    private String submittedToOrgan;

    @Column(name = "organ_response", columnDefinition = "TEXT")
    private String organResponse;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "prepared_by_id")
    private UUID preparedById;

    @Column(name = "submitted_by_id")
    private UUID submittedById;
}
