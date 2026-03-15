package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.compliance.domain.ConsentType;
import jakarta.validation.constraints.NotNull;

public record RecordConsentRequest(
        @NotNull(message = "Consent type is required")
        ConsentType consentType
) {
}
