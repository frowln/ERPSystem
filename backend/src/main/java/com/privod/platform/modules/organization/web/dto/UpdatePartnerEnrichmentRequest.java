package com.privod.platform.modules.organization.web.dto;

import com.privod.platform.modules.organization.domain.EnrichmentSource;
import com.privod.platform.modules.organization.domain.PartnerLegalStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdatePartnerEnrichmentRequest(
        String inn,
        String ogrn,
        String kpp,
        String legalName,
        String tradeName,
        String legalAddress,
        String actualAddress,
        LocalDate registrationDate,
        PartnerLegalStatus status,
        BigDecimal authorizedCapital,
        String ceoName,
        String ceoInn,
        Integer employeeCount,
        String mainActivity,
        String okvedCode,
        EnrichmentSource source,
        Integer reliabilityScore
) {
}
