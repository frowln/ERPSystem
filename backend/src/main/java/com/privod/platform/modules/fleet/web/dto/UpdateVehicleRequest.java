package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.FuelType;
import com.privod.platform.modules.fleet.domain.VehicleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateVehicleRequest(
        @Size(max = 20, message = "Гос. номер не должен превышать 20 символов")
        String licensePlate,

        @Size(max = 100, message = "Марка не должна превышать 100 символов")
        String make,

        @Size(max = 100, message = "Модель не должна превышать 100 символов")
        String model,

        @Min(value = 1900, message = "Год выпуска не может быть ранее 1900")
        @Max(value = 2100, message = "Год выпуска не может быть позднее 2100")
        Integer year,

        @Size(max = 50, message = "VIN не должен превышать 50 символов")
        String vin,

        VehicleType vehicleType,

        UUID currentLocationId,
        UUID responsibleId,

        LocalDate purchaseDate,

        @DecimalMin(value = "0", message = "Стоимость покупки не может быть отрицательной")
        BigDecimal purchasePrice,

        @DecimalMin(value = "0", message = "Текущая стоимость не может быть отрицательной")
        BigDecimal currentValue,

        @DecimalMin(value = "0", message = "Ставка амортизации не может быть отрицательной")
        BigDecimal depreciationRate,

        FuelType fuelType,

        @DecimalMin(value = "0", message = "Расход топлива не может быть отрицательным")
        BigDecimal fuelConsumptionRate,

        @DecimalMin(value = "0", message = "Пробег не может быть отрицательным")
        BigDecimal currentMileage,

        @DecimalMin(value = "0", message = "Моточасы не могут быть отрицательными")
        BigDecimal currentHours,

        LocalDate insuranceExpiryDate,
        LocalDate techInspectionExpiryDate,

        String notes
) {
}
