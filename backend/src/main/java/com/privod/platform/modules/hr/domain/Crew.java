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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "crews", indexes = {
        @Index(name = "idx_crews_org", columnList = "organization_id"),
        @Index(name = "idx_crews_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Crew extends BaseEntity {

    public enum CrewStatus {
        ACTIVE, IDLE, ON_LEAVE, DISBANDED
    }

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "foreman_id")
    private UUID foremanId;

    @Column(name = "foreman_name", length = 255)
    private String foremanName;

    @Column(name = "foreman_phone", length = 50)
    private String foremanPhone;

    @Column(name = "workers_count")
    @Builder.Default
    private int workersCount = 0;

    @Column(name = "current_project_id")
    private UUID currentProjectId;

    @Column(name = "current_project", length = 255)
    private String currentProject;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private CrewStatus status;

    @Column(name = "specialization", length = 255)
    private String specialization;

    @Column(name = "performance")
    private Integer performance;

    @Column(name = "active_orders")
    @Builder.Default
    private int activeOrders = 0;
}
