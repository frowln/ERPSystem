package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import com.privod.platform.modules.safety.service.SafetyViolationService;
import com.privod.platform.modules.safety.web.dto.CreateViolationRequest;
import com.privod.platform.modules.safety.web.dto.ResolveViolationRequest;
import com.privod.platform.modules.safety.web.dto.ViolationDashboardResponse;
import com.privod.platform.modules.safety.web.dto.ViolationResponse;
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
@RequestMapping("/api/safety/violations")
@RequiredArgsConstructor
@Tag(name = "Safety Violations", description = "Safety violation management endpoints")
public class SafetyViolationController {

    private final SafetyViolationService violationService;

    @GetMapping
    @Operation(summary = "List all safety violations")
    public ResponseEntity<ApiResponse<PageResponse<ViolationResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ViolationResponse> page = violationService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get violation by ID")
    public ResponseEntity<ApiResponse<ViolationResponse>> getById(@PathVariable UUID id) {
        ViolationResponse response = violationService.getViolation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Create a new safety violation")
    public ResponseEntity<ApiResponse<ViolationResponse>> create(
            @Valid @RequestBody CreateViolationRequest request) {
        ViolationResponse response = violationService.createViolation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Update a safety violation")
    public ResponseEntity<ApiResponse<ViolationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateViolationRequest request) {
        ViolationResponse response = violationService.updateViolation(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Delete a safety violation (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        violationService.deleteViolation(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Resolve a safety violation")
    public ResponseEntity<ApiResponse<ViolationResponse>> resolve(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveViolationRequest request) {
        ViolationResponse response = violationService.resolveViolation(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/overdue")
    @Operation(summary = "Get all overdue violations")
    public ResponseEntity<ApiResponse<List<ViolationResponse>>> getOverdue() {
        List<ViolationResponse> violations = violationService.getOverdueViolations();
        return ResponseEntity.ok(ApiResponse.ok(violations));
    }

    @GetMapping("/by-status")
    @Operation(summary = "List violations by status")
    public ResponseEntity<ApiResponse<PageResponse<ViolationResponse>>> listByStatus(
            @RequestParam ViolationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ViolationResponse> page = violationService.listByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get violation dashboard statistics")
    public ResponseEntity<ApiResponse<ViolationDashboardResponse>> getDashboard() {
        ViolationDashboardResponse response = violationService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
