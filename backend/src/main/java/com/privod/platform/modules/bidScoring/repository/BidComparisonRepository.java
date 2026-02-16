package com.privod.platform.modules.bidScoring.repository;

import com.privod.platform.modules.bidScoring.domain.BidComparison;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BidComparisonRepository extends JpaRepository<BidComparison, UUID>, JpaSpecificationExecutor<BidComparison> {

    Page<BidComparison> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<BidComparison> findByStatusAndDeletedFalse(ComparisonStatus status, Pageable pageable);

    Page<BidComparison> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
