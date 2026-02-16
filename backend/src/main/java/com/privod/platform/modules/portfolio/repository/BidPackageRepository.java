package com.privod.platform.modules.portfolio.repository;

import com.privod.platform.modules.portfolio.domain.BidPackage;
import com.privod.platform.modules.portfolio.domain.BidStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BidPackageRepository extends JpaRepository<BidPackage, UUID>, JpaSpecificationExecutor<BidPackage> {

    Page<BidPackage> findByOpportunityIdAndDeletedFalse(UUID opportunityId, Pageable pageable);

    Page<BidPackage> findByStatusAndDeletedFalse(BidStatus status, Pageable pageable);

    /**
     * Tenant-safe listing: bid packages belong to a tenant through their opportunity.
     * Uses a subquery because we intentionally keep UUID FKs instead of JPA relations.
     */
    @Query("SELECT bp FROM BidPackage bp WHERE bp.deleted = false AND " +
            "bp.opportunityId IN (SELECT o.id FROM Opportunity o WHERE o.deleted = false AND o.organizationId = :organizationId) " +
            "AND (:status IS NULL OR bp.status = :status)")
    Page<BidPackage> findTenantBidPackages(@Param("organizationId") UUID organizationId,
                                          @Param("status") BidStatus status,
                                          Pageable pageable);

    List<BidPackage> findByOpportunityIdAndDeletedFalse(UUID opportunityId);

    long countByStatusAndDeletedFalse(BidStatus status);
}
