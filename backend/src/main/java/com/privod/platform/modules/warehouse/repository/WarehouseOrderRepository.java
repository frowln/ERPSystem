package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.WarehouseOrder;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderStatus;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseOrderRepository extends JpaRepository<WarehouseOrder, UUID>,
        JpaSpecificationExecutor<WarehouseOrder> {

    Optional<WarehouseOrder> findByOrderNumberAndDeletedFalse(String orderNumber);

    Page<WarehouseOrder> findByStatusAndDeletedFalse(WarehouseOrderStatus status, Pageable pageable);

    Page<WarehouseOrder> findByOrderTypeAndDeletedFalse(WarehouseOrderType orderType, Pageable pageable);

    Page<WarehouseOrder> findByWarehouseIdAndDeletedFalse(UUID warehouseId, Pageable pageable);

    List<WarehouseOrder> findByPurchaseOrderIdAndDeletedFalse(UUID purchaseOrderId);

    List<WarehouseOrder> findByStockMovementIdAndDeletedFalse(UUID stockMovementId);

    @Query("SELECT wo FROM WarehouseOrder wo WHERE wo.deleted = false AND " +
            "wo.orderDate BETWEEN :dateFrom AND :dateTo")
    Page<WarehouseOrder> findByDateRange(@Param("dateFrom") LocalDate dateFrom,
                                          @Param("dateTo") LocalDate dateTo, Pageable pageable);

    long countByWarehouseIdAndDeletedFalse(UUID warehouseId);
}
