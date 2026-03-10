package com.privod.platform.modules.hr.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.hr.service.HrExtendedService;
import com.privod.platform.modules.hr.web.dto.CreateHrWorkOrderRequest;
import com.privod.platform.modules.hr.web.dto.CreateQualificationRecordRequest;
import com.privod.platform.modules.hr.web.dto.CreateStaffingVacancyRequest;
import com.privod.platform.modules.hr.web.dto.HrWorkOrderResponse;
import com.privod.platform.modules.hr.web.dto.QualificationRecordResponse;
import com.privod.platform.modules.hr.web.dto.SeniorityRecordResponse;
import com.privod.platform.modules.hr.web.dto.StaffingPositionResponse;
import com.privod.platform.modules.hr.web.dto.TimesheetT13RowResponse;
import com.privod.platform.modules.hr.web.dto.UpdateTimesheetT13CellRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@Tag(name = "HR Extended", description = "Staffing schedule, T-13 timesheet, work orders, qualifications, seniority report")
public class HrExtendedController {

    private final HrExtendedService hrExtendedService;

    // -----------------------------------------------------------------------
    // Staffing Schedule
    // -----------------------------------------------------------------------

    @GetMapping("/staffing-schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Get staffing schedule with optional filters")
    public ResponseEntity<ApiResponse<List<StaffingPositionResponse>>> getStaffingSchedule(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String vacancyStatus) {
        List<StaffingPositionResponse> result = hrExtendedService.getStaffingSchedule(department, vacancyStatus);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/staffing-schedule/vacancies")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'MANAGER')")
    @Operation(summary = "Create a new staffing vacancy")
    public ResponseEntity<ApiResponse<StaffingPositionResponse>> createVacancy(
            @Valid @RequestBody CreateStaffingVacancyRequest request) {
        StaffingPositionResponse result = hrExtendedService.createVacancy(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // Timesheet T-13
    // -----------------------------------------------------------------------

    @GetMapping("/timesheet-t13")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'MANAGER', 'FOREMAN')")
    @Operation(summary = "Get T-13 timesheet for a project/month/year")
    public ResponseEntity<ApiResponse<List<TimesheetT13RowResponse>>> getTimesheetT13(
            @RequestParam UUID projectId,
            @RequestParam int month,
            @RequestParam int year) {
        List<TimesheetT13RowResponse> result = hrExtendedService.getTimesheetT13(projectId, month, year);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/timesheet-t13/cell")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'MANAGER', 'FOREMAN')")
    @Operation(summary = "Update a single T-13 timesheet cell")
    public ResponseEntity<ApiResponse<Void>> updateTimesheetT13Cell(
            @RequestParam UUID projectId,
            @RequestParam int month,
            @RequestParam int year,
            @Valid @RequestBody UpdateTimesheetT13CellRequest request) {
        hrExtendedService.updateTimesheetT13Cell(projectId, month, year, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // -----------------------------------------------------------------------
    // Work Orders
    // -----------------------------------------------------------------------

    @GetMapping("/work-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'MANAGER', 'FOREMAN', 'ENGINEER')")
    @Operation(summary = "List HR work orders with optional type and status filters")
    public ResponseEntity<ApiResponse<List<HrWorkOrderResponse>>> getWorkOrders(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        List<HrWorkOrderResponse> result = hrExtendedService.getWorkOrders(type, status);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/work-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'MANAGER', 'FOREMAN')")
    @Operation(summary = "Create a new HR work order")
    public ResponseEntity<ApiResponse<HrWorkOrderResponse>> createWorkOrder(
            @Valid @RequestBody CreateHrWorkOrderRequest request) {
        HrWorkOrderResponse result = hrExtendedService.createWorkOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // Qualifications & Permits
    // -----------------------------------------------------------------------

    @GetMapping("/qualifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "List qualification records with optional filters")
    public ResponseEntity<ApiResponse<List<QualificationRecordResponse>>> getQualifications(
            @RequestParam(required = false) String qualificationType,
            @RequestParam(required = false) String status) {
        List<QualificationRecordResponse> result = hrExtendedService.getQualifications(qualificationType, status);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/qualifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Create a new qualification record")
    public ResponseEntity<ApiResponse<QualificationRecordResponse>> createQualification(
            @Valid @RequestBody CreateQualificationRecordRequest request) {
        QualificationRecordResponse result = hrExtendedService.createQualification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    // -----------------------------------------------------------------------
    // Seniority & Leave Report
    // -----------------------------------------------------------------------

    @GetMapping("/seniority-report")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Get seniority and leave report for all active employees")
    public ResponseEntity<ApiResponse<List<SeniorityRecordResponse>>> getSeniorityReport() {
        List<SeniorityRecordResponse> result = hrExtendedService.getSeniorityReport();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
