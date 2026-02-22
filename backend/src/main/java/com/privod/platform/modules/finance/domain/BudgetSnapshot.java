package com.privod.platform.modules.finance.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "budget_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSnapshot extends BaseEntity {

    @Column(name = "budget_id", nullable = false)
    private UUID budgetId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "snapshot_name", nullable = false, length = 200)
    private String snapshotName;

    @Column(name = "snapshot_date", nullable = false)
    @Builder.Default
    private Instant snapshotDate = Instant.now();

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "total_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(name = "total_customer", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCustomer = BigDecimal.ZERO;

    @Column(name = "total_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalMargin = BigDecimal.ZERO;

    @Column(name = "margin_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal marginPercent = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items_json", nullable = false, columnDefinition = "jsonb")
    private String itemsJson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
