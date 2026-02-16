package com.privod.platform.modules.dailylog.repository;

import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyLogRepository extends JpaRepository<DailyLog, UUID>,
        JpaSpecificationExecutor<DailyLog> {

    Page<DailyLog> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<DailyLog> findByDeletedFalse(Pageable pageable);

    Optional<DailyLog> findByProjectIdAndLogDateAndDeletedFalse(UUID projectId, LocalDate logDate);

    @Query("SELECT dl FROM DailyLog dl WHERE dl.deleted = false " +
            "AND dl.projectId = :projectId " +
            "AND dl.logDate >= :startDate AND dl.logDate <= :endDate " +
            "ORDER BY dl.logDate DESC")
    List<DailyLog> findByProjectIdAndDateRange(@Param("projectId") UUID projectId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    @Query("SELECT dl FROM DailyLog dl WHERE dl.deleted = false " +
            "AND dl.projectId = :projectId " +
            "ORDER BY dl.logDate DESC")
    List<DailyLog> findProjectTimeline(@Param("projectId") UUID projectId);

    List<DailyLog> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, DailyLogStatus status);

    @Query(value = "SELECT nextval('daily_log_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
