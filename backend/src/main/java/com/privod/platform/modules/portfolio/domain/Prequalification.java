package com.privod.platform.modules.portfolio.domain;

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

@Entity(name = "PortfolioPrequalification")
@Table(name = "prequalifications", indexes = {
        @Index(name = "idx_prequalification_org", columnList = "organization_id"),
        @Index(name = "idx_prequalification_status", columnList = "status"),
        @Index(name = "idx_prequalification_responsible", columnList = "responsible_id"),
        @Index(name = "idx_prequalification_expiry", columnList = "expiry_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prequalification extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "client_name", nullable = false, length = 500)
    private String clientName;

    @Column(name = "project_name", length = 500)
    private String projectName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PrequalificationStatus status = PrequalificationStatus.DRAFT;

    @Column(name = "submission_date")
    private LocalDate submissionDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "categories", columnDefinition = "JSONB")
    private String categories;

    @Column(name = "max_contract_value", precision = 18, scale = 2)
    private BigDecimal maxContractValue;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "documents", columnDefinition = "JSONB")
    private String documents;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean isExpired() {
        if (expiryDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(expiryDate)
                && status != PrequalificationStatus.EXPIRED;
    }
}
