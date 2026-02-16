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
@Table(name = "ks2_documents", indexes = {
        @Index(name = "idx_ks2_document_date", columnList = "document_date"),
        @Index(name = "idx_ks2_project", columnList = "project_id"),
        @Index(name = "idx_ks2_contract", columnList = "contract_id"),
        @Index(name = "idx_ks2_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks2Document extends BaseEntity {

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Column(name = "document_date", nullable = false)
    private LocalDate documentDate;

    @Column(name = "name", length = 500)
    private String name;

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

    @Column(name = "total_quantity", precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal totalQuantity = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "signed_by_id")
    private UUID signedById;

    @Column(name = "signed_at")
    private Instant signedAt;

    public void computeName() {
        this.name = "КС-2 №" + this.number + " от " + this.documentDate;
    }

    public boolean canTransitionTo(ClosingDocumentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
