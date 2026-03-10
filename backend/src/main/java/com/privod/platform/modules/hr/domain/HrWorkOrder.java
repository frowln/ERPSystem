package com.privod.platform.modules.hr.domain;

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
@Table(name = "hr_work_orders", indexes = {
        @Index(name = "idx_hr_wo_org", columnList = "organization_id"),
        @Index(name = "idx_hr_wo_project", columnList = "project_id"),
        @Index(name = "idx_hr_wo_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HrWorkOrder extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private HrWorkOrderType type;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "project_name", length = 255)
    private String projectName;

    @Column(name = "crew_name", length = 255)
    private String crewName;

    @Column(name = "work_description", columnDefinition = "TEXT")
    private String workDescription;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "safety_requirements", columnDefinition = "TEXT")
    private String safetyRequirements;

    @Column(name = "hazardous_conditions", columnDefinition = "TEXT")
    private String hazardousConditions;

    @Column(name = "required_permits", columnDefinition = "TEXT")
    private String requiredPermits;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private HrWorkOrderStatus status = HrWorkOrderStatus.DRAFT;

    public enum HrWorkOrderType {
        TASK_ORDER, ACCESS_ORDER
    }

    public enum HrWorkOrderStatus {
        DRAFT, ISSUED, IN_PROGRESS, COMPLETED, CANCELLED
    }
}
