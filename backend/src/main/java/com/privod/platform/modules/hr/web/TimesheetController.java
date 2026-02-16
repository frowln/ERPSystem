package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hr.service.TimesheetService;
import com.privod.platform.modules.hr.web.dto.CreateTimesheetRequest;
import com.privod.platform.modules.hr.web.dto.TimesheetResponse;
import com.privod.platform.modules.hr.web.dto.TimesheetSummaryResponse;
import com.privod.platform.modules.hr.web.dto.UpdateTimesheetRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
@Tag(name = "Timesheets", description = "Timesheet management endpoints")
public class TimesheetController {

    private final TimesheetService timesheetService;

    @GetMapping
    @Operation(summary = "List all timesheets")
    public ResponseEntity<ApiResponse<PageResponse<TimesheetResponse>>> list(
            @PageableDefault(size = 20, sort = "workDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TimesheetResponse> page = timesheetService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "List timesheets for an employee")
    public ResponseEntity<ApiResponse<PageResponse<TimesheetResponse>>> listByEmployee(
            @PathVariable UUID employeeId,
            @PageableDefault(size = 20, sort = "workDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TimesheetResponse> page = timesheetService.listByEmployee(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "List timesheets for a project")
    public ResponseEntity<ApiResponse<PageResponse<TimesheetResponse>>> listByProject(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "workDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TimesheetResponse> page = timesheetService.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get timesheet by ID")
    public ResponseEntity<ApiResponse<TimesheetResponse>> getById(@PathVariable UUID id) {
        TimesheetResponse response = timesheetService.getTimesheet(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Create a timesheet entry")
    public ResponseEntity<ApiResponse<TimesheetResponse>> create(
            @Valid @RequestBody CreateTimesheetRequest request) {
        TimesheetResponse response = timesheetService.createTimesheet(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Update a timesheet entry")
    public ResponseEntity<ApiResponse<TimesheetResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTimesheetRequest request) {
        TimesheetResponse response = timesheetService.updateTimesheet(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Submit a timesheet for approval")
    public ResponseEntity<ApiResponse<TimesheetResponse>> submit(@PathVariable UUID id) {
        TimesheetResponse response = timesheetService.submitTimesheet(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve a submitted timesheet")
    public ResponseEntity<ApiResponse<TimesheetResponse>> approve(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID approvedById) {
        TimesheetResponse response = timesheetService.approveTimesheet(id, approvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Reject a submitted timesheet")
    public ResponseEntity<ApiResponse<TimesheetResponse>> reject(@PathVariable UUID id) {
        TimesheetResponse response = timesheetService.rejectTimesheet(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a timesheet entry (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        timesheetService.deleteTimesheet(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary/weekly")
    @Operation(summary = "Get weekly timesheet summary for an employee")
    public ResponseEntity<ApiResponse<TimesheetSummaryResponse>> getWeeklySummary(
            @RequestParam UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        TimesheetSummaryResponse response = timesheetService.getWeeklySummary(employeeId, weekStart);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/summary/monthly")
    @Operation(summary = "Get monthly timesheet summary for a project")
    public ResponseEntity<ApiResponse<TimesheetSummaryResponse>> getMonthlySummary(
            @RequestParam UUID projectId,
            @RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        TimesheetSummaryResponse response = timesheetService.getMonthlySummary(projectId, yearMonth);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
