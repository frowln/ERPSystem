package com.privod.platform.modules.contract.domain;

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
@Table(name = "contracts", indexes = {
        @Index(name = "idx_contract_org", columnList = "organization_id"),
        @Index(name = "idx_contract_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_contract_org_number", columnList = "organization_id, number", unique = true),
        @Index(name = "idx_contract_project", columnList = "project_id"),
        @Index(name = "idx_contract_partner", columnList = "partner_id"),
        @Index(name = "idx_contract_status", columnList = "status"),
        @Index(name = "idx_contract_type", columnList = "type_id"),
        @Index(name = "idx_contract_responsible", columnList = "responsible_id"),
        @Index(name = "idx_contract_number", columnList = "number"),
        @Index(name = "idx_contract_planned_end", columnList = "planned_end_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contract extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "contract_date")
    private LocalDate contractDate;

    @Column(name = "partner_id")
    private UUID partnerId;

    @Column(name = "partner_name", length = 500)
    private String partnerName;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "type_id")
    private UUID typeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatRate = new BigDecimal("20.00");

    @Column(name = "vat_amount", precision = 18, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_with_vat", precision = 18, scale = 2)
    private BigDecimal totalWithVat;

    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Column(name = "planned_start_date")
    private LocalDate plannedStartDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "retention_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal retentionPercent = BigDecimal.ZERO;

    @Column(name = "doc_version")
    @Builder.Default
    private Integer docVersion = 1;

    @Column(name = "version_comment", columnDefinition = "TEXT")
    private String versionComment;

    @Column(name = "parent_version_id")
    private UUID parentVersionId;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "total_invoiced", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalInvoiced = BigDecimal.ZERO;

    @Column(name = "total_paid", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(ContractStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public BigDecimal getBalance() {
        BigDecimal invoiced = totalInvoiced != null ? totalInvoiced : BigDecimal.ZERO;
        BigDecimal paid = totalPaid != null ? totalPaid : BigDecimal.ZERO;
        return invoiced.subtract(paid);
    }

    public boolean isExpired() {
        if (plannedEndDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(plannedEndDate)
                && status != ContractStatus.CLOSED
                && status != ContractStatus.CANCELLED;
    }
}
