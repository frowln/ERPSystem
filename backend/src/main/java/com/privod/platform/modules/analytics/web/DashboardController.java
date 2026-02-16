package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.analytics.service.DashboardService;
import com.privod.platform.modules.analytics.web.dto.CreateDashboardRequest;
import com.privod.platform.modules.analytics.web.dto.CreateWidgetRequest;
import com.privod.platform.modules.analytics.web.dto.DashboardResponse;
import com.privod.platform.modules.analytics.web.dto.DashboardWidgetResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateDashboardRequest;
import com.privod.platform.modules.analytics.web.dto.UpdateLayoutRequest;
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
@RequestMapping("/api/dashboards")
@RequiredArgsConstructor
@Tag(name = "Dashboards", description = "Dashboard management endpoints")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "List all accessible dashboards with pagination")
    public ResponseEntity<ApiResponse<PageResponse<DashboardResponse>>> list(
            @RequestParam(required = false) UUID ownerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DashboardResponse> page;
        if (ownerId != null) {
            page = dashboardService.getAccessibleDashboards(ownerId, pageable);
        } else {
            page = dashboardService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get dashboard by ID")
    public ResponseEntity<ApiResponse<DashboardResponse>> getById(@PathVariable UUID id) {
        DashboardResponse response = dashboardService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get dashboards owned by a specific user")
    public ResponseEntity<ApiResponse<PageResponse<DashboardResponse>>> getMyDashboards(
            @RequestParam UUID ownerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DashboardResponse> page = dashboardService.getMyDashboards(ownerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/system")
    @Operation(summary = "Get all system dashboards")
    public ResponseEntity<ApiResponse<List<DashboardResponse>>> getSystemDashboards() {
        List<DashboardResponse> dashboards = dashboardService.getSystemDashboards();
        return ResponseEntity.ok(ApiResponse.ok(dashboards));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> create(
            @Valid @RequestBody CreateDashboardRequest request) {
        DashboardResponse response = dashboardService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDashboardRequest request) {
        DashboardResponse response = dashboardService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/layout")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update dashboard layout configuration")
    public ResponseEntity<ApiResponse<DashboardResponse>> updateLayout(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLayoutRequest request) {
        DashboardResponse response = dashboardService.updateLayout(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/clone")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Clone an existing dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> clone(
            @PathVariable UUID id,
            @RequestParam String newCode,
            @RequestParam String newName,
            @RequestParam(required = false) UUID ownerId) {
        DashboardResponse response = dashboardService.cloneDashboard(id, newCode, newName, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a dashboard (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        dashboardService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- Widget endpoints ---

    @GetMapping("/{id}/widgets")
    @Operation(summary = "Get all widgets for a dashboard")
    public ResponseEntity<ApiResponse<List<DashboardWidgetResponse>>> getWidgets(@PathVariable UUID id) {
        List<DashboardWidgetResponse> widgets = dashboardService.getWidgets(id);
        return ResponseEntity.ok(ApiResponse.ok(widgets));
    }

    @PostMapping("/{id}/widgets")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Add a widget to a dashboard")
    public ResponseEntity<ApiResponse<DashboardWidgetResponse>> addWidget(
            @PathVariable UUID id,
            @Valid @RequestBody CreateWidgetRequest request) {
        DashboardWidgetResponse response = dashboardService.addWidget(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/widgets/{widgetId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Remove a widget from a dashboard")
    public ResponseEntity<ApiResponse<Void>> removeWidget(
            @PathVariable UUID id,
            @PathVariable UUID widgetId) {
        dashboardService.removeWidget(id, widgetId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
