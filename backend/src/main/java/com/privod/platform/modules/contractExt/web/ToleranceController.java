package com.privod.platform.modules.contractExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.contractExt.service.ContractToleranceService;
import com.privod.platform.modules.contractExt.web.dto.CreateToleranceCheckRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateToleranceRequest;
import com.privod.platform.modules.contractExt.web.dto.ToleranceCheckResponse;
import com.privod.platform.modules.contractExt.web.dto.ToleranceResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tolerances")
@RequiredArgsConstructor
@Tag(name = "Tolerances", description = "Управление допусками и проверками")
public class ToleranceController {

    private final ContractToleranceService toleranceService;

    @GetMapping
    @Operation(summary = "List tolerances (all or filtered by project)")
    public ResponseEntity<ApiResponse<PageResponse<ToleranceResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ToleranceResponse> page;
        if (projectId != null) {
            page = toleranceService.listByProject(projectId, pageable);
        } else {
            page = toleranceService.listAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tolerance by ID")
    public ResponseEntity<ApiResponse<ToleranceResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(toleranceService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new tolerance")
    public ResponseEntity<ApiResponse<ToleranceResponse>> create(
            @Valid @RequestBody CreateToleranceRequest request) {
        ToleranceResponse response = toleranceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // -- Checks --

    @GetMapping("/{toleranceId}/checks")
    @Operation(summary = "List checks for a tolerance")
    public ResponseEntity<ApiResponse<PageResponse<ToleranceCheckResponse>>> listChecks(
            @PathVariable UUID toleranceId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ToleranceCheckResponse> page = toleranceService.listChecks(toleranceId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/checks")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Record a tolerance check")
    public ResponseEntity<ApiResponse<ToleranceCheckResponse>> createCheck(
            @Valid @RequestBody CreateToleranceCheckRequest request) {
        ToleranceCheckResponse response = toleranceService.createCheck(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
