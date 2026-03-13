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
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "hr_qualification_records", indexes = {
        @Index(name = "idx_qual_employee", columnList = "employee_id"),
        @Index(name = "idx_qual_org", columnList = "organization_id"),
        @Index(name = "idx_qual_type", columnList = "qualification_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualificationRecord extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 500)
    private String employeeName;

    @Column(name = "qualification_type", nullable = false, length = 100)
    private String qualificationType;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private QualificationStatus status = QualificationStatus.VALID;

    public enum QualificationStatus {
        VALID, EXPIRING, EXPIRED
    }
}
