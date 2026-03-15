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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reclamations", indexes = {
        @Index(name = "idx_reclamation_org", columnList = "organization_id"),
        @Index(name = "idx_reclamation_project", columnList = "project_id"),
        @Index(name = "idx_reclamation_status", columnList = "status"),
        @Index(name = "idx_reclamation_contract", columnList = "contract_id"),
        @Index(name = "idx_reclamation_counterparty", columnList = "counterparty_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reclamation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "counterparty_id")
    private UUID counterpartyId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "claim_number", length = 50)
    private String claimNumber;

    @Column(name = "claim_date", nullable = false)
    @Builder.Default
    private LocalDate claimDate = LocalDate.now();

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ReclamationStatus status = ReclamationStatus.DRAFT;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
