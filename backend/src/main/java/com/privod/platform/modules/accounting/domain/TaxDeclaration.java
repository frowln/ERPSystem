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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tax_declarations", indexes = {
        @Index(name = "idx_tax_declaration_org", columnList = "organization_id"),
        @Index(name = "idx_tax_declaration_type", columnList = "declaration_type"),
        @Index(name = "idx_tax_declaration_period", columnList = "period_id"),
        @Index(name = "idx_tax_declaration_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxDeclaration extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "declaration_type", nullable = false, length = 20)
    private DeclarationType declarationType;

    @Column(name = "period_id", nullable = false)
    private UUID periodId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DeclarationStatus status = DeclarationStatus.DRAFT;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(DeclarationStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
