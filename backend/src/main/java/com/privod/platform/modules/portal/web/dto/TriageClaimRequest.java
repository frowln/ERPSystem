package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClaimPriority;

public record TriageClaimRequest(
        ClaimPriority priority,
        String internalNotes
) {
}
