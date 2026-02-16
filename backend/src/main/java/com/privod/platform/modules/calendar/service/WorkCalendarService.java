package com.privod.platform.modules.calendar.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.CalendarType;
import com.privod.platform.modules.calendar.domain.DayType;
import com.privod.platform.modules.calendar.domain.WorkCalendar;
import com.privod.platform.modules.calendar.domain.WorkCalendarDay;
import com.privod.platform.modules.calendar.repository.WorkCalendarDayRepository;
import com.privod.platform.modules.calendar.repository.WorkCalendarRepository;
import com.privod.platform.modules.calendar.web.dto.AddCalendarExceptionRequest;
import com.privod.platform.modules.calendar.web.dto.CreateWorkCalendarRequest;
import com.privod.platform.modules.calendar.web.dto.WorkCalendarDayResponse;
import com.privod.platform.modules.calendar.web.dto.WorkCalendarResponse;
import com.privod.platform.modules.calendar.web.dto.WorkingDaysResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkCalendarService {

    private final WorkCalendarRepository calendarRepository;
    private final WorkCalendarDayRepository dayRepository;
    private final AuditService auditService;

    // Russian federal holidays (month-day pairs, no year)
    private static final Map<String, String> RUSSIAN_HOLIDAYS = new HashMap<>();

    static {
        RUSSIAN_HOLIDAYS.put("01-01", "Новый год");
        RUSSIAN_HOLIDAYS.put("01-02", "Новогодние каникулы");
        RUSSIAN_HOLIDAYS.put("01-03", "Новогодние каникулы");
        RUSSIAN_HOLIDAYS.put("01-04", "Новогодние каникулы");
        RUSSIAN_HOLIDAYS.put("01-05", "Новогодние каникулы");
        RUSSIAN_HOLIDAYS.put("01-06", "Новогодние каникулы");
        RUSSIAN_HOLIDAYS.put("01-07", "Рождество Христово");
        RUSSIAN_HOLIDAYS.put("01-08", "Новогодние каникулы");
        RUSSIAN_HOLIDAYS.put("02-23", "День защитника Отечества");
        RUSSIAN_HOLIDAYS.put("03-08", "Международный женский день");
        RUSSIAN_HOLIDAYS.put("05-01", "Праздник Весны и Труда");
        RUSSIAN_HOLIDAYS.put("05-09", "День Победы");
        RUSSIAN_HOLIDAYS.put("06-12", "День России");
        RUSSIAN_HOLIDAYS.put("11-04", "День народного единства");
    }

    @Transactional(readOnly = true)
    public Page<WorkCalendarResponse> listCalendars(Pageable pageable) {
        return calendarRepository.findByDeletedFalse(pageable)
                .map(WorkCalendarResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WorkCalendarResponse getCalendar(UUID id) {
        WorkCalendar calendar = getCalendarOrThrow(id);
        return WorkCalendarResponse.fromEntity(calendar);
    }

    @Transactional
    public WorkCalendarResponse createCalendar(CreateWorkCalendarRequest request) {
        WorkCalendar calendar = WorkCalendar.builder()
                .year(request.year())
                .calendarType(request.calendarType() != null ? request.calendarType() : CalendarType.STANDARD)
                .projectId(request.projectId())
                .name(request.name())
                .build();

        calendar = calendarRepository.save(calendar);
        auditService.logCreate("WorkCalendar", calendar.getId());

        log.info("Work calendar created: {} for year {} ({})",
                calendar.getName(), calendar.getYear(), calendar.getId());
        return WorkCalendarResponse.fromEntity(calendar);
    }

    @Transactional
    public WorkCalendarResponse updateCalendar(UUID id, CreateWorkCalendarRequest request) {
        WorkCalendar calendar = getCalendarOrThrow(id);

        if (request.name() != null) calendar.setName(request.name());
        if (request.calendarType() != null) calendar.setCalendarType(request.calendarType());
        if (request.projectId() != null) calendar.setProjectId(request.projectId());

        calendar = calendarRepository.save(calendar);
        auditService.logUpdate("WorkCalendar", calendar.getId(), "multiple", null, null);

        log.info("Work calendar updated: {} ({})", calendar.getName(), calendar.getId());
        return WorkCalendarResponse.fromEntity(calendar);
    }

    @Transactional
    public void deleteCalendar(UUID id) {
        WorkCalendar calendar = getCalendarOrThrow(id);
        calendar.softDelete();
        calendarRepository.save(calendar);
        auditService.logDelete("WorkCalendar", id);
        log.info("Work calendar deleted: {} ({})", calendar.getName(), id);
    }

    @Transactional
    public WorkCalendarResponse initializeYear(int year) {
        if (calendarRepository.existsByYearAndCalendarTypeAndProjectIdIsNullAndDeletedFalse(
                year, CalendarType.STANDARD)) {
            throw new IllegalStateException(
                    "Стандартный производственный календарь на " + year + " год уже существует");
        }

        WorkCalendar calendar = WorkCalendar.builder()
                .year(year)
                .calendarType(CalendarType.STANDARD)
                .name("Производственный календарь " + year)
                .build();
        calendar = calendarRepository.save(calendar);

        List<WorkCalendarDay> days = new ArrayList<>();
        LocalDate date = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);

        while (!date.isAfter(endOfYear)) {
            String monthDay = String.format("%02d-%02d", date.getMonthValue(), date.getDayOfMonth());
            DayType dayType;
            BigDecimal workHours;
            String note = null;

            if (RUSSIAN_HOLIDAYS.containsKey(monthDay)) {
                dayType = DayType.HOLIDAY;
                workHours = BigDecimal.ZERO;
                note = RUSSIAN_HOLIDAYS.get(monthDay);
            } else if (date.getDayOfWeek() == DayOfWeek.SATURDAY
                    || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                dayType = DayType.WEEKEND;
                workHours = BigDecimal.ZERO;
            } else {
                dayType = DayType.WORKING;
                workHours = new BigDecimal("8.00");
            }

            WorkCalendarDay day = WorkCalendarDay.builder()
                    .calendarId(calendar.getId())
                    .calendarDate(date)
                    .dayType(dayType)
                    .workHours(workHours)
                    .note(note)
                    .build();
            days.add(day);

            date = date.plusDays(1);
        }

        dayRepository.saveAll(days);
        auditService.logCreate("WorkCalendar", calendar.getId());

        log.info("Work calendar initialized for year {}: {} days created ({})",
                year, days.size(), calendar.getId());
        return WorkCalendarResponse.fromEntity(calendar);
    }

    @Transactional
    public WorkCalendarDayResponse addException(UUID calendarId, AddCalendarExceptionRequest request) {
        getCalendarOrThrow(calendarId);

        WorkCalendarDay day = dayRepository
                .findByCalendarIdAndCalendarDateAndDeletedFalse(calendarId, request.calendarDate())
                .orElse(null);

        if (day != null) {
            day.setDayType(request.dayType());
            day.setWorkHours(request.workHours() != null ? request.workHours() : BigDecimal.ZERO);
            day.setNote(request.note());
        } else {
            day = WorkCalendarDay.builder()
                    .calendarId(calendarId)
                    .calendarDate(request.calendarDate())
                    .dayType(request.dayType())
                    .workHours(request.workHours() != null ? request.workHours() : BigDecimal.ZERO)
                    .note(request.note())
                    .build();
        }

        day = dayRepository.save(day);
        log.info("Calendar exception added/updated for {}: {} ({})",
                request.calendarDate(), request.dayType(), calendarId);
        return WorkCalendarDayResponse.fromEntity(day);
    }

    @Transactional(readOnly = true)
    public WorkingDaysResponse getWorkingDays(UUID calendarId, LocalDate startDate, LocalDate endDate) {
        getCalendarOrThrow(calendarId);

        List<DayType> workingTypes = List.of(DayType.WORKING, DayType.SHORT_DAY);
        long workingDays = dayRepository.countWorkingDays(calendarId, startDate, endDate, workingTypes);
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        return new WorkingDaysResponse(startDate, endDate, workingDays, totalDays);
    }

    @Transactional(readOnly = true)
    public boolean isWorkingDay(UUID calendarId, LocalDate date) {
        getCalendarOrThrow(calendarId);

        return dayRepository.findByCalendarIdAndCalendarDateAndDeletedFalse(calendarId, date)
                .map(day -> day.getDayType() == DayType.WORKING || day.getDayType() == DayType.SHORT_DAY)
                .orElse(date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY);
    }

    @Transactional(readOnly = true)
    public List<WorkCalendarDayResponse> getCalendarDays(UUID calendarId, LocalDate startDate, LocalDate endDate) {
        getCalendarOrThrow(calendarId);
        return dayRepository.findByCalendarIdAndDateRange(calendarId, startDate, endDate)
                .stream()
                .map(WorkCalendarDayResponse::fromEntity)
                .toList();
    }

    /**
     * Calculate end date given a start date and number of working days.
     * Used by ScheduleItemService for schedule calculations.
     */
    @Transactional(readOnly = true)
    public LocalDate calculateEndDate(UUID calendarId, LocalDate startDate, int workingDays) {
        if (workingDays <= 0) {
            return startDate;
        }

        getCalendarOrThrow(calendarId);

        LocalDate current = startDate;
        int counted = 0;

        while (counted < workingDays) {
            if (isWorkingDay(calendarId, current)) {
                counted++;
            }
            if (counted < workingDays) {
                current = current.plusDays(1);
            }
        }

        return current;
    }

    private WorkCalendar getCalendarOrThrow(UUID id) {
        return calendarRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Производственный календарь не найден: " + id));
    }
}
