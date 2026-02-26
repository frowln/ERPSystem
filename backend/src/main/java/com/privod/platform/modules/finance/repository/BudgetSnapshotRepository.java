package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.BudgetSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetSnapshotRepository extends JpaRepository<BudgetSnapshot, UUID> {

    Page<BudgetSnapshot> findByBudgetIdAndDeletedFalseOrderBySnapshotDateDesc(UUID budgetId, Pageable pageable);

    Optional<BudgetSnapshot> findByIdAndDeletedFalse(UUID id);

    Optional<BudgetSnapshot> findFirstByBudgetIdAndSnapshotTypeAndDeletedFalseOrderBySnapshotDateDesc(
            UUID budgetId,
            BudgetSnapshot.SnapshotType snapshotType
    );

    long countByBudgetIdAndDeletedFalse(UUID budgetId);
}
