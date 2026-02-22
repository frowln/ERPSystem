package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.BodyPart;
import com.privod.platform.modules.safety.domain.IncidentInjuredPerson;
import com.privod.platform.modules.safety.domain.InjuredPersonOutcome;
import com.privod.platform.modules.safety.domain.InjuryType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record InjuredPersonResponse(
        UUID id,
        UUID incidentId,
        UUID employeeId,
        String fullName,
        String position,
        String department,
        LocalDate dateOfBirth,
        BigDecimal yearsOfExperience,
        InjuryType injuryType,
        String injuryTypeDisplayName,
        BodyPart bodyPart,
        String bodyPartDisplayName,
        String injuryDescription,
        boolean medicalTreatment,
        boolean hospitalized,
        String hospitalName,
        Integer workDaysLost,
        boolean returnedToWork,
        LocalDate returnDate,
        String disabilityType,
        InjuredPersonOutcome outcome,
        String outcomeDisplayName,
        Instant createdAt
) {
    public static InjuredPersonResponse fromEntity(IncidentInjuredPerson p) {
        return new InjuredPersonResponse(
                p.getId(),
                p.getIncidentId(),
                p.getEmployeeId(),
                p.getFullName(),
                p.getPosition(),
                p.getDepartment(),
                p.getDateOfBirth(),
                p.getYearsOfExperience(),
                p.getInjuryType(),
                p.getInjuryType().getDisplayName(),
                p.getBodyPart(),
                p.getBodyPart().getDisplayName(),
                p.getInjuryDescription(),
                p.isMedicalTreatment(),
                p.isHospitalized(),
                p.getHospitalName(),
                p.getWorkDaysLost(),
                p.isReturnedToWork(),
                p.getReturnDate(),
                p.getDisabilityType(),
                p.getOutcome(),
                p.getOutcome() != null ? p.getOutcome().getDisplayName() : null,
                p.getCreatedAt()
        );
    }
}
