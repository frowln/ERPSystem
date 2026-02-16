package com.privod.platform.modules.bidScoring.repository;

import com.privod.platform.modules.bidScoring.domain.BidComparison;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidComparisonRepository extends JpaRepository<BidComparison, UUID>, JpaSpecificationExecutor<BidComparison> {

    Optional<BidComparison> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<BidComparison> findByOrganizationIdAndProjectIdAndDeletedFalse(
            UUID organizationId,
            UUID projectId,
            Pageable pageable
    );

    Page<BidComparison> findByOrganizationIdAndStatusAndDeletedFalse(
            UUID organizationId,
            ComparisonStatus status,
            Pageable pageable
    );

    Page<BidComparison> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    long countByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);
}
