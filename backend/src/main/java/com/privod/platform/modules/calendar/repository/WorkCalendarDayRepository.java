package com.privod.platform.modules.calendar.repository;

import com.privod.platform.modules.calendar.domain.DayType;
import com.privod.platform.modules.calendar.domain.WorkCalendarDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkCalendarDayRepository extends JpaRepository<WorkCalendarDay, UUID> {

    List<WorkCalendarDay> findByCalendarIdAndDeletedFalseOrderByCalendarDate(UUID calendarId);

    Optional<WorkCalendarDay> findByCalendarIdAndCalendarDateAndDeletedFalse(UUID calendarId, LocalDate calendarDate);

    @Query("SELECT d FROM WorkCalendarDay d WHERE d.calendarId = :calendarId " +
            "AND d.calendarDate >= :startDate AND d.calendarDate <= :endDate " +
            "AND d.deleted = false ORDER BY d.calendarDate")
    List<WorkCalendarDay> findByCalendarIdAndDateRange(
            @Param("calendarId") UUID calendarId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(d) FROM WorkCalendarDay d WHERE d.calendarId = :calendarId " +
            "AND d.calendarDate >= :startDate AND d.calendarDate <= :endDate " +
            "AND d.dayType IN :workingTypes AND d.deleted = false")
    long countWorkingDays(
            @Param("calendarId") UUID calendarId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("workingTypes") List<DayType> workingTypes);

    void deleteByCalendarId(UUID calendarId);
}
