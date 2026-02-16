package com.privod.platform.modules.contract.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateContractTypeRequest(
        @NotBlank(message = "Код типа договора обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @NotBlank(message = "Наименование типа договора обязательно")
        @Size(max = 200, message = "Наименование не должно превышать 200 символов")
        String name,

        String description,

        Integer sequence,

        Boolean active,

        Boolean requiresLawyerApproval,

        Boolean requiresManagementApproval,

        Boolean requiresFinanceApproval
) {
}
