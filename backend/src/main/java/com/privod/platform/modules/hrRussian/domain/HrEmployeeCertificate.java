package com.privod.platform.modules.hrRussian.domain;

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
@Table(name = "hr_employee_certificates", indexes = {
        @Index(name = "idx_hr_cert_employee", columnList = "employee_id"),
        @Index(name = "idx_hr_cert_type", columnList = "certificate_type_id"),
        @Index(name = "idx_hr_cert_expiry", columnList = "expiry_date"),
        @Index(name = "idx_hr_cert_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HrEmployeeCertificate extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "certificate_type_id")
    private UUID certificateTypeId;

    @Column(name = "certificate_name", nullable = false, length = 500)
    private String certificateName;

    @Column(name = "issuer", length = 500)
    private String issuer;

    @Column(name = "number", length = 100)
    private String number;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CertificateStatus status = CertificateStatus.VALID;

    public boolean isExpired() {
        if (expiryDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(expiryDate);
    }

    public boolean isExpiring(int daysThreshold) {
        if (expiryDate == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !today.isAfter(expiryDate) &&
                today.plusDays(daysThreshold).isAfter(expiryDate);
    }
}
