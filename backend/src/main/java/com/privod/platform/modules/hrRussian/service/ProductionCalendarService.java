package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.modules.hrRussian.domain.DayType;
import com.privod.platform.modules.hrRussian.domain.ProductionCalendar;
import com.privod.platform.modules.hrRussian.repository.ProductionCalendarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Сервис производственного календаря РФ.
 * <p>
 * Используется для:
 * <ul>
 *   <li>Формирования табелей Т-13 (норма часов за месяц)</li>
 *   <li>Расчёта сверхурочных (фактические часы vs. норма)</li>
 *   <li>Расчёта отпускных (рабочие дни в периоде)</li>
 *   <li>Определения типа дня (рабочий/выходной/праздничный)</li>
 * </ul>
 * <p>
 * Поддерживает как общесистемный календарь (organization_id IS NULL),
 * так и организационные переопределения.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionCalendarService {

    private final ProductionCalendarRepository repository;

    /** Working day types (for counting and filtering). */
    private static final Set<DayType> WORKING_DAY_TYPES = Set.of(
            DayType.WORKING, DayType.PRE_HOLIDAY, DayType.TRANSFERRED_WORKING
    );

    /**
     * Получить все дни календаря за указанный год.
     * Если у организации есть собственный календарь, возвращает его;
     * иначе — общесистемный.
     */
    @Transactional(readOnly = true)
    public List<ProductionCalendar> getCalendar(int year, UUID orgId) {
        if (orgId != null) {
            List<ProductionCalendar> orgCalendar =
                    repository.findByYearAndOrganizationIdAndDeletedFalseOrderByCalendarDateAsc(year, orgId);
            if (!orgCalendar.isEmpty()) {
                return orgCalendar;
            }
        }
        return repository.findSystemByYear(year);
    }

    /**
     * Количество рабочих дней в диапазоне дат.
     * Рабочие дни: WORKING, PRE_HOLIDAY, TRANSFERRED_WORKING.
     */
    @Transactional(readOnly = true)
    public long getWorkingDays(LocalDate from, LocalDate to, UUID orgId) {
        List<DayType> workingTypes = List.of(
                DayType.WORKING, DayType.PRE_HOLIDAY, DayType.TRANSFERRED_WORKING);
        if (orgId != null) {
            long orgCount = repository.countWorkingDaysByOrg(from, to, orgId, workingTypes);
            if (orgCount > 0) {
                return orgCount;
            }
        }
        return repository.countSystemWorkingDays(from, to, workingTypes);
    }

    /**
     * Норма рабочих часов за месяц/год.
     * Сумма standard_hours всех дней указанного месяца.
     * Используется для T-13 и расчёта сверхурочных.
     */
    @Transactional(readOnly = true)
    public BigDecimal getWorkingHours(int year, int month, UUID orgId) {
        if (orgId != null) {
            BigDecimal orgHours = repository.sumHoursByYearAndMonthAndOrg(year, month, orgId);
            if (orgHours.compareTo(BigDecimal.ZERO) > 0) {
                return orgHours;
            }
        }
        return repository.sumSystemHoursByYearAndMonth(year, month);
    }

    /**
     * Является ли указанная дата рабочим днём.
     */
    @Transactional(readOnly = true)
    public boolean isWorkingDay(LocalDate date, UUID orgId) {
        DayType type = getDayType(date, orgId);
        return WORKING_DAY_TYPES.contains(type);
    }

    /**
     * Тип дня по производственному календарю.
     * Если дата отсутствует в календаре, определяет по дню недели (fallback).
     */
    @Transactional(readOnly = true)
    public DayType getDayType(LocalDate date, UUID orgId) {
        // Try organization-specific first
        if (orgId != null) {
            var orgEntry = repository.findByCalendarDateAndOrganizationIdAndDeletedFalse(date, orgId);
            if (orgEntry.isPresent()) {
                return orgEntry.get().getDayType();
            }
        }

        // Fall back to system calendar
        var systemEntry = repository.findSystemByDate(date);
        if (systemEntry.isPresent()) {
            return systemEntry.get().getDayType();
        }

        // Ultimate fallback: determine by day of week
        log.warn("Production calendar entry not found for {}, falling back to day-of-week logic", date);
        int dow = date.getDayOfWeek().getValue(); // 1=Mon..7=Sun
        return (dow >= 6) ? DayType.WEEKEND : DayType.WORKING;
    }

    /**
     * Получить дни календаря за диапазон дат.
     */
    @Transactional(readOnly = true)
    public List<ProductionCalendar> getDateRange(LocalDate from, LocalDate to, UUID orgId) {
        if (orgId != null) {
            List<ProductionCalendar> orgRange =
                    repository.findByCalendarDateBetweenAndOrganizationIdAndDeletedFalseOrderByCalendarDateAsc(from, to, orgId);
            if (!orgRange.isEmpty()) {
                return orgRange;
            }
        }
        return repository.findSystemByDateRange(from, to);
    }
}
