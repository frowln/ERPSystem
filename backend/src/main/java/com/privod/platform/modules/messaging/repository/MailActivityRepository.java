package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailActivity;
import com.privod.platform.modules.messaging.domain.MailActivityStatus;
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
public interface MailActivityRepository extends JpaRepository<MailActivity, UUID> {

    @Query("SELECT a FROM MailActivity a WHERE a.modelName = :modelName AND a.recordId = :recordId " +
            "AND a.deleted = false ORDER BY a.dueDate ASC")
    List<MailActivity> findByModelNameAndRecordId(@Param("modelName") String modelName,
                                                  @Param("recordId") UUID recordId);

    @Query("SELECT a FROM MailActivity a WHERE a.assignedUserId = :userId AND a.status = :status " +
            "AND a.deleted = false ORDER BY a.dueDate ASC")
    Page<MailActivity> findByAssignedUserIdAndStatus(@Param("userId") UUID userId,
                                                      @Param("status") MailActivityStatus status,
                                                      Pageable pageable);

    @Query("SELECT a FROM MailActivity a WHERE a.assignedUserId = :userId AND a.deleted = false " +
            "ORDER BY a.dueDate ASC")
    Page<MailActivity> findByAssignedUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT a FROM MailActivity a WHERE a.status = 'PLANNED' AND a.dueDate < :today " +
            "AND a.deleted = false ORDER BY a.dueDate ASC")
    List<MailActivity> findOverdue(@Param("today") LocalDate today);

    @Query("SELECT a FROM MailActivity a WHERE a.userId = :userId AND a.deleted = false " +
            "ORDER BY a.dueDate ASC")
    Page<MailActivity> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM MailActivity a WHERE a.assignedUserId = :userId " +
            "AND a.status = 'PLANNED' AND a.deleted = false")
    long countPendingByAssignedUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(a) FROM MailActivity a WHERE a.assignedUserId = :userId " +
            "AND a.status = 'PLANNED' AND a.dueDate < :today AND a.deleted = false")
    long countOverdueByAssignedUserId(@Param("userId") UUID userId, @Param("today") LocalDate today);
}
