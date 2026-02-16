package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyIncidentService;
import com.privod.platform.modules.safety.web.dto.CreateIncidentRequest;
import com.privod.platform.modules.safety.web.dto.IncidentDashboardResponse;
import com.privod.platform.modules.safety.web.dto.IncidentResponse;
import com.privod.platform.modules.safety.web.dto.UpdateIncidentRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/safety/incidents")
@RequiredArgsConstructor
@Tag(name = "Safety Incidents", description = "Safety incident management endpoints")
public class SafetyIncidentController {

    private final SafetyIncidentService incidentService;

    @GetMapping
    @Operation(summary = "List safety incidents with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<IncidentResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "incidentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IncidentResponse> page = incidentService.listIncidents(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get safety incident by ID")
    public ResponseEntity<ApiResponse<IncidentResponse>> getById(@PathVariable UUID id) {
        IncidentResponse response = incidentService.getIncident(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Report a new safety incident")
    public ResponseEntity<ApiResponse<IncidentResponse>> create(
            @Valid @RequestBody CreateIncidentRequest request) {
        IncidentResponse response = incidentService.createIncident(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a safety incident")
    public ResponseEntity<ApiResponse<IncidentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIncidentRequest request) {
        IncidentResponse response = incidentService.updateIncident(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/investigate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Start investigation of an incident")
    public ResponseEntity<ApiResponse<IncidentResponse>> investigate(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID investigatorId,
            @RequestParam(required = false) String investigatorName) {
        IncidentResponse response = incidentService.investigate(id, investigatorId, investigatorName);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/corrective-action")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Add corrective action to an incident")
    public ResponseEntity<ApiResponse<IncidentResponse>> addCorrectiveAction(
            @PathVariable UUID id,
            @RequestParam String rootCause,
            @RequestParam String correctiveAction) {
        IncidentResponse response = incidentService.addCorrectiveAction(id, rootCause, correctiveAction);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Resolve an incident")
    public ResponseEntity<ApiResponse<IncidentResponse>> resolve(@PathVariable UUID id) {
        IncidentResponse response = incidentService.resolveIncident(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Close a resolved incident")
    public ResponseEntity<ApiResponse<IncidentResponse>> close(@PathVariable UUID id) {
        IncidentResponse response = incidentService.closeIncident(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Delete a safety incident (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get incidents for a specific project")
    public ResponseEntity<ApiResponse<PageResponse<IncidentResponse>>> getByProject(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "incidentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IncidentResponse> page = incidentService.getProjectIncidents(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get incident dashboard statistics")
    public ResponseEntity<ApiResponse<IncidentDashboardResponse>> getDashboard(
            @RequestParam(required = false) UUID projectId) {
        IncidentDashboardResponse response = incidentService.getDashboard(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
