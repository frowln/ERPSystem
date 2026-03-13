package com.privod.platform.modules.selfEmployed.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
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
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "self_employed_workers", indexes = {
        @Index(name = "idx_sew_organization", columnList = "organization_id"),
        @Index(name = "idx_sew_inn", columnList = "inn"),
        @Index(name = "idx_sew_npd_status", columnList = "npd_status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelfEmployedWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "inn", nullable = false, length = 12)
    private String inn;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "npd_status", length = 20)
    @Builder.Default
    private NpdStatus npdStatus = NpdStatus.UNKNOWN;

    @Column(name = "npd_verified_at")
    private Instant npdVerifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false, length = 20)
    @Builder.Default
    private ContractType contractType = ContractType.GPC;

    @Column(name = "contract_number", length = 100)
    private String contractNumber;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "specialization", length = 255)
    private String specialization;

    @Column(name = "hourly_rate", precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "total_paid", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "deleted")
    @Builder.Default
    private boolean deleted = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ElementCollection
    @CollectionTable(
            name = "self_employed_project_links",
            joinColumns = @JoinColumn(name = "worker_id")
    )
    @Column(name = "project_id")
    @Builder.Default
    private Set<UUID> projectIds = new HashSet<>();

    public void softDelete() {
        this.deleted = true;
    }
}
