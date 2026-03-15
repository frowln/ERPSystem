package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hrRussian.domain.DayType;
import com.privod.platform.modules.hrRussian.domain.ProductionCalendar;
import com.privod.platform.modules.hrRussian.service.ProductionCalendarService;
import com.privod.platform.modules.hrRussian.web.dto.ProductionCalendarDayResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Производственный календарь РФ.
 * <p>
 * Предоставляет данные о рабочих/нерабочих днях, нормах часов и количестве
 * рабочих дней за период. Используется табелем Т-13, расчётом сверхурочных
 * и отпускных.
 */
@RestController
@RequestMapping("/api/production-calendar")
@RequiredArgsConstructor
@Tag(name = "Production Calendar", description = "Производственный календарь РФ")
@PreAuthorize("isAuthenticated()")
public class ProductionCalendarController {

    private final ProductionCalendarService calendarService;

    /**
     * GET /api/production-calendar?year=2026
     * Возвращает все дни производственного календаря за указанный год.
     */
    @GetMapping
    @Operation(summary = "Get production calendar for a year")
    public ResponseEntity<ApiResponse<List<ProductionCalendarDayResponse>>> getCalendar(
            @RequestParam int year) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        List<ProductionCalendar> days = calendarService.getCalendar(year, orgId);
        List<ProductionCalendarDayResponse> response = days.stream()
                .map(ProductionCalendarDayResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/production-calendar/working-hours?year=2026&month=3
     * Возвращает норму рабочих часов за указанный месяц.
     */
    @GetMapping("/working-hours")
    @Operation(summary = "Get working hours norm for a month")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getWorkingHours(
            @RequestParam int year,
            @RequestParam int month) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        BigDecimal hours = calendarService.getWorkingHours(year, month, orgId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("hours", hours)));
    }

    /**
     * GET /api/production-calendar/working-days?from=2026-03-01&to=2026-03-31
     * Возвращает количество рабочих дней в диапазоне дат.
     */
    @GetMapping("/working-days")
    @Operation(summary = "Get working days count for a date range")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getWorkingDays(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        long count = calendarService.getWorkingDays(from, to, orgId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    /**
     * GET /api/production-calendar/day-type?date=2026-03-08
     * Возвращает тип конкретного дня.
     */
    @GetMapping("/day-type")
    @Operation(summary = "Get day type for a specific date")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDayType(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        DayType dayType = calendarService.getDayType(date, orgId);
        boolean isWorking = calendarService.isWorkingDay(date, orgId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "date", date.toString(),
                "dayType", dayType.name(),
                "isWorkingDay", isWorking
        )));
    }
}
