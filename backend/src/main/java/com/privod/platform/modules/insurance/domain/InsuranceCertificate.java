package com.privod.platform.modules.insurance.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "insurance_certificates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsuranceCertificate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "vendor_id")
    private UUID vendorId;

    @Column(name = "vendor_name", nullable = false, length = 255)
    private String vendorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "certificate_type", nullable = false, length = 50)
    private CertificateType certificateType;

    @Column(name = "policy_number", length = 100)
    private String policyNumber;

    @Column(name = "insurer_name", length = 255)
    private String insurerName;

    @Column(name = "coverage_amount", precision = 18, scale = 2)
    private BigDecimal coverageAmount;

    @Column(name = "deductible", precision = 18, scale = 2)
    private BigDecimal deductible;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "certificate_holder", length = 255)
    private String certificateHolder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private InsuranceCertificateStatus status = InsuranceCertificateStatus.PENDING;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
