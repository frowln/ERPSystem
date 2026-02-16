package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.DeadlineStatus;
import com.privod.platform.modules.regulatory.domain.ReportingDeadline;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReportingDeadlineRepository extends JpaRepository<ReportingDeadline, UUID>, JpaSpecificationExecutor<ReportingDeadline> {

    Page<ReportingDeadline> findByDeletedFalseOrderByDueDateAsc(Pageable pageable);

    Page<ReportingDeadline> findByStatusAndDeletedFalseOrderByDueDateAsc(
            DeadlineStatus status, Pageable pageable);

    List<ReportingDeadline> findByDueDateBetweenAndDeletedFalseOrderByDueDateAsc(
            LocalDate from, LocalDate to);

    @Query("SELECT d FROM ReportingDeadline d WHERE d.deleted = false " +
            "AND d.status IN ('UPCOMING', 'DUE') " +
            "AND d.dueDate <= :reminderDate " +
            "ORDER BY d.dueDate ASC")
    List<ReportingDeadline> findUpcomingDeadlines(@Param("reminderDate") LocalDate reminderDate);

    @Query("SELECT d FROM ReportingDeadline d WHERE d.deleted = false " +
            "AND d.status != 'SUBMITTED' AND d.status != 'SKIPPED' " +
            "AND d.dueDate < :today " +
            "ORDER BY d.dueDate ASC")
    List<ReportingDeadline> findOverdueDeadlines(@Param("today") LocalDate today);

    @Query("SELECT d FROM ReportingDeadline d WHERE d.deleted = false " +
            "AND (:status IS NULL OR d.status = :status) " +
            "AND (:reportType IS NULL OR d.reportType = :reportType) " +
            "AND (:regulatoryBody IS NULL OR d.regulatoryBody = :regulatoryBody) " +
            "AND (:from IS NULL OR d.dueDate >= :from) " +
            "AND (:to IS NULL OR d.dueDate <= :to) " +
            "ORDER BY d.dueDate ASC")
    Page<ReportingDeadline> findByFilters(@Param("status") DeadlineStatus status,
                                           @Param("reportType") String reportType,
                                           @Param("regulatoryBody") String regulatoryBody,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to,
                                           Pageable pageable);
}
