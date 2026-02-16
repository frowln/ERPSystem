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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ens_operations", indexes = {
        @Index(name = "idx_ens_op_account", columnList = "ens_account_id"),
        @Index(name = "idx_ens_op_date", columnList = "operation_date"),
        @Index(name = "idx_ens_op_type", columnList = "operation_type"),
        @Index(name = "idx_ens_op_tax_type", columnList = "tax_type"),
        @Index(name = "idx_ens_op_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnsOperation extends BaseEntity {

    @Column(name = "ens_account_id", nullable = false)
    private UUID ensAccountId;

    @Column(name = "operation_date", nullable = false)
    private LocalDate operationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, length = 20)
    private EnsOperationType operationType;

    @Column(name = "tax_type", length = 100)
    private String taxType;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EnsOperationStatus status = EnsOperationStatus.PENDING;

    public boolean canTransitionTo(EnsOperationStatus target) {
        return this.status.canTransitionTo(target);
    }
}
