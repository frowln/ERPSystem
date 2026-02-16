package com.privod.platform.modules.bidScoring.repository;

import com.privod.platform.modules.bidScoring.domain.BidScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BidScoreRepository extends JpaRepository<BidScore, UUID> {

    List<BidScore> findByBidComparisonIdAndDeletedFalse(UUID bidComparisonId);

    List<BidScore> findByBidComparisonIdAndVendorIdAndDeletedFalse(UUID bidComparisonId, UUID vendorId);

    List<BidScore> findByCriteriaIdAndDeletedFalse(UUID criteriaId);

    @Query("SELECT bs.vendorId, bs.vendorName, COALESCE(SUM(bs.weightedScore), 0) " +
            "FROM BidScore bs WHERE bs.bidComparisonId = :bidComparisonId AND bs.deleted = false " +
            "GROUP BY bs.vendorId, bs.vendorName ORDER BY COALESCE(SUM(bs.weightedScore), 0) DESC")
    List<Object[]> getVendorTotalScores(@Param("bidComparisonId") UUID bidComparisonId);
}
