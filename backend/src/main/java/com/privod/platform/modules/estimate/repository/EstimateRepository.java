package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateStatus;
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
public interface EstimateRepository extends JpaRepository<Estimate, UUID>, JpaSpecificationExecutor<Estimate> {

    Page<Estimate> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Estimate> findBySpecificationIdAndDeletedFalse(UUID specificationId);

    Page<Estimate> findByStatusAndDeletedFalse(EstimateStatus status, Pageable pageable);

    List<Estimate> findByProjectIdAndDeletedFalse(UUID projectId);

    /**
     * Sum totalAmount of approved/active estimates for a project.
     */
    @Query("SELECT COALESCE(SUM(e.totalAmount), 0) FROM Estimate e " +
            "WHERE e.projectId = :projectId AND e.status IN ('APPROVED', 'ACTIVE') AND e.deleted = false")
    BigDecimal sumTotalAmountByProjectId(@Param("projectId") UUID projectId);
}
