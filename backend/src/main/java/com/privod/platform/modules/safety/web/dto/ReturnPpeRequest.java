package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.PpeCondition;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReturnPpeRequest(
        @NotNull(message = "Дата возврата обязательна")
        LocalDate returnDate,

        @NotNull(message = "Состояние при возврате обязательно")
        PpeCondition condition
) {
}
