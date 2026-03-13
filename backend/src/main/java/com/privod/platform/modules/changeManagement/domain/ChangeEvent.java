package com.privod.platform.modules.changeManagement.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "change_events", indexes = {
        @Index(name = "idx_change_event_project", columnList = "project_id"),
        @Index(name = "idx_change_event_status", columnList = "status"),
        @Index(name = "idx_change_event_source", columnList = "source"),
        @Index(name = "idx_change_event_identified_by", columnList = "identified_by_id"),
        @Index(name = "idx_change_event_contract", columnList = "contract_id"),
        @Index(name = "idx_change_event_linked_rfi", columnList = "linked_rfi_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeEvent extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 30)
    private ChangeEventSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ChangeEventStatus status = ChangeEventStatus.IDENTIFIED;

    @Column(name = "identified_by_id", nullable = false)
    private UUID identifiedById;

    @Column(name = "identified_date", nullable = false)
    private LocalDate identifiedDate;

    @Column(name = "estimated_cost_impact", precision = 18, scale = 2)
    private BigDecimal estimatedCostImpact;

    @Column(name = "estimated_schedule_impact")
    private Integer estimatedScheduleImpact;

    @Column(name = "actual_cost_impact", precision = 18, scale = 2)
    private BigDecimal actualCostImpact;

    @Column(name = "actual_schedule_impact")
    private Integer actualScheduleImpact;

    @Column(name = "linked_rfi_id")
    private UUID linkedRfiId;

    @Column(name = "linked_issue_id")
    private UUID linkedIssueId;

    @Column(name = "contract_id")
    private UUID contractId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "JSONB")
    private String tags;

    public boolean canTransitionTo(ChangeEventStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
