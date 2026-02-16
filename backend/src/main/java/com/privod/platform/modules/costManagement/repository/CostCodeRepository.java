package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.CostCode;
import com.privod.platform.modules.costManagement.domain.CostCodeLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CostCodeRepository extends JpaRepository<CostCode, UUID>, JpaSpecificationExecutor<CostCode> {

    Page<CostCode> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<CostCode> findByDeletedFalse(Pageable pageable);

    List<CostCode> findByProjectIdAndDeletedFalseOrderByCodeAsc(UUID projectId);

    List<CostCode> findByParentIdAndDeletedFalse(UUID parentId);

    Optional<CostCode> findByProjectIdAndCodeAndDeletedFalse(UUID projectId, String code);

    boolean existsByProjectIdAndCodeAndDeletedFalse(UUID projectId, String code);

    List<CostCode> findByProjectIdAndLevelAndDeletedFalse(UUID projectId, CostCodeLevel level);

    @Query("SELECT cc FROM CostCode cc WHERE cc.projectId = :projectId AND cc.isActive = true AND cc.deleted = false ORDER BY cc.code")
    List<CostCode> findActiveByProjectId(@Param("projectId") UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    /**
     * Sum budgetAmount across all active, non-deleted cost codes for a project.
     */
    @Query("SELECT COALESCE(SUM(cc.budgetAmount), 0) FROM CostCode cc " +
            "WHERE cc.projectId = :projectId AND cc.isActive = true AND cc.deleted = false")
    BigDecimal sumBudgetAmountByProjectId(@Param("projectId") UUID projectId);
}
