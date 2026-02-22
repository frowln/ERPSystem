package com.privod.platform.modules.safety.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "incident_injured_persons", indexes = {
        @Index(name = "idx_iip_incident", columnList = "incident_id"),
        @Index(name = "idx_iip_employee", columnList = "employee_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentInjuredPerson extends BaseEntity {

    @Column(name = "incident_id", nullable = false)
    private UUID incidentId;

    @Column(name = "employee_id")
    private UUID employeeId;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "position", length = 200)
    private String position;

    @Column(name = "department", length = 200)
    private String department;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "years_of_experience", precision = 4, scale = 1)
    private BigDecimal yearsOfExperience;

    @Enumerated(EnumType.STRING)
    @Column(name = "injury_type", nullable = false, length = 30)
    private InjuryType injuryType;

    @Enumerated(EnumType.STRING)
    @Column(name = "body_part", nullable = false, length = 30)
    private BodyPart bodyPart;

    @Column(name = "injury_description", columnDefinition = "TEXT")
    private String injuryDescription;

    @Column(name = "medical_treatment", nullable = false)
    @Builder.Default
    private boolean medicalTreatment = false;

    @Column(name = "hospitalized", nullable = false)
    @Builder.Default
    private boolean hospitalized = false;

    @Column(name = "hospital_name", length = 300)
    private String hospitalName;

    @Column(name = "work_days_lost")
    @Builder.Default
    private Integer workDaysLost = 0;

    @Column(name = "returned_to_work")
    @Builder.Default
    private boolean returnedToWork = false;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "disability_type", length = 50)
    private String disabilityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", length = 30)
    private InjuredPersonOutcome outcome;
}
