package com.privod.platform.modules.integration.govregistries.web.dto;

import com.privod.platform.modules.integration.govregistries.domain.CheckStatus;
import com.privod.platform.modules.integration.govregistries.domain.RegistryCheckResult;
import com.privod.platform.modules.integration.govregistries.domain.RegistryType;
import com.privod.platform.modules.integration.govregistries.domain.RiskLevel;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CheckResultResponse(
        UUID id,
        UUID counterpartyId,
        String inn,
        String ogrn,
        RegistryType registryType,
        String registryTypeDisplayName,
        Instant checkDate,
        CheckStatus status,
        String statusDisplayName,
        String companyName,
        LocalDate registrationDate,
        boolean isActive,
        String chiefName,
        BigDecimal authorizedCapital,
        RiskLevel riskLevel,
        String riskLevelDisplayName,
        String warnings,
        Instant createdAt
) {
    public static CheckResultResponse fromEntity(RegistryCheckResult entity) {
        return new CheckResultResponse(
                entity.getId(),
                entity.getCounterpartyId(),
                entity.getInn(),
                entity.getOgrn(),
                entity.getRegistryType(),
                entity.getRegistryType().getDisplayName(),
                entity.getCheckDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCompanyName(),
                entity.getRegistrationDate(),
                entity.isActive(),
                entity.getChiefName(),
                entity.getAuthorizedCapital(),
                entity.getRiskLevel(),
                entity.getRiskLevel() != null ? entity.getRiskLevel().getDisplayName() : null,
                entity.getWarnings(),
                entity.getCreatedAt()
        );
    }
}
