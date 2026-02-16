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
import java.util.UUID;

@Entity
@Table(name = "quality_certificates", indexes = {
        @Index(name = "idx_cert_material", columnList = "material_id"),
        @Index(name = "idx_cert_supplier", columnList = "supplier_id"),
        @Index(name = "idx_cert_type", columnList = "certificate_type"),
        @Index(name = "idx_cert_number", columnList = "certificate_number"),
        @Index(name = "idx_cert_expiry", columnList = "expiry_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityCertificate extends BaseEntity {

    @Column(name = "material_id")
    private UUID materialId;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "supplier_name", length = 500)
    private String supplierName;

    @Column(name = "certificate_number", nullable = false, length = 100)
    private String certificateNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "certificate_type", nullable = false, length = 30)
    private CertificateType certificateType;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "verified_by_id")
    private UUID verifiedById;
}
