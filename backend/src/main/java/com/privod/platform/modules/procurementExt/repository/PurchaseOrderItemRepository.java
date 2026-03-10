package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository("procurementExtPurchaseOrderItemRepository")
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

    List<PurchaseOrderItem> findByPurchaseOrderIdAndDeletedFalse(UUID purchaseOrderId);

    @Query("SELECT COALESCE(SUM(poi.totalAmount), 0) FROM PurchaseOrderItem poi " +
            "WHERE poi.purchaseOrderId = :orderId AND poi.deleted = false")
    BigDecimal sumTotalByOrderId(@Param("orderId") UUID orderId);

    @Query("SELECT COALESCE(SUM(poi.deliveredQuantity), 0) FROM PurchaseOrderItem poi " +
            "WHERE poi.purchaseOrderId = :orderId AND poi.deleted = false")
    BigDecimal sumDeliveredQuantityByOrderId(@Param("orderId") UUID orderId);

    long countByPurchaseOrderIdAndDeletedFalse(UUID purchaseOrderId);
}
