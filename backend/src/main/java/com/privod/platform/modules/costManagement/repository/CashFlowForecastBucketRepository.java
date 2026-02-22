package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.CashFlowForecastBucket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CashFlowForecastBucketRepository extends JpaRepository<CashFlowForecastBucket, UUID>,
        JpaSpecificationExecutor<CashFlowForecastBucket> {

    List<CashFlowForecastBucket> findByScenarioIdAndDeletedFalseOrderByPeriodStart(UUID scenarioId);

    List<CashFlowForecastBucket> findByOrganizationIdAndProjectIdAndPeriodStartBetweenAndDeletedFalseOrderByPeriodStart(
            UUID orgId, UUID projectId, LocalDate from, LocalDate to);

    @Modifying
    @Query("DELETE FROM CashFlowForecastBucket b WHERE b.scenarioId = :scenarioId AND b.deleted = false")
    void deleteByScenarioIdAndDeletedFalse(@Param("scenarioId") UUID scenarioId);
}
