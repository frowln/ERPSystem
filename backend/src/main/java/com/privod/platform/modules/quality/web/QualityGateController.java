package com.privod.platform.modules.quality.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.quality.service.QualityGateService;
import com.privod.platform.modules.quality.web.dto.ApplyTemplateRequest;
import com.privod.platform.modules.quality.web.dto.CreateQualityGateRequest;
import com.privod.platform.modules.quality.web.dto.ProgressionCheckResponse;
import com.privod.platform.modules.quality.web.dto.QualityGateResponse;
import com.privod.platform.modules.quality.web.dto.QualityGateTemplateResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityGateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quality/gates")
@RequiredArgsConstructor
@Tag(name = "Quality Gates", description = "Quality gate management at WBS level")
public class QualityGateController {

    private final QualityGateService qualityGateService;

    @GetMapping("/project/{projectId}")
    @Operation(summary = "List quality gates for a project")
    public ResponseEntity<ApiResponse<List<QualityGateResponse>>> listByProject(
            @PathVariable UUID projectId) {
        List<QualityGateResponse> gates = qualityGateService.getGatesForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(gates));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quality gate detail with progress")
    public ResponseEntity<ApiResponse<QualityGateResponse>> getById(@PathVariable UUID id) {
        QualityGateResponse response = qualityGateService.getGateDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/evaluate/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Evaluate a single quality gate")
    public ResponseEntity<ApiResponse<QualityGateResponse>> evaluate(@PathVariable UUID id) {
        QualityGateResponse response = qualityGateService.evaluateGate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/evaluate/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Evaluate all quality gates for a project")
    public ResponseEntity<ApiResponse<List<QualityGateResponse>>> evaluateAllForProject(
            @PathVariable UUID projectId) {
        List<QualityGateResponse> results = qualityGateService.evaluateAllForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @PostMapping("/apply-template")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Apply a quality gate template to a project")
    public ResponseEntity<ApiResponse<List<QualityGateResponse>>> applyTemplate(
            @Valid @RequestBody ApplyTemplateRequest request) {
        List<QualityGateResponse> created = qualityGateService.applyTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a quality gate")
    public ResponseEntity<ApiResponse<QualityGateResponse>> create(
            @Valid @RequestBody CreateQualityGateRequest request) {
        QualityGateResponse response = qualityGateService.createGate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a quality gate")
    public ResponseEntity<ApiResponse<QualityGateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQualityGateRequest request) {
        QualityGateResponse response = qualityGateService.updateGate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUALITY_MANAGER')")
    @Operation(summary = "Soft delete a quality gate")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        qualityGateService.deleteGate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/check-progression/{wbsNodeId}")
    @Operation(summary = "Check if WBS node progression is allowed (all quality gates must be PASSED)")
    public ResponseEntity<ApiResponse<ProgressionCheckResponse>> checkProgression(
            @PathVariable UUID wbsNodeId) {
        ProgressionCheckResponse response = qualityGateService.checkProgression(wbsNodeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/templates")
    @Operation(summary = "List quality gate templates for current organization")
    public ResponseEntity<ApiResponse<List<QualityGateTemplateResponse>>> listTemplates() {
        List<QualityGateTemplateResponse> templates = qualityGateService.listTemplates();
        return ResponseEntity.ok(ApiResponse.ok(templates));
    }
}
