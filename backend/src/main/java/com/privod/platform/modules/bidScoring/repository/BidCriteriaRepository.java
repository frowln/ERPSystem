package com.privod.platform.modules.bidScoring.repository;

import com.privod.platform.modules.bidScoring.domain.BidCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface BidCriteriaRepository extends JpaRepository<BidCriteria, UUID> {

    List<BidCriteria> findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(UUID bidComparisonId);

    @Query("SELECT COALESCE(SUM(bc.weight), 0) FROM BidCriteria bc " +
            "WHERE bc.bidComparisonId = :bidComparisonId AND bc.deleted = false")
    BigDecimal sumWeightByBidComparisonId(@Param("bidComparisonId") UUID bidComparisonId);

    long countByBidComparisonIdAndDeletedFalse(UUID bidComparisonId);
}
