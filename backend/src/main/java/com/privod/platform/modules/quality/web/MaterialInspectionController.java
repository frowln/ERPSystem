package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.quality.service.MaterialInspectionService;
import com.privod.platform.modules.quality.web.dto.CreateMaterialInspectionRequest;
import com.privod.platform.modules.quality.web.dto.MaterialInspectionResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/quality/material-inspections")
@RequiredArgsConstructor
@Tag(name = "Material Inspections", description = "Material incoming inspection management endpoints")
public class MaterialInspectionController {

    private final MaterialInspectionService materialInspectionService;

    @GetMapping
    @Operation(summary = "List material inspections with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<MaterialInspectionResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MaterialInspectionResponse> page = materialInspectionService.list(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new material inspection record")
    public ResponseEntity<ApiResponse<MaterialInspectionResponse>> create(
            @Valid @RequestBody CreateMaterialInspectionRequest request) {
        MaterialInspectionResponse response = materialInspectionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
