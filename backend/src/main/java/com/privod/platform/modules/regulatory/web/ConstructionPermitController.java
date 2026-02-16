package com.privod.platform.modules.regulatory.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.regulatory.service.ConstructionPermitService;
import com.privod.platform.modules.regulatory.web.dto.ConstructionPermitResponse;
import com.privod.platform.modules.regulatory.web.dto.CreateConstructionPermitRequest;
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
@RequestMapping("/api/regulatory/permits")
@RequiredArgsConstructor
@Tag(name = "Construction Permits", description = "Construction permit management endpoints")
public class ConstructionPermitController {

    private final ConstructionPermitService permitService;

    @GetMapping
    @Operation(summary = "List construction permits with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<ConstructionPermitResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ConstructionPermitResponse> page = permitService.listPermits(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get construction permit by ID")
    public ResponseEntity<ApiResponse<ConstructionPermitResponse>> getById(@PathVariable UUID id) {
        ConstructionPermitResponse response = permitService.getPermit(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new construction permit")
    public ResponseEntity<ApiResponse<ConstructionPermitResponse>> create(
            @Valid @RequestBody CreateConstructionPermitRequest request) {
        ConstructionPermitResponse response = permitService.createPermit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a construction permit")
    public ResponseEntity<ApiResponse<ConstructionPermitResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateConstructionPermitRequest request) {
        ConstructionPermitResponse response = permitService.updatePermit(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Delete a construction permit (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        permitService.deletePermit(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Suspend a construction permit")
    public ResponseEntity<ApiResponse<ConstructionPermitResponse>> suspend(@PathVariable UUID id) {
        ConstructionPermitResponse response = permitService.suspendPermit(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Revoke a construction permit")
    public ResponseEntity<ApiResponse<ConstructionPermitResponse>> revoke(@PathVariable UUID id) {
        ConstructionPermitResponse response = permitService.revokePermit(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
