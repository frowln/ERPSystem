package com.privod.platform.modules.prequalification.web.dto;

import com.privod.platform.modules.prequalification.domain.Prequalification;
import java.math.BigDecimal;
import java.util.UUID;

public record PrequalificationResponse(
    UUID id, String companyName, String inn, String contactPerson,
    String workType, BigDecimal annualRevenue, Integer yearsInBusiness,
    Boolean hasSroMembership, String sroNumber,
    Integer totalScore, Integer financialScore, Integer experienceScore, Integer safetyScore,
    String qualificationResult, String status, String createdAt
) {
    public static PrequalificationResponse fromEntity(Prequalification e) {
        return new PrequalificationResponse(
            e.getId(), e.getCompanyName(), e.getInn(), e.getContactPerson(),
            e.getWorkType(), e.getAnnualRevenue(), e.getYearsInBusiness(),
            e.getHasSroMembership(), e.getSroNumber(),
            e.getTotalScore(), e.getFinancialScore(), e.getExperienceScore(), e.getSafetyScore(),
            e.getQualificationResult(), e.getStatus() != null ? e.getStatus().name() : "PENDING",
            e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
