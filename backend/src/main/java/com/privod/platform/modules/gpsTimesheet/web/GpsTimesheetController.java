package com.privod.platform.modules.gpsTimesheet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.gpsTimesheet.service.GpsTimesheetService;
import com.privod.platform.modules.gpsTimesheet.web.dto.CreateSiteGeofenceRequest;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsCheckEventResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsCheckInRequest;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsCheckOutRequest;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsTimesheetEntryResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsTimesheetSummaryResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.SiteGeofenceResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.TimesheetDashboardResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.UpdateSiteGeofenceRequest;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gps-timesheets")
@RequiredArgsConstructor
@Tag(name = "GPS Timesheets", description = "GPS-based timesheets with geofencing")
public class GpsTimesheetController {

    private final GpsTimesheetService gpsTimesheetService;

    // ───────── Geofence endpoints ─────────

    @GetMapping("/geofences")
    @Operation(summary = "List site geofences with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<SiteGeofenceResponse>>> listGeofences(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SiteGeofenceResponse> page = gpsTimesheetService.listGeofences(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/geofences/{id}")
    @Operation(summary = "Get site geofence by ID")
    public ResponseEntity<ApiResponse<SiteGeofenceResponse>> getGeofence(@PathVariable UUID id) {
        SiteGeofenceResponse response = gpsTimesheetService.getGeofence(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/geofences")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new site geofence")
    public ResponseEntity<ApiResponse<SiteGeofenceResponse>> createGeofence(
            @Valid @RequestBody CreateSiteGeofenceRequest request) {
        SiteGeofenceResponse response = gpsTimesheetService.createGeofence(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/geofences/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a site geofence")
    public ResponseEntity<ApiResponse<SiteGeofenceResponse>> updateGeofence(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSiteGeofenceRequest request) {
        SiteGeofenceResponse response = gpsTimesheetService.updateGeofence(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/geofences/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Soft-delete a site geofence")
    public ResponseEntity<ApiResponse<Void>> deleteGeofence(@PathVariable UUID id) {
        gpsTimesheetService.deleteGeofence(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ───────── Check-in / Check-out ─────────

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Record a GPS check-in event")
    public ResponseEntity<ApiResponse<GpsCheckEventResponse>> checkIn(
            @Valid @RequestBody GpsCheckInRequest request) {
        GpsCheckEventResponse response = gpsTimesheetService.checkIn(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Record a GPS check-out event")
    public ResponseEntity<ApiResponse<GpsCheckEventResponse>> checkOut(
            @Valid @RequestBody GpsCheckOutRequest request) {
        GpsCheckEventResponse response = gpsTimesheetService.checkOut(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ───────── Timesheet entries ─────────

    @GetMapping("/entries")
    @Operation(summary = "List timesheet entries with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<GpsTimesheetEntryResponse>>> listEntries(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<GpsTimesheetEntryResponse> page = gpsTimesheetService.listEntries(employeeId, projectId, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/entries/unverified")
    @Operation(summary = "List unverified timesheet entries")
    public ResponseEntity<ApiResponse<PageResponse<GpsTimesheetEntryResponse>>> listUnverified(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<GpsTimesheetEntryResponse> page = gpsTimesheetService.listUnverifiedEntries(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/entries/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Verify a timesheet entry")
    public ResponseEntity<ApiResponse<GpsTimesheetEntryResponse>> verifyEntry(@PathVariable UUID id) {
        GpsTimesheetEntryResponse response = gpsTimesheetService.verifyEntry(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/entries/employee/{employeeId}")
    @Operation(summary = "Get employee timesheet for a date range")
    public ResponseEntity<ApiResponse<List<GpsTimesheetEntryResponse>>> getEmployeeTimesheet(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<GpsTimesheetEntryResponse> entries = gpsTimesheetService.getEmployeeTimesheet(employeeId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    // ───────── Summaries ─────────

    @GetMapping("/summaries")
    @Operation(summary = "List monthly timesheet summaries")
    public ResponseEntity<ApiResponse<PageResponse<GpsTimesheetSummaryResponse>>> listSummaries(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<GpsTimesheetSummaryResponse> page = gpsTimesheetService.listSummaries(employeeId, year, month, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/summaries/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Generate monthly timesheet summaries")
    public ResponseEntity<ApiResponse<Void>> generateSummaries(
            @RequestParam int year,
            @RequestParam int month) {
        gpsTimesheetService.generateMonthlySummary(year, month);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ───────── Dashboard ─────────

    @GetMapping("/dashboard")
    @Operation(summary = "Get real-time GPS timesheet dashboard")
    public ResponseEntity<ApiResponse<TimesheetDashboardResponse>> getDashboard() {
        TimesheetDashboardResponse dashboard = gpsTimesheetService.getTimesheetDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
