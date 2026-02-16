package com.privod.platform.modules.crm.repository;

import com.privod.platform.modules.crm.domain.CrmActivity;
import com.privod.platform.modules.crm.domain.CrmActivityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CrmActivityRepository extends JpaRepository<CrmActivity, UUID> {

    List<CrmActivity> findByLeadIdAndDeletedFalseOrderByScheduledAtDesc(UUID leadId);

    Page<CrmActivity> findByLeadIdAndDeletedFalse(UUID leadId, Pageable pageable);

    Page<CrmActivity> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    List<CrmActivity> findByLeadIdAndActivityTypeAndDeletedFalse(UUID leadId, CrmActivityType activityType);

    @Query("SELECT a FROM CrmActivity a WHERE a.deleted = false AND a.completedAt IS NULL " +
            "AND a.scheduledAt < :now")
    List<CrmActivity> findOverdueActivities(@Param("now") LocalDateTime now);

    @Query("SELECT a FROM CrmActivity a WHERE a.deleted = false AND a.completedAt IS NULL " +
            "AND a.userId = :userId AND a.scheduledAt BETWEEN :from AND :to")
    List<CrmActivity> findUpcomingActivities(@Param("userId") UUID userId,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    long countByLeadIdAndDeletedFalse(UUID leadId);

    long countByUserIdAndCompletedAtIsNullAndDeletedFalse(UUID userId);
}
