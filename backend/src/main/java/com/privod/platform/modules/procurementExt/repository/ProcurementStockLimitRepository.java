package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.warehouse.domain.StockLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcurementStockLimitRepository extends JpaRepository<StockLimit, UUID> {

    List<StockLimit> findByWarehouseLocationIdAndDeletedFalse(UUID warehouseLocationId);

    Optional<StockLimit> findByWarehouseLocationIdAndMaterialIdAndDeletedFalse(UUID warehouseLocationId, UUID materialId);

    @Query("SELECT s FROM StockLimit s WHERE s.isActive = true AND s.deleted = false")
    List<StockLimit> findAllActiveNotDeleted();
}
