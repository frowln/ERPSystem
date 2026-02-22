package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.domain.PortalTaskStatus;
import com.privod.platform.modules.portal.service.PortalTaskService;
import com.privod.platform.modules.portal.web.dto.CreatePortalTaskRequest;
import com.privod.platform.modules.portal.web.dto.PortalTaskResponse;
import com.privod.platform.modules.portal.web.dto.UpdatePortalTaskStatusRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/portal/tasks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER', 'ADMIN', 'PROJECT_MANAGER')")
@Tag(name = "Portal Tasks", description = "Portal task management endpoints")
public class PortalTaskController {

    private final PortalTaskService portalTaskService;

    @GetMapping
    @Operation(summary = "Get tasks for a portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalTaskResponse>>> getMyTasks(
            @RequestParam UUID portalUserId,
            @RequestParam(required = false) PortalTaskStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalTaskResponse> page = portalTaskService.getMyTasks(portalUserId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get tasks for a project")
    public ResponseEntity<ApiResponse<PageResponse<PortalTaskResponse>>> getProjectTasks(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalTaskResponse> page = portalTaskService.getProjectTasks(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<ApiResponse<PortalTaskResponse>> getById(@PathVariable UUID id) {
        PortalTaskResponse response = portalTaskService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new portal task (internal users only)")
    public ResponseEntity<ApiResponse<PortalTaskResponse>> create(
            @Valid @RequestBody CreatePortalTaskRequest request) {
        PortalTaskResponse response = portalTaskService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update task status")
    public ResponseEntity<ApiResponse<PortalTaskResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID portalUserId,
            @Valid @RequestBody UpdatePortalTaskStatusRequest request) {
        PortalTaskResponse response = portalTaskService.updateStatus(id, request, portalUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a portal task (internal users only)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        portalTaskService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
