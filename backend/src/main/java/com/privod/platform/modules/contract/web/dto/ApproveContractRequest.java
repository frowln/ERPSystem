package com.privod.platform.modules.contract.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ApproveContractRequest(
        @NotBlank(message = "Этап согласования обязателен")
        String stage,

        String comment
) {
}
