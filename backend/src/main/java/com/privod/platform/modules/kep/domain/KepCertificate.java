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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kep_certificates", indexes = {
        @Index(name = "idx_kep_cert_owner", columnList = "owner_id"),
        @Index(name = "idx_kep_cert_status", columnList = "status"),
        @Index(name = "idx_kep_cert_serial", columnList = "serial_number"),
        @Index(name = "idx_kep_cert_thumbprint", columnList = "thumbprint"),
        @Index(name = "idx_kep_cert_valid_to", columnList = "valid_to"),
        @Index(name = "idx_kep_cert_inn", columnList = "subject_inn")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KepCertificate extends BaseEntity {

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "owner_name", nullable = false, length = 500)
    private String ownerName;

    @Column(name = "serial_number", nullable = false, length = 100)
    private String serialNumber;

    @Column(name = "issuer", nullable = false, length = 500)
    private String issuer;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_to", nullable = false)
    private LocalDateTime validTo;

    @Column(name = "thumbprint", nullable = false, length = 100)
    private String thumbprint;

    @Column(name = "subject_cn", length = 500)
    private String subjectCn;

    @Column(name = "subject_org", length = 500)
    private String subjectOrg;

    @Column(name = "subject_inn", length = 20)
    private String subjectInn;

    @Column(name = "subject_ogrn", length = 20)
    private String subjectOgrn;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private KepCertificateStatus status = KepCertificateStatus.ACTIVE;

    @Column(name = "certificate_data", columnDefinition = "TEXT")
    private String certificateData;

    @Column(name = "is_qualified", nullable = false)
    @Builder.Default
    private boolean qualified = true;

    public boolean isExpired() {
        return validTo != null && LocalDateTime.now().isAfter(validTo);
    }

    public boolean isActive() {
        return status == KepCertificateStatus.ACTIVE && !isExpired();
    }
}
