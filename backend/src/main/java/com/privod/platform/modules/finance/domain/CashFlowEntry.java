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

@Entity
@Table(name = "cash_flow_entries", indexes = {
        @Index(name = "idx_cashflow_project", columnList = "project_id"),
        @Index(name = "idx_cashflow_date", columnList = "entry_date"),
        @Index(name = "idx_cashflow_direction", columnList = "direction")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashFlowEntry extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "direction", nullable = false, length = 10)
    private String direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private CashFlowCategory category;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
