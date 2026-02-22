package com.privod.platform.modules.hr.domain;

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
@Table(name = "employee_certificates", indexes = {
        @Index(name = "idx_cert_employee", columnList = "employee_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCertificate extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "certificate_type", nullable = false, length = 30)
    private CertificateType certificateType;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "number", length = 100)
    private String number;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "issued_by", length = 500)
    private String issuedBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private CertificateStatus status = CertificateStatus.VALID;

    public boolean isExpired() {
        if (expiryDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(expiryDate);
    }

    public void recalculateStatus() {
        if (expiryDate == null) {
            this.status = CertificateStatus.VALID;
            return;
        }
        LocalDate today = LocalDate.now();
        if (today.isAfter(expiryDate)) {
            this.status = CertificateStatus.EXPIRED;
        } else if (today.plusDays(90).isAfter(expiryDate)) {
            this.status = CertificateStatus.EXPIRING;
        } else {
            this.status = CertificateStatus.VALID;
        }
    }
}
