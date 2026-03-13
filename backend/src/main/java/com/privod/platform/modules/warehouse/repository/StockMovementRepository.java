package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID>,
        JpaSpecificationExecutor<StockMovement> {

    Optional<StockMovement> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<StockMovement> findByStatusAndDeletedFalse(StockMovementStatus status, Pageable pageable);

    Page<StockMovement> findByMovementTypeAndDeletedFalse(StockMovementType movementType, Pageable pageable);

    Page<StockMovement> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.deleted = false AND " +
            "sm.movementDate BETWEEN :dateFrom AND :dateTo")
    Page<StockMovement> findByDateRange(@Param("dateFrom") LocalDate dateFrom,
                                         @Param("dateTo") LocalDate dateTo, Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.deleted = false AND " +
            "(sm.sourceLocationId = :locationId OR sm.destinationLocationId = :locationId)")
    Page<StockMovement> findByLocationId(@Param("locationId") UUID locationId, Pageable pageable);

    @Query(value = "SELECT nextval('stock_movement_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    /**
     * P1-WAR-4: Aggregate material consumption by project.
     * Returns [materialId, SUM(quantity)] for CONSUMPTION movements in COMPLETED status.
     * Replaces StockEntry.projectId — project-level inventory tracking via movement aggregation.
     */
    @Query(value =
            "SELECT sml.material_id, SUM(sml.quantity) AS consumed " +
            "FROM stock_movement_lines sml " +
            "JOIN stock_movements sm ON sml.movement_id = sm.id " +
            "WHERE sm.deleted = false AND sml.deleted = false " +
            "  AND sm.project_id = :projectId " +
            "  AND sm.movement_type = 'CONSUMPTION' " +
            "  AND sm.status = 'COMPLETED' " +
            "GROUP BY sml.material_id",
            nativeQuery = true)
    List<Object[]> sumConsumptionByProject(@Param("projectId") UUID projectId);

    /**
     * P1-WAR-4: Aggregate consumption for a specific material on a project.
     */
    @Query(value =
            "SELECT COALESCE(SUM(sml.quantity), 0) " +
            "FROM stock_movement_lines sml " +
            "JOIN stock_movements sm ON sml.movement_id = sm.id " +
            "WHERE sm.deleted = false AND sml.deleted = false " +
            "  AND sm.project_id = :projectId " +
            "  AND sml.material_id = :materialId " +
            "  AND sm.movement_type = 'CONSUMPTION' " +
            "  AND sm.status = 'COMPLETED'",
            nativeQuery = true)
    BigDecimal sumConsumptionByProjectAndMaterial(@Param("projectId") UUID projectId,
                                                   @Param("materialId") UUID materialId);

    /**
     * P1-WAR-2: Returns [material_id, material_name, unit_of_measure, SUM(quantity)]
     * for consumption report (plan vs actual).
     */
    @Query(value =
            "SELECT sml.material_id, sml.material_name, sml.unit_of_measure, SUM(sml.quantity) AS consumed " +
            "FROM stock_movement_lines sml " +
            "JOIN stock_movements sm ON sml.movement_id = sm.id " +
            "WHERE sm.deleted = false AND sml.deleted = false " +
            "  AND sm.project_id = :projectId " +
            "  AND sm.movement_type = 'CONSUMPTION' " +
            "  AND sm.status = 'COMPLETED' " +
            "GROUP BY sml.material_id, sml.material_name, sml.unit_of_measure " +
            "ORDER BY sml.material_name",
            nativeQuery = true)
    List<Object[]> consumptionByProjectGroupedByMaterial(@Param("projectId") UUID projectId);
}
