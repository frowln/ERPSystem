package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.ContractType;
import com.privod.platform.modules.hrRussian.domain.SalaryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEmploymentContractRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotBlank(message = "Номер договора обязателен")
        @Size(max = 50, message = "Номер договора не должен превышать 50 символов")
        String contractNumber,

        @NotNull(message = "Тип договора обязателен")
        ContractType contractType,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        LocalDate endDate,

        @NotNull(message = "Оклад обязателен")
        BigDecimal salary,

        @NotNull(message = "Тип оплаты обязателен")
        SalaryType salaryType,

        @Size(max = 300)
        String position,

        @Size(max = 300)
        String department,

        LocalDate probationEndDate,

        @Size(max = 200)
        String workSchedule
) {
}
