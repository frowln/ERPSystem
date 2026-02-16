package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequest(
        @NotBlank(message = "Причина отклонения обязательна")
        @Size(max = 5000, message = "Причина отклонения не должна превышать 5000 символов")
        String reason
) {
}
