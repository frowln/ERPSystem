package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.service.QualityCheckService;
import com.privod.platform.modules.quality.web.dto.CreateQualityCheckRequest;
import com.privod.platform.modules.quality.web.dto.QualityCheckResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityCheckRequest;
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
@RequestMapping("/api/quality/checks")
@RequiredArgsConstructor
@Tag(name = "Quality Checks", description = "Quality check management endpoints")
public class QualityCheckController {

    private final QualityCheckService qualityCheckService;

    @GetMapping
    @Operation(summary = "List quality checks with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<QualityCheckResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QualityCheckResponse> page = qualityCheckService.listChecks(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quality check by ID")
    public ResponseEntity<ApiResponse<QualityCheckResponse>> getById(@PathVariable UUID id) {
        QualityCheckResponse response = qualityCheckService.getCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new quality check")
    public ResponseEntity<ApiResponse<QualityCheckResponse>> create(
            @Valid @RequestBody CreateQualityCheckRequest request) {
        QualityCheckResponse response = qualityCheckService.createCheck(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a quality check")
    public ResponseEntity<ApiResponse<QualityCheckResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQualityCheckRequest request) {
        QualityCheckResponse response = qualityCheckService.updateCheck(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Start a quality check")
    public ResponseEntity<ApiResponse<QualityCheckResponse>> start(@PathVariable UUID id) {
        QualityCheckResponse response = qualityCheckService.startCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Complete a quality check with result")
    public ResponseEntity<ApiResponse<QualityCheckResponse>> complete(
            @PathVariable UUID id,
            @RequestParam CheckResult result,
            @RequestParam(required = false) String findings,
            @RequestParam(required = false) String recommendations) {
        QualityCheckResponse response = qualityCheckService.completeCheck(id, result, findings, recommendations);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Delete a quality check")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        qualityCheckService.deleteCheck(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
