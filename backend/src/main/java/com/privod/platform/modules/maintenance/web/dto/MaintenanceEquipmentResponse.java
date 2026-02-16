package com.privod.platform.modules.maintenance.web.dto;

import com.privod.platform.modules.maintenance.domain.EquipmentStatus;
import com.privod.platform.modules.maintenance.domain.MaintenanceEquipment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MaintenanceEquipmentResponse(
        UUID id,
        String name,
        String serialNumber,
        String model,
        String category,
        UUID assignedTo,
        String location,
        LocalDate purchaseDate,
        LocalDate warrantyDate,
        BigDecimal cost,
        EquipmentStatus status,
        String statusDisplayName,
        String notes,
        LocalDate lastMaintenanceDate,
        LocalDate nextMaintenanceDate,
        int maintenanceFrequencyDays,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MaintenanceEquipmentResponse fromEntity(MaintenanceEquipment equipment) {
        return new MaintenanceEquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getSerialNumber(),
                equipment.getModel(),
                equipment.getCategory(),
                equipment.getAssignedTo(),
                equipment.getLocation(),
                equipment.getPurchaseDate(),
                equipment.getWarrantyDate(),
                equipment.getCost(),
                equipment.getStatus(),
                equipment.getStatus().getDisplayName(),
                equipment.getNotes(),
                equipment.getLastMaintenanceDate(),
                equipment.getNextMaintenanceDate(),
                equipment.getMaintenanceFrequencyDays(),
                equipment.getCreatedAt(),
                equipment.getUpdatedAt(),
                equipment.getCreatedBy()
        );
    }
}
