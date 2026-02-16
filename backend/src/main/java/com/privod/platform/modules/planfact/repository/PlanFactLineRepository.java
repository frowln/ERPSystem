package com.privod.platform.modules.planfact.repository;

import com.privod.platform.modules.planfact.domain.PlanFactLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PlanFactLineRepository extends JpaRepository<PlanFactLine, UUID> {

    List<PlanFactLine> findByProjectIdAndDeletedFalseOrderBySequenceAsc(UUID projectId);

    @Query("SELECT COALESCE(SUM(l.planAmount), 0) FROM PlanFactLine l WHERE l.projectId = :projectId AND l.deleted = false AND l.category = 'REVENUE'")
    BigDecimal sumPlanRevenue(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(l.factAmount), 0) FROM PlanFactLine l WHERE l.projectId = :projectId AND l.deleted = false AND l.category = 'REVENUE'")
    BigDecimal sumFactRevenue(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(l.planAmount), 0) FROM PlanFactLine l WHERE l.projectId = :projectId AND l.deleted = false AND l.category = 'COST'")
    BigDecimal sumPlanCost(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(l.factAmount), 0) FROM PlanFactLine l WHERE l.projectId = :projectId AND l.deleted = false AND l.category = 'COST'")
    BigDecimal sumFactCost(@Param("projectId") UUID projectId);

    void deleteByProjectIdAndDeletedFalse(UUID projectId);
}
