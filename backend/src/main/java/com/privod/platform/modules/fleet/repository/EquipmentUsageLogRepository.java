package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.EquipmentUsageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EquipmentUsageLogRepository extends JpaRepository<EquipmentUsageLog, UUID> {

    Optional<EquipmentUsageLog> findByIdAndDeletedFalse(UUID id);

    Page<EquipmentUsageLog> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<EquipmentUsageLog> findByVehicleIdAndDeletedFalse(UUID vehicleId, Pageable pageable);

    Page<EquipmentUsageLog> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<EquipmentUsageLog> findByOrganizationIdAndVehicleIdAndDeletedFalse(
            UUID organizationId, UUID vehicleId, Pageable pageable);

    Page<EquipmentUsageLog> findByOrganizationIdAndProjectIdAndDeletedFalse(
            UUID organizationId, UUID projectId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(u.hoursWorked), 0) FROM EquipmentUsageLog u " +
            "WHERE u.vehicleId = :vehicleId AND u.deleted = false")
    BigDecimal sumHoursWorkedByVehicleId(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT COALESCE(SUM(u.hoursWorked), 0) FROM EquipmentUsageLog u " +
            "WHERE u.vehicleId = :vehicleId AND u.deleted = false " +
            "AND u.usageDate >= :from AND u.usageDate <= :to")
    BigDecimal sumHoursWorkedByVehicleIdAndDateRange(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(u.hoursWorked), 0) FROM EquipmentUsageLog u " +
            "WHERE u.projectId = :projectId AND u.deleted = false")
    BigDecimal sumHoursWorkedByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(u.fuelConsumed), 0) FROM EquipmentUsageLog u " +
            "WHERE u.vehicleId = :vehicleId AND u.deleted = false " +
            "AND u.usageDate >= :from AND u.usageDate <= :to")
    BigDecimal sumFuelConsumedByVehicleIdAndDateRange(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    List<EquipmentUsageLog> findByVehicleIdAndDeletedFalseOrderByUsageDateDesc(UUID vehicleId);
}
