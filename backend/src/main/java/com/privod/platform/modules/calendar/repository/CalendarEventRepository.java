package com.privod.platform.modules.calendar.repository;

import com.privod.platform.modules.calendar.domain.CalendarEvent;
import com.privod.platform.modules.calendar.domain.EventStatus;
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
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID>,
        JpaSpecificationExecutor<CalendarEvent> {

    Page<CalendarEvent> findByDeletedFalse(Pageable pageable);

    Page<CalendarEvent> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query("SELECT e FROM CalendarEvent e WHERE e.deleted = false " +
            "AND e.startDate <= :endDate AND e.endDate >= :startDate " +
            "ORDER BY e.startDate, e.startTime")
    List<CalendarEvent> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM CalendarEvent e WHERE e.deleted = false " +
            "AND e.projectId = :projectId " +
            "AND e.startDate <= :endDate AND e.endDate >= :startDate " +
            "ORDER BY e.startDate, e.startTime")
    List<CalendarEvent> findByProjectAndDateRange(
            @Param("projectId") UUID projectId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM CalendarEvent e WHERE e.deleted = false " +
            "AND e.organizerId = :userId " +
            "ORDER BY e.startDate, e.startTime")
    Page<CalendarEvent> findByOrganizerId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT e FROM CalendarEvent e WHERE e.deleted = false " +
            "AND e.organizerId = :userId " +
            "AND e.startDate >= :fromDate " +
            "AND e.status IN :statuses " +
            "ORDER BY e.startDate, e.startTime")
    List<CalendarEvent> findUpcomingByOrganizer(
            @Param("userId") UUID userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("statuses") List<EventStatus> statuses);

    @Query("SELECT e FROM CalendarEvent e WHERE e.deleted = false " +
            "AND e.startDate >= :fromDate " +
            "AND e.status IN :statuses " +
            "ORDER BY e.startDate, e.startTime")
    List<CalendarEvent> findUpcoming(
            @Param("fromDate") LocalDate fromDate,
            @Param("statuses") List<EventStatus> statuses);
}
