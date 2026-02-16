package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.ContractorStatus;
import com.privod.platform.modules.selfEmployed.domain.TaxStatus;
import jakarta.validation.constraints.Size;

public record UpdateContractorRequest(
        @Size(max = 500, message = "ФИО не должно превышать 500 символов")
        String fullName,

        @Size(max = 20)
        String phone,

        @Size(max = 255)
        String email,

        @Size(max = 20, message = "Расчётный счёт не должен превышать 20 символов")
        String bankAccount,

        @Size(max = 9, message = "БИК не должен превышать 9 символов")
        String bic,

        ContractorStatus status,

        TaxStatus taxStatus,

        String projectIds
) {
}
