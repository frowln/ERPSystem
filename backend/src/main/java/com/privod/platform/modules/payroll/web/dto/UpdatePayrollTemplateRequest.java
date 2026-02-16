package com.privod.platform.modules.payroll.web.dto;

import com.privod.platform.modules.payroll.domain.PayrollType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdatePayrollTemplateRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        PayrollType type,

        @DecimalMin(value = "0", message = "Базовый оклад не может быть отрицательным")
        BigDecimal baseSalary,

        @DecimalMin(value = "0", message = "Почасовая ставка не может быть отрицательной")
        BigDecimal hourlyRate,

        @DecimalMin(value = "1.0", message = "Множитель сверхурочных должен быть не менее 1.0")
        BigDecimal overtimeMultiplier,

        @DecimalMin(value = "0", message = "Процент премии не может быть отрицательным")
        BigDecimal bonusPercentage,

        @DecimalMin(value = "0", message = "Ставка НДФЛ не может быть отрицательной")
        BigDecimal taxRate,

        @DecimalMin(value = "0", message = "Ставка пенсионных взносов не может быть отрицательной")
        BigDecimal pensionRate,

        @DecimalMin(value = "0", message = "Ставка социальных взносов не может быть отрицательной")
        BigDecimal socialRate,

        @DecimalMin(value = "0", message = "Ставка медицинских взносов не может быть отрицательной")
        BigDecimal medicalRate,

        @Size(max = 3)
        String currency,

        Boolean isActive,

        UUID projectId
) {
}
