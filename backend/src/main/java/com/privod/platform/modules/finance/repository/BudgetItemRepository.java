package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.BudgetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetItemRepository extends JpaRepository<BudgetItem, UUID> {

    List<BudgetItem> findByBudgetIdAndDeletedFalseOrderBySequenceAsc(UUID budgetId);

    long countByBudgetIdAndDeletedFalse(UUID budgetId);

    void deleteByBudgetId(UUID budgetId);

    @Query("SELECT bi.category, COALESCE(SUM(bi.plannedAmount), 0) FROM BudgetItem bi " +
            "WHERE bi.budgetId IN :budgetIds AND bi.deleted = false AND bi.section = false " +
            "GROUP BY bi.category")
    List<Object[]> sumPlannedAmountByCategoryAndBudgetIds(@Param("budgetIds") List<UUID> budgetIds);

    @Query("SELECT bi.category, COALESCE(SUM(bi.plannedAmount), 0), COALESCE(SUM(bi.actualAmount), 0) FROM BudgetItem bi " +
            "WHERE bi.budgetId IN :budgetIds AND bi.deleted = false AND bi.section = false " +
            "GROUP BY bi.category")
    List<Object[]> sumPlannedAndActualByCategoryAndBudgetIds(@Param("budgetIds") List<UUID> budgetIds);

    @Query("SELECT COALESCE(SUM(bi.plannedAmount), 0) FROM BudgetItem bi " +
            "WHERE bi.budgetId IN :budgetIds AND bi.deleted = false AND bi.section = false")
    BigDecimal sumPlannedAmountByBudgetIds(@Param("budgetIds") List<UUID> budgetIds);

    @Query("SELECT COALESCE(SUM(bi.actualAmount), 0) FROM BudgetItem bi " +
            "WHERE bi.budgetId IN :budgetIds AND bi.deleted = false AND bi.section = false")
    BigDecimal sumActualAmountByBudgetIds(@Param("budgetIds") List<UUID> budgetIds);
}
