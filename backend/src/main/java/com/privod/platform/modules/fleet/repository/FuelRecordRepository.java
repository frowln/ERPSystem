package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.FuelRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FuelRecordRepository extends JpaRepository<FuelRecord, UUID> {

    Page<FuelRecord> findByVehicleIdAndDeletedFalse(UUID vehicleId, Pageable pageable);

    List<FuelRecord> findByVehicleIdAndDeletedFalseOrderByFuelDateDesc(UUID vehicleId);

    Page<FuelRecord> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(f.totalCost), 0) FROM FuelRecord f " +
            "WHERE f.projectId = :projectId AND f.deleted = false")
    BigDecimal sumCostByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(f.totalCost), 0) FROM FuelRecord f " +
            "WHERE f.vehicleId = :vehicleId AND f.deleted = false " +
            "AND f.fuelDate >= :from AND f.fuelDate <= :to")
    BigDecimal sumCostByVehicleIdAndDateRange(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(f.quantity), 0) FROM FuelRecord f " +
            "WHERE f.vehicleId = :vehicleId AND f.deleted = false " +
            "AND f.fuelDate >= :from AND f.fuelDate <= :to")
    BigDecimal sumQuantityByVehicleIdAndDateRange(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
