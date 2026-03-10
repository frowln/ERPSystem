package com.privod.platform.modules.procurement.repository;

import com.privod.platform.modules.procurement.domain.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository("procurementPurchaseOrderItemRepository")
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

    List<PurchaseOrderItem> findByPurchaseOrderIdAndDeletedFalseOrderByCreatedAtAsc(UUID purchaseOrderId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM PurchaseOrderItem i WHERE i.purchaseOrderId = :orderId AND i.deleted = false")
    BigDecimal sumTotalAmountByOrderId(@Param("orderId") UUID orderId);
}
