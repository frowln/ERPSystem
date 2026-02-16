package com.privod.platform.modules.calendar.repository;

import com.privod.platform.modules.calendar.domain.ScheduleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleItemRepository extends JpaRepository<ScheduleItem, UUID> {

    List<ScheduleItem> findByScheduleIdAndDeletedFalseOrderBySortOrder(UUID scheduleId);

    List<ScheduleItem> findByScheduleIdAndParentItemIdAndDeletedFalseOrderBySortOrder(
            UUID scheduleId, UUID parentItemId);

    List<ScheduleItem> findByScheduleIdAndParentItemIdIsNullAndDeletedFalseOrderBySortOrder(UUID scheduleId);

    List<ScheduleItem> findByScheduleIdAndIsCriticalPathTrueAndDeletedFalseOrderBySortOrder(UUID scheduleId);

    @Query("SELECT si FROM ScheduleItem si WHERE si.predecessorItemId = :itemId AND si.deleted = false")
    List<ScheduleItem> findSuccessors(@Param("itemId") UUID itemId);

    @Query("SELECT COALESCE(MAX(si.sortOrder), 0) FROM ScheduleItem si " +
            "WHERE si.scheduleId = :scheduleId AND si.deleted = false")
    int findMaxSortOrder(@Param("scheduleId") UUID scheduleId);

    long countByScheduleIdAndDeletedFalse(UUID scheduleId);
}
