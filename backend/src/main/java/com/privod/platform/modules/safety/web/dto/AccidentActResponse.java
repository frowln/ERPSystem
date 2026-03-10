package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.AccidentAct;
import com.privod.platform.modules.safety.domain.AccidentActStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccidentActResponse(
        UUID id,
        String actNumber,
        UUID projectId,
        UUID incidentId,
        LocalDateTime accidentDate,
        String accidentLocation,
        // Victim
        String victimFullName,
        String victimPosition,
        LocalDate victimBirthDate,
        String victimGender,
        String victimWorkExperience,
        LocalDate victimBriefingDate,
        String victimBriefingType,
        // Investigation
        LocalDate investigationStartDate,
        LocalDate investigationEndDate,
        String commissionChairman,
        String commissionMembers,
        // Circumstances
        String circumstances,
        String rootCauses,
        String correctiveMeasures,
        String responsiblePersons,
        // Injury
        String injuryDescription,
        String injurySeverity,
        Integer workDaysLost,
        boolean hospitalization,
        boolean fatal,
        // Status
        AccidentActStatus status,
        String statusDisplayName,
        String approvedByName,
        LocalDate approvedDate,
        LocalDate sentToAuthoritiesDate,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static AccidentActResponse fromEntity(AccidentAct entity) {
        return new AccidentActResponse(
                entity.getId(),
                entity.getActNumber(),
                entity.getProjectId(),
                entity.getIncidentId(),
                entity.getAccidentDate(),
                entity.getAccidentLocation(),
                entity.getVictimFullName(),
                entity.getVictimPosition(),
                entity.getVictimBirthDate(),
                entity.getVictimGender(),
                entity.getVictimWorkExperience(),
                entity.getVictimBriefingDate(),
                entity.getVictimBriefingType(),
                entity.getInvestigationStartDate(),
                entity.getInvestigationEndDate(),
                entity.getCommissionChairman(),
                entity.getCommissionMembers(),
                entity.getCircumstances(),
                entity.getRootCauses(),
                entity.getCorrectiveMeasures(),
                entity.getResponsiblePersons(),
                entity.getInjuryDescription(),
                entity.getInjurySeverity(),
                entity.getWorkDaysLost(),
                entity.isHospitalization(),
                entity.isFatal(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getApprovedByName(),
                entity.getApprovedDate(),
                entity.getSentToAuthoritiesDate(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
