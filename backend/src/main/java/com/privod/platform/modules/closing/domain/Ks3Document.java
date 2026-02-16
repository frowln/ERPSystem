package com.privod.platform.modules.closing.domain;

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
@Table(name = "ks3_documents", indexes = {
        @Index(name = "idx_ks3_document_date", columnList = "document_date"),
        @Index(name = "idx_ks3_project", columnList = "project_id"),
        @Index(name = "idx_ks3_contract", columnList = "contract_id"),
        @Index(name = "idx_ks3_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks3Document extends BaseEntity {

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Column(name = "document_date", nullable = false)
    private LocalDate documentDate;

    @Column(name = "name", length = 500)
    private String name;

    @Column(name = "period_from")
    private LocalDate periodFrom;

    @Column(name = "period_to")
    private LocalDate periodTo;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ClosingDocumentStatus status = ClosingDocumentStatus.DRAFT;

    @Column(name = "total_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "retention_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal retentionPercent = new BigDecimal("5.00");

    @Column(name = "retention_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal retentionAmount = BigDecimal.ZERO;

    @Column(name = "net_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "signed_by_id")
    private UUID signedById;

    @Column(name = "signed_at")
    private Instant signedAt;

    public void computeName() {
        this.name = "КС-3 №" + this.number + " от " + this.documentDate;
    }

    public boolean canTransitionTo(ClosingDocumentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public void calculateRetention() {
        if (this.totalAmount != null && this.retentionPercent != null) {
            this.retentionAmount = this.totalAmount
                    .multiply(this.retentionPercent)
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            this.netAmount = this.totalAmount.subtract(this.retentionAmount);
        }
    }
}
