package com.privod.platform.modules.maintenance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.maintenance.domain.EquipmentStatus;
import com.privod.platform.modules.maintenance.domain.FrequencyType;
import com.privod.platform.modules.maintenance.domain.MaintenanceStage;
import com.privod.platform.modules.maintenance.domain.MaintenanceTeam;
import com.privod.platform.modules.maintenance.domain.PreventiveSchedule;
import com.privod.platform.modules.maintenance.domain.RequestStatus;
import com.privod.platform.modules.maintenance.service.MaintenanceService;
import com.privod.platform.modules.maintenance.web.dto.CreateEquipmentRequest;
import com.privod.platform.modules.maintenance.web.dto.CreateMaintenanceRequest;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceDashboardData;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceEquipmentResponse;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceRequestResponse;
import com.privod.platform.modules.maintenance.web.dto.PreventiveScheduleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@Tag(name = "Maintenance", description = "Maintenance management endpoints")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    // ==================== REQUESTS ====================

    @GetMapping("/requests")
    @Operation(summary = "List maintenance requests with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceRequestResponse>>> listRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) UUID equipmentId,
            @RequestParam(required = false) UUID teamId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MaintenanceRequestResponse> page = maintenanceService.findAllRequests(
                search, status, equipmentId, teamId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get maintenance request by ID")
    public ResponseEntity<ApiResponse<MaintenanceRequestResponse>> getRequest(@PathVariable UUID id) {
        MaintenanceRequestResponse response = maintenanceService.findRequestById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Create a new maintenance request")
    public ResponseEntity<ApiResponse<MaintenanceRequestResponse>> createRequest(
            @Valid @RequestBody CreateMaintenanceRequest request) {
        MaintenanceRequestResponse response = maintenanceService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/requests/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Change maintenance request status")
    public ResponseEntity<ApiResponse<MaintenanceRequestResponse>> updateRequestStatus(
            @PathVariable UUID id,
            @RequestParam RequestStatus status) {
        MaintenanceRequestResponse response = maintenanceService.updateRequestStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/requests/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Change maintenance request stage")
    public ResponseEntity<ApiResponse<MaintenanceRequestResponse>> updateRequestStage(
            @PathVariable UUID id,
            @RequestParam UUID stageId) {
        MaintenanceRequestResponse response = maintenanceService.updateRequestStage(id, stageId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/requests/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a maintenance request (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable UUID id) {
        maintenanceService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/requests/overdue")
    @Operation(summary = "Get overdue maintenance requests")
    public ResponseEntity<ApiResponse<List<MaintenanceRequestResponse>>> getOverdueRequests() {
        List<MaintenanceRequestResponse> overdue = maintenanceService.findOverdueRequests();
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }

    // ==================== EQUIPMENT ====================

    @GetMapping("/equipment")
    @Operation(summary = "List maintenance equipment with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceEquipmentResponse>>> listEquipment(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EquipmentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MaintenanceEquipmentResponse> page = maintenanceService.findAllEquipment(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/equipment/{id}")
    @Operation(summary = "Get equipment by ID")
    public ResponseEntity<ApiResponse<MaintenanceEquipmentResponse>> getEquipment(@PathVariable UUID id) {
        MaintenanceEquipmentResponse response = maintenanceService.findEquipmentById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/equipment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Create new equipment")
    public ResponseEntity<ApiResponse<MaintenanceEquipmentResponse>> createEquipment(
            @Valid @RequestBody CreateEquipmentRequest request) {
        MaintenanceEquipmentResponse response = maintenanceService.createEquipment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/equipment/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Update equipment")
    public ResponseEntity<ApiResponse<MaintenanceEquipmentResponse>> updateEquipment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEquipmentRequest request) {
        MaintenanceEquipmentResponse response = maintenanceService.updateEquipment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete equipment (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(@PathVariable UUID id) {
        maintenanceService.deleteEquipment(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ==================== TEAMS ====================

    @GetMapping("/teams")
    @Operation(summary = "List maintenance teams")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceTeam>>> listTeams(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MaintenanceTeam> page = maintenanceService.findAllTeams(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/teams/{id}")
    @Operation(summary = "Get maintenance team by ID")
    public ResponseEntity<ApiResponse<MaintenanceTeam>> getTeam(@PathVariable UUID id) {
        MaintenanceTeam team = maintenanceService.findTeamById(id);
        return ResponseEntity.ok(ApiResponse.ok(team));
    }

    @PostMapping("/teams")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Create a new maintenance team")
    public ResponseEntity<ApiResponse<MaintenanceTeam>> createTeam(@RequestBody MaintenanceTeam team) {
        MaintenanceTeam created = maintenanceService.createTeam(team);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created));
    }

    @PutMapping("/teams/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Update a maintenance team")
    public ResponseEntity<ApiResponse<MaintenanceTeam>> updateTeam(
            @PathVariable UUID id,
            @RequestBody MaintenanceTeam team) {
        MaintenanceTeam updated = maintenanceService.updateTeam(id, team);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/teams/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a maintenance team (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable UUID id) {
        maintenanceService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ==================== STAGES ====================

    @GetMapping("/stages")
    @Operation(summary = "List all maintenance stages ordered by sequence")
    public ResponseEntity<ApiResponse<List<MaintenanceStage>>> listStages() {
        List<MaintenanceStage> stages = maintenanceService.findAllStages();
        return ResponseEntity.ok(ApiResponse.ok(stages));
    }

    // ==================== SCHEDULES ====================

    @GetMapping("/schedules")
    @Operation(summary = "List preventive schedules")
    public ResponseEntity<ApiResponse<PageResponse<PreventiveScheduleResponse>>> listSchedules(
            @RequestParam(required = false) UUID equipmentId,
            @PageableDefault(size = 20, sort = "nextExecution", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<PreventiveScheduleResponse> page = maintenanceService.findAllSchedules(equipmentId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/schedules/{id}")
    @Operation(summary = "Get preventive schedule by ID")
    public ResponseEntity<ApiResponse<PreventiveScheduleResponse>> getSchedule(@PathVariable UUID id) {
        PreventiveScheduleResponse response = maintenanceService.findScheduleById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE_MANAGER')")
    @Operation(summary = "Create a preventive schedule")
    public ResponseEntity<ApiResponse<PreventiveScheduleResponse>> createSchedule(
            @RequestBody PreventiveSchedule schedule) {
        PreventiveScheduleResponse response = maintenanceService.createSchedule(schedule);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/schedules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a preventive schedule (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable UUID id) {
        maintenanceService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/schedules/process")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Process due preventive schedules and auto-create requests")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> processSchedules() {
        int created = maintenanceService.processPreventiveSchedules();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("createdRequests", created)));
    }

    @GetMapping("/schedules/upcoming")
    @Operation(summary = "Get upcoming preventive maintenance within next 7 days")
    public ResponseEntity<ApiResponse<List<PreventiveScheduleResponse>>> getUpcomingPreventive() {
        List<PreventiveScheduleResponse> upcoming = maintenanceService.findUpcomingPreventive();
        return ResponseEntity.ok(ApiResponse.ok(upcoming));
    }

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard")
    @Operation(summary = "Get maintenance dashboard statistics")
    public ResponseEntity<ApiResponse<MaintenanceDashboardData>> getDashboard() {
        MaintenanceDashboardData dashboard = maintenanceService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
