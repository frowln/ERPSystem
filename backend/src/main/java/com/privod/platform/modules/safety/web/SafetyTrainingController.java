package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyTrainingService;
import com.privod.platform.modules.safety.web.dto.CreateSafetyTrainingRequest;
import com.privod.platform.modules.safety.web.dto.SafetyTrainingResponse;
import com.privod.platform.modules.safety.web.dto.UpdateSafetyTrainingRequest;
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
@RequestMapping("/api/safety/trainings")
@RequiredArgsConstructor
@Tag(name = "Safety Trainings", description = "Safety briefing journal per ГОСТ 12.0.004-2015")
public class SafetyTrainingController {

    private final SafetyTrainingService trainingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "List safety trainings with filters")
    public ResponseEntity<ApiResponse<PageResponse<SafetyTrainingResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String trainingType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyTrainingResponse> page = trainingService.listTrainings(projectId, trainingType, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Get safety training by ID")
    public ResponseEntity<ApiResponse<SafetyTrainingResponse>> getById(@PathVariable UUID id) {
        SafetyTrainingResponse response = trainingService.getTraining(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new safety training/briefing")
    public ResponseEntity<ApiResponse<SafetyTrainingResponse>> create(
            @Valid @RequestBody CreateSafetyTrainingRequest request) {
        SafetyTrainingResponse response = trainingService.createTraining(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER')")
    @Operation(summary = "Update a safety training")
    public ResponseEntity<ApiResponse<SafetyTrainingResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSafetyTrainingRequest request) {
        SafetyTrainingResponse response = trainingService.updateTraining(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SAFETY_MANAGER', 'ENGINEER')")
    @Operation(summary = "Complete a training and record signatures")
    public ResponseEntity<ApiResponse<SafetyTrainingResponse>> complete(
            @PathVariable UUID id,
            @RequestParam(required = false) String signatureData) {
        SafetyTrainingResponse response = trainingService.completeTraining(id, signatureData);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Cancel a training")
    public ResponseEntity<ApiResponse<SafetyTrainingResponse>> cancel(@PathVariable UUID id) {
        SafetyTrainingResponse response = trainingService.cancelTraining(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SAFETY_MANAGER')")
    @Operation(summary = "Delete a training (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        trainingService.deleteTraining(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
