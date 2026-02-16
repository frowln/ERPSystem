package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.PurchaseOrder;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID>,
        JpaSpecificationExecutor<PurchaseOrder> {

    Optional<PurchaseOrder> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
    Optional<PurchaseOrder> findByOrderNumberAndOrganizationIdAndDeletedFalse(String orderNumber, UUID organizationId);

    Page<PurchaseOrder> findByStatusAndDeletedFalse(PurchaseOrderStatus status, Pageable pageable);

    Page<PurchaseOrder> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<PurchaseOrder> findBySupplierIdAndDeletedFalse(UUID supplierId);

    List<PurchaseOrder> findByPurchaseRequestIdAndDeletedFalse(UUID purchaseRequestId);

    List<PurchaseOrder> findByContractIdAndDeletedFalse(UUID contractId);

    @Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM PurchaseOrder po " +
            "WHERE po.projectId = :projectId AND po.status NOT IN ('DRAFT', 'CANCELLED') AND po.deleted = false")
    BigDecimal sumTotalByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po " +
            "WHERE po.supplierId = :supplierId AND po.status = :status AND po.deleted = false")
    long countBySupplierIdAndStatus(@Param("supplierId") UUID supplierId,
                                     @Param("status") PurchaseOrderStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
