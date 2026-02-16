package com.privod.platform.modules.quality.domain;

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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_certificates", indexes = {
        @Index(name = "idx_mc_material", columnList = "material_id"),
        @Index(name = "idx_mc_certificate_number", columnList = "certificate_number"),
        @Index(name = "idx_mc_certificate_type", columnList = "certificate_type"),
        @Index(name = "idx_mc_status", columnList = "status"),
        @Index(name = "idx_mc_expiry_date", columnList = "expiry_date"),
        @Index(name = "idx_mc_issued_date", columnList = "issued_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCertificate extends BaseEntity {

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "certificate_number", nullable = false, length = 100)
    private String certificateNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "certificate_type", nullable = false, length = 30)
    private MaterialCertificateType certificateType;

    @Column(name = "issued_by", length = 500)
    private String issuedBy;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private MaterialCertificateStatus status = MaterialCertificateStatus.PENDING_VERIFICATION;

    @Column(name = "verified_by_id")
    private UUID verifiedById;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
