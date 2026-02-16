package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.service.NonConformanceService;
import com.privod.platform.modules.quality.web.dto.CreateNonConformanceRequest;
import com.privod.platform.modules.quality.web.dto.NonConformanceResponse;
import com.privod.platform.modules.quality.web.dto.UpdateNonConformanceRequest;
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
@RequestMapping("/api/quality/non-conformances")
@RequiredArgsConstructor
@Tag(name = "Non-Conformances", description = "Non-conformance report management endpoints")
public class NonConformanceController {

    private final NonConformanceService nonConformanceService;

    @GetMapping
    @Operation(summary = "List non-conformances with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<NonConformanceResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NonConformanceResponse> page = nonConformanceService.listNonConformances(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get non-conformance by ID")
    public ResponseEntity<ApiResponse<NonConformanceResponse>> getById(@PathVariable UUID id) {
        NonConformanceResponse response = nonConformanceService.getNonConformance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new non-conformance report")
    public ResponseEntity<ApiResponse<NonConformanceResponse>> create(
            @Valid @RequestBody CreateNonConformanceRequest request) {
        NonConformanceResponse response = nonConformanceService.createNonConformance(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a non-conformance report")
    public ResponseEntity<ApiResponse<NonConformanceResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNonConformanceRequest request) {
        NonConformanceResponse response = nonConformanceService.updateNonConformance(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Close a non-conformance report")
    public ResponseEntity<ApiResponse<NonConformanceResponse>> close(@PathVariable UUID id) {
        NonConformanceResponse response = nonConformanceService.closeNonConformance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a non-conformance report")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        nonConformanceService.deleteNonConformance(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
