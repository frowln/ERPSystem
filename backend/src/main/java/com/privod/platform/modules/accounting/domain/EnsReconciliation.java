package com.privod.platform.modules.accounting.domain;

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
@Table(name = "ens_reconciliations", indexes = {
        @Index(name = "idx_ens_reconciliation_account", columnList = "ens_account_id"),
        @Index(name = "idx_ens_reconciliation_period", columnList = "period_id"),
        @Index(name = "idx_ens_reconciliation_status", columnList = "status"),
        @Index(name = "idx_ens_reconciliation_period_range", columnList = "period_start, period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnsReconciliation extends BaseEntity {

    @Column(name = "ens_account_id", nullable = false)
    private UUID ensAccountId;

    @Column(name = "period_id", nullable = false)
    private UUID periodId;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "opening_balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(name = "expected_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal expectedAmount = BigDecimal.ZERO;

    @Column(name = "actual_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(name = "total_debits", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalDebits = BigDecimal.ZERO;

    @Column(name = "total_credits", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCredits = BigDecimal.ZERO;

    @Column(name = "closing_balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal closingBalance = BigDecimal.ZERO;

    @Column(name = "difference", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal difference = BigDecimal.ZERO;

    @Column(name = "discrepancy_amount", precision = 18, scale = 2)
    private BigDecimal discrepancyAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EnsReconciliationStatus status = EnsReconciliationStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reconciled_by_id")
    private UUID reconciledById;

    @Column(name = "reconciled_at")
    private Instant reconciledAt;

    public BigDecimal calculateDifference() {
        BigDecimal expected = expectedAmount != null ? expectedAmount : BigDecimal.ZERO;
        BigDecimal actual = actualAmount != null ? actualAmount : BigDecimal.ZERO;
        return expected.subtract(actual);
    }
}
