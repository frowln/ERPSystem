package com.privod.platform.modules.contractExt.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateSupplementRequest(
        @NotNull(message = "ID договора обязателен")
        UUID contractId,

        @NotBlank(message = "Номер дополнительного соглашения обязателен")
        @Size(max = 100)
        String number,

        LocalDate supplementDate,

        @Size(max = 500)
        String reason,

        String description,

        BigDecimal amountChange,

        BigDecimal newTotalAmount,

        Integer deadlineChange,

        LocalDate newDeadline,

        List<String> signatories
) {
}
