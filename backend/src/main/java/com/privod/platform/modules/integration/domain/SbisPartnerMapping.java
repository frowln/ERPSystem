package com.privod.platform.modules.integration.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sbis_partner_mappings", indexes = {
        @Index(name = "idx_sbis_pm_partner", columnList = "partner_id"),
        @Index(name = "idx_sbis_pm_contractor_id", columnList = "sbis_contractor_id"),
        @Index(name = "idx_sbis_pm_contractor_inn", columnList = "sbis_contractor_inn"),
        @Index(name = "idx_sbis_pm_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SbisPartnerMapping extends BaseEntity {

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @Column(name = "partner_name", nullable = false, length = 500)
    private String partnerName;

    @Column(name = "sbis_contractor_id", length = 255)
    private String sbisContractorId;

    @Column(name = "sbis_contractor_inn", length = 12)
    private String sbisContractorInn;

    @Column(name = "sbis_contractor_kpp", length = 9)
    private String sbisContractorKpp;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;
}
