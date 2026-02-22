package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.MaintenanceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateScheduleRuleRequest(
        UUID vehicleId,

        @NotBlank(message = "Название правила обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        String description,

        MaintenanceType maintenanceType,

        @DecimalMin(value = "0", message = "Интервал часов не может быть отрицательным")
        BigDecimal intervalHours,

        @DecimalMin(value = "0", message = "Интервал пробега не может быть отрицательным")
        BigDecimal intervalMileage,

        Integer intervalDays,

        @DecimalMin(value = "0", message = "Предупреждение по часам не может быть отрицательным")
        BigDecimal leadTimeHours,

        @DecimalMin(value = "0", message = "Предупреждение по пробегу не может быть отрицательным")
        BigDecimal leadTimeMileage,

        Integer leadTimeDays,

        Boolean appliesToAllVehicles,

        String notes
) {
}
