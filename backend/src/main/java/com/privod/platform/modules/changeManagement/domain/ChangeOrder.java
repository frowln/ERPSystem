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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "change_orders", indexes = {
        @Index(name = "idx_co_project", columnList = "project_id"),
        @Index(name = "idx_co_contract", columnList = "contract_id"),
        @Index(name = "idx_co_status", columnList = "status"),
        @Index(name = "idx_co_type", columnList = "change_order_type"),
        @Index(name = "idx_co_cor", columnList = "change_order_request_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeOrder extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_order_type", length = 30)
    private ChangeOrderType changeOrderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ChangeOrderStatus status = ChangeOrderStatus.DRAFT;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "schedule_impact_days", nullable = false)
    @Builder.Default
    private Integer scheduleImpactDays = 0;

    @Column(name = "original_contract_amount", precision = 18, scale = 2)
    private BigDecimal originalContractAmount;

    @Column(name = "revised_contract_amount", precision = 18, scale = 2)
    private BigDecimal revisedContractAmount;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_date")
    private LocalDate approvedDate;

    @Column(name = "executed_date")
    private LocalDate executedDate;

    @Column(name = "change_order_request_id")
    private UUID changeOrderRequestId;

    public boolean canTransitionTo(ChangeOrderStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
