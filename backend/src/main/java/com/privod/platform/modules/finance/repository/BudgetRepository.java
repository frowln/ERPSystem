package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetStatus;
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
public interface BudgetRepository extends JpaRepository<Budget, UUID>, JpaSpecificationExecutor<Budget> {

    Optional<Budget> findByIdAndDeletedFalse(UUID id);

    Optional<Budget> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Budget> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Budget> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<Budget> findByStatusAndDeletedFalse(BudgetStatus status, Pageable pageable);

    Page<Budget> findByProjectIdInAndStatusAndDeletedFalse(List<UUID> projectIds, BudgetStatus status, Pageable pageable);

    List<Budget> findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId);

    @Query("SELECT COALESCE(SUM(b.plannedCost), 0) FROM Budget b " +
            "WHERE b.projectId = :projectId AND b.deleted = false AND b.status <> 'CLOSED'")
    BigDecimal sumPlannedCostByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.actualCost), 0) FROM Budget b " +
            "WHERE b.projectId = :projectId AND b.deleted = false AND b.status <> 'CLOSED'")
    BigDecimal sumActualCostByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.plannedRevenue), 0) FROM Budget b " +
            "WHERE b.projectId = :projectId AND b.deleted = false AND b.status <> 'CLOSED'")
    BigDecimal sumPlannedRevenueByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.actualRevenue), 0) FROM Budget b " +
            "WHERE b.projectId = :projectId AND b.deleted = false AND b.status <> 'CLOSED'")
    BigDecimal sumActualRevenueByProjectId(@Param("projectId") UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    @Query("SELECT b.id FROM Budget b WHERE b.projectId IN :projectIds AND b.deleted = false AND b.status <> 'CLOSED'")
    List<UUID> findIdsByProjectIds(@Param("projectIds") List<UUID> projectIds);
}
