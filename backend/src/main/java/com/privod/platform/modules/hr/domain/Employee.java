package com.privod.platform.modules.hr.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import com.privod.platform.infrastructure.security.EncryptedFieldConverter;
import com.privod.platform.infrastructure.validation.ValidSnils;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employees", indexes = {
        @Index(name = "idx_employee_user", columnList = "user_id"),
        @Index(name = "idx_employee_organization", columnList = "organization_id"),
        @Index(name = "idx_employee_status", columnList = "status"),
        @Index(name = "idx_employee_number", columnList = "employee_number", unique = true)
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee extends BaseEntity {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "first_name", nullable = false, length = 255)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 255)
    private String lastName;

    @Column(name = "middle_name", length = 255)
    private String middleName;

    @Column(name = "full_name", length = 765)
    private String fullName;

    @Column(name = "employee_number", unique = true, length = 20)
    private String employeeNumber;

    @Column(name = "position", length = 200)
    private String position;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "phone", columnDefinition = "TEXT")
    private String phone;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "email", columnDefinition = "TEXT")
    private String email;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "passport_number", columnDefinition = "TEXT")
    private String passportNumber;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "inn", columnDefinition = "TEXT")
    private String inn;

    @ValidSnils
    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "snils", columnDefinition = "TEXT")
    private String snils;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Column(name = "monthly_rate", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal monthlyRate = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void computeFullName() {
        StringBuilder sb = new StringBuilder();
        if (lastName != null) {
            sb.append(lastName);
        }
        if (firstName != null) {
            if (!sb.isEmpty()) sb.append(" ");
            sb.append(firstName);
        }
        if (middleName != null) {
            if (!sb.isEmpty()) sb.append(" ");
            sb.append(middleName);
        }
        this.fullName = sb.toString();
    }
}
