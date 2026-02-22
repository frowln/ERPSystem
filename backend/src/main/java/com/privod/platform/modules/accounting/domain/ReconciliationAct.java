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
import java.util.UUID;

@Entity(name = "AccountingReconciliationAct")
@Table(name = "reconciliation_acts", indexes = {
        @Index(name = "idx_reconciliation_act_counterparty", columnList = "counterparty_id"),
        @Index(name = "idx_reconciliation_act_period", columnList = "period_id"),
        @Index(name = "idx_reconciliation_act_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationAct extends BaseEntity {

    @Column(name = "counterparty_id", nullable = false)
    private UUID counterpartyId;

    @Column(name = "period_id", nullable = false)
    private UUID periodId;

    @Column(name = "our_debit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal ourDebit = BigDecimal.ZERO;

    @Column(name = "our_credit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal ourCredit = BigDecimal.ZERO;

    @Column(name = "their_debit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal theirDebit = BigDecimal.ZERO;

    @Column(name = "their_credit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal theirCredit = BigDecimal.ZERO;

    @Column(name = "difference", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal difference = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReconciliationActStatus status = ReconciliationActStatus.DRAFT;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(ReconciliationActStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public BigDecimal calculateDifference() {
        BigDecimal ourBalance = (ourDebit != null ? ourDebit : BigDecimal.ZERO)
                .subtract(ourCredit != null ? ourCredit : BigDecimal.ZERO);
        BigDecimal theirBalance = (theirDebit != null ? theirDebit : BigDecimal.ZERO)
                .subtract(theirCredit != null ? theirCredit : BigDecimal.ZERO);
        return ourBalance.subtract(theirBalance);
    }
}
