package com.privod.platform.modules.integration.govregistries.web.dto;

import com.privod.platform.modules.integration.govregistries.domain.RiskLevel;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CounterpartyCheckSummary(
        UUID counterpartyId,
        String inn,
        String companyName,
        RiskLevel overallRiskLevel,
        String overallRiskLevelDisplayName,
        int totalChecks,
        int validChecks,
        int invalidChecks,
        int errorChecks,
        Instant lastCheckDate,
        List<String> warnings,
        List<CheckResultResponse> results
) {
}
