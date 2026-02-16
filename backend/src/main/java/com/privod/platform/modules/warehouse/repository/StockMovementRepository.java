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

import java.time.LocalDate;
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
}
