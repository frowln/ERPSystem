package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.MaintenanceRecord;
import com.privod.platform.modules.fleet.domain.MaintenanceStatus;
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
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {

    Optional<MaintenanceRecord> findByIdAndDeletedFalse(UUID id);

    Page<MaintenanceRecord> findByVehicleIdInAndDeletedFalse(List<UUID> vehicleIds, Pageable pageable);

    Page<MaintenanceRecord> findByVehicleIdInAndStatusAndDeletedFalse(List<UUID> vehicleIds, MaintenanceStatus status, Pageable pageable);

    Page<MaintenanceRecord> findByVehicleIdAndDeletedFalse(UUID vehicleId, Pageable pageable);

    List<MaintenanceRecord> findByVehicleIdAndDeletedFalseOrderByStartDateDesc(UUID vehicleId);

    Page<MaintenanceRecord> findByStatusAndDeletedFalse(MaintenanceStatus status, Pageable pageable);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.deleted = false " +
            "AND m.status IN ('PLANNED', 'IN_PROGRESS') " +
            "AND m.startDate <= :threshold ORDER BY m.startDate ASC")
    List<MaintenanceRecord> findUpcomingMaintenance(@Param("threshold") LocalDate threshold);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.deleted = false AND m.vehicleId IN :vehicleIds " +
            "AND m.status IN ('PLANNED', 'IN_PROGRESS') " +
            "AND m.startDate <= :threshold ORDER BY m.startDate ASC")
    List<MaintenanceRecord> findUpcomingMaintenanceByVehicleIds(@Param("vehicleIds") List<UUID> vehicleIds,
                                                                @Param("threshold") LocalDate threshold);

    @Query("SELECT COALESCE(SUM(m.cost), 0) FROM MaintenanceRecord m " +
            "WHERE m.vehicleId = :vehicleId AND m.status = 'COMPLETED' AND m.deleted = false")
    BigDecimal sumCostByVehicleId(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT COALESCE(SUM(m.cost), 0) FROM MaintenanceRecord m " +
            "WHERE m.vehicleId = :vehicleId AND m.status = 'COMPLETED' AND m.deleted = false " +
            "AND m.startDate >= :from AND m.startDate <= :to")
    BigDecimal sumCostByVehicleIdAndDateRange(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
