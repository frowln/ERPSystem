package com.privod.platform.modules.chatter.repository;

import com.privod.platform.modules.chatter.domain.Activity;
import com.privod.platform.modules.chatter.domain.ActivityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    Page<Activity> findByEntityTypeAndEntityIdAndDeletedFalse(
            String entityType, UUID entityId, Pageable pageable);

    Page<Activity> findByAssignedToIdAndDeletedFalse(UUID assignedToId, Pageable pageable);

    Page<Activity> findByAssignedToIdAndStatusAndDeletedFalse(
            UUID assignedToId, ActivityStatus status, Pageable pageable);

    @Query("SELECT a FROM Activity a WHERE a.deleted = false " +
            "AND a.status IN ('PLANNED', 'IN_PROGRESS') " +
            "AND a.dueDate < :today")
    List<Activity> findOverdueActivities(@Param("today") LocalDate today);

    long countByAssignedToIdAndStatusInAndDeletedFalse(
            UUID assignedToId, List<ActivityStatus> statuses);
}
