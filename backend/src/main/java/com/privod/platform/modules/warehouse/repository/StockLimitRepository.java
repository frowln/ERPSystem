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

    Optional<StockLimit> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<StockLimit> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<StockLimit> findByDeletedFalse(Pageable pageable);

    Page<StockLimit> findByOrganizationIdAndMaterialIdAndDeletedFalse(UUID organizationId,
                                                                       UUID materialId,
                                                                       Pageable pageable);

    Page<StockLimit> findByMaterialIdAndDeletedFalse(UUID materialId, Pageable pageable);

    Page<StockLimit> findByOrganizationIdAndWarehouseLocationIdAndDeletedFalse(UUID organizationId,
                                                                                UUID warehouseLocationId,
                                                                                Pageable pageable);

    Page<StockLimit> findByWarehouseLocationIdAndDeletedFalse(UUID warehouseLocationId, Pageable pageable);

    List<StockLimit> findByOrganizationIdAndIsActiveTrueAndDeletedFalse(UUID organizationId);

    List<StockLimit> findByIsActiveTrueAndDeletedFalse();

    Optional<StockLimit> findByOrganizationIdAndMaterialIdAndWarehouseLocationIdAndDeletedFalse(UUID organizationId,
                                                                                                  UUID materialId,
                                                                                                  UUID warehouseLocationId);

    Optional<StockLimit> findByMaterialIdAndWarehouseLocationIdAndDeletedFalse(UUID materialId, UUID warehouseLocationId);
}
