package com.privod.platform.modules.calendar.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.calendar.service.WorkCalendarService;
import com.privod.platform.modules.calendar.web.dto.AddCalendarExceptionRequest;
import com.privod.platform.modules.calendar.web.dto.CreateWorkCalendarRequest;
import com.privod.platform.modules.calendar.web.dto.WorkCalendarDayResponse;
import com.privod.platform.modules.calendar.web.dto.WorkCalendarResponse;
import com.privod.platform.modules.calendar.web.dto.WorkingDaysResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar/work-calendar")
@RequiredArgsConstructor
@Tag(name = "Work Calendar", description = "Production work calendar management endpoints")
public class WorkCalendarController {

    private final WorkCalendarService calendarService;

    @GetMapping
    @Operation(summary = "List work calendars")
    public ResponseEntity<ApiResponse<PageResponse<WorkCalendarResponse>>> list(
            @PageableDefault(size = 20, sort = "year", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WorkCalendarResponse> page = calendarService.listCalendars(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get work calendar by ID")
    public ResponseEntity<ApiResponse<WorkCalendarResponse>> getById(@PathVariable UUID id) {
        WorkCalendarResponse response = calendarService.getCalendar(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new work calendar")
    public ResponseEntity<ApiResponse<WorkCalendarResponse>> create(
            @Valid @RequestBody CreateWorkCalendarRequest request) {
        WorkCalendarResponse response = calendarService.createCalendar(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a work calendar")
    public ResponseEntity<ApiResponse<WorkCalendarResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateWorkCalendarRequest request) {
        WorkCalendarResponse response = calendarService.updateCalendar(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Delete a work calendar")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        calendarService.deleteCalendar(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/initialize-year/{year}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Initialize a standard work calendar for a year with Russian holidays")
    public ResponseEntity<ApiResponse<WorkCalendarResponse>> initializeYear(@PathVariable int year) {
        WorkCalendarResponse response = calendarService.initializeYear(year);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{calendarId}/exceptions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Add or update a calendar day exception")
    public ResponseEntity<ApiResponse<WorkCalendarDayResponse>> addException(
            @PathVariable UUID calendarId,
            @Valid @RequestBody AddCalendarExceptionRequest request) {
        WorkCalendarDayResponse response = calendarService.addException(calendarId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{calendarId}/working-days")
    @Operation(summary = "Get number of working days between two dates")
    public ResponseEntity<ApiResponse<WorkingDaysResponse>> getWorkingDays(
            @PathVariable UUID calendarId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        WorkingDaysResponse response = calendarService.getWorkingDays(calendarId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{calendarId}/is-working-day")
    @Operation(summary = "Check if a specific date is a working day")
    public ResponseEntity<ApiResponse<Boolean>> isWorkingDay(
            @PathVariable UUID calendarId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean isWorking = calendarService.isWorkingDay(calendarId, date);
        return ResponseEntity.ok(ApiResponse.ok(isWorking));
    }

    @GetMapping("/{calendarId}/days")
    @Operation(summary = "Get calendar days for a date range")
    public ResponseEntity<ApiResponse<List<WorkCalendarDayResponse>>> getCalendarDays(
            @PathVariable UUID calendarId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkCalendarDayResponse> days = calendarService.getCalendarDays(calendarId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(days));
    }
}
