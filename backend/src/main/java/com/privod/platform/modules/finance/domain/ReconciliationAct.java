package com.privod.platform.modules.finance.domain;

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

/**
 * Акт сверки взаиморасчётов с контрагентом.
 * Reconciliation act — compares expected vs actual payments/invoices for a period.
 */
@Entity
@Table(name = "reconciliation_acts", indexes = {
        @Index(name = "idx_rec_counterparty", columnList = "counterparty_id"),
        @Index(name = "idx_rec_contract", columnList = "contract_id"),
        @Index(name = "idx_rec_period", columnList = "period_start, period_end"),
        @Index(name = "idx_rec_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationAct extends BaseEntity {

    @Column(name = "act_number", nullable = false, unique = true, length = 50)
    private String actNumber;

    @Column(name = "counterparty_id", nullable = false)
    private UUID counterpartyId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "our_debit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal ourDebit = BigDecimal.ZERO;

    @Column(name = "our_credit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal ourCredit = BigDecimal.ZERO;

    @Column(name = "our_balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal ourBalance = BigDecimal.ZERO;

    @Column(name = "counterparty_debit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal counterpartyDebit = BigDecimal.ZERO;

    @Column(name = "counterparty_credit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal counterpartyCredit = BigDecimal.ZERO;

    @Column(name = "counterparty_balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal counterpartyBalance = BigDecimal.ZERO;

    @Column(name = "discrepancy", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal discrepancy = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReconciliationActStatus status = ReconciliationActStatus.DRAFT;

    @Column(name = "signed_by_us")
    private Boolean signedByUs;

    @Column(name = "signed_by_counterparty")
    private Boolean signedByCounterparty;

    @Column(name = "signed_date")
    private LocalDate signedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "organization_id")
    private UUID organizationId;
}
