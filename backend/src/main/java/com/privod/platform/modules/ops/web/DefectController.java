package com.privod.platform.modules.ops.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.ops.domain.DefectStatus;
import com.privod.platform.modules.ops.service.DefectService;
import com.privod.platform.modules.ops.web.dto.CreateDefectRequest;
import com.privod.platform.modules.ops.web.dto.DefectDashboardResponse;
import com.privod.platform.modules.ops.web.dto.DefectResponse;
import com.privod.platform.modules.ops.web.dto.UpdateDefectRequest;
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
@RequestMapping("/api/defects")
@RequiredArgsConstructor
@Tag(name = "Defects", description = "Defect registry management endpoints")
public class DefectController {

    private final DefectService defectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "List defects with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<DefectResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID contractorId,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DefectResponse> page = defectService.listDefects(projectId, contractorId, severity, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Get defect dashboard statistics")
    public ResponseEntity<ApiResponse<DefectDashboardResponse>> dashboard() {
        DefectDashboardResponse response = defectService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Get defect by ID")
    public ResponseEntity<ApiResponse<DefectResponse>> getById(@PathVariable UUID id) {
        DefectResponse response = defectService.getDefect(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Create a new defect")
    public ResponseEntity<ApiResponse<DefectResponse>> create(
            @Valid @RequestBody CreateDefectRequest request) {
        DefectResponse response = defectService.createDefect(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a defect")
    public ResponseEntity<ApiResponse<DefectResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDefectRequest request) {
        DefectResponse response = defectService.updateDefect(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/transition")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Transition defect to new status")
    public ResponseEntity<ApiResponse<DefectResponse>> transition(
            @PathVariable UUID id,
            @RequestParam DefectStatus status,
            @RequestParam(required = false) String fixDescription) {
        DefectResponse response = defectService.transitionStatus(id, status, fixDescription);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a defect (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        defectService.deleteDefect(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
