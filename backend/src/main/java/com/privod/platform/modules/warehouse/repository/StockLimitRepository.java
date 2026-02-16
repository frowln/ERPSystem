package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.StockLimit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockLimitRepository extends JpaRepository<StockLimit, UUID>,
        JpaSpecificationExecutor<StockLimit> {

    Page<StockLimit> findByDeletedFalse(Pageable pageable);

    Page<StockLimit> findByMaterialIdAndDeletedFalse(UUID materialId, Pageable pageable);

    Page<StockLimit> findByWarehouseLocationIdAndDeletedFalse(UUID warehouseLocationId, Pageable pageable);

    List<StockLimit> findByIsActiveTrueAndDeletedFalse();

    Optional<StockLimit> findByMaterialIdAndWarehouseLocationIdAndDeletedFalse(UUID materialId, UUID warehouseLocationId);
}
