package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.LocalEstimateLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocalEstimateLineRepository extends JpaRepository<LocalEstimateLine, UUID> {

    List<LocalEstimateLine> findByEstimateIdAndDeletedFalseOrderByLineNumberAsc(UUID estimateId);

    @Modifying
    @Query("DELETE FROM LocalEstimateLine l WHERE l.estimateId = :estimateId")
    void deleteByEstimateId(@Param("estimateId") UUID estimateId);

    long countByEstimateIdAndDeletedFalse(UUID estimateId);
}
