package com.privod.platform.modules.organization.web.dto;

import com.privod.platform.modules.organization.domain.EnrichmentSource;
import com.privod.platform.modules.organization.domain.PartnerEnrichment;
import com.privod.platform.modules.organization.domain.PartnerLegalStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PartnerEnrichmentResponse(
        UUID id,
        UUID partnerId,
        String inn,
        String ogrn,
        String kpp,
        String legalName,
        String tradeName,
        String legalAddress,
        String actualAddress,
        LocalDate registrationDate,
        PartnerLegalStatus status,
        String statusDisplayName,
        BigDecimal authorizedCapital,
        String ceoName,
        String ceoInn,
        Integer employeeCount,
        String mainActivity,
        String okvedCode,
        Instant enrichedAt,
        EnrichmentSource source,
        String sourceDisplayName,
        int reliabilityScore,
        Instant createdAt,
        Instant updatedAt
) {
    public static PartnerEnrichmentResponse fromEntity(PartnerEnrichment enrichment) {
        return new PartnerEnrichmentResponse(
                enrichment.getId(),
                enrichment.getPartnerId(),
                enrichment.getInn(),
                enrichment.getOgrn(),
                enrichment.getKpp(),
                enrichment.getLegalName(),
                enrichment.getTradeName(),
                enrichment.getLegalAddress(),
                enrichment.getActualAddress(),
                enrichment.getRegistrationDate(),
                enrichment.getStatus(),
                enrichment.getStatus().getDisplayName(),
                enrichment.getAuthorizedCapital(),
                enrichment.getCeoName(),
                enrichment.getCeoInn(),
                enrichment.getEmployeeCount(),
                enrichment.getMainActivity(),
                enrichment.getOkvedCode(),
                enrichment.getEnrichedAt(),
                enrichment.getSource(),
                enrichment.getSource().getDisplayName(),
                enrichment.getReliabilityScore(),
                enrichment.getCreatedAt(),
                enrichment.getUpdatedAt()
        );
    }
}
