package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.WarehouseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseOrderItemRepository extends JpaRepository<WarehouseOrderItem, UUID> {

    List<WarehouseOrderItem> findByWarehouseOrderIdAndDeletedFalse(UUID warehouseOrderId);

    @Query("SELECT COALESCE(SUM(woi.quantity), 0) FROM WarehouseOrderItem woi " +
            "WHERE woi.warehouseOrderId = :orderId AND woi.deleted = false")
    BigDecimal sumQuantityByOrderId(@Param("orderId") UUID orderId);

    @Query("SELECT COALESCE(SUM(woi.totalAmount), 0) FROM WarehouseOrderItem woi " +
            "WHERE woi.warehouseOrderId = :orderId AND woi.deleted = false")
    BigDecimal sumTotalByOrderId(@Param("orderId") UUID orderId);

    long countByWarehouseOrderIdAndDeletedFalse(UUID warehouseOrderId);
}
