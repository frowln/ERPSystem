package com.privod.platform.modules.planning.web.dto;

import java.util.List;
import java.util.UUID;

public record CandidateSuggestionResponse(
        UUID employeeId,
        String employeeName,
        int matchScore,
        List<SkillMatch> skillMatches,
        int currentAllocationPct,
        List<String> certWarnings,
        boolean certCompliant
) {
    public record SkillMatch(
            String skillName,
            int requiredLevel,
            int actualLevel,
            boolean certified
    ) {
    }
}
