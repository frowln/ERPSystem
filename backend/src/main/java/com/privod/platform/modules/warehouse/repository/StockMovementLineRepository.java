package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.StockMovementLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementLineRepository extends JpaRepository<StockMovementLine, UUID> {

    List<StockMovementLine> findByMovementIdAndDeletedFalseOrderBySequenceAsc(UUID movementId);

    @Query("SELECT sml FROM StockMovementLine sml " +
            "JOIN StockMovement sm ON sml.movementId = sm.id " +
            "WHERE sml.materialId = :materialId AND sml.deleted = false AND sm.deleted = false " +
            "ORDER BY sm.movementDate DESC")
    List<StockMovementLine> findByMaterialIdOrderByDateDesc(@Param("materialId") UUID materialId);

    void deleteByMovementId(UUID movementId);
}
