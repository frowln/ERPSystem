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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reporting_deadlines", indexes = {
        @Index(name = "idx_rpt_deadline_due_date", columnList = "due_date"),
        @Index(name = "idx_rpt_deadline_status", columnList = "status"),
        @Index(name = "idx_rpt_deadline_report_type", columnList = "report_type"),
        @Index(name = "idx_rpt_deadline_responsible", columnList = "responsible_id"),
        @Index(name = "idx_rpt_deadline_regulatory_body", columnList = "regulatory_body")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportingDeadline extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    @Builder.Default
    private ReportingFrequency frequency = ReportingFrequency.MONTHLY;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "reminder_days_before", nullable = false)
    @Builder.Default
    private int reminderDaysBefore = 5;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DeadlineStatus status = DeadlineStatus.UPCOMING;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "submitted_by_id")
    private UUID submittedById;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "regulatory_body", length = 100)
    private String regulatoryBody;

    @Column(name = "penalty_amount", precision = 18, scale = 2)
    private BigDecimal penaltyAmount;
}
