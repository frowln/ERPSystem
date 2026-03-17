package com.privod.platform.modules.procurement.repository;

import com.privod.platform.modules.procurement.domain.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository("procurementPurchaseOrderRepository")
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID>, JpaSpecificationExecutor<PurchaseOrder> {

    Optional<PurchaseOrder> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<PurchaseOrder> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId);

    List<PurchaseOrder> findByProjectIdAndOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId, UUID organizationId);

    Optional<PurchaseOrder> findByPurchaseRequestIdAndOrganizationIdAndDeletedFalse(UUID purchaseRequestId, UUID organizationId);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 " +
            "FROM purchase_orders WHERE organization_id = :orgId", nativeQuery = true)
    long getNextOrderNumber(@Param("orgId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM ProcurementPurchaseOrder po " +
            "WHERE po.organizationId = :orgId AND po.deleted = false AND po.status <> 'CANCELLED'")
    BigDecimal sumTotalAmountByOrganizationId(@Param("orgId") UUID organizationId);

    @Query("SELECT po.status, COUNT(po) FROM ProcurementPurchaseOrder po " +
            "WHERE po.organizationId = :orgId AND po.deleted = false GROUP BY po.status")
    List<Object[]> countByStatusAndOrganizationId(@Param("orgId") UUID organizationId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
