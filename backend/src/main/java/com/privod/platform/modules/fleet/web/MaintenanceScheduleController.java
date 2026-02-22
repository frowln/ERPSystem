package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.service.MaintenanceScheduleService;
import com.privod.platform.modules.fleet.web.dto.ComplianceDashboardResponse;
import com.privod.platform.modules.fleet.web.dto.CreateScheduleRuleRequest;
import com.privod.platform.modules.fleet.web.dto.MaintenanceDueItem;
import com.privod.platform.modules.fleet.web.dto.ScheduleRuleResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet/maintenance-schedule")
@RequiredArgsConstructor
@Tag(name = "Fleet - Maintenance Schedule", description = "Preventive maintenance scheduling and compliance tracking")
public class MaintenanceScheduleController {

    private final MaintenanceScheduleService scheduleService;

    @GetMapping("/rules")
    @Operation(summary = "List maintenance schedule rules")
    public ResponseEntity<ApiResponse<PageResponse<ScheduleRuleResponse>>> listRules(
            @RequestParam(required = false) UUID vehicleId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ScheduleRuleResponse> page = scheduleService.listRules(vehicleId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/rules/{id}")
    @Operation(summary = "Get maintenance schedule rule by ID")
    public ResponseEntity<ApiResponse<ScheduleRuleResponse>> getRule(@PathVariable UUID id) {
        ScheduleRuleResponse response = scheduleService.getRule(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a maintenance schedule rule")
    public ResponseEntity<ApiResponse<ScheduleRuleResponse>> createRule(
            @Valid @RequestBody CreateScheduleRuleRequest request) {
        ScheduleRuleResponse response = scheduleService.createRule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a maintenance schedule rule")
    public ResponseEntity<ApiResponse<ScheduleRuleResponse>> updateRule(
            @PathVariable UUID id,
            @Valid @RequestBody CreateScheduleRuleRequest request) {
        ScheduleRuleResponse response = scheduleService.updateRule(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/rules/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Toggle maintenance schedule rule active/inactive")
    public ResponseEntity<ApiResponse<Void>> toggleRule(
            @PathVariable UUID id,
            @RequestParam boolean active) {
        scheduleService.toggleRule(id, active);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Soft-delete a maintenance schedule rule")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable UUID id) {
        scheduleService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/due")
    @Operation(summary = "Get all due/approaching maintenance items based on schedule rules")
    public ResponseEntity<ApiResponse<List<MaintenanceDueItem>>> getDueItems() {
        List<MaintenanceDueItem> items = scheduleService.getDueMaintenanceItems();
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/compliance")
    @Operation(summary = "Get compliance dashboard: insurance, tech inspection, overdue maintenance")
    public ResponseEntity<ApiResponse<ComplianceDashboardResponse>> getComplianceDashboard() {
        ComplianceDashboardResponse dashboard = scheduleService.getComplianceDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }
}
