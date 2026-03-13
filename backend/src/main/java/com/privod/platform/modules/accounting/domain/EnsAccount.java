package com.privod.platform.modules.accounting.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "ens_accounts", indexes = {
        @Index(name = "idx_ens_account_inn", columnList = "inn"),
        @Index(name = "idx_ens_account_org", columnList = "organization_id"),
        @Index(name = "idx_ens_account_active", columnList = "is_active")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnsAccount extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "inn", nullable = false, unique = true, length = 12)
    private String inn;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "last_updated")
    private Instant lastUpdated;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;
}
