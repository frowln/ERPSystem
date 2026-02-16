package com.privod.platform.modules.procurement.repository;

import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseRequestItemRepository extends JpaRepository<PurchaseRequestItem, UUID> {

    List<PurchaseRequestItem> findByRequestIdAndDeletedFalseOrderBySequenceAsc(UUID requestId);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM PurchaseRequestItem i WHERE i.requestId = :requestId AND i.deleted = false")
    BigDecimal sumAmountByRequestId(@Param("requestId") UUID requestId);

    @Query("SELECT i.requestId, COUNT(i) FROM PurchaseRequestItem i WHERE i.deleted = false AND i.requestId IN :requestIds GROUP BY i.requestId")
    List<Object[]> countByRequestIds(@Param("requestIds") List<UUID> requestIds);
}
