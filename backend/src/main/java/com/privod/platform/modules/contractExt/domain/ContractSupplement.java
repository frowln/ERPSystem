package com.privod.platform.modules.contractExt.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "contract_supplements", indexes = {
        @Index(name = "idx_supplement_contract", columnList = "contract_id"),
        @Index(name = "idx_supplement_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractSupplement extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "supplement_date", nullable = false)
    private LocalDate supplementDate;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "amount_change", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal amountChange = BigDecimal.ZERO;

    @Column(name = "new_total_amount", precision = 18, scale = 2)
    private BigDecimal newTotalAmount;

    @Column(name = "deadline_change")
    private Integer deadlineChange;

    @Column(name = "new_deadline")
    private LocalDate newDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SupplementStatus status = SupplementStatus.DRAFT;

    @Column(name = "signed_at")
    private Instant signedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "signatories", columnDefinition = "jsonb")
    private List<String> signatories;
}
