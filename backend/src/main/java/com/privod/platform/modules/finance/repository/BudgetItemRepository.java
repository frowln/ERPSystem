package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.BudgetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetItemRepository extends JpaRepository<BudgetItem, UUID> {

    List<BudgetItem> findByBudgetIdAndDeletedFalseOrderBySequenceAsc(UUID budgetId);

    long countByBudgetIdAndDeletedFalse(UUID budgetId);

    void deleteByBudgetId(UUID budgetId);
}
