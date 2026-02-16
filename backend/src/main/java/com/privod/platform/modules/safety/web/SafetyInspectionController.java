package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyInspectionService;
import com.privod.platform.modules.safety.web.dto.CreateInspectionRequest;
import com.privod.platform.modules.safety.web.dto.CreateViolationRequest;
import com.privod.platform.modules.safety.web.dto.InspectionResponse;
import com.privod.platform.modules.safety.web.dto.UpdateInspectionRequest;
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
@RequestMapping("/api/safety/inspections")
@RequiredArgsConstructor
@Tag(name = "Safety Inspections", description = "Safety inspection management endpoints")
public class SafetyInspectionController {

    private final SafetyInspectionService inspectionService;

    @GetMapping
    @Operation(summary = "List safety inspections with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<InspectionResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "inspectionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InspectionResponse> page = inspectionService.listInspections(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get safety inspection by ID")
    public ResponseEntity<ApiResponse<InspectionResponse>> getById(@PathVariable UUID id) {
        InspectionResponse response = inspectionService.getInspection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new safety inspection")
    public ResponseEntity<ApiResponse<InspectionResponse>> create(
            @Valid @RequestBody CreateInspectionRequest request) {
        InspectionResponse response = inspectionService.createInspection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a safety inspection")
    public ResponseEntity<ApiResponse<InspectionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInspectionRequest request) {
        InspectionResponse response = inspectionService.updateInspection(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Start a planned inspection")
    public ResponseEntity<ApiResponse<InspectionResponse>> start(@PathVariable UUID id) {
        InspectionResponse response = inspectionService.startInspection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Complete an in-progress inspection")
    public ResponseEntity<ApiResponse<InspectionResponse>> complete(@PathVariable UUID id) {
        InspectionResponse response = inspectionService.completeInspection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Cancel an inspection")
    public ResponseEntity<ApiResponse<InspectionResponse>> cancel(@PathVariable UUID id) {
        InspectionResponse response = inspectionService.cancelInspection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Delete a safety inspection (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Violations within inspection ----

    @GetMapping("/{inspectionId}/violations")
    @Operation(summary = "Get all violations for an inspection")
    public ResponseEntity<ApiResponse<List<ViolationResponse>>> getViolations(
            @PathVariable UUID inspectionId) {
        List<ViolationResponse> violations = inspectionService.getInspectionViolations(inspectionId);
        return ResponseEntity.ok(ApiResponse.ok(violations));
    }

    @PostMapping("/{inspectionId}/violations")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Add a violation to an inspection")
    public ResponseEntity<ApiResponse<ViolationResponse>> addViolation(
            @PathVariable UUID inspectionId,
            @Valid @RequestBody CreateViolationRequest request) {
        ViolationResponse response = inspectionService.addViolationToInspection(inspectionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
