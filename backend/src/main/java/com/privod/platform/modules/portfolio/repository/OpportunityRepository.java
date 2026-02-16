package com.privod.platform.modules.portfolio.repository;

import com.privod.platform.modules.portfolio.domain.Opportunity;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, UUID>, JpaSpecificationExecutor<Opportunity> {

    Page<Opportunity> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<Opportunity> findByStageAndDeletedFalse(OpportunityStage stage, Pageable pageable);

    @Query("SELECT o.stage, COUNT(o) FROM Opportunity o WHERE o.deleted = false AND " +
            "(:organizationId IS NULL OR o.organizationId = :organizationId) GROUP BY o.stage")
    List<Object[]> countByStageAndOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(o.estimatedValue), 0) FROM Opportunity o WHERE o.deleted = false AND " +
            "o.stage NOT IN ('LOST', 'WITHDRAWN') AND (:organizationId IS NULL OR o.organizationId = :organizationId)")
    BigDecimal sumPipelineValue(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.deleted = false AND o.stage = 'WON' AND " +
            "(:organizationId IS NULL OR o.organizationId = :organizationId)")
    long countWon(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.deleted = false AND o.stage IN ('WON', 'LOST') AND " +
            "(:organizationId IS NULL OR o.organizationId = :organizationId)")
    long countClosed(@Param("organizationId") UUID organizationId);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.deleted = false AND " +
            "(:organizationId IS NULL OR o.organizationId = :organizationId)")
    long countTotal(@Param("organizationId") UUID organizationId);
}
