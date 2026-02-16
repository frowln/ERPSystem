package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ClaimType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateClaimRequest(
        @NotNull(message = "ID договора обязателен")
        UUID contractId,

        @NotNull(message = "Тип претензии обязателен")
        ClaimType claimType,

        @NotBlank(message = "Тема претензии обязательна")
        @Size(max = 500)
        String subject,

        String description,

        @DecimalMin(value = "0", message = "Сумма претензии не может быть отрицательной")
        BigDecimal amount,

        List<String> evidenceUrls,

        UUID filedById
) {
}
