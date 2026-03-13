package com.privod.platform.modules.russianDoc.domain;

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

/**
 * Акт выполненных работ.
 * Первичный документ, подтверждающий факт выполнения работ/оказания услуг.
 */
@Entity
@Table(name = "act", indexes = {
        @Index(name = "idx_act_number", columnList = "number"),
        @Index(name = "idx_act_date", columnList = "date"),
        @Index(name = "idx_act_status", columnList = "status"),
        @Index(name = "idx_act_executor", columnList = "executor_id"),
        @Index(name = "idx_act_contract", columnList = "contract_id"),
        @Index(name = "idx_act_project", columnList = "project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Act extends BaseEntity {

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "executor_id", nullable = false)
    private UUID executorId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", nullable = false, columnDefinition = "jsonb")
    private String items;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "period", length = 100)
    private String period;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RussianDocStatus status = RussianDocStatus.DRAFT;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    public boolean canTransitionTo(RussianDocStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
