package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.EnsOperationType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEnsOperationRequest(
        @NotNull(message = "ID счёта ЕНС обязателен")
        UUID ensAccountId,

        @NotNull(message = "Дата операции обязательна")
        LocalDate operationDate,

        @NotNull(message = "Тип операции обязателен")
        EnsOperationType operationType,

        @Size(max = 100, message = "Тип налога не должен превышать 100 символов")
        String taxType,

        @NotNull(message = "Сумма обязательна")
        @DecimalMin(value = "0.01", message = "Сумма должна быть больше 0")
        BigDecimal amount,

        @Size(max = 2000, message = "Описание не должно превышать 2000 символов")
        String description,

        @Size(max = 100, message = "Номер документа не должен превышать 100 символов")
        String documentNumber,

        LocalDate documentDate
) {
}
