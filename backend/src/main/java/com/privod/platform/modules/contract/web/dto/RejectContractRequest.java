package com.privod.platform.modules.contract.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectContractRequest(
        @NotBlank(message = "Этап согласования обязателен")
        String stage,

        @NotBlank(message = "Причина отклонения обязательна")
        String reason
) {
}
