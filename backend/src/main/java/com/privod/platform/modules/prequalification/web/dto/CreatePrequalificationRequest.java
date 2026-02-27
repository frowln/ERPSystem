package com.privod.platform.modules.prequalification.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;

public record CreatePrequalificationRequest(
    @NotBlank String companyName,
    String inn,
    UUID counterpartyId,
    String contactPerson, String contactEmail, String contactPhone,
    String workType,
    BigDecimal annualRevenue, Integer yearsInBusiness,
    Boolean hasNoDebts, Boolean hasCreditLine,
    Integer similarProjectsCount, BigDecimal maxProjectValue, Boolean hasReferences,
    Boolean hasSroMembership, String sroNumber,
    Boolean hasIsoCertification, Boolean hasSafetyCertification,
    BigDecimal ltir, Boolean hasSafetyPlan, Boolean noFatalIncidents3y,
    Boolean hasLiabilityInsurance, BigDecimal insuranceCoverage,
    Boolean canProvideBankGuarantee,
    Integer employeeCount, Boolean hasOwnEquipment, Boolean hasOwnTransport,
    String notes
) {}
