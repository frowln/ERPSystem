package com.privod.platform.modules.maintenance.web.dto;

import com.privod.platform.modules.maintenance.domain.EquipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEquipmentRequest(
        @NotBlank(message = "Equipment name is required")
        @Size(max = 300, message = "Name must not exceed 300 characters")
        String name,

        @Size(max = 100)
        String serialNumber,

        @Size(max = 200)
        String model,

        @Size(max = 100)
        String category,

        UUID assignedTo,

        @Size(max = 500)
        String location,

        LocalDate purchaseDate,

        LocalDate warrantyDate,

        @Positive(message = "Cost must be positive")
        BigDecimal cost,

        EquipmentStatus status,

        @Size(max = 5000)
        String notes,

        @PositiveOrZero(message = "Maintenance frequency must be zero or positive")
        Integer maintenanceFrequencyDays
) {
}
