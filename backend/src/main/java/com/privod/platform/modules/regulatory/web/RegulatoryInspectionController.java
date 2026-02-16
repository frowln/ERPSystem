package com.privod.platform.modules.regulatory.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.regulatory.service.RegulatoryInspectionService;
import com.privod.platform.modules.regulatory.web.dto.CreatePrescriptionRequest;
import com.privod.platform.modules.regulatory.web.dto.CreateRegulatoryInspectionRequest;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionResponse;
import com.privod.platform.modules.regulatory.web.dto.RegulatoryInspectionResponse;
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
@RequestMapping("/api/regulatory/inspections")
@RequiredArgsConstructor
@Tag(name = "Regulatory Inspections", description = "Regulatory inspection management endpoints")
public class RegulatoryInspectionController {

    private final RegulatoryInspectionService inspectionService;

    @GetMapping
    @Operation(summary = "List regulatory inspections with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<RegulatoryInspectionResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "inspectionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RegulatoryInspectionResponse> page = inspectionService.listInspections(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get regulatory inspection by ID")
    public ResponseEntity<ApiResponse<RegulatoryInspectionResponse>> getById(@PathVariable UUID id) {
        RegulatoryInspectionResponse response = inspectionService.getInspection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new regulatory inspection")
    public ResponseEntity<ApiResponse<RegulatoryInspectionResponse>> create(
            @Valid @RequestBody CreateRegulatoryInspectionRequest request) {
        RegulatoryInspectionResponse response = inspectionService.createInspection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a regulatory inspection")
    public ResponseEntity<ApiResponse<RegulatoryInspectionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateRegulatoryInspectionRequest request) {
        RegulatoryInspectionResponse response = inspectionService.updateInspection(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Delete a regulatory inspection (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Prescriptions within inspection ----

    @GetMapping("/{inspectionId}/prescriptions")
    @Operation(summary = "Get all prescriptions for an inspection")
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getPrescriptions(
            @PathVariable UUID inspectionId) {
        List<PrescriptionResponse> prescriptions = inspectionService.getInspectionPrescriptions(inspectionId);
        return ResponseEntity.ok(ApiResponse.ok(prescriptions));
    }

    @PostMapping("/{inspectionId}/prescriptions")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Add a prescription to an inspection")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> addPrescription(
            @PathVariable UUID inspectionId,
            @Valid @RequestBody CreatePrescriptionRequest request) {
        PrescriptionResponse response = inspectionService.addPrescription(inspectionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/prescriptions/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Complete a prescription")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> completePrescription(
            @PathVariable UUID id,
            @RequestParam(required = false) String evidenceUrl) {
        PrescriptionResponse response = inspectionService.completePrescription(id, evidenceUrl);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/prescriptions/overdue")
    @Operation(summary = "Get all overdue prescriptions")
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getOverdue() {
        List<PrescriptionResponse> prescriptions = inspectionService.getOverduePrescriptions();
        return ResponseEntity.ok(ApiResponse.ok(prescriptions));
    }
}
