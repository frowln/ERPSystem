package com.privod.platform.modules.fleet.repository;

import com.privod.platform.modules.fleet.domain.EquipmentInspection;
import com.privod.platform.modules.fleet.domain.InspectionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EquipmentInspectionRepository extends JpaRepository<EquipmentInspection, UUID> {

    Page<EquipmentInspection> findByVehicleIdAndDeletedFalse(UUID vehicleId, Pageable pageable);

    List<EquipmentInspection> findByVehicleIdAndDeletedFalseOrderByInspectionDateDesc(UUID vehicleId);

    @Query("SELECT e FROM EquipmentInspection e WHERE e.deleted = false " +
            "AND e.inspectionType = :type " +
            "AND e.inspectionDate = :date")
    List<EquipmentInspection> findByTypeAndDate(
            @Param("type") InspectionType type,
            @Param("date") LocalDate date);

    @Query("SELECT e FROM EquipmentInspection e WHERE e.deleted = false " +
            "AND e.nextInspectionDate IS NOT NULL " +
            "AND e.nextInspectionDate <= :threshold ORDER BY e.nextInspectionDate ASC")
    List<EquipmentInspection> findUpcomingInspections(@Param("threshold") LocalDate threshold);

    @Query("SELECT e FROM EquipmentInspection e WHERE e.deleted = false " +
            "AND e.vehicleId = :vehicleId " +
            "AND e.inspectionType = 'DAILY' " +
            "AND e.inspectionDate = :date")
    List<EquipmentInspection> findDailyCheckByVehicleAndDate(
            @Param("vehicleId") UUID vehicleId,
            @Param("date") LocalDate date);
}
