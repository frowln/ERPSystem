package com.privod.platform.modules.ops.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "defects", indexes = {
        @Index(name = "idx_def_project", columnList = "project_id"),
        @Index(name = "idx_def_status", columnList = "status"),
        @Index(name = "idx_def_severity", columnList = "severity"),
        @Index(name = "idx_def_code", columnList = "code"),
        @Index(name = "idx_def_assigned_to", columnList = "assigned_to_id"),
        @Index(name = "idx_def_detected_by", columnList = "detected_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Defect extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "quality_check_id")
    private UUID qualityCheckId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "location", length = 500)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private DefectSeverity severity = DefectSeverity.MEDIUM;

    @Column(name = "photo_urls", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String photoUrls;

    @Column(name = "detected_by_id")
    private UUID detectedById;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "contractor_id")
    private UUID contractorId;

    @Column(name = "fix_deadline")
    private LocalDate fixDeadline;

    @Column(name = "sla_deadline_hours")
    private Integer slaDeadlineHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DefectStatus status = DefectStatus.OPEN;

    @Column(name = "fix_description", columnDefinition = "TEXT")
    private String fixDescription;

    @Column(name = "fixed_at")
    private Instant fixedAt;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "verification_requested_at")
    private Instant verificationRequestedAt;

    @Column(name = "reinspection_count")
    @Builder.Default
    private Integer reinspectionCount = 0;

    @Column(name = "drawing_id")
    private UUID drawingId;

    @Column(name = "pin_x")
    private Double pinX;

    @Column(name = "pin_y")
    private Double pinY;

    public boolean canTransitionTo(DefectStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
