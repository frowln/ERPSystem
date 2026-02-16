package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import com.privod.platform.modules.warehouse.service.MaterialService;
import com.privod.platform.modules.warehouse.web.dto.CreateMaterialRequest;
import com.privod.platform.modules.warehouse.web.dto.MaterialResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateMaterialRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse/materials")
@RequiredArgsConstructor
@Tag(name = "Materials", description = "Material/product management endpoints")
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    @Operation(summary = "List materials with filtering, search, and pagination")
    public ResponseEntity<ApiResponse<PageResponse<MaterialResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) MaterialCategory category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MaterialResponse> page = materialService.listMaterials(search, category, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get material by ID")
    public ResponseEntity<ApiResponse<MaterialResponse>> getById(@PathVariable UUID id) {
        MaterialResponse response = materialService.getMaterial(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Create a new material")
    public ResponseEntity<ApiResponse<MaterialResponse>> create(
            @Valid @RequestBody CreateMaterialRequest request) {
        MaterialResponse response = materialService.createMaterial(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Update an existing material")
    public ResponseEntity<ApiResponse<MaterialResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMaterialRequest request) {
        MaterialResponse response = materialService.updateMaterial(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Delete a material (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
