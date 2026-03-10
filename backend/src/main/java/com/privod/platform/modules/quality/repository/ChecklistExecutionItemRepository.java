package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.ChecklistExecutionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChecklistExecutionItemRepository extends JpaRepository<ChecklistExecutionItem, UUID> {

    List<ChecklistExecutionItem> findByChecklistIdAndDeletedFalseOrderBySortOrderAsc(UUID checklistId);

    int countByChecklistIdAndDeletedFalse(UUID checklistId);
}
