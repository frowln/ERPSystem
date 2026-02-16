package com.privod.platform.modules.calendar.repository;

import com.privod.platform.modules.calendar.domain.CalendarType;
import com.privod.platform.modules.calendar.domain.WorkCalendar;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkCalendarRepository extends JpaRepository<WorkCalendar, UUID> {

    Page<WorkCalendar> findByDeletedFalse(Pageable pageable);

    Optional<WorkCalendar> findByYearAndCalendarTypeAndProjectIdIsNullAndDeletedFalse(
            Integer year, CalendarType calendarType);

    Optional<WorkCalendar> findByYearAndProjectIdAndDeletedFalse(Integer year, UUID projectId);

    boolean existsByYearAndCalendarTypeAndProjectIdIsNullAndDeletedFalse(Integer year, CalendarType calendarType);
}
