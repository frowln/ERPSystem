package com.privod.platform.modules.safety.web.dto;

import java.util.List;

/**
 * Complete data for Form Н-1 (accident report per Russian labor law).
 * Contains all incident details + injured persons + corrective actions.
 */
public record FormN1DataResponse(
        IncidentResponse incident,
        List<InjuredPersonResponse> injuredPersons,
        List<CorrectiveActionResponse> correctiveActions,
        long injuredCount,
        int totalWorkDaysLost,
        boolean requiresRegulatoryNotification,
        String regulatoryDeadlineWarning
) {
}
