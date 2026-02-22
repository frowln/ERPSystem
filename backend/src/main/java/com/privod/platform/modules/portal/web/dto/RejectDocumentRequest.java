package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectDocumentRequest(
        @NotBlank(message = "Причина отклонения обязательна")
        String reason
) {
}
