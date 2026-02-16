package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;
import com.privod.platform.modules.closeout.service.WarrantyClaimService;
import com.privod.platform.modules.closeout.web.dto.CreateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.WarrantyClaimResponse;
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
@RequestMapping("/api/warranty-claims")
@RequiredArgsConstructor
@Tag(name = "Warranty Claims", description = "Управление гарантийными рекламациями")
public class WarrantyClaimController {

    private final WarrantyClaimService warrantyService;

    @GetMapping
    @Operation(summary = "Список гарантийных рекламаций с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<WarrantyClaimResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) WarrantyClaimStatus status,
            @RequestParam(required = false) UUID handoverPackageId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<WarrantyClaimResponse> page = warrantyService.findAll(projectId, status, handoverPackageId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить рекламацию по ID")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> getById(@PathVariable UUID id) {
        WarrantyClaimResponse response = warrantyService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать гарантийную рекламацию")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> create(
            @Valid @RequestBody CreateWarrantyClaimRequest request) {
        WarrantyClaimResponse response = warrantyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить гарантийную рекламацию")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarrantyClaimRequest request) {
        WarrantyClaimResponse response = warrantyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить гарантийную рекламацию (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        warrantyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
