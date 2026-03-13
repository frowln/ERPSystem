package com.privod.platform.modules.safety.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "safety_training_records", indexes = {
        @Index(name = "idx_training_record_org", columnList = "organization_id"),
        @Index(name = "idx_training_record_employee", columnList = "employee_id"),
        @Index(name = "idx_training_record_type", columnList = "training_type"),
        @Index(name = "idx_training_record_expiry", columnList = "expiry_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingRecord extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 300)
    private String employeeName;

    @Column(name = "training_type", nullable = false, length = 100)
    private String trainingType;

    @Column(name = "completed_date", nullable = false)
    private LocalDate completedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
