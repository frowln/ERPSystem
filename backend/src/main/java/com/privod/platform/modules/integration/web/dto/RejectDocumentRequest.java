package com.privod.platform.modules.integration.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectDocumentRequest(
        @NotBlank(message = "Причина отклонения обязательна")
        @Size(max = 2000, message = "Причина отклонения не должна превышать 2000 символов")
        String reason
) {
}
