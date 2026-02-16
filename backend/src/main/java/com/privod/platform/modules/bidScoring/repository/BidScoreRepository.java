package com.privod.platform.modules.bidScoring.repository;

import com.privod.platform.modules.bidScoring.domain.BidScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidScoreRepository extends JpaRepository<BidScore, UUID> {

    List<BidScore> findByBidComparisonIdAndDeletedFalse(UUID bidComparisonId);

    List<BidScore> findByBidComparisonIdAndVendorIdAndDeletedFalse(UUID bidComparisonId, UUID vendorId);

    List<BidScore> findByCriteriaIdAndDeletedFalse(UUID criteriaId);

    Optional<BidScore> findByBidComparisonIdAndCriteriaIdAndVendorIdAndDeletedFalse(
            UUID bidComparisonId,
            UUID criteriaId,
            UUID vendorId
    );

    boolean existsByBidComparisonIdAndVendorIdAndDeletedFalse(UUID bidComparisonId, UUID vendorId);

}
