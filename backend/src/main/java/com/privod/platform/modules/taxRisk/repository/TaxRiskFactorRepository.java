package com.privod.platform.modules.taxRisk.repository;

import com.privod.platform.modules.taxRisk.domain.FactorCategory;
import com.privod.platform.modules.taxRisk.domain.TaxRiskFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaxRiskFactorRepository extends JpaRepository<TaxRiskFactor, UUID> {

    List<TaxRiskFactor> findByAssessmentIdAndDeletedFalse(UUID assessmentId);

    List<TaxRiskFactor> findByAssessmentIdAndFactorCategoryAndDeletedFalse(UUID assessmentId, FactorCategory category);

    @Query("SELECT COALESCE(SUM(f.weightedScore), 0) FROM TaxRiskFactor f " +
            "WHERE f.assessmentId = :assessmentId AND f.deleted = false")
    BigDecimal sumWeightedScoreByAssessmentId(@Param("assessmentId") UUID assessmentId);

    @Query("SELECT COALESCE(SUM(f.weight), 0) FROM TaxRiskFactor f " +
            "WHERE f.assessmentId = :assessmentId AND f.deleted = false")
    BigDecimal sumWeightByAssessmentId(@Param("assessmentId") UUID assessmentId);

    long countByAssessmentIdAndDeletedFalse(UUID assessmentId);
}
