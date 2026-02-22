package com.privod.platform.modules.regulatory.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import com.privod.platform.modules.regulatory.domain.RegulatoryBodyType;
import com.privod.platform.modules.regulatory.service.PrescriptionService;
import com.privod.platform.modules.regulatory.web.dto.CreatePrescriptionRequest;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionDashboardResponse;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionResponse;
import com.privod.platform.modules.regulatory.web.dto.UpdatePrescriptionRequest;
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
@RequestMapping("/api/regulatory/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Regulatory Prescriptions", description = "Prescription tracking from regulatory authorities (GIT, Rostekhnadzor, etc.)")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    @Operation(summary = "List prescriptions with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<PrescriptionResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) PrescriptionStatus status,
            @RequestParam(required = false) RegulatoryBodyType bodyType,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "deadline", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PrescriptionResponse> page = prescriptionService.listPrescriptions(projectId, status, bodyType, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get prescription by ID")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(prescriptionService.getPrescription(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Register a new prescription")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> create(
            @Valid @RequestBody CreatePrescriptionRequest request) {
        PrescriptionResponse response = prescriptionService.createPrescription(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Update a prescription")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePrescriptionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(prescriptionService.updatePrescription(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER', 'SAFETY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Change prescription status")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestParam PrescriptionStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(prescriptionService.changeStatus(id, status)));
    }

    @PatchMapping("/{id}/appeal")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "File an appeal for a prescription")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> fileAppeal(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(prescriptionService.fileAppeal(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'REGULATORY_MANAGER')")
    @Operation(summary = "Delete a prescription (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get prescription dashboard statistics")
    public ResponseEntity<ApiResponse<PrescriptionDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(prescriptionService.getDashboard()));
    }
}
