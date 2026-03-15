package com.privod.platform.infrastructure.dadata;

import java.time.LocalDateTime;
import java.util.List;

public record ChekkaResponse(
    String inn,
    String riskLevel,              // LOW / MEDIUM / HIGH / UNKNOWN
    Integer riskScore,             // 0-100
    Boolean isActive,
    Boolean hasBankruptcy,
    Boolean hasDebts,
    Integer arbitrationCount,
    Integer arbitrationAsPlaintiff,
    Integer arbitrationAsDefendant,
    List<String> relatedCompanies,
    String legalAddress,
    LocalDateTime lastUpdated,
    String error                   // null if success
) {
    public static ChekkaResponse ofError(String inn, String error) {
        return new ChekkaResponse(inn, "UNKNOWN", null, null, null, null,
                null, null, null, null, null, LocalDateTime.now(), error);
    }
}
