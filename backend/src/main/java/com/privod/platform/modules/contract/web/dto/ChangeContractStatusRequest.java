package com.privod.platform.modules.contract.web.dto;

import com.privod.platform.modules.contract.domain.ContractStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeContractStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        ContractStatus status,

        String reason
) {
}
