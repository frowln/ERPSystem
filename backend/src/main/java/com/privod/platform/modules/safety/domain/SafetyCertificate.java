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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "safety_certificates", indexes = {
        @Index(name = "idx_sc_employee", columnList = "employee_id"),
        @Index(name = "idx_sc_type", columnList = "type"),
        @Index(name = "idx_sc_number", columnList = "number"),
        @Index(name = "idx_sc_expiry", columnList = "expiry_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyCertificate extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "type", nullable = false, length = 200)
    private String type;

    @Column(name = "number", length = 100)
    private String number;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "issuing_authority", length = 500)
    private String issuingAuthority;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
