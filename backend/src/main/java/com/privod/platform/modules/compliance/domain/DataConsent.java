package com.privod.platform.modules.compliance.domain;

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

import java.time.Instant;
import java.util.UUID;

/**
 * Запись о согласии субъекта на обработку персональных данных (ст. 9 152-ФЗ).
 */
@Entity
@Table(name = "data_consents", indexes = {
        @Index(name = "idx_dc_org", columnList = "organization_id"),
        @Index(name = "idx_dc_user", columnList = "user_id"),
        @Index(name = "idx_dc_type", columnList = "consent_type"),
        @Index(name = "idx_dc_active", columnList = "is_active")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataConsent extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 50)
    private ConsentType consentType;

    @Column(name = "consented_at", nullable = false)
    @Builder.Default
    private Instant consentedAt = Instant.now();

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "consent_version", nullable = false, length = 20)
    @Builder.Default
    private String consentVersion = "1.0";

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false, length = 50)
    @Builder.Default
    private LegalBasis legalBasis = LegalBasis.CONSENT;

    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "data_categories", columnDefinition = "TEXT")
    private String dataCategories;

    @Column(name = "retention_days")
    private Integer retentionDays;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    /**
     * Отзыв согласия (ст. 9, п. 2 152-ФЗ).
     */
    public void revoke() {
        this.revokedAt = Instant.now();
        this.isActive = false;
    }
}
