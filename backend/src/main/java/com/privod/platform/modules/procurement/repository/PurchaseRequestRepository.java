package com.privod.platform.modules.procurement.repository;

import com.privod.platform.modules.procurement.domain.PurchaseRequest;
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
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, UUID>, JpaSpecificationExecutor<PurchaseRequest> {

    Optional<PurchaseRequest> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    @Query(value = "SELECT nextval('purchase_request_name_seq')", nativeQuery = true)
    long getNextNameSequence();

    @Query("SELECT pr.status, COUNT(pr) FROM PurchaseRequest pr WHERE pr.deleted = false " +
            "AND pr.organizationId = :organizationId " +
            "AND (:projectId IS NULL OR pr.projectId = :projectId) GROUP BY pr.status")
    List<Object[]> countByStatusForProjectAndOrganizationId(@Param("projectId") UUID projectId,
                                                            @Param("organizationId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(pr.totalAmount), 0) FROM PurchaseRequest pr WHERE pr.deleted = false " +
            "AND pr.organizationId = :organizationId " +
            "AND (:projectId IS NULL OR pr.projectId = :projectId) " +
            "AND pr.status NOT IN ('CANCELLED', 'REJECTED')")
    BigDecimal sumTotalAmountForProjectAndOrganizationId(@Param("projectId") UUID projectId,
                                                         @Param("organizationId") UUID organizationId);
}
