package com.privod.platform.modules.kep.domain;

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
 * Machine-readable Power of Attorney (МЧД — Машиночитаемая доверенность)
 * per Federal Law 63-FZ on Electronic Signatures.
 */
@Entity
@Table(name = "mchd_documents", indexes = {
        @Index(name = "idx_mchd_organization", columnList = "organization_id"),
        @Index(name = "idx_mchd_representative_user", columnList = "representative_user_id"),
        @Index(name = "idx_mchd_status", columnList = "status"),
        @Index(name = "idx_mchd_number", columnList = "number")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MchDDocument extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "principal_inn", nullable = false, length = 20)
    private String principalInn;

    @Column(name = "principal_name", nullable = false, length = 500)
    private String principalName;

    @Column(name = "representative_inn", nullable = false, length = 20)
    private String representativeInn;

    @Column(name = "representative_name", nullable = false, length = 500)
    private String representativeName;

    @Column(name = "representative_user_id")
    private UUID representativeUserId;

    @Column(name = "scope", columnDefinition = "TEXT")
    private String scope;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_to", nullable = false)
    private Instant validTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MchDStatus status = MchDStatus.ACTIVE;

    @Column(name = "registry_id", length = 100)
    private String registryId;

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData;

    @Column(name = "signing_certificate_id")
    private UUID signingCertificateId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
