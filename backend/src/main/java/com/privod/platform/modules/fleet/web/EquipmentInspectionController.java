package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.service.EquipmentInspectionService;
import com.privod.platform.modules.fleet.web.dto.CreateInspectionRequest;
import com.privod.platform.modules.fleet.web.dto.EquipmentInspectionResponse;
import com.privod.platform.modules.fleet.web.dto.UpdateInspectionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet/inspections")
@RequiredArgsConstructor
@Tag(name = "Fleet - Inspections", description = "Equipment inspection management endpoints")
public class EquipmentInspectionController {

    private final EquipmentInspectionService inspectionService;

    @GetMapping
    @Operation(summary = "List inspections with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<EquipmentInspectionResponse>>> list(
            @RequestParam(required = false) UUID vehicleId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<EquipmentInspectionResponse> page = inspectionService.listInspections(vehicleId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get inspection by ID")
    public ResponseEntity<ApiResponse<EquipmentInspectionResponse>> getById(@PathVariable UUID id) {
        EquipmentInspectionResponse response = inspectionService.getInspection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new inspection")
    public ResponseEntity<ApiResponse<EquipmentInspectionResponse>> create(
            @Valid @RequestBody CreateInspectionRequest request) {
        EquipmentInspectionResponse response = inspectionService.createInspection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER')")
    @Operation(summary = "Update an inspection")
    public ResponseEntity<ApiResponse<EquipmentInspectionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInspectionRequest request) {
        EquipmentInspectionResponse response = inspectionService.updateInspection(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Soft-delete an inspection")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/daily-check")
    @Operation(summary = "Get daily check list for a specific date")
    public ResponseEntity<ApiResponse<List<EquipmentInspectionResponse>>> getDailyCheckList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<EquipmentInspectionResponse> inspections = inspectionService.getDailyCheckList(date);
        return ResponseEntity.ok(ApiResponse.ok(inspections));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming inspections")
    public ResponseEntity<ApiResponse<List<EquipmentInspectionResponse>>> getUpcoming(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<EquipmentInspectionResponse> inspections = inspectionService.getUpcomingInspections(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(inspections));
    }
}
