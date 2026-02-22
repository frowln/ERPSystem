package com.privod.platform.modules.changeManagement.repository;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeOrderItemRepository extends JpaRepository<ChangeOrderItem, UUID> {

    List<ChangeOrderItem> findByChangeOrderIdAndDeletedFalseOrderBySortOrderAsc(UUID changeOrderId);

    List<ChangeOrderItem> findByChangeOrderIdInAndDeletedFalse(List<UUID> changeOrderIds);

    long countByChangeOrderIdAndDeletedFalse(UUID changeOrderId);

    @Query("SELECT COALESCE(SUM(i.totalPrice), 0) FROM ChangeOrderItem i " +
            "WHERE i.changeOrderId = :changeOrderId AND i.deleted = false")
    BigDecimal sumTotalPriceByChangeOrderId(@Param("changeOrderId") UUID changeOrderId);
}
