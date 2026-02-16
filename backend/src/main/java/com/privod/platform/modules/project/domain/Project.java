package com.privod.platform.modules.project.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "projects", indexes = {
        @Index(name = "idx_project_code", columnList = "code", unique = true),
        @Index(name = "idx_project_status", columnList = "status"),
        @Index(name = "idx_project_org", columnList = "organization_id"),
        @Index(name = "idx_project_manager", columnList = "manager_id"),
        @Index(name = "idx_project_customer", columnList = "customer_id"),
        @Index(name = "idx_project_dates", columnList = "planned_start_date, planned_end_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "planned_start_date")
    private LocalDate plannedStartDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "address", length = 1000)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "budget_amount", precision = 18, scale = 2)
    private BigDecimal budgetAmount;

    @Column(name = "contract_amount", precision = 18, scale = 2)
    private BigDecimal contractAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private ProjectType type;

    @Column(name = "category", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private ProjectPriority priority = ProjectPriority.NORMAL;

    public boolean canTransitionTo(ProjectStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
